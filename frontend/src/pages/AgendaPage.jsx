import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/SideBar';
import ModalEdicaoAgendamento from '../components/ModalEdicaoAgendamento';
import ModalVisualizacaoDetalhes from '../components/Agenda/ModalVisualizacaoDetalhes';
import AgendaTable from '../components/Agenda/AgendaTable';
import { RetornosPendentesCard, OrcamentosPendentesCard } from '../components/Agenda/AgendaSats';
import { getTodayDate, formatDisplayDate, mapToValidString } from '../utils/agendaUtils';

// Services
import AgendamentoService from '../services/AgendamentoService';
import ProcedimentoService from '../services/ProcedimentoService';
import PacienteService from '../services/PacienteService';

// Ícones
import { FaCalendarPlus, FaFilter, FaCalendarDay, FaSearch, FaUndoAlt, FaSpinner, FaUserClock } from 'react-icons/fa';

export default function AgendaPage() {
    const navigate = useNavigate();
    const todayDate = getTodayDate();

    // ESTADOS
    const [agendamentos, setAgendamentos] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(todayDate); 
    const [retornosPendentes, setRetornosPendentes] = useState([]); 
    const [orcamentosPendentes, setOrcamentosPendentes] = useState([]); 
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    // --- ESTADOS PARA BUSCA RÁPIDA ---
    const [quickSearchTerm, setQuickSearchTerm] = useState('');
    const [quickSearchResults, setQuickSearchResults] = useState([]);
    const [isSearchingPatient, setIsSearchingPatient] = useState(false);
    
    // Modais
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedAgendamento, setSelectedAgendamento] = useState(null);

    // Filtros
    const [filterCriteria, setFilterCriteria] = useState({
        area: 'Todos',
        profissional: 'Todos',
        status: 'Todos',
        searchQuery: '',
    });

    // --- CARREGAMENTO DE DADOS ---
    const fetchPendencias = async () => {
        try {
            const dataRetornos = await AgendamentoService.listarPacientesComRetornoPendente(); 
            setRetornosPendentes(dataRetornos || []);
            const dataOrcamentos = await ProcedimentoService.listarOrcamentos();
            setOrcamentosPendentes(dataOrcamentos || []);
        } catch (error) {
            console.error("Erro ao carregar pendências:", error);
        }
    }

    const fetchAgendamentos = async (dateToFetch) => {
        setIsLoading(true);
        setFilterCriteria({ area: 'Todos', profissional: 'Todos', status: 'Todos', searchQuery: '' });
        setFetchError(null);
        try {
            let data;
            if (dateToFetch === todayDate) {
                data = await AgendamentoService.listarAgendamentosDeHoje();
            } else {
                data = await AgendamentoService.listarPorData(dateToFetch);
            }
            setAgendamentos(data || []);
        } catch (error) {
            console.error("Erro ao carregar agendamentos:", error);
            setFetchError(`Falha na comunicação com o backend. Detalhe: ${error.message}`);
            setAgendamentos([]);
        } finally {
            setIsLoading(false);
        }
    }; 

    useEffect(() => {
        fetchAgendamentos(selectedDate);
        fetchPendencias(); 
    }, [selectedDate]);

    // --- LÓGICA DE BUSCA RÁPIDA ---
    const handleQuickSearchChange = async (e) => {
        const term = e.target.value;
        setQuickSearchTerm(term);

        if (term.length > 2) {
            setIsSearchingPatient(true);
            try {
                const results = await PacienteService.buscarPorNome(term);
                setQuickSearchResults(results);
            } catch (error) {
                console.error("Erro na busca rápida:", error);
                setQuickSearchResults([]);
            } finally {
                setIsSearchingPatient(false);
            }
        } else {
            setQuickSearchResults([]);
        }
    };

    const handleSelectPatientForNewAppointment = (paciente) => {
        navigate(`/agenda/nova?pacienteId=${paciente.id}`);
    };

    // --- LÓGICA DE FILTROS ---
    const { areas, profissionais, statusOpcoes } = useMemo(() => {
        const allAreas = [...new Set(agendamentos.map(a => a.area))].filter(Boolean).sort();
        const allProfs = [...new Set(agendamentos.map(a => mapToValidString(a, 'profissional')))].filter(Boolean).sort();
        const allStatus = [...new Set(agendamentos.map(a => a.status))].filter(Boolean).sort();
        return { areas: allAreas, profissionais: allProfs, statusOpcoes: allStatus };
    }, [agendamentos]);

    const filteredAgendamentos = useMemo(() => {
        let list = agendamentos;
        const criteria = filterCriteria;
        list = list.filter(item => {
            const itemArea = item.area;
            const itemProfissional = mapToValidString(item, 'profissional');
            const itemStatus = item.status;
            
            const areaMatch = criteria.area === 'Todos' || itemArea === criteria.area;
            const profMatch = criteria.profissional === 'Todos' || itemProfissional === criteria.profissional;
            const statusMatch = criteria.status === 'Todos' || itemStatus === criteria.status;
            const searchLower = criteria.searchQuery.toLowerCase();
            const searchMatch = !searchLower || mapToValidString(item, 'paciente').toLowerCase().includes(searchLower) || itemProfissional.toLowerCase().includes(searchLower);

            return areaMatch && profMatch && statusMatch && searchMatch;
        });
        return list.sort((a, b) => {
            const horaA = a.dataHora ? a.dataHora.substring(11, 16) : "";
            const horaB = b.dataHora ? b.dataHora.substring(11, 16) : "";
            return horaA.localeCompare(horaB);
        });
    }, [agendamentos, filterCriteria]);

    // --- HANDLERS DE AÇÃO ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterCriteria(prev => ({ ...prev, [name]: value }));
    };

    const handleResetFilter = () => {
        setFilterCriteria({ area: 'Todos', profissional: 'Todos', status: 'Todos', searchQuery: '' });
    };

    const handleEdit = (agendamento) => {
        setSelectedAgendamento(agendamento);
        setIsEditModalOpen(true);
    };

    const handleRowClick = (agendamento) => {
        setSelectedAgendamento(agendamento);
        setIsViewModalOpen(true);
    };

    const handleWhatsApp = (telefone) => {
        if (!telefone) return alert("Paciente sem telefone cadastrado.");
        const numeroLimpo = telefone.replace(/\D/g, '');
        const numeroFinal = numeroLimpo.length <= 11 ? `55${numeroLimpo}` : numeroLimpo;
        window.open(`https://wa.me/${numeroFinal}`, '_blank');
    };

    // 🌟 NOVO HANDLER: IR PARA FINANCEIRO
    const handleOpenFinanceiro = (item) => {
        if (item.paciente?.id) {
            // Navega para a página de detalhes enviando 'activeTab' no state
            navigate(`/pacientes/${item.paciente.id}`, { state: { activeTab: 'financeiro' } });
        } else {
            alert("Erro: Paciente não vinculado a este agendamento.");
        }
    };

    const updateAgendamento = async (updatedData) => {
        try {
            if (!updatedData.id) throw new Error("ID do agendamento ausente.");
            const result = await AgendamentoService.atualizarAgendamentoCompleto(updatedData.id, updatedData);
            setAgendamentos(prev => prev.map(item => item.id === result.id ? result : item));
            return true;
        } catch (error) {
            console.error("Erro ao salvar agendamento:", error);
            alert(`Erro ao salvar agendamento: ${error.message}`);
            return false;
        }
    };

    const handleSave = async (updatedData) => {
        const success = await updateAgendamento(updatedData);
        if (success) {
            fetchAgendamentos(selectedDate);
            setIsEditModalOpen(false);
            setSelectedAgendamento(null);
        }
    };

    const handleConfirmarPresenca = async (item) => {
        if (!window.confirm(`Confirmar presença de ${mapToValidString(item, 'paciente')}?`)) return;
        try {
            await AgendamentoService.atualizarStatus(item.id, 'CONFIRMADO');
            setAgendamentos(prev => prev.map(ag => ag.id === item.id ? { ...ag, status: 'CONFIRMADO' } : ag));
        } catch (error) {
            console.error("Erro ao confirmar:", error);
            alert("Erro ao confirmar: " + error.message);
        }
    };

    const handleCancel = async (item) => {
        // 1. Confirmação única de segurança (Simplificada conforme pedido anterior)
        if (!window.confirm(`Tem certeza que deseja cancelar o agendamento de ${mapToValidString(item, 'paciente')}?`)) return;
        
        try {
            // 2. Chama o serviço para cancelar
            const updatedItem = await AgendamentoService.atualizarStatus(item.id, 'CANCELADO'); 
            
            // 3. Atualiza a interface imediatamente
            setAgendamentos(prev => prev.map(ag => ag.id === updatedItem.id ? updatedItem : ag));

        } catch (error) {
            console.error("Erro ao cancelar:", error);
            alert(`Erro ao cancelar agendamento: ${error.message}`);
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />

            <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-y-auto w-full">
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Agenda Diária</h2>
                    <p className="text-sm md:text-xl text-indigo-600 font-semibold">Agendamentos para {formatDisplayDate(selectedDate)}</p>
                </div>

                <RetornosPendentesCard count={retornosPendentes.length} />
                <OrcamentosPendentesCard count={orcamentosPendentes.length} />
                
                {/* --- BARRA DE AÇÕES --- */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 gap-4 bg-gray-100 p-4 rounded-xl border border-gray-200">
                    
                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-start md:items-center">
                        <Link to="/agenda/nova" className="flex items-center w-full md:w-auto gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-200 justify-center whitespace-nowrap">
                            <FaCalendarPlus /> Novo Agendamento
                        </Link>

                        <span className="hidden md:block text-gray-400 font-bold">OU</span>

                        {/* BUSCA RÁPIDA AQUI */}
                        <div className="relative w-full md:w-80 z-20">
                            <div className="flex items-center border border-indigo-300 rounded-lg bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                <div className="pl-3 text-indigo-500"><FaUserClock /></div>
                                <input 
                                    type="text" 
                                    placeholder="Buscar paciente para agendar..." 
                                    className="w-full p-3 outline-none text-sm text-gray-700"
                                    value={quickSearchTerm}
                                    onChange={handleQuickSearchChange}
                                />
                                {isSearchingPatient && <FaSpinner className="animate-spin mr-3 text-gray-400"/>}
                            </div>
                            
                            {/* Dropdown de Resultados */}
                            {quickSearchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 max-h-60 overflow-y-auto z-30">
                                    {quickSearchResults.map(paciente => (
                                        <div 
                                            key={paciente.id}
                                            onClick={() => handleSelectPatientForNewAppointment(paciente)}
                                            className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0 flex flex-col group"
                                        >
                                            <span className="font-bold text-gray-800 group-hover:text-indigo-700">{paciente.nome}</span>
                                            <span className="text-xs text-gray-500">CPF: {paciente.cpf}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end bg-white p-2 px-4 rounded-lg border border-gray-300 shadow-sm">
                        <label htmlFor="agenda-date" className="font-semibold text-gray-700 text-sm whitespace-nowrap">Visualizar Dia:</label>
                        <input 
                            type="date" 
                            id="agenda-date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="p-1 outline-none text-gray-700 font-medium"
                        />
                    </div>
                </div>

                <section className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 mb-4 gap-2">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <FaCalendarDay className="text-indigo-500 shrink-0" /> 
                            <span className="truncate">Agendamentos ({filteredAgendamentos.length})</span>
                        </h3>
                        <button className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-sm ${isFilterVisible ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`} onClick={() => setIsFilterVisible(prev => !prev)}>
                            <FaFilter /> Filtro
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden mb-4 ${isFilterVisible ? 'opacity-100 max-h-[600px] scale-y-100' : 'opacity-0 max-h-0 scale-y-95 pointer-events-none'}`}>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="col-span-1 sm:col-span-2 md:col-span-1 flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                                    <div className="p-3 text-gray-500 bg-gray-100"><FaSearch /></div>
                                    <input type="text" name="searchQuery" placeholder="Filtrar na grade..." value={filterCriteria.searchQuery} onChange={handleFilterChange} className="flex-1 p-2 md:p-3 focus:ring-indigo-500 focus:border-indigo-500 border-none min-w-0"/>
                                </div>
                                <select name="area" value={filterCriteria.area} onChange={handleFilterChange} className="p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full">
                                    <option value="Todos">Todas as Áreas</option>
                                    {areas.map(area => <option key={area} value={area}>{area}</option>)}
                                </select>
                                <select name="profissional" value={filterCriteria.profissional} onChange={handleFilterChange} className="p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full">
                                    <option value="Todos">Todos Profissionais</option>
                                    {profissionais.map(prof => <option key={prof} value={prof}>{prof}</option>)}
                                </select>
                                <select name="status" value={filterCriteria.status} onChange={handleFilterChange} className="p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full">
                                    <option value="Todos">Todos Status</option>
                                    {statusOpcoes.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end mt-3">
                                <button onClick={handleResetFilter} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition w-full sm:w-auto justify-center">
                                    <FaUndoAlt /> Limpar Filtro
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {fetchError && (
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <p className="font-bold">Atenção:</p>
                            <p className="text-sm">{fetchError}</p>
                        </div>
                    )}
                    
                    {isLoading ? (
                        <div className="py-10 text-center text-indigo-600 flex items-center justify-center gap-2"><FaSpinner className="animate-spin text-xl" /> Carregando...</div>
                    ) : (
                        <>
                            {/* TABELA DE AGENDAMENTOS */}
                            <div className="overflow-y-auto max-h-[600px] border border-gray-100 rounded-lg">
                                <table className="min-w-[800px] md:min-w-full text-left table-auto">
                                    <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                                        <tr className="text-xs text-gray-600 uppercase tracking-wider">
                                            <th className="py-3 px-3">Hora</th>
                                            <th className="py-3 px-3">Paciente</th>
                                            <th className="py-3 px-3">Tipo</th>
                                            <th className="py-3 px-3 hidden md:table-cell">Profissional</th>
                                            <th className="py-3 px-3">Status</th>
                                            <th className="py-3 px-3">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700 divide-y divide-gray-200">
                                        <AgendaTable 
                                            agendamentos={filteredAgendamentos}
                                            retornosPendentes={retornosPendentes}
                                            handleRowClick={handleRowClick}
                                            handleConfirmarPresenca={handleConfirmarPresenca}
                                            handleWhatsApp={handleWhatsApp}
                                            handleEdit={handleEdit}
                                            handleCancel={handleCancel}
                                            handleOpenFinanceiro={handleOpenFinanceiro} // 🌟 PROP NOVA PASSADA AQUI
                                        />
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                                <span>Total do dia: {filteredAgendamentos.length}</span>
                            </div>
                        </>
                    )}
                </section>

                {/* Modais */}
                {isEditModalOpen && selectedAgendamento && (
                    <ModalEdicaoAgendamento agendamento={selectedAgendamento} onClose={() => setIsEditModalOpen(false)} onSave={handleSave} />
                )}
                {isViewModalOpen && selectedAgendamento && (
                    <ModalVisualizacaoDetalhes item={selectedAgendamento} onClose={() => setIsViewModalOpen(false)} />
                )}
            </main>
        </div>
    );
}