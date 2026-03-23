import React, { useState, useEffect } from 'react';
import Sidebar from '../components/SideBar';
import { 
    FaCalendarPlus, FaSpinner, FaUsers, FaCheckCircle, 
    FaExclamationTriangle, FaRedoAlt, FaClock, FaTimesCircle 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AgendamentoService from '../services/AgendamentoService';
import PacienteService from '../services/PacienteService'; // 1. Importar PacienteService

export default function RetornoAgendamentoPage() {
    const navigate = useNavigate();
    const [pacientes, setPacientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // --- LÓGICA DE BUSCA ---
    useEffect(() => {
        const fetchPacientesRetorno = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                const data = await AgendamentoService.listarPacientesComRetornoPendente();
                setPacientes(data || []);
            } catch (error) {
                console.error("Erro ao carregar pacientes para retorno:", error);
                setFetchError(`Falha ao carregar lista: ${error.message}`);
                setPacientes([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPacientesRetorno();
    }, []);

    // --- FILTRAGEM (Recorrentes vs Simples) ---
    const retornosRecorrentes = pacientes.filter(p => p.recorrente || (p.diasRecorrencia && p.diasRecorrencia > 0));
    const retornosSimples = pacientes.filter(p => !p.recorrente && (!p.diasRecorrencia || p.diasRecorrencia === 0));

    // --- HANDLERS DE AÇÃO ---
    const handleAgendarProcedimento = (paciente) => {
        if (window.confirm(`Deseja agendar um novo procedimento para o paciente ${paciente.nome}?`)) {
            // Adiciona &tipo=retorno para o NovoAgendamento saber que é um retorno
            navigate(`/agenda/nova?pacienteId=${paciente.id}&tipo=retorno`); 
        }
    };

    // 🌟 NOVO HANDLER: CANCELAR RETORNO
    const handleCancelarRetorno = async (paciente) => {
        if (window.confirm(`Tem certeza que deseja remover ${paciente.nome} da lista de retornos pendentes?`)) {
            try {
                await PacienteService.limparMarcacaoRetorno(paciente.id);
                // Remove da lista localmente para atualizar a tela sem recarregar
                setPacientes(prev => prev.filter(p => p.id !== paciente.id));
            } catch (error) {
                alert("Erro ao cancelar retorno: " + error.message);
            }
        }
    };

    // Helper para formatar data
    const formatData = (dataStr) => {
        if (!dataStr) return '--/--/----';
        return new Date(dataStr).toLocaleDateString('pt-BR');
    };

    // Helper para calcular/mostrar previsão
    const getPrevisao = (paciente) => {
        if (paciente.dataPrevisao) return formatData(paciente.dataPrevisao);
        if (paciente.dataUltimaVisita && paciente.diasRecorrencia) {
            const dt = new Date(paciente.dataUltimaVisita);
            dt.setDate(dt.getDate() + paciente.diasRecorrencia);
            return dt.toLocaleDateString('pt-BR');
        }
        return "A Definir";
    };

    // Helper para cor da previsão
    const getPrevisaoClass = (dataStr) => {
        if (!dataStr) return "text-gray-600";
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        
        let dataPrev;
        if (dataStr.includes('/')) {
            const [dia, mes, ano] = dataStr.split('/');
            dataPrev = new Date(`${ano}-${mes}-${dia}`);
        } else {
            dataPrev = new Date(dataStr);
        }

        if (dataPrev < hoje) return "text-red-600 font-bold"; 
        if (dataPrev.getTime() === hoje.getTime()) return "text-orange-600 font-bold"; 
        return "text-green-600 font-bold"; 
    };

    // --- RENDERIZAÇÃO ---
    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <FaCalendarPlus className="text-indigo-600" /> Pacientes com Retorno
                </h2>
                <p className="text-base md:text-lg text-gray-600 mb-6">Gerenciamento de retornos pendentes e manutenções recorrentes.</p>

                {fetchError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
                        <FaExclamationTriangle /> {fetchError}
                    </div>
                )}

                {isLoading && (
                    <div className="py-8 text-center text-indigo-600 flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-xl" /> Carregando listas...
                    </div>
                )}

                {/* 🌟 TABELA 1: RETORNOS RECORRENTES (MANUTENÇÃO) */}
                {!isLoading && (
                    <section className="bg-white p-4 md:p-6 rounded-xl shadow-lg overflow-x-auto mb-8 border border-teal-100">
                        <h3 className="text-xl font-semibold text-teal-700 mb-4 border-b pb-2 flex items-center gap-2">
                            <FaRedoAlt /> Manutenções / Recorrentes ({retornosRecorrentes.length})
                        </h3>
                        
                        {retornosRecorrentes.length === 0 ? (
                            <div className="bg-teal-50 text-teal-700 p-4 rounded-lg flex items-center gap-3">
                                <FaCheckCircle /> Nenhuma manutenção recorrente pendente.
                            </div>
                        ) : (
                            <table className="min-w-full text-left table-auto">
                                <thead>
                                    <tr className="bg-teal-50 text-sm text-teal-800 uppercase tracking-wider">
                                        <th className="py-3 px-4">Paciente</th>
                                        <th className="py-3 px-4 hidden md:table-cell">Área</th>
                                        <th className="py-3 px-4 text-center">Frequência</th>
                                        <th className="py-3 px-4 text-center">Previsão</th>
                                        <th className="py-3 px-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {retornosRecorrentes.map(paciente => {
                                        const previsaoStr = getPrevisao(paciente);
                                        return (
                                            <tr key={paciente.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 font-bold text-gray-700">{paciente.nome}</td>
                                                <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500">{paciente.areaAtendimento}</td>
                                                
                                                <td className="py-3 px-4 text-center">
                                                    <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">
                                                        {paciente.diasRecorrencia ? `A cada ${paciente.diasRecorrencia} dias` : 'Recorrente'}
                                                    </span>
                                                </td>

                                                <td className={`py-3 px-4 text-center text-sm ${getPrevisaoClass(previsaoStr)}`}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <FaClock size={12}/> {previsaoStr}
                                                    </div>
                                                </td>
                                                
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {/* BOTÃO CANCELAR */}
                                                        <button 
                                                            onClick={() => handleCancelarRetorno(paciente)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                                                            title="Cancelar Retorno"
                                                        >
                                                            <FaTimesCircle size={18} />
                                                        </button>
                                                        {/* BOTÃO AGENDAR */}
                                                        <button 
                                                            onClick={() => handleAgendarProcedimento(paciente)}
                                                            className="bg-teal-600 text-white text-sm px-3 py-2 rounded hover:bg-teal-700 transition whitespace-nowrap shadow-sm"
                                                        >
                                                            Agendar
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
                )}

                {/* 🌟 TABELA 2: RETORNOS SIMPLES (EXISTENTE) */}
                {!isLoading && (
                    <section className="bg-white p-4 md:p-6 rounded-xl shadow-lg overflow-x-auto border border-gray-100">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                            <FaUsers /> Retornos Simples Pendentes ({retornosSimples.length})
                        </h3>
                        
                        {retornosSimples.length === 0 ? (
                            <div className="bg-gray-50 text-gray-600 p-4 rounded-lg flex items-center gap-3">
                                <FaCheckCircle /> Nenhum retorno simples pendente.
                            </div>
                        ) : (
                            <table className="min-w-full text-left table-auto">
                                <thead>
                                    <tr className="bg-gray-100 text-sm text-gray-600 uppercase tracking-wider">
                                        <th className="py-3 px-4">Nome do Paciente</th>
                                        <th className="py-3 px-4 hidden md:table-cell">Área</th>
                                        <th className="py-3 px-4 hidden md:table-cell">Telefone</th>
                                        <th className="py-3 px-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {retornosSimples.map(paciente => (
                                        <tr key={paciente.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 text-indigo-600 font-medium whitespace-nowrap">{paciente.nome}</td>
                                            <td className="py-3 px-4 hidden md:table-cell text-sm">{paciente.areaAtendimento}</td>
                                            <td className="py-3 px-4 hidden md:table-cell whitespace-nowrap text-sm text-gray-500">{paciente.telefone}</td>
                                            
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* BOTÃO CANCELAR */}
                                                    <button 
                                                        onClick={() => handleCancelarRetorno(paciente)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                                                        title="Cancelar Retorno"
                                                    >
                                                        <FaTimesCircle size={18} />
                                                    </button>
                                                    {/* BOTÃO AGENDAR */}
                                                    <button 
                                                        onClick={() => handleAgendarProcedimento(paciente)}
                                                        className="bg-indigo-500 text-white text-sm px-3 py-2 rounded hover:bg-indigo-600 transition whitespace-nowrap shadow-sm"
                                                    >
                                                        Agendar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}