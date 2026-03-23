import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/SideBar';
import { 
    FaUserPlus, FaSearch, FaExclamationCircle, FaBirthdayCake, FaDollarSign, 
    FaBriefcaseMedical, FaUser, FaTimes, FaWhatsapp,
    FaGhost, FaClock, FaMoneyBillWave, FaCheckCircle, FaCalendarCheck
} from 'react-icons/fa'; 
import { Link, useNavigate } from 'react-router-dom'; 
import PacienteService from '../services/PacienteService';

const STATUS_MAP = {
    'COM_DEBITOS_EM_ABERTO': ["Com Débitos", "bg-red-100 text-red-700"],
    'PENDENTE': ["Pendente", "bg-yellow-100 text-yellow-700"],
    'SEM_DEBITOS': ["Sem Débitos", "bg-green-100 text-green-700"],
};

const areasAtendimento = ["ODONTOLOGIA", "FISIOTERAPIA", "NUTRICIONISTA", "PSICOLOGIA", "CLINICA_GERAL"];

const getStatusDisplay = (statusEnum) => {
    return STATUS_MAP[statusEnum] || [statusEnum || 'Desconhecido', 'bg-gray-100 text-gray-500'];
};

// 🌟 CONFIGURAÇÃO VISUAL DOS ALERTAS
const ALERT_CONFIG = {
    'INADIMPLENTE': { text: "Inadimplente (+60d)", style: "bg-red-100 text-red-700 border border-red-200", icon: FaMoneyBillWave },
    'ORCAMENTO_PARADO': { text: "Orçamento Parado (+30d)", style: "bg-orange-100 text-orange-800 border border-orange-200", icon: FaClock },
    'RETORNO_PENDENTE': { text: "Retorno", style: "bg-purple-100 text-purple-700 border border-purple-200", icon: FaCalendarCheck },
    'INATIVO': { text: "Inativo (+90d)", style: "bg-gray-100 text-gray-600 border border-gray-300", icon: FaGhost },
    'ATIVO': { text: "Ativo", style: "bg-green-50 text-green-600 border border-green-200", icon: FaCheckCircle }
};

const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '—';
    if (isoDate.includes('/')) return isoDate; 
    try {
        const [year, month, day] = isoDate.substring(0, 10).split('-');
        return `${day}/${month}/${year}`;
    } catch (e) { return isoDate; }
};

const checkBirthdayProximo = (isoDate) => {
    if (!isoDate || isoDate.length < 10) return false;
    const parts = isoDate.substring(0, 10).split('-');
    const diaAniversario = parseInt(parts[2], 10);
    const mesAniversario = parseInt(parts[1], 10) - 1; 
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    for (let i = 0; i <= 7; i++) {
        const dataChecagem = new Date(hoje);
        dataChecagem.setDate(hoje.getDate() + i);
        if (dataChecagem.getMonth() === mesAniversario && dataChecagem.getDate() === diaAniversario) {
            return true;
        }
    }
    return false;
};

