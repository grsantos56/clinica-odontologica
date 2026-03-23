import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserRole } from '../utils/authUtils';
import { extractDateFromISO, extractHorarioFromISO, getNomePaciente } from '../utils/registroUtils';

// Importação dos Sub-Hooks
import { useOdontogramaLogic } from './registro/useOdontogramaLogic';
import { useFinanceiroLogic } from './registro/useFinanceiroLogic';
import { useSessaoLogic } from './registro/useSessaoLogic';
import { useRegistroData } from './registro/useRegistroData';
import { useRegistroActions } from './registro/useRegistroActions';

export const useRegistroProcedimento = () => {
    const { idAgendamento } = useParams(); 
    const navigate = useNavigate();
    const id = parseInt(idAgendamento);

    // --- ESTADOS GLOBAIS DO HOOK ---
    const [agendamento, setAgendamento] = useState(null); 
    const [procedimentoRegistro, setProcedimentoRegistro] = useState(null); 
    const [todosServicos, setTodosServicos] = useState([]); 
    const userRole = useMemo(() => getUserRole(), []);

    // 1. SUB-HOOK: FINANCEIRO
    // Instanciamos primeiro para garantir que 'procedimentosRealizados' exista para o Odontograma
    const financeiro = useFinanceiroLogic(todosServicos);

    // 2. SUB-HOOK: ODONTOGRAMA
    const odontograma = useOdontogramaLogic(financeiro.procedimentosRealizados);

    // 3. SUB-HOOK: SESSÃO
    const sessao = useSessaoLogic();

    // 4. SUB-HOOK: DATA FETCHING
    // Popula os estados dos outros hooks
    const { isLoading } = useRegistroData(
        idAgendamento,
        setTodosServicos,
        setAgendamento,
        sessao.setHistorico,
        setProcedimentoRegistro,
        odontograma.setOdontogramaAtualMap,
        odontograma.setOdontogramaInicialMap,
        odontograma.setIsInitialMapSaved,
        odontograma.setCurrentOdontogramaView,
        financeiro.setProcedimentosRealizados,
        sessao.setFotos,
        sessao.setObservacoes,
        financeiro.setStatusPagamento,
        financeiro.setValorTotalLancado,
        sessao.setAcoesDaSessao
    );

    // 5. SUB-HOOK: AÇÕES (SALVAR, ENCERRAR)
    const fullState = {
        agendamento, procedimentoRegistro, todosServicos,
        odontogramaAtualMap: odontograma.odontogramaAtualMap,
        odontogramaInicialMap: odontograma.odontogramaInicialMap,
        procedimentosRealizados: financeiro.procedimentosRealizados,
        descontoTipo: financeiro.descontoTipo,
        descontoValor: financeiro.descontoValor,
        statusPagamento: financeiro.statusPagamento,
        numeroParcelas: financeiro.numeroParcelas,
        valorTotalLancado: financeiro.valorTotalLancado,
        totalComDesconto: financeiro.totalComDesconto,
        observacoes: sessao.observacoes,
        acoesDaSessao: sessao.acoesDaSessao,
        fotos: sessao.fotos
    };

    const setters = {
        setProcedimentosRealizados: financeiro.setProcedimentosRealizados,
        setStatusPagamento: financeiro.setStatusPagamento,
        setValorTotalLancado: financeiro.setValorTotalLancado,
        setProcedimentoRegistro,
        setOdontogramaAtualMap: odontograma.setOdontogramaAtualMap,
        setOdontogramaInicialMap: odontograma.setOdontogramaInicialMap,
        setIsInitialMapSaved: odontograma.setIsInitialMapSaved,
        setFotos: sessao.setFotos,
        navigate
    };

    const actions = useRegistroActions(fullState, setters);

    // Wrappers auxiliares
    const handleAddAcaoWrapper = (acao) => sessao.handleAddAcaoDaSessao(acao, agendamento);
    const handleSaveOdontoInicialWrapper = () => odontograma.handleSaveOdontogramaInicial(actions.handleSalvar);

    // --- RETURN FINAL ---
    const displayVars = useMemo(() => {
        const dataHoraISO = agendamento?.dataHora; 
        return {
            pacienteNome: getNomePaciente(agendamento),
            procedimentoAgendado: agendamento?.procedimento || 'N/A',
            dataAgendamento: dataHoraISO ? extractDateFromISO(dataHoraISO).split('-').reverse().join('/') : 'N/A',
            horarioAgendamento: extractHorarioFromISO(dataHoraISO),
        };
    }, [agendamento]);

    return {
        // Base
        idAgendamento, navigate, id, agendamento, isLoading, isSaving: actions.isSaving,
        ...displayVars,
        userRole,
        
        // Sessão & Histórico
        historico: sessao.historico, 
        observacoes: sessao.observacoes, setObservacoes: sessao.setObservacoes,
        agendamentoNotas: agendamento?.notas,
        pacienteObs: agendamento?.paciente?.observacoes,
        acoesDaSessao: sessao.acoesDaSessao, 
        handleAddAcaoDaSessao: handleAddAcaoWrapper, 
        handleRemoveAcaoDaSessao: sessao.handleRemoveAcaoDaSessao,
        fotos: sessao.fotos, 
        handleAddFoto: sessao.handleAddFoto, 
        handleRemoveFoto: sessao.handleRemoveFoto,

        // Financeiro
        procedimentosRealizados: financeiro.procedimentosRealizados, 
        
        // 🌟 CORREÇÃO REALIZADA AQUI:
        setProcedimentosRealizados: financeiro.setProcedimentosRealizados, 
        
        subtotal: financeiro.subtotal, 
        statusPagamento: financeiro.statusPagamento, 
        setStatusPagamento: financeiro.setStatusPagamento,
        handleAcrescimoChange: financeiro.handleAcrescimoChange, 
        handleRemoveProcedureFromBill: financeiro.handleRemoveProcedureFromBill,
        handleAddProcedureToBill: financeiro.handleAddProcedureToBill,
        numeroParcelas: financeiro.numeroParcelas, setNumeroParcelas: financeiro.setNumeroParcelas,
        descontoValor: financeiro.descontoValor, setDescontoValor: financeiro.setDescontoValor,
        descontoTipo: financeiro.descontoTipo, setDescontoTipo: financeiro.setDescontoTipo,
        totalComDesconto: financeiro.totalComDesconto,

        // Odontograma
        odontogramaDisplayMap: odontograma.odontogramaDisplayMap, 
        odontogramaInicialMap: odontograma.odontogramaInicialMap, 
        currentOdontogramaView: odontograma.currentOdontogramaView, 
        setCurrentOdontogramaView: odontograma.setCurrentOdontogramaView,
        isInitialMapSaved: odontograma.isInitialMapSaved,
        handleUpdateOdontogramaMap: odontograma.handleUpdateOdontogramaMap, 
        handleUpdateOdontogramaInicialMap: odontograma.handleUpdateOdontogramaInicialMap,
        handleSaveOdontogramaInicial: handleSaveOdontoInicialWrapper,

        // Ações Principais
        handleSalvar: actions.handleSalvar,
        handleSaveRegistro: actions.handleSaveRegistro,
        handleEncerrar: actions.handleEncerrar,
        handleMarcarRetorno: actions.handleMarcarRetorno,
        handleLancarCobranca: actions.handleLancarCobranca
    };
};