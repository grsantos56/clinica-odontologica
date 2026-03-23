import { useState, useMemo } from 'react';
import { normalizarTexto } from '../../utils/registroUtils';

export const useFinanceiroLogic = (todosServicos) => {
    const [procedimentosRealizados, setProcedimentosRealizados] = useState([]);
    const [valorTotalLancado, setValorTotalLancado] = useState(0);
    const [descontoValor, setDescontoValor] = useState(0);
    const [descontoTipo, setDescontoTipo] = useState('PORCENTAGEM');
    const [statusPagamento, setStatusPagamento] = useState('AGUARDANDO');
    const [numeroParcelas, setNumeroParcelas] = useState(1);

    const handleAddProcedureToBill = (newProcedure) => {
        let procedureWithRec = { ...newProcedure };
        
        // 🌟 Inicializa faturado como true se não existir
        if (procedureWithRec.faturado === undefined) {
            procedureWithRec.faturado = true;
        }
        
        // Tenta preencher recomendações e comissão automaticamente
        if (!procedureWithRec.recomendacoes_pos_procedimento || procedureWithRec.comissaoPercentual === undefined) {
            const nomeBase = (newProcedure.descricao || newProcedure.servico).split(' (')[0];
            const servicoEncontrado = todosServicos.find(s => normalizarTexto(s.nome) === normalizarTexto(nomeBase));
            if (servicoEncontrado) {
                if (!procedureWithRec.recomendacoes_pos_procedimento) procedureWithRec.recomendacoes_pos_procedimento = servicoEncontrado.recomendacoesPosProcedimento || '';
                if (procedureWithRec.comissaoPercentual === undefined) procedureWithRec.comissaoPercentual = servicoEncontrado.comissaoPercentual || 0;
            }
        }
        
        const valorBase = newProcedure.valorBase || newProcedure.valor || 0;
        
        const itemPronto = {
            ...procedureWithRec,
            id: Date.now() + Math.random(),
            valor: valorBase,
            valorBase: valorBase,
            acrescimo: 0,
            valorCobrado: valorBase
        };
        setProcedimentosRealizados(prev => [...prev, itemPronto]);
    };

    const handleRemoveProcedureFromBill = (targetId) => {
        setProcedimentosRealizados(prev => prev.filter(proc => proc.id !== targetId));
    };

    const handleAcrescimoChange = (e, targetId) => {
        let value = Math.max(0, parseFloat(e.target.value.replace(',', '.')) || 0);
        setProcedimentosRealizados(prev => prev.map(proc => {
            if (proc.id === targetId) {
                const base = proc.valor || proc.valorBase || 0;
                return { ...proc, acrescimo: value, valorCobrado: base + value };
            }
            return proc;
        }));
    };

    // 🌟 CÁLCULOS ATUALIZADOS: IGNORAR ITENS "NÃO FATURADOS"
    const subtotal = useMemo(() => {
        return procedimentosRealizados.reduce((sum, proc) => {
            // Se faturado for false, não soma. Se for undefined ou true, soma.
            if (proc.faturado === false) return sum;
            return sum + (proc.valorCobrado || 0);
        }, 0);
    }, [procedimentosRealizados]);

    const totalComDesconto = useMemo(() => {
        let valorDescontoReais = 0;
        if (descontoTipo === 'PORCENTAGEM') {
            valorDescontoReais = subtotal * (descontoValor / 100);
        } else {
            valorDescontoReais = descontoValor;
        }
        return Math.max(0, subtotal - valorDescontoReais);
    }, [subtotal, descontoValor, descontoTipo]);

    return {
        procedimentosRealizados, setProcedimentosRealizados,
        valorTotalLancado, setValorTotalLancado,
        descontoValor, setDescontoValor,
        descontoTipo, setDescontoTipo,
        statusPagamento, setStatusPagamento,
        numeroParcelas, setNumeroParcelas,
        subtotal,
        totalComDesconto,
        handleAddProcedureToBill,
        handleRemoveProcedureFromBill,
        handleAcrescimoChange
    };
};