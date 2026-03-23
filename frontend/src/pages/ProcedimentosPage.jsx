import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '../components/SideBar';
import { FaTooth, FaUndo, FaSearch, FaCheckCircle, FaExclamationCircle, FaSpinner, FaCalendarAlt, FaUser, FaMoneyBillWave, FaClock, FaBan, FaLock } from 'react-icons/fa'; 
import { useNavigate, useLocation } from 'react-router-dom';
import AgendamentoService from '../services/AgendamentoService';
import ProcedimentoService from '../services/ProcedimentoService'; 
 
const extractHorarioFromDataHora = (dataHoraStr) => { if (!dataHoraStr || typeof dataHoraStr !== 'string' || dataHoraStr.length < 16) return 'N/A'; return dataHoraStr.substring(11, 16); };

// ✅ Função para pegar o primeiro nome
const getFirstName = (fullName) => {
    if (!fullName) return '';
    return String(fullName).split(' ')[0];
};

const mapToValidString = (obj) => { if (typeof obj === 'object' && obj !== null) return String(obj.nome || ''); return String(obj || ''); };
const formatDateToInput = (date) => { const d = new Date(date); let month = '' + (d.getMonth() + 1); let day = '' + d.getDate(); const year = d.getFullYear(); if (month.length < 2) month = '0' + month; if (day.length < 2) day = '0' + day; return [year, month, day].join('-'); }

const actionStatusConfig = {
    "Em Andamento": { style: "bg-blue-100 text-blue-700", label: "Em Andamento" },
    "PENDENTE": { style: "bg-yellow-100 text-yellow-700", label: "Aguardando" },
    "CONFIRMADO": { style: "bg-blue-50 text-blue-600 border border-blue-100", label: "Confirmado" },
    "REAGENDADO": { style: "bg-purple-100 text-purple-700", label: "Reagendado" },
    "AGUARDANDO_RETORNO": { style: "bg-orange-100 text-orange-700", label: "Aguardando Retorno" },
    "CONCLUIDO_RETORNO": { style: "bg-gray-200 text-gray-700", label: "Retorno Concluído" },
    "RETORNO": { style: "bg-gray-400 text-white", label: "Retorno" }, 
    "CONCLUIDO": { style: "bg-green-100 text-green-700", label: "Concluído" },
    "CANCELADO": { style: "bg-red-100 text-red-700", label: "Cancelado" },
};

const paymentStatusConfig = {
    "PAGO": { style: "bg-green-100 text-green-800 border border-green-200", label: "Pago", icon: <FaCheckCircle className="text-green-600"/> },
    "AGUARDANDO": { style: "bg-gray-100 text-gray-600 border border-gray-200", label: "Aguardando", icon: <FaClock className="text-gray-500"/> },
    "NAO_PAGO": { style: "bg-red-100 text-red-800 border border-red-200", label: "Não Pago", icon: <FaExclamationCircle className="text-red-600"/> },
    "PARCIALMENTE_PAGO": { style: "bg-yellow-100 text-yellow-800 border border-yellow-300", label: "Parcial", icon: <FaMoneyBillWave className="text-yellow-600"/> },
    "DEBITO_SESSAO": { style: "bg-red-50 text-red-700 border border-red-200", label: "Débito", icon: <FaExclamationCircle className="text-red-500"/> },
    "EM_ATENDIMENTO": { style: "bg-blue-100 text-blue-800 border border-blue-200", label: "Em Atendimento", icon: <FaSpinner className="text-blue-600 animate-spin"/> },
    "ORCAMENTO": { style: "bg-purple-50 text-purple-700 border border-purple-200 border-dashed", label: "Orçamento", icon: <FaTooth className="text-purple-500"/> }
};

