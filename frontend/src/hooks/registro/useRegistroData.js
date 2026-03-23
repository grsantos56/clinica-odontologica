import { useState, useEffect } from 'react';
import ProcedimentoService from '../../services/ProcedimentoService';
import AgendamentoService from '../../services/AgendamentoService';
import ServicoService from '../../services/ServicoService';
import { normalizarTexto, deepClone } from '../../utils/registroUtils';

export const useRegistroData = (
    idAgendamento,
    setTodosServicos,
    setAgendamento,
    setHistorico,
    setProcedimentoRegistro,
    setOdontogramaAtualMap,
    setOdontogramaInicialMap,
    setIsInitialMapSaved,
    setCurrentOdontogramaView,
    setProcedimentosRealizados,
    setFotos,
    setObservacoes,
    setStatusPagamento,
    setValorTotalLancado,
    setAcoesDaSessao
) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            console.log(`[DEBUG] Iniciando busca para Agendamento ID: ${idAgendamento}`);
            setIsLoading(true);
            const id = parseInt(idAgendamento);
            let listaServicosBackend = [];
            
            let mapaHistorico = {};
            let mapaHistoricoInicial = {};
            let fotosHistorico = [];

            try {
                // 1. Carrega Serviços
                listaServicosBackend = await ServicoService.listarTodos();
                setTodosServicos(listaServicosBackend);

                // 2. Carrega Agendamento Principal
                const agenda = await AgendamentoService.buscarPorId(id);
                if (!agenda) throw new Error("Agendamento não encontrado");
                
                setAgendamento(agenda);
                
                // 🌟 REGRA RÍGIDA: Só busca histórico/orçamento se for Retorno ou Avaliação/Orçamento
                const strProc = agenda.procedimento?.toLowerCase() || '';
                
                const isRetorno = agenda.status === 'AGUARDANDO_RETORNO' || 
                                  agenda.status === 'CONCLUIDO_RETORNO' || 
                                  strProc.includes("retorno");
                                  
                const isOrcamento = strProc.includes("orçament") || 
                                    strProc.includes("orcament") || 
                                    strProc.includes("avalia");

                const deveHerdarHistorico = isRetorno || isOrcamento;

                if (agenda.paciente?.id) {
                    try {
                        const hist = await ProcedimentoService.listarHistoricoPorPacienteId(agenda.paciente.id);
                        if (hist && Array.isArray(hist)) setHistorico(hist);
                    } catch (e) { console.error("[ERROR] Falha histórico:", e); }

                    // 🌟 Só busca dados de odontogramas passados se a regra permitir
                    if (deveHerdarHistorico) {
                        try {
                            let ultimo = await ProcedimentoService.buscarUltimoGeradorRetorno(agenda.paciente.id);
                            if (!ultimo) ultimo = await ProcedimentoService.buscarUltimoSalvo(agenda.paciente.id);

                            if (ultimo) {
                                mapaHistorico = JSON.parse(ultimo.mapaOdontogramaJson || '{}');
                                mapaHistoricoInicial = JSON.parse(ultimo.mapaOdontogramaInicialJson || '{}');
                                if (ultimo.fotos) {
                                    fotosHistorico = ultimo.fotos.map((url, idx) => ({ 
                                        id: `hist-${idx}`, file: null, url: url 
                                    }));
                                }
                            }
                        } catch (e) { console.error("[ERROR] Recuperação de dados anteriores:", e); }
                    }
                }

                // 3. Busca Rascunho (Se você já tiver salvo algo NESTE agendamento hoje, ele não perde)
                const rascunho = await ProcedimentoService.buscarPorAgendamentoId(id);

                if (rascunho) {
                    // --- CENÁRIO A: JÁ EXISTE RASCUNHO SALVO ---
                    console.log("[DEBUG] Rascunho encontrado. Restaurando sessão...");
                    setProcedimentoRegistro(rascunho);
                    
                    if (rascunho.mapaOdontogramaJson) setOdontogramaAtualMap(JSON.parse(rascunho.mapaOdontogramaJson));
                    if (rascunho.mapaOdontogramaInicialJson) {
                        const mapaInicial = JSON.parse(rascunho.mapaOdontogramaInicialJson);
                        setOdontogramaInicialMap(mapaInicial);
                        if (Object.keys(mapaInicial).length > 0) {
                            setIsInitialMapSaved(true);
                            setCurrentOdontogramaView('ATUAL');
                        }
                    }

                    if (rascunho.itens && rascunho.itens.length > 0) {
                        const listaRecuperada = rascunho.itens.map((item, idx) => {
                            const nomeLimpo = item.descricao.split(' (')[0].replace(/\[ORÇAMENTO\]\s*/g, '');
                            const servicoOriginal = listaServicosBackend.find(s => normalizarTexto(s.nome) === normalizarTexto(nomeLimpo));
                            const ehOrcamento = item.statusItem === 'ORCAMENTO' || item.descricao.includes('[ORÇAMENTO]');

                            return {
                                id: Date.now() + idx,
                                descricao: item.descricao,
                                valorBase: item.valorBase, valor: item.valorBase, acrescimo: item.acrescimo || 0,
                                valorCobrado: (item.valorBase + (item.acrescimo || 0)),
                                fdi: null, 
                                status: 'realizado',
                                faturado: !ehOrcamento, 
                                comissaoPercentual: servicoOriginal?.comissaoPercentual || 0,
                                recomendacoes_pos_procedimento: servicoOriginal?.recomendacoesPosProcedimento || ''
                            };
                        });
                        setProcedimentosRealizados(listaRecuperada);
                    }

                    if (rascunho.fotos?.length > 0) setFotos(rascunho.fotos.map((url, idx) => ({ id: `saved-${idx}`, file: null, url: url })));
                    setObservacoes(rascunho.observacoesClinicas || '');
                    setStatusPagamento(rascunho.statusPagamento || 'AGUARDANDO');
                    setValorTotalLancado(rascunho.valorTotalLancado || 0);
                    if (rascunho.acoesDiarioJson) {
                        const diario = JSON.parse(rascunho.acoesDiarioJson);
                        if (diario.listaAcoes) setAcoesDaSessao(diario.listaAcoes);
                    }

                } else {
                    // --- CENÁRIO B: NOVO REGISTRO (Aberto pela primeira vez) ---
                    console.log("[DEBUG] Novo atendimento. Verificando regras de herança...");
                    setProcedimentoRegistro({ agendamento: { id: id } });
                    
                    let orcamentoCarregado = false;

                    // 🌟 SÓ CARREGA ORÇAMENTO PENDENTE SE A REGRA DE ORÇAMENTO FOR VERDADEIRA
                    if (deveHerdarHistorico && agenda.paciente?.id) {
                        try {
                            const orcamentoPendente = await ProcedimentoService.buscarUltimoOrcamento(agenda.paciente.id);
                            
                            if (orcamentoPendente) {
                                console.log("[DEBUG] Orçamento pendente encontrado! Carregando dados...");
                                orcamentoCarregado = true;

                                if (orcamentoPendente.mapaOdontogramaJson) {
                                    setOdontogramaAtualMap(JSON.parse(orcamentoPendente.mapaOdontogramaJson));
                                }
                                if (orcamentoPendente.mapaOdontogramaInicialJson) {
                                    const mapaIni = JSON.parse(orcamentoPendente.mapaOdontogramaInicialJson);
                                    setOdontogramaInicialMap(mapaIni);
                                    if (Object.keys(mapaIni).length > 0) {
                                        setIsInitialMapSaved(true);
                                        setCurrentOdontogramaView('ATUAL');
                                    }
                                }

                                if (orcamentoPendente.itens && orcamentoPendente.itens.length > 0) {
                                    const listaDoOrcamento = orcamentoPendente.itens.map((item, idx) => {
                                        const nomeLimpo = item.descricao.replace(/\[ORÇAMENTO\]\s*/g, '').trim();
                                        const nomeBaseServico = nomeLimpo.split(' (')[0];
                                        const servicoOriginal = listaServicosBackend.find(s => normalizarTexto(s.nome) === normalizarTexto(nomeBaseServico));

                                        return {
                                            id: Date.now() + idx,
                                            descricao: nomeLimpo,
                                            valorBase: item.valorBase,
                                            valor: item.valorBase,
                                            acrescimo: item.acrescimo || 0,
                                            valorCobrado: (item.valorBase + (item.acrescimo || 0)),
                                            fdi: null, 
                                            status: 'realizado',
                                            faturado: true, // Já vem marcado para cobrar
                                            comissaoPercentual: servicoOriginal?.comissaoPercentual || 0,
                                            recomendacoes_pos_procedimento: servicoOriginal?.recomendacoesPosProcedimento || ''
                                        };
                                    });
                                    setProcedimentosRealizados(listaDoOrcamento);
                                }
                                
                                if (orcamentoPendente.observacoesClinicas) {
                                    setObservacoes(orcamentoPendente.observacoesClinicas);
                                }
                            }
                        } catch (err) {
                            console.error("Erro ao tentar carregar orçamento pendente:", err);
                        }
                    }

                    // Se a regra bloqueou a herança ou não havia orçamento...
                    if (!orcamentoCarregado) {
                        // Só traz a arcada antiga se for retorno/orçamento
                        if (deveHerdarHistorico && Object.keys(mapaHistorico).length > 0) {
                            const mapaInicialParaSetar = Object.keys(mapaHistoricoInicial).length > 0 
                                ? deepClone(mapaHistoricoInicial) 
                                : deepClone(mapaHistorico);
                            
                            setOdontogramaInicialMap(mapaInicialParaSetar);
                            setOdontogramaAtualMap(deepClone(mapaHistorico));
                            setFotos(deepClone(fotosHistorico));
                            setIsInitialMapSaved(true);
                            setCurrentOdontogramaView('ATUAL');
                        } else {
                            // 🌟 REGRA APLICADA: Inicia totalmente limpo (vazio)
                            setOdontogramaInicialMap({});
                            setOdontogramaAtualMap({});
                            setFotos([]);
                            setIsInitialMapSaved(false);
                            setProcedimentosRealizados([]);
                        }
                    }
                }
            } catch (e) { 
                console.error("[ERROR CRITICAL] useRegistroData:", e); 
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchData();
    }, [idAgendamento]);

    return { isLoading };
};