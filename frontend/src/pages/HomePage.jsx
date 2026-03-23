import React, { useState, useEffect } from "react";
import Sidebar from "../components/SideBar";
import AgendamentoService from "../services/AgendamentoService"; 
import AuthService from "../services/AuthService"; 
import FinanceiroService from "../services/FinanceiroService"; 
import { 
    FaClock, FaUserPlus, FaCalendarPlus, FaSpinner, FaUser, FaSignOutAlt, 
    FaCalendarAlt, FaCreditCard, FaUserAlt, FaRedoAlt, FaExclamationCircle,
    FaMoneyBillWave, FaArrowUp, FaArrowDown, FaWallet, FaExchangeAlt
} from "react-icons/fa"; 
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'; 

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatHora = (dataHoraISO) => {
    if (!dataHoraISO || !dataHoraISO.includes('T')) return '—';
    return dataHoraISO.split('T')[1].substring(0, 5); 
};

const mapObjectName = (obj) => {
    return (obj && obj.nome) || 'Não Definido';
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
};

const formatPaymentType = (type) => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export default function HomePage() {
    const navigate = useNavigate(); 
    const dataAtual = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); 
    
    const [consultasDeHoje, setConsultasDeHoje] = useState([]);
    const [retornosPrioritarios, setRetornosPrioritarios] = useState([]); 
    const [todasConsultas, setTodasConsultas] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 8; 
    
    const [resumoFinanceiro, setResumoFinanceiro] = useState({
        totalRecebido: 0,
        totalSaidas: 0, 
        entradasDinheiro: 0,
        saidasDinheiro: 0,
        saldoDinheiro: 0
    });
    const [movimentacoesDoDia, setMovimentacoesDoDia] = useState([]); 
    
    const currentUser = AuthService.getCurrentUser();
    
    // --- 1. DEFINIÇÃO DE PERMISSÕES ---
    const role = currentUser?.role;
    const isAdmin = role === 'ADMINISTRADOR';
    const isAtendente = role === 'ATENDENTE';
    const canViewFinance = isAdmin || isAtendente;

    // --- EFEITO: CARREGAMENTO DE DADOS ---
    const fetchDados = async () => {
        setIsLoading(true);
        setApiError(null);
        
        try {
            // 1. Carrega Agenda
            const dataAgenda = await AgendamentoService.listarAgendamentosDeHoje();
            setTodasConsultas(dataAgenda);
            setTotalPages(Math.ceil(dataAgenda.length / itemsPerPage));
            const startIndex = (currentPage - 1) * itemsPerPage;
            setConsultasDeHoje(dataAgenda.slice(startIndex, startIndex + itemsPerPage));

            // 2. Carrega Retornos (Próximos 3 dias ou Vencidos)
            const todosRetornos = await AgendamentoService.listarPacientesComRetornoPendente();
            const hoje = new Date();
            hoje.setHours(0,0,0,0);
            const limite = new Date();
            limite.setDate(hoje.getDate() + 3);

            const filtrados = todosRetornos.filter(p => {
                const isRecorrente = p.recorrente || (p.diasRecorrencia > 0);
                if (!isRecorrente) return false;

                let dataPrev = p.dataPrevisao ? new Date(p.dataPrevisao) : null;
                if (!dataPrev && p.dataUltimaVisita && p.diasRecorrencia) {
                    dataPrev = new Date(p.dataUltimaVisita);
                    dataPrev.setDate(dataPrev.getDate() + p.diasRecorrencia);
                }
                return dataPrev && dataPrev <= limite;
            }).sort((a, b) => new Date(a.dataPrevisao) - new Date(b.dataPrevisao));

            setRetornosPrioritarios(filtrados);

            // 3. Carrega Financeiro (Se tiver permissão)
            if (canViewFinance) {
                const todasTransacoes = await FinanceiroService.listarPagamentos();
                const hojeStr = hoje.toLocaleDateString('pt-BR');
                
                const transacoesHoje = todasTransacoes.filter(t => new Date(t.data).toLocaleDateString('pt-BR') === hojeStr);
                
                const entradasTotais = transacoesHoje.filter(t => t.tipo === 'ENTRADA' || (t.pacienteNome && !t.descricao?.includes('Repasse')));
                const saidasTotais = transacoesHoje.filter(t => t.tipo === 'SAIDA');

                const totalRecebido = entradasTotais.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
                const totalSaidas = saidasTotais.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

                const entradasDinheiro = entradasTotais
                    .filter(t => t.forma === 'DINHEIRO')
                    .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

                const saidasDinheiro = saidasTotais
                    .filter(t => t.forma === 'DINHEIRO')
                    .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

                const saldoDinheiro = entradasDinheiro - saidasDinheiro;

                setResumoFinanceiro({ 
                    totalRecebido,
                    totalSaidas,
                    entradasDinheiro,
                    saidasDinheiro,
                    saldoDinheiro
                });
                
                setMovimentacoesDoDia(transacoesHoje.reverse()); 
            }
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            setApiError("Não foi possível carregar os dados do painel.");
        } 
        setIsLoading(false);
    };
    
    useEffect(() => { fetchDados(); }, [currentPage]); 

    // --- HANDLERS ---
    const handleLogout = async () => { await AuthService.logout(); navigate('/login'); };
    const handlePageChange = (page) => { if (page > 0 && page <= totalPages) setCurrentPage(page); };

    const getStatusRetorno = (dataStr) => {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const dataPrev = new Date(dataStr);
        if (dataPrev < hoje) return { label: "Vencido", css: "bg-red-100 text-red-700 border-red-200" };
        if (dataPrev.getTime() === hoje.getTime()) return { label: "Hoje", css: "bg-orange-100 text-orange-700 border-orange-200" };
        return { label: "Próximo", css: "bg-teal-100 text-teal-700 border-teal-200" };
    };
    
    const PacienteCell = ({ paciente }) => {
        const nome = paciente?.nome || 'Paciente sem nome';
        const fotoUrl = paciente?.foto;
        return (
            <div className="flex items-center gap-2">
                {fotoUrl ? (
                    <img src={fotoUrl} alt={nome} className="w-8 h-8 object-cover rounded-full shadow-sm" onError={(e) => { e.target.onerror = null; e.target.parentNode.innerHTML = `<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><FaUser className='w-4 h-4' /></div><span class='whitespace-nowrap'>${nome}</span>`; }} />
                ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><FaUser className='w-4 h-4' /></div>
                )}
                <span className='whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none font-medium'>{nome}</span>
            </div>
        );
    };

    const FinanceiroCard = () => {
        const listaVisivel = isAdmin 
            ? movimentacoesDoDia 
            : movimentacoesDoDia.filter(p => p.forma === 'DINHEIRO');

        return (
            <div className="mb-8 space-y-6">
                {/* 5 CARDS DE RESUMO FINANCEIRO */}
                {resumoFinanceiro && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-xl shadow-md">
                            <p className="text-[10px] font-bold text-blue-600 uppercase flex justify-between items-center">Total Entradas (Dia) <FaArrowUp/></p>
                            <p className="text-xl font-extrabold text-blue-800 mt-1">{formatCurrency(resumoFinanceiro.totalRecebido)}</p>
                        </div>
                        <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded-xl shadow-md">
                            <p className="text-[10px] font-bold text-purple-600 uppercase flex justify-between items-center">Total Saídas (Dia) <FaArrowDown/></p>
                            <p className="text-xl font-extrabold text-purple-800 mt-1">{formatCurrency(resumoFinanceiro.totalSaidas)}</p>
                        </div>
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-xl shadow-md">
                            <p className="text-[10px] font-bold text-green-600 uppercase flex justify-between items-center">Entrada (Espécie) <FaMoneyBillWave/></p>
                            <p className="text-xl font-extrabold text-green-700 mt-1">{formatCurrency(resumoFinanceiro.entradasDinheiro)}</p>
                        </div>
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-md">
                            <p className="text-[10px] font-bold text-red-600 uppercase flex justify-between items-center">Saídas (Espécie) <FaArrowDown/></p>
                            <p className="text-xl font-extrabold text-red-700 mt-1">{formatCurrency(resumoFinanceiro.saidasDinheiro)}</p>
                        </div>
                        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl shadow-md">
                            <p className="text-[10px] font-bold text-amber-600 uppercase flex justify-between items-center">Em Caixa (Espécie) <FaWallet/></p>
                            <p className="text-xl font-extrabold text-amber-700 mt-1">{formatCurrency(resumoFinanceiro.saldoDinheiro)}</p>
                        </div>
                    </div>
                )}

                {/* ÚLTIMAS MOVIMENTAÇÕES DO DIA */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg overflow-x-auto border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaExchangeAlt /> Últimas Movimentações {isAtendente ? '(Em Espécie)' : 'do Dia'}
                    </h4>
                    {listaVisivel.length > 0 ? (
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="border-b text-xs text-gray-500 uppercase bg-gray-50">
                                    <th className="py-2 px-3">Tipo</th>
                                    <th className="py-2 px-3">Descrição / Paciente</th> 
                                    <th className="py-2 px-3">Método</th>
                                    <th className="py-2 px-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 divide-y divide-gray-100">
                                {listaVisivel.map((transacao) => {
                                    const isEntrada = transacao.tipo === 'ENTRADA' || (transacao.pacienteNome && !transacao.descricao?.includes('Repasse'));
                                    return (
                                        <tr key={transacao.id} className="hover:bg-gray-50">
                                            <td className="py-2 px-3">
                                                {isEntrada ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold bg-green-50 px-2 py-1 rounded w-fit uppercase">
                                                        <FaArrowUp /> ENT
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 text-[10px] font-bold bg-red-50 px-2 py-1 rounded w-fit uppercase">
                                                        <FaArrowDown /> SAÍ
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 flex items-center gap-2 text-sm font-medium">
                                                {isEntrada ? <FaUserAlt className="text-gray-300 shrink-0" size={12}/> : null}
                                                <span className="truncate">{transacao.pacienteNome || transacao.descricao || 'Movimentação'}</span>
                                            </td>
                                            <td className="py-2 px-3 text-xs">
                                                <span className={`px-2 py-1 rounded font-bold ${transacao.forma === 'DINHEIRO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {formatPaymentType(transacao.forma || transacao.tipo)}
                                                </span>
                                            </td>
                                            <td className={`py-2 px-3 text-right font-bold text-sm ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
                                                {isEntrada ? '+' : '-'} {formatCurrency(transacao.valor)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : <p className="text-gray-400 text-center py-6 text-sm">Nenhuma movimentação registrada hoje.</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />
            
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 lg:pt-8 w-full"> 
                <div className="max-w-5xl mx-auto">
                    
                    {/* CABEÇALHO / LOGO */}
                    <div className="w-full flex flex-col items-center justify-center mb-8">
                        <img src={logo} alt="Logo" className="w-20 sm:w-24 mb-5 object-contain" />
                        <div className="text-center leading-tight">
                            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-widest text-gray-900 uppercase">Rodrigues</h1>
                            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-widest text-gray-900 uppercase mt-1 mb-3">Cavalcante</h1>
                            <p className="text-[10px] sm:text-xs font-serif font-bold tracking-[0.25em] text-[#c49a6c] uppercase border-t border-[#c49a6c] pt-3 inline-block">Odontologia & Harmonização</p>
                        </div>
                    </div>

                    {apiError && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg text-sm">{apiError}</div>}

                    {isLoading ? (
                        <div className="text-center py-6 flex items-center justify-center text-indigo-600 font-medium"><FaSpinner className="animate-spin mr-2" /> Carregando informações...</div>
                    ) : (
                        <>
                            {/* SEÇÃO FINANCEIRA */}
                            {canViewFinance && <FinanceiroCard />}

                            {/* 🌟 NOVA SEÇÃO: PROCEDIMENTOS RECORRENTES (MANUTENÇÕES URGENTES) */}
                            {retornosPrioritarios.length > 0 && (
                                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-orange-500 mb-8 border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FaExclamationCircle className="text-orange-500" /> Retornos Recorrentes Próximos
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left">
                                            <thead>
                                                <tr className="border-b text-xs text-gray-500 uppercase bg-gray-50">
                                                    <th className="py-2 px-3 font-bold">Paciente</th>
                                                    <th className="py-2 px-3 font-bold">Status</th>
                                                    <th className="py-2 px-3 text-right font-bold">Previsão</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {retornosPrioritarios.map(p => {
                                                    const status = getStatusRetorno(p.dataPrevisao);
                                                    return (
                                                        <tr key={p.id} className="hover:bg-orange-50/30">
                                                            <td className="py-3 px-3 font-semibold text-gray-700">{p.nome}</td>
                                                            <td className="py-3 px-3">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${status.css}`}>
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                            <td className={`py-3 px-3 text-right text-sm font-black ${status.label === 'Vencido' ? 'text-red-600' : 'text-gray-600'}`}>
                                                                {new Date(p.dataPrevisao).toLocaleDateString('pt-BR')}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 text-right">
                                        <Link to="/retorno/agendar" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition flex items-center justify-end gap-1">
                                            Gerenciar todos os retornos <span className="text-base">→</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* AGENDAMENTOS DE HOJE */}
                            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg overflow-x-auto mt-8 border border-gray-100">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    Agendamentos de Hoje
                                    <span className="text-sm sm:text-base font-normal text-gray-400 flex items-center gap-1 font-sans"><FaCalendarAlt className="text-gray-300" /> {dataAtual}</span>
                                </h2>
                                
                                {consultasDeHoje.length > 0 ? (
                                    <table className="min-w-full text-left">
                                        <thead>
                                            <tr className="border-b text-[11px] text-gray-400 uppercase tracking-wider font-bold">
                                                <th className="py-3 px-4">Horário</th> 
                                                <th className="py-3 px-4">Paciente</th>
                                                <th className="py-3 px-4">Telefone</th>
                                                <th className="py-3 px-4">Profissional</th>
                                                <th className="py-3 px-4">Procedimento</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-700 divide-y divide-gray-100">
                                            {consultasDeHoje.map((consulta) => (
                                                <tr key={consulta.id} className="hover:bg-indigo-50/20 transition-colors">
                                                    <td className="py-4 px-4 font-bold text-indigo-600 text-sm">
                                                        <div className="flex items-center gap-2"><FaClock className="text-indigo-300" size={14} />{formatHora(consulta.dataHora)}</div>
                                                    </td>
                                                    <td className="py-4 px-4"><PacienteCell paciente={consulta.paciente} /></td>
                                                    <td className="py-4 px-4 text-sm text-gray-500">{consulta.paciente?.telefone || '—'}</td>
                                                    <td className="py-4 px-4 text-sm font-medium text-gray-600">{mapObjectName(consulta.profissional)}</td>
                                                    <td className="py-4 px-4 text-sm text-gray-500 font-medium">{consulta.procedimento}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-gray-400 text-center py-10 font-medium italic">Nenhuma consulta agendada para hoje.</p>}
                                
                                {totalPages > 1 && (
                                    <div className="mt-8 flex justify-center space-x-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button key={page} onClick={() => handlePageChange(page)} className={`px-4 py-2 border rounded-lg font-bold text-sm transition-all ${page === currentPage ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-400 hover:bg-indigo-50 border-indigo-100'}`}>{page}</button>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-6 text-center">
                                    <Link to="/agenda" className="text-sm font-bold text-indigo-500 hover:text-indigo-700 transition">Ver Agenda Completa <span className="text-base">→</span></Link>
                                </div>
                            </div>
                        </>
                    )}

                    {/* BOTÕES DE AÇÃO INFERIORES */}
                    <div className="mt-12 pb-10 flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/pacientes/novo" className="flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all hover:-translate-y-1"><FaUserPlus size={18} /> Cadastrar Paciente</Link>
                        <Link to="/agenda/nova" className="flex items-center justify-center gap-2 px-8 py-3.5 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-all hover:-translate-y-1"><FaCalendarPlus size={18} /> Novo Agendamento</Link>
                        <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-all hover:-translate-y-1"><FaSignOutAlt size={18} /> Finalizar Sessão</button>
                    </div>
                </div>
            </main>
        </div>
    );
}