export default function ProcedimentosPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [atendimentos, setAtendimentos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(formatDateToInput(new Date()));

    const userRole = localStorage.getItem('user_role');
    const canEdit = userRole === 'ADMINISTRADOR' || userRole === 'DENTISTA';

    const getActionLabel = (status, notas) => {
        if (status === 'CANCELADO') return 'Cancelado';
        const statusParaIniciar = ['PENDENTE', 'CONFIRMADO', 'REAGENDADO', 'AGUARDANDO_RETORNO', 'RETORNO'];
        if (statusParaIniciar.includes(status)) return 'Iniciar Atendimento';
        if (status === 'CONCLUIDO' || status === 'CONCLUIDO_RETORNO') return 'Visualizar Registro';
        if (status === 'CONCLUIDO' && !notas) return 'Visualizar Registro'; 
        return 'Registrar Procedimento';
    };

    const fetchAtendimentos = useCallback(async (date) => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const [dataAgendamentos, dataProcedimentos] = await Promise.all([
                AgendamentoService.listarPorData(date),
                ProcedimentoService.listarPorData(date)
            ]);
            
            const currentRole = localStorage.getItem('user_role');
            const userId = localStorage.getItem('user_id');
            
            let agendamentosFiltrados = dataAgendamentos;

            if (currentRole === 'DENTISTA') {
                agendamentosFiltrados = dataAgendamentos.filter(item => 
                    item.profissional && String(item.profissional.id) === String(userId)
                );
            }

            const mappedData = agendamentosFiltrados
                .filter(item => {
                    return item.status !== 'PENDENTE' && item.status !== 'CANCELADO';
                })
                .map(item => {
                    const isFinalizado = ['CONCLUIDO', 'CONCLUIDO_RETORNO', 'CANCELADO'].includes(item.status);
                    
                    const procedimentoVinculado = dataProcedimentos.find(p => 
                        p.agendamento && String(p.agendamento.id) === String(item.id)
                    );
                    
                    let statusFinanceiroReal = 'AGUARDANDO';
                    
                    if (procedimentoVinculado && procedimentoVinculado.statusPagamento) {
                        statusFinanceiroReal = procedimentoVinculado.statusPagamento;
                    }

                    // 1. Pega o nome completo seguro
                    const nomeCompletoProf = mapToValidString(item.profissional);

                    return {
                        id: item.id,
                        dataHora: item.dataHora, 
                        horario: extractHorarioFromDataHora(item.dataHora),
                        paciente: item.paciente, 
                        pacienteNome: mapToValidString(item.paciente),
                        pacienteFoto: item.paciente?.foto || null, 
                        // 2. Aplica a função para pegar só o primeiro nome
                        profissional: getFirstName(nomeCompletoProf), 
                        area: item.area || 'Não Definida', 
                        status: item.status, 
                        statusPagamento: statusFinanceiroReal, 
                        registroPendente: !isFinalizado, 
                        acao: getActionLabel(item.status, item.notas),
                    };
                });

            const sortedData = mappedData.sort((a, b) => {
                if (a.dataHora < b.dataHora) return -1;
                if (a.dataHora > b.dataHora) return 1;
                return 0;
            });

            setAtendimentos(sortedData);
        } catch (error) {
            console.error("Erro ao carregar atendimentos:", error);
            setFetchError(`Falha ao carregar dados: ${error.message}`);
            setAtendimentos([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setSearchTerm(''); 
        fetchAtendimentos(selectedDate);
    }, [selectedDate, location, fetchAtendimentos]); 

    const handleAcao = (item) => { navigate(`/procedimentos/registro/${item.id}`); };
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleDateChange = (e) => setSelectedDate(e.target.value);

    const filteredAtendimentos = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return atendimentos.filter(item => {
            const statusLabel = actionStatusConfig[item.status]?.label || item.status;
            return item.pacienteNome.toLowerCase().includes(lowerSearchTerm) ||
                   item.horario.includes(lowerSearchTerm) ||
                   item.profissional.toLowerCase().includes(lowerSearchTerm) || 
                   item.area.toLowerCase().includes(lowerSearchTerm) || 
                   statusLabel.toLowerCase().includes(lowerSearchTerm);
        });
    }, [atendimentos, searchTerm]);

    const getDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00'); 
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />
            
            <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-y-auto w-full">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Painel de Procedimentos</h2>
                        <p className="text-base md:text-xl text-indigo-600 font-semibold">Visualizando: {getDisplayDate(selectedDate)}</p>
                    </div>
                    
                    {canEdit && (
                        <button 
                            onClick={() => navigate('/procedimentos/relatorio')}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition transform hover:scale-105 whitespace-nowrap text-sm md:text-base"
                        >
                            Relatório de Procedimentos 
                        </button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="relative w-full sm:max-w-xs">
                        <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 mb-1">Selecione a Data</label>
                        <div className="relative">
                            <input id="date-picker" type="date" value={selectedDate} onChange={handleDateChange} className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none" />
                            <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <input type="text" placeholder="Buscar paciente, horário..." value={searchTerm} onChange={handleSearchChange} className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
                
                {fetchError && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{fetchError}</div>)}

                <section className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-4 border-b pb-2 whitespace-nowrap">Atendimentos ({filteredAtendimentos.length} encontrados)</h3>
                    
                    {isLoading ? (
                        <div className="py-8 text-center text-indigo-600 flex items-center justify-center gap-2"><FaSpinner className="animate-spin text-xl" /> Carregando...</div>
                    ) : filteredAtendimentos.length === 0 ? (
                        <p className="text-gray-500 py-4">Nenhum atendimento confirmado ou encontrado.</p>
                    ) : (
                        <>
                            {/* WRAPPER DA TABELA COM SCROLL */}
                            <div className="overflow-y-auto max-h-[600px] border border-gray-100 rounded-lg">
                                <table className="min-w-full text-left table-auto">
                                    <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                                            <tr className="text-sm text-gray-600 uppercase tracking-wider">
                                                <th className="py-3 px-4 whitespace-nowrap">Horário</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Paciente</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Profissional</th>
                                                {/* Removido: Área */}
                                                <th className="py-3 px-4 whitespace-nowrap">Status Agenda</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Financeiro</th>
                                                {/* Removido: Registro */}
                                                <th className="py-3 px-4 whitespace-nowrap">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-700 divide-y divide-gray-200">
                                            {filteredAtendimentos.map(item => {
                                                const statusConfig = actionStatusConfig[item.status] || { style: "bg-gray-200 text-gray-700", label: item.status };
                                                const finConfig = paymentStatusConfig[item.statusPagamento] || paymentStatusConfig['AGUARDANDO'];
                                                const fotoUrl = item.pacienteFoto;
                                                const isCancelled = item.status === 'CANCELADO';
                                                
                                                const isActionDisabled = isCancelled || !canEdit;

                                                return (
                                                    <tr key={item.id} className="border-b hover:bg-gray-50">
                                                        <td className="py-3 px-4 font-semibold text-indigo-600 whitespace-nowrap">{item.horario}</td>
                                                        
                                                        <td className="py-3 px-4 flex items-center gap-2 whitespace-nowrap">
                                                            {fotoUrl ? (
                                                                <img src={fotoUrl} alt={item.pacienteNome} className="w-8 h-8 object-cover rounded-full shadow-sm flex-shrink-0" onError={(e) => { e.target.onerror = null; e.target.parentNode.innerHTML = `<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg></div>${item.pacienteNome}`; }}/>
                                                            ) : (<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0"><FaUser className='w-4 h-4' /></div>)}
                                                            <span className='truncate'>{item.pacienteNome}</span>
                                                        </td>
                                                        
                                                        <td className="py-3 px-4 whitespace-nowrap">{item.profissional}</td>
                                                        
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${statusConfig.style}`}>
                                                                {statusConfig.label}
                                                            </span>
                                                        </td>

                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {isCancelled ? (
                                                                <span className="text-gray-400 text-xs italic">-</span>
                                                            ) : (
                                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border whitespace-nowrap ${finConfig.style}`}>
                                                                    {finConfig.icon && <span className="text-xs">{finConfig.icon}</span>}
                                                                    <span className="text-xs font-bold">{finConfig.label}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <button 
                                                                onClick={() => !isActionDisabled && handleAcao(item)} 
                                                                disabled={isActionDisabled}
                                                                className={`flex items-center gap-1 text-sm font-medium transition whitespace-nowrap ${isActionDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                                                            >
                                                                {isCancelled ? <FaBan/> : (!canEdit ? <FaLock /> : (item.acao.includes("Visualizar") ? <FaUndo /> : <FaTooth />))} 
                                                                
                                                                <span className="hidden xl:inline">
                                                                    {!canEdit ? "Restrito" : item.acao}
                                                                </span>
                                                                <span className="xl:hidden">
                                                                    {!canEdit ? "Restrito" : (item.acao.includes("Iniciar") ? "Iniciar" : "Ver")}
                                                                </span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="flex justify-between items-center mt-4 text-gray-500 text-xs sm:text-sm">
                                   <span>Total do dia: {filteredAtendimentos.length}</span>
                                </div>
                            </>
                        )}
                    </section>
                </main>
            </div>
        );
    }