const PhotoModal = ({ url, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 z-10"><FaTimes /></button>
            <img src={url} alt="Foto do Paciente Ampliada" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />
        </div>
    </div>
);

export default function PacientesPage() {
    const navigate = useNavigate();
    const [pacientes, setPacientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    
    const [filtroArea, setFiltroArea] = useState('todos');
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [filtroEspecial, setFiltroEspecial] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Removed currentPage state since pagination is replaced by scroll
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');

    const handleShowPhoto = (url) => { setPhotoUrl(url); setShowPhotoModal(true); };

    const handleWhatsApp = (telefone) => {
        if (!telefone) return alert("Paciente sem telefone cadastrado.");
        const numeroLimpo = telefone.replace(/\D/g, '');
        const numeroFinal = numeroLimpo.length <= 11 ? `55${numeroLimpo}` : numeroLimpo;
        window.open(`https://wa.me/${numeroFinal}`, '_blank');
    };

    const fetchPacientes = async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            const data = await PacienteService.listarTodos();
            const pacientesComUrls = data.map(p => ({
                ...p,
                fotoUrl: p.foto
            }));
            setPacientes(pacientesComUrls);
        } catch (err) {
            setApiError(err.message || "Erro ao carregar pacientes da API.");
        } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchPacientes(); }, []); 
    
    const pacientesFiltrados = useMemo(() => {
        let lista = pacientes.filter(p => {
            if (filtroArea !== 'todos' && p.areaAtendimento !== filtroArea) return false;
            if (filtroStatus !== 'todos' && p.statusFinanceiro !== filtroStatus) return false;
            
            if (filtroEspecial !== 'todos') {
                if (filtroEspecial === 'aniversariantes') {
                    if (!checkBirthdayProximo(p.nascimento)) return false;
                } else if (filtroEspecial === 'debitos') {
                    if (p.statusFinanceiro !== 'COM_DEBITOS_EM_ABERTO') return false;
                } else {
                    if (!p.listaAlertas || !p.listaAlertas.includes(filtroEspecial)) return false;
                }
            }
            
            const termo = searchTerm.toLowerCase();
            return p.nome?.toLowerCase().includes(termo) || p.cpf?.toLowerCase().includes(termo);
        });
        return lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    }, [pacientes, filtroArea, filtroStatus, filtroEspecial, searchTerm]);

    // Removed pagination calculation logic

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />
            
            <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 w-full overflow-y-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Lista de Pacientes ({pacientes.length})</h2>
                
                {isLoading && (<div className="text-indigo-600 font-semibold mb-4">Carregando pacientes da API...</div>)}
                {apiError && (<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">{apiError}</div>)}

                <div className="flex flex-col gap-4 mb-8">
                    {/* Botão Novo e Busca */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <Link to="/pacientes/novo" className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 w-full md:w-auto">
                            <FaUserPlus /> <span>Cadastrar Novo Paciente</span>
                        </Link>
                        <div className="relative w-full md:w-80">
                            <input 
                                type="text" 
                                placeholder="Buscar por nome ou CPF..." 
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value);}}
                                className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" 
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 p-3 bg-gray-100 rounded-lg text-sm">
                        <div className="w-full sm:w-auto flex items-center gap-2">
                            <FaBriefcaseMedical className="text-gray-600" />
                            <select value={filtroArea} onChange={(e) => {setFiltroArea(e.target.value);}} className="flex-1 sm:flex-none p-2 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="todos">Todas as Áreas</option>
                                {areasAtendimento.map(area => <option key={area} value={area}>{area}</option>)}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto flex items-center gap-2">
                            <FaDollarSign className="text-gray-600" />
                            <select value={filtroStatus} onChange={(e) => {setFiltroStatus(e.target.value);}} className="flex-1 sm:flex-none p-2 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="todos">Todos os Status</option>
                                {Object.keys(STATUS_MAP).map(statusEnum => (<option key={statusEnum} value={statusEnum}>{getStatusDisplay(statusEnum)[0]}</option>))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto flex items-center gap-2">
                            <span className="font-medium text-gray-600 shrink-0">Especiais:</span>
                            <select value={filtroEspecial} onChange={(e) => {setFiltroEspecial(e.target.value);}} className="flex-1 sm:flex-none p-2 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="todos">Nenhum</option>
                                <option value="aniversariantes">🎂 Aniversariantes</option>
                                <option value="debitos">💸 Com Débitos</option>
                                <option value="ORCAMENTO_PARADO">⚠️ Orçamento Parado</option>
                                <option value="INADIMPLENTE">🚫 Inadimplente (+60d)</option>
                                <option value="RETORNO_PENDENTE">🟣 Retorno Pendente</option>
                                <option value="INATIVO">👻 Inativo (+90d)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <section className="bg-white rounded-xl shadow-lg">
                    {/* Added max-h and overflow-y-auto to enable scrolling */}
                    <div className="overflow-y-auto max-h-[600px]">
                        <table className="min-w-full text-left table-auto">
                            {/* Sticky header to keep column names visible */}
                            <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                                <tr className="text-xs text-gray-600 uppercase tracking-wider">
                                    <th className="py-3 px-2 sm:px-3 w-12 sm:w-16">Foto</th>
                                    <th className="py-3 px-2 sm:px-3">Nome</th>
                                    <th className="py-3 px-3 hidden xl:table-cell">CPF</th>
                                    <th className="py-3 px-3 hidden lg:table-cell">Telefone</th>
                                    <th className="py-3 px-3 hidden md:table-cell">Nascimento</th>
                                    <th className="py-3 px-2 sm:px-3 min-w-[140px]">Situação</th> 
                                    <th className="py-3 px-2 sm:px-3 min-w-[120px]">Financeiro</th>
                                    <th className="py-3 px-2 sm:px-3 w-16 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 divide-y divide-gray-200">
                                {pacientesFiltrados.map((paciente) => {
                                    const [statusText, statusClass] = getStatusDisplay(paciente.statusFinanceiro);
                                    const isCadastroIncompleto = !paciente.nome || !paciente.telefone || !paciente.cpf || !paciente.nascimento || !paciente.email || !paciente.endereco || !paciente.foto; 
                                    
                                    return (
                                    <tr 
                                        key={paciente.id} 
                                        className="hover:bg-indigo-50 transition duration-100 cursor-pointer text-xs sm:text-sm"
                                        onClick={() => navigate(`/pacientes/${paciente.id}`)}
                                    >
                                        <td className="py-2 sm:py-3 px-2 sm:px-3">
                                            {paciente.fotoUrl ? (
                                                <img 
                                                    src={paciente.fotoUrl} alt={`Foto de ${paciente.nome}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer hover:ring-2 ring-indigo-500" 
                                                    onClick={(e) => {e.stopPropagation(); handleShowPhoto(paciente.fotoUrl);}} 
                                                    onError={(e) => { e.target.onerror = null; e.target.parentNode.innerHTML = '<div class="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg></div>'; }}
                                                />
                                            ) : (<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><FaUser /></div>)}
                                        </td>
                                        
                                        <td className="py-2 sm:py-3 px-2 sm:px-3 font-medium text-indigo-700" title="Ver Detalhes">
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <span className="truncate max-w-[120px] sm:max-w-xs">{paciente.nome}</span>
                                                
                                                {checkBirthdayProximo(paciente.nascimento) && (
                                                    <FaBirthdayCake 
                                                        className="text-pink-500 text-lg sm:text-xl shrink-0 animate-bounce" 
                                                        title={`🎂 Aniversário: ${formatDateDisplay(paciente.nascimento)}`} 
                                                    />
                                                )}
                                                
                                                {isCadastroIncompleto && (<FaExclamationCircle className="text-yellow-500 text-sm sm:text-base shrink-0" title="Cadastro Incompleto." />)}
                                            </div>
                                        </td>

                                        <td className="py-3 px-3 hidden xl:table-cell whitespace-nowrap">{paciente.cpf || '—'}</td>
                                        <td className="py-3 px-3 hidden lg:table-cell whitespace-nowrap">{paciente.telefone}</td>
                                        <td className="py-3 px-3 hidden md:table-cell">{formatDateDisplay(paciente.nascimento)}</td>
                                        
                                        <td className="py-2 sm:py-3 px-2 sm:px-3">
                                            <div className="flex flex-col gap-1 items-start">
                                                {(paciente.listaAlertas && paciente.listaAlertas.length > 0) ? (
                                                    paciente.listaAlertas.map((alertaCode, idx) => {
                                                        const config = ALERT_CONFIG[alertaCode] || ALERT_CONFIG['ATIVO'];
                                                        const Icon = config.icon;
                                                        return (
                                                            <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit whitespace-nowrap shadow-sm ${config.style}`}>
                                                                <Icon className="text-xs" />
                                                                {config.text}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">Ativo</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">
                                            <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full ${statusClass}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                        
                                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                className="text-green-500 hover:text-green-700 transition p-1.5 sm:p-2 bg-green-50 rounded-full hover:bg-green-100" 
                                                title="Enviar WhatsApp" 
                                                onClick={() => handleWhatsApp(paciente.telefone)}
                                            >
                                                <FaWhatsapp className="text-base sm:text-xl" />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })} 
                                {pacientesFiltrados.length === 0 && !isLoading && (<tr><td colSpan="9" className="text-center py-10 text-gray-500">Nenhum paciente encontrado com esses filtros.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </section>
                
                {/* Removed pagination controls since scroll is used */}
                <div className="flex justify-between items-center mt-4 text-gray-500 text-xs sm:text-sm">
                   <span>Total de pacientes: {pacientesFiltrados.length}</span>
                </div>

            </main>
            
            {showPhotoModal && (<PhotoModal url={photoUrl} onClose={() => setShowPhotoModal(false)} />)}
        </div>
    );
}