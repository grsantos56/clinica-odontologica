import React, { useState, useEffect } from 'react';
import Sidebar from '../components/SideBar';
import { 
    FaFileInvoiceDollar, FaSpinner, FaUsers, FaCheckCircle, 
    FaExclamationTriangle, FaCalendarPlus, FaArrowLeft, FaTimesCircle 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ProcedimentoService from '../services/ProcedimentoService';

export default function OrcamentosAgendamentoPage() {
    const navigate = useNavigate();
    const [orcamentos, setOrcamentos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // --- LÓGICA DE BUSCA ---
    useEffect(() => {
        const fetchOrcamentos = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                // Endpoint que retorna lista de Procedimentos com status ORCAMENTO
                const data = await ProcedimentoService.listarOrcamentos();
                setOrcamentos(data || []);
            } catch (error) {
                console.error("Erro ao carregar orçamentos:", error);
                setFetchError(`Falha ao carregar lista: ${error.message}`);
                setOrcamentos([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrcamentos();
    }, []);

    // --- HANDLERS DE AÇÃO ---
    
    // 1. Agendar Execução
    const handleAgendarOrcamento = (orcamento) => {
        const paciente = orcamento.agendamento?.paciente;
        if (!paciente) return alert("Dados do paciente não encontrados.");

        if (window.confirm(`Deseja agendar a execução do ORÇAMENTO de ${paciente.nome}?`)) {
            navigate(`/agenda/nova?pacienteId=${paciente.id}&tipo=orcamento&orcamentoId=${orcamento.id}`); 
        }
    };

    // 2. Cancelar/Excluir Orçamento (NOVO)
    const handleCancelarOrcamento = async (orcamento) => {
        const pacienteNome = orcamento.agendamento?.paciente?.nome || 'Paciente';
        
        if (window.confirm(`Tem certeza que deseja CANCELAR/EXCLUIR o orçamento de ${pacienteNome}?\nIsso removerá este item da lista de pendências.`)) {
            try {
                // Tenta excluir ou cancelar via serviço
                // Verifica se existe o método excluir, senão tenta atualizar status
                if (ProcedimentoService.excluir) {
                    await ProcedimentoService.excluir(orcamento.id);
                } else if (ProcedimentoService.atualizarStatus) {
                    await ProcedimentoService.atualizarStatus(orcamento.id, 'CANCELADO');
                } else {
                    // Fallback genérico caso o serviço não tenha metodo explicito exposto aqui
                    throw new Error("Método de exclusão não configurado no serviço.");
                }

                // Remove da lista local para atualizar a tela sem recarregar
                setOrcamentos(prev => prev.filter(item => item.id !== orcamento.id));
                alert("Orçamento cancelado com sucesso.");

            } catch (error) {
                console.error("Erro ao cancelar orçamento:", error);
                alert(`Erro ao cancelar: ${error.message}`);
            }
        }
    };

    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
                    <FaArrowLeft /> Voltar
                </button>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <FaFileInvoiceDollar className="text-yellow-600" /> Orçamentos Pendentes
                </h2>
                <p className="text-base md:text-lg text-gray-600 mb-6">Lista de pacientes que realizaram avaliação mas ainda não iniciaram o tratamento.</p>

                {fetchError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
                        <FaExclamationTriangle /> {fetchError}
                    </div>
                )}

                <section className="bg-white p-4 md:p-6 rounded-xl shadow-lg overflow-x-auto">
                    <h3 className="text-xl font-semibold text-yellow-700 mb-4 border-b pb-2 flex items-center gap-2">
                        <FaUsers /> {orcamentos.length} Orçamentos Abertos
                    </h3>
                    
                    {isLoading ? (
                        <div className="py-8 text-center text-yellow-600 flex items-center justify-center gap-2">
                            <FaSpinner className="animate-spin text-xl" /> Carregando orçamentos...
                        </div>
                    ) : orcamentos.length === 0 ? (
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
                            <FaCheckCircle /> Nenhum orçamento pendente.
                        </div>
                    ) : (
                        <table className="min-w-full text-left table-auto">
                            <thead>
                                <tr className="bg-yellow-50 text-sm text-yellow-800 uppercase tracking-wider">
                                    <th className="py-3 px-4">Data Orçamento</th>
                                    <th className="py-3 px-4">Paciente</th>
                                    <th className="py-3 px-4 hidden md:table-cell">Profissional</th>
                                    <th className="py-3 px-4">Total Orçado</th>
                                    <th className="py-3 px-4 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orcamentos.map(orc => {
                                    const paciente = orc.agendamento?.paciente;
                                    const total = orc.itens?.reduce((acc, i) => acc + (i.valorLiquido || i.valorBase || 0), 0) || 0;
                                    
                                    return (
                                    <tr key={orc.id} className="hover:bg-yellow-50/50">
                                        <td className="py-3 px-4 text-gray-600">
                                            {new Date(orc.dataRegistro).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                            {paciente?.nome || 'N/A'}
                                        </td>
                                        
                                        <td className="py-3 px-4 hidden md:table-cell text-gray-600">
                                            {orc.agendamento?.profissional?.nome || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-green-600 font-bold">
                                            R$ {total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                        </td>
                                        
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* BOTÃO AGENDAR EXECUÇÃO */}
                                                <button 
                                                    onClick={() => handleAgendarOrcamento(orc)}
                                                    className="bg-indigo-600 text-white text-sm px-3 py-2 rounded hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                                                    title="Agendar Execução"
                                                >
                                                    <FaCalendarPlus /> Agendar
                                                </button>

                                                {/* 🌟 BOTÃO CANCELAR ORÇAMENTO */}
                                                <button 
                                                    onClick={() => handleCancelarOrcamento(orc)}
                                                    className="bg-red-100 text-red-600 text-sm px-3 py-2 rounded hover:bg-red-200 transition flex items-center gap-2 shadow-sm"
                                                    title="Cancelar/Excluir Orçamento"
                                                >
                                                    <FaTimesCircle />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </div>
    );
}