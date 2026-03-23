import { useState } from 'react';
import ProcedimentoService from '../../services/ProcedimentoService';
import PacienteService from '../../services/PacienteService';
import AgendamentoService from '../../services/AgendamentoService';
import { aggregateProceduresFromMap, normalizarTexto, deepClone } from '../../utils/registroUtils';

export const useRegistroActions = (state, setters) => {
    const [isSaving, setIsSaving] = useState(false);
    const { 
        agendamento, procedimentoRegistro, odontogramaAtualMap, odontogramaInicialMap, 
        procedimentosRealizados, todosServicos, descontoTipo, descontoValor, 
        statusPagamento, observacoes, acoesDaSessao, fotos, numeroParcelas, 
        valorTotalLancado, totalComDesconto 
    } = state;
    
    const { 
        setProcedimentosRealizados, setStatusPagamento, setProcedimentoRegistro, 
        setOdontogramaAtualMap, setOdontogramaInicialMap, setIsInitialMapSaved, 
        setFotos, setValorTotalLancado, navigate 
    } = setters;

    // --- FUNÇÕES AUXILIARES DE SEGURANÇA (Evitam Erro 500) ---
    const safeFloat = (val) => {
        const num = parseFloat(val);
        // Se for NaN ou null, retorna 0.00. Fixa em 2 casas decimais e converte volta pra number
        return isNaN(num) ? 0 : Number(num.toFixed(2));
    };

    const safeInt = (val) => {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
    };

    // --- 1. HANDLE SALVAR ---
    const handleSalvar = async (e, statusForce = null, totalLancadoForce = null) => {
        if (e instanceof Event && e.type === 'submit') e.preventDefault();
        if (isSaving || !agendamento) return false; 
        
        setIsSaving(true);
        
        try {
            // 1. Consolida a lista
            const listaAtual = procedimentosRealizados.length > 0 
                ? procedimentosRealizados 
                : aggregateProceduresFromMap(odontogramaAtualMap, todosServicos);


            // 2. Separação e Cálculos
            const itensFaturados = listaAtual.filter(p => p.faturado !== false);
            const subtotalFaturado = itensFaturados.reduce((sum, proc) => sum + safeFloat(proc.valorCobrado || 0), 0);
            
            // 3. Desconto
            let valorFinalComDesconto = subtotalFaturado;
            if (descontoTipo === 'PORCENTAGEM') {
                valorFinalComDesconto = subtotalFaturado * (1 - (safeFloat(descontoValor) / 100));
            } else {
                valorFinalComDesconto = Math.max(0, subtotalFaturado - safeFloat(descontoValor));
            }

            const fatorDesconto = subtotalFaturado > 0 ? (valorFinalComDesconto / subtotalFaturado) : 1;

            // 4. Prepara Payload (USEI safeFloat PARA BLINDAR CONTRA ERROS)
            const itensParaSalvar = listaAtual.map(p => {
                const isFaturado = p.faturado !== false;
                
                const valorBase = safeFloat(p.valor || p.valorBase);
                const acrescimo = safeFloat(p.acrescimo);
                const bruto = valorBase + acrescimo;
                
                const liquido = isFaturado ? (bruto * fatorDesconto) : bruto;
                const descontoItem = isFaturado ? (bruto - liquido) : 0;
                
                // Limpa tag visual do nome
                let descricaoLimpa = (p.descricao || '').replace(/\[ORÇAMENTO\]\s*/g, '').trim();
                if (!descricaoLimpa) descricaoLimpa = "Procedimento sem nome";

                return {
                    descricao: isFaturado ? descricaoLimpa : `[ORÇAMENTO] ${descricaoLimpa}`,
                    valorBase: safeFloat(valorBase),
                    acrescimo: safeFloat(acrescimo),
                    desconto: safeFloat(descontoItem),
                    valorLiquido: safeFloat(liquido),
                    // Backend deve estar preparado para receber este campo. 
                    // Se o erro 500 persistir, o backend pode não ter mapeado este campo ainda.
                    // Se não tiver mapeado, a linha abaixo pode ser removida se o 'faturado' já resolver.
                    // statusItem: isFaturado ? 'REALIZADO' : 'ORCAMENTO', 
                    faturado: isFaturado
                };
            });

            // Strings simples
            const procedimentosApiStrings = listaAtual.map(p => {
                const desc = (p.descricao || '').replace(/\[ORÇAMENTO\]\s*/g, '').trim();
                const prefix = p.faturado === false ? '[ORÇAMENTO] ' : '';
                return `${prefix}${desc}`;
            });
            
            // 5. Status Geral
            let statusParaSalvar = statusForce || statusPagamento;
            const valorLancadoRef = totalLancadoForce !== null ? safeFloat(totalLancadoForce) : safeFloat(valorTotalLancado);

            if (!statusForce) {
                if (itensFaturados.length === 0) {
                    statusParaSalvar = 'ORCAMENTO';
                } else {
                    if (valorLancadoRef > 0) statusParaSalvar = 'NAO_PAGO'; 
                    else if (Math.abs(valorFinalComDesconto) < 0.01) statusParaSalvar = 'PAGO'; 
                    else statusParaSalvar = 'AGUARDANDO';
                }
            }
            
            // Atualiza visualmente
            setProcedimentosRealizados(listaAtual); 
            setStatusPagamento(statusParaSalvar);

            // PAYLOAD FINAL
            const payloadJson = {
                id: procedimentoRegistro?.id || null, // Se undefined, manda null
                agendamento: { id: safeInt(agendamento.id) }, // Garante Inteiro
                observacoesClinicas: observacoes || '',
                itens: itensParaSalvar, 
                procedimentosRealizados: procedimentosApiStrings,
                statusPagamento: statusParaSalvar, 
                dataRegistro: new Date().toISOString(),
                mapaOdontogramaJson: JSON.stringify(odontogramaAtualMap || {}), 
                mapaOdontogramaInicialJson: JSON.stringify(odontogramaInicialMap || {}),
                acoesDiarioJson: JSON.stringify({ listaAcoes: acoesDaSessao || [], descontoValor: safeFloat(descontoValor), descontoTipo }),
                fotos: fotos.filter(f => !f.file).map(f => f.url),
                numeroParcelas: safeInt(numeroParcelas) || 1,
                valorTotalLancado: safeFloat(valorLancadoRef) 
            };
            

            const formData = new FormData();
            const fotosAEnviar = fotos.filter(f => f.file);
            
            fotosAEnviar.forEach((fotoItem) => formData.append('fotos', fotoItem.file, fotoItem.file.name));
            formData.append('procedimento', JSON.stringify(payloadJson));

            // Chamada ao Serviço
            const savedData = await ProcedimentoService.salvarRegistroComFotos(formData);
            
            setProcedimentoRegistro(savedData);
            
            // Recarrega lista
            if (savedData.itens && savedData.itens.length > 0) {
                const listaRecarregada = savedData.itens.map((item, idx) => {
                    const nomeBase = item.descricao.replace(/\[ORÇAMENTO\]\s*/g, '').split(' (')[0];
                    const servicoOriginal = todosServicos.find(s => normalizarTexto(s.nome) === normalizarTexto(nomeBase));
                    
                    // Se faturado vier false do backend, ou se tiver a tag no nome, é orçamento
                    const ehOrcamento = item.faturado === false || item.descricao.includes('[ORÇAMENTO]');

                    return {
                        id: Date.now() + idx,
                        descricao: item.descricao,
                        valorBase: item.valorBase, 
                        valor: item.valorBase, 
                        acrescimo: item.acrescimo,
                        valorCobrado: item.valorBase + item.acrescimo, 
                        fdi: null, 
                        faturado: !ehOrcamento, 
                        status: 'realizado',
                        comissaoPercentual: servicoOriginal ? (servicoOriginal.comissaoPercentual || 0) : 0,
                        recomendacoes_pos_procedimento: servicoOriginal ? (servicoOriginal.recomendacoesPosProcedimento || '') : ''
                    };
                });
                setProcedimentosRealizados(listaRecarregada);
            }

            // Atualiza Odontograma/Fotos
            const savedAtual = JSON.parse(savedData.mapaOdontogramaJson || '{}');
            let savedInicial = JSON.parse(savedData.mapaOdontogramaInicialJson || '{}');
            if (Object.keys(savedInicial).length === 0 && Object.keys(odontogramaInicialMap).length > 0) savedInicial = deepClone(odontogramaInicialMap);
            setOdontogramaAtualMap(savedAtual); setOdontogramaInicialMap(savedInicial); if (Object.keys(savedInicial).length > 0) setIsInitialMapSaved(true);
            
            if (savedData.fotos?.length > 0) {
                setFotos(savedData.fotos.map((url, index) => ({ id: `db-${index}`, file: null, url: url })));
            }
            return true;

        } catch (error) {
            
            let msg = error.message;
            if (error.response) {
                
                if (error.response.status === 500) {
                    msg = "Erro 500: O servidor rejeitou os dados. Verifique o console para detalhes do JSON.";
                }
                if (error.response.status === 400) {
                    msg = "Erro 400: Dados inválidos enviados.";
                }
            }
            
            alert(`Erro ao salvar: ${msg}`);
            return false;
        } finally {
            console.groupEnd();
            setIsSaving(false);
        }
    };

    const handleSaveRegistro = async () => {
        const sucesso = await handleSalvar(new Event('submit'));
        if (sucesso) alert("Registro salvo com sucesso!");
    };

    const handleLancarCobranca = async () => {
        if (!agendamento || !agendamento.paciente?.id) return;
        
        const temFaturado = procedimentosRealizados.some(p => p.faturado !== false);
        if (!temFaturado) {
            alert("Não há itens marcados para cobrança (apenas orçamento).");
            return;
        }

        const valorAjuste = totalComDesconto - valorTotalLancado;
        if (valorAjuste <= 0.01 && valorAjuste >= -0.01) {
            if (totalComDesconto > 0) {
                setStatusPagamento('NAO_PAGO');
                await handleSalvar(null, 'NAO_PAGO', totalComDesconto);
                alert("Dados financeiros atualizados.");
            } else {
                alert("Não há novos valores a cobrar.");
            }
            return;
        }

        if (window.confirm(`CONFIRMAR LANÇAMENTO DE DÉBITO?\n\nSerá adicionado R$ ${valorAjuste.toFixed(2)} ao saldo devedor do paciente.`)) {
            try {
                await PacienteService.ajustarSaldoDevedor(agendamento.paciente.id, parseFloat(valorAjuste.toFixed(2)), "DEBITO_SESSAO");
                const novoTotalLancado = totalComDesconto;
                setValorTotalLancado(novoTotalLancado);
                setStatusPagamento('NAO_PAGO');
                await handleSalvar(null, 'NAO_PAGO', novoTotalLancado);
                alert("Débito lançado com sucesso!");
            } catch (error) {
                alert("Erro ao lançar débito: " + error.message);
            }
        }
    };

    const handleMarcarRetorno = async (diasRecorrencia = null) => {
        if (!agendamento || !agendamento.paciente?.id) { 
            alert("Erro: Dados do paciente não disponíveis."); 
            return false; 
        }

        if (totalComDesconto > 0 && valorTotalLancado === 0) {
            const confirmar = window.confirm("⚠️ Existem itens a cobrar mas o débito NÃO foi lançado.\nO paciente não será cobrado.\n\nDeseja continuar e marcar o retorno mesmo assim?");
            if (!confirmar) return false;
        }

        const saveSuccess = await handleSalvar(new Event('submit')); 
        if (!saveSuccess) return false;
        
        try {
            await PacienteService.marcarParaRetorno(agendamento.paciente.id, diasRecorrencia);
            await AgendamentoService.atualizarStatus(agendamento.id, 'CONCLUIDO_RETORNO'); 
            alert(`Retorno marcado.`);
            navigate('/procedimentos'); 
            return true;
        } catch (error) {
            alert(`Erro ao marcar retorno: ${error.message}`); 
            return false;
        }
    };

    const handleEncerrar = async (manterRecorrencia = false) => {
        if (!agendamento) return;
        
        const temFaturado = procedimentosRealizados.some(p => p.faturado !== false);
        let statusFinal = 'AGUARDANDO';
        let novoValorLancado = valorTotalLancado;

        if (!temFaturado) {
            statusFinal = 'ORCAMENTO';
        } else {
            if (valorTotalLancado > 0) {
                statusFinal = 'NAO_PAGO'; 
            } else if (Math.abs(totalComDesconto) < 0.01) {
                statusFinal = 'PAGO'; 
            } else {
                // TEM VALOR A COBRAR, MAS NÃO FOI LANÇADO
                const confirmarDebito = window.confirm(
                    `⚠️ DÉBITOS PENDENTES\n\n` +
                    `O valor de R$ ${totalComDesconto.toFixed(2)} ainda não foi lançado na conta do paciente.\n\n` +
                    `[OK] -> Lançar débito e Finalizar (Status: NÃO PAGO)\n` +
                    `[Cancelar] -> Finalizar sem cobrar (Status: AGUARDANDO)`
                );

                if (confirmarDebito) {
                    try {
                        await PacienteService.ajustarSaldoDevedor(agendamento.paciente.id, parseFloat(totalComDesconto.toFixed(2)), "DEBITO_SESSAO");
                        statusFinal = 'NAO_PAGO'; 
                        novoValorLancado = totalComDesconto;
                        setValorTotalLancado(totalComDesconto);
                        alert("Débito lançado com sucesso!");
                    } catch (err) {
                        alert("Erro ao lançar débito automático: " + err.message);
                        return; 
                    }
                } else {
                    statusFinal = 'AGUARDANDO'; 
                }
            }
        }

        // Salva com status correto (AGUARDANDO ou NAO_PAGO)
        // NUNCA manda CONCLUIDO aqui, pois quebra o enum do backend
        const saveSuccess = await handleSalvar(null, statusFinal, novoValorLancado);
        if (!saveSuccess) return;

        const msgConfirmacao = statusFinal === 'ORCAMENTO'
            ? "Deseja salvar e sair (apenas ORÇAMENTO)?"
            : "Deseja finalizar o atendimento?";

        if (window.confirm(msgConfirmacao)) {
            try { 
                if (manterRecorrencia && agendamento.paciente?.diasRecorrencia > 0) {
                    await PacienteService.marcarParaRetorno(agendamento.paciente.id, agendamento.paciente.diasRecorrencia);
                    await AgendamentoService.atualizarStatus(agendamento.id, 'CONCLUIDO_RETORNO'); 
                    alert(`Ciclo renovado.`);
                } else {
                    await AgendamentoService.atualizarStatus(agendamento.id, 'CONCLUIDO'); 
                }
                navigate('/procedimentos'); 
            } catch (e) { alert("Erro: " + e.message); }
        }
    };

    return { isSaving, handleSalvar, handleSaveRegistro, handleLancarCobranca, handleMarcarRetorno, handleEncerrar };
};