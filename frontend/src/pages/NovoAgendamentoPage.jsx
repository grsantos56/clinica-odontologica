import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../components/SideBar'; 
import AgendamentoService from '../services/AgendamentoService'; 
import PacienteService from '../services/PacienteService'; 
import ProfissionalService from '../services/ProfissionalService';
import ProcedimentoService from '../services/ProcedimentoService'; 
import { FaSave, FaUser, FaClock, FaCalendarDay, FaTooth, FaArrowLeft, FaSearch, FaBriefcaseMedical, FaIdCard, FaBirthdayCake } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

// --- CONFIGURAÇÃO ---
const areaData = {
    'ODONTOLOGIA': { procedimento: 'Consulta Inicial Odontológica' },
    'FISIOTERAPIA': { procedimento: 'Avaliação Fisioterápica' },
    'NUTRICIONISTA': { procedimento: 'Primeira Consulta Nutricional' },
    'PSICOLOGIA': { procedimento: 'Sessão Inicial' },
};

// --- DEBOUNCE ---
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

// --- UTILITÁRIOS ---
const getTodayDateString = () => new Date().toISOString().split('T')[0];

const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '—';
    if (isoDate.includes('/')) return isoDate; 
    try {
        const [year, month, day] = isoDate.substring(0, 10).split('-');
        return `${day}/${month}/${year}`;
    } catch (e) { return isoDate; }
};

// 🌟 COMPONENTES DE INPUT E SELECT 🌟
const SelectField = ({ name, placeholder, icon: Icon, options, required = false, disabled = false, value, onChange }) => (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white w-full">
        <div className="p-3 bg-gray-100 text-gray-500 shrink-0"><Icon /></div>
        <select 
            name={name} 
            value={value} 
            onChange={onChange} 
            required={required} 
            disabled={disabled} 
            className={`flex-1 p-3 focus:ring-0 focus:outline-none bg-white appearance-none w-full min-w-0 ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map((option, index) => {
                const val = option.value || option.id || option;
                const label = option.label || option.nome || option;
                const isDisabled = option.disabled || false;

                return (
                    <option key={index} value={val} disabled={isDisabled} className={isDisabled ? "text-gray-400 bg-gray-100" : ""}>
                        {label}
                    </option>
                );
            })}
        </select>
    </div>
);

const InputField = ({ name, type = 'text', placeholder, icon: Icon, required = false, disabled = false, customStyle = "", value, onChange, min = "" }) => (
    <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white w-full ${customStyle}`}>
        <div className="p-3 bg-gray-100 text-gray-500 shrink-0"><Icon /></div>
        <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} required={required} disabled={disabled} min={min} className={`flex-1 p-3 focus:ring-0 focus:outline-none w-full min-w-0 ${disabled ? 'bg-gray-50' : ''}`}/>
    </div>
);

export default function NovoAgendamentoPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // 🌟 CAPTURA OS DADOS DA URL
    const pacienteIdUrl = searchParams.get('pacienteId');
    const tipoAgendamento = searchParams.get('tipo'); // ex: 'orcamento', 'retorno'
    const orcamentoId = searchParams.get('orcamentoId'); // ID do orçamento a ser baixado

    // 🌟 CORREÇÃO: Só considera retorno se a flag 'tipo' for EXPLICITAMENTE 'retorno'
    const isRetornoParam = tipoAgendamento === 'retorno';

    // 🌟 NOVO ESTADO
    const [jaConfirmado, setJaConfirmado] = useState(false);

    const [formData, setFormData] = useState({
        pacienteNome: '', pacienteId: null, data: getTodayDateString(), hora: '',
        area: 'ODONTOLOGIA', profissionalId: null, profissionalNome: '', 
        procedimento: areaData['ODONTOLOGIA'].procedimento, valorEstimado: '', notes: '', 
        // 🌟 CORREÇÃO: Usa a variável controlada para definir se é retorno inicial
        isRetorno: isRetornoParam
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchResult, setSearchResult] = useState([]); 
    const [profissionaisDisponiveis, setProfissionaisDisponiveis] = useState([]); 
    const [alertaPendente, setAlertaPendente] = useState(null); 
    const [hasDebito, setHasDebito] = useState(false); 
    
    // Lista de horários OCUPADOS (vinda do backend)
    const [occupiedSlots, setOccupiedSlots] = useState([]); 

    const isPacienteBloqueado = !!pacienteIdUrl; // Bloqueia a troca de paciente se veio redirecionado
    const MIN_DATE = getTodayDateString(); 

    // --- BUSCA DISPONIBILIDADE (OCUPADOS) ---
    const fetchDisponibilidade = useCallback(async (profissionalId, dataStr) => {
        if (!profissionalId || !dataStr) {
            setOccupiedSlots([]); 
            return;
        }

        try {
            const agendamentosDoDia = await AgendamentoService.buscarDisponibilidade(dataStr, profissionalId);
            
            // Extrai apenas os horários ocupados (ignorando CANCELADOS)
            const horarios = agendamentosDoDia
                .filter(ag => ag.status !== 'CANCELADO') 
                .map(ag => {
                    if (!ag.dataHora) return null;
                    return ag.dataHora.split('T')[1].substring(0, 5); 
                })
                .filter(h => h !== null);

            setOccupiedSlots(horarios);

        } catch (err) {
            console.error("Erro disponibilidade:", err);
            setOccupiedSlots([]); 
        }
    }, []);

    // --- CALCULA OPÇÕES DE HORÁRIO (Visualização) ---
    const timeOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        const selectedDate = new Date(formData.data + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);

        const isToday = selectedDate.getTime() === today.getTime();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        for (let h = 6; h < 20; h++) {
            for (let m = 0; m < 60; m += 10) { 
                if (h === 19 && m === 50) { 
                    const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    let isPast = false;
                    if (isToday && (h < currentHour || (h === currentHour && m < currentMin))) isPast = true;
                    const isOccupied = occupiedSlots.includes(timeString);
                    let label = timeString;
                    if (isOccupied) label += " (Ocupado)";
                    else if (isPast) label += " (Passado)";

                    options.push({ value: timeString, label: label, disabled: isOccupied || isPast });
                    break; 
                }
                
                const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                let isPast = false;
                if (isToday && (h < currentHour || (h === currentHour && m < currentMin))) isPast = true;
                
                const isOccupied = occupiedSlots.includes(timeString);
                
                let label = timeString;
                if (isOccupied) label += " (Ocupado)";
                else if (isPast) label += " (Passado)";

                options.push({ value: timeString, label: label, disabled: isOccupied || isPast });
            }
        }
        return options;
    }, [formData.data, occupiedSlots]);

    // Atualiza disponibilidade ao mudar inputs
    useEffect(() => {
        if (formData.profissionalId && formData.data) {
            fetchDisponibilidade(formData.profissionalId, formData.data);
        } else {
            setOccupiedSlots([]);
        }
    }, [formData.profissionalId, formData.data, fetchDisponibilidade]);


    // --- OUTRAS FUNÇÕES ---
    const verificarDebitos = async (pacienteId) => {
        if (!pacienteId) { setHasDebito(false); return; }
        try {
            const debitos = await PacienteService.verificarDebitos(pacienteId); 
            setHasDebito(typeof debitos === 'number' ? debitos > 0 : !!debitos);
        } catch (err) { console.error("Falha débitos:", err); setHasDebito(false); }
    };

    const searchPacientes = useCallback(debounce(async (termo) => {
        if (isPacienteBloqueado || termo.length < 3) { setSearchResult([]); return; }
        try { setSearchResult(await PacienteService.buscarPorNome(termo)); } 
        catch (err) { setSearchResult([]); }
    }, 300), [isPacienteBloqueado]);

    const checarProcedimentoPendente = async (id) => {
        setAlertaPendente(null);
        try {
            const pendente = await ProcedimentoService.buscarProcedimentoPendente(id);
            if (pendente) setAlertaPendente({ agendamentoId: pendente.agendamento.id, status: pendente.agendamento.status });
        } catch (e) {}
    }
    
    const handleSelectPaciente = (p) => {
        setFormData(prev => ({ ...prev, pacienteNome: p.nome, pacienteId: p.id }));
        setSearchResult([]);
        checarProcedimentoPendente(p.id);
        verificarDebitos(p.id);
    };
    
    // BUSCA PROFISSIONAIS
    const fetchProfissionaisPorArea = async (area) => {
        if (!area || area === 'ATENDIMENTO_GERAL') { 
            setProfissionaisDisponiveis([]); 
            return []; 
        }
        try {
            const data = await ProfissionalService.buscarPorArea(area.toUpperCase());
            
            const filtrados = data.filter(p => {
                const cargo = p.cargo ? p.cargo.toUpperCase() : '';
                const perfil = p.perfil ? p.perfil.toUpperCase() : '';
                const bloqueados = ['ATENDENTE', 'RECEPCIONISTA', 'SECRETARIA', 'ADMINISTRADOR'];
                return !bloqueados.includes(cargo) && !bloqueados.includes(perfil);
            });
            
            setProfissionaisDisponiveis(filtrados);
            return filtrados; 
        } catch (err) {
            console.error("Erro profissionais:", err);
            setProfissionaisDisponiveis([]);
            return [];
        }
    };
    
    // 🌟 EFEITO 1: Carga inicial (Quando muda a área ou abre a tela limpa)
    useEffect(() => {
        if (!loading && !pacienteIdUrl) { 
            const run = async () => {
                const data = await fetchProfissionaisPorArea(formData.area);
                setFormData(prev => ({ 
                    ...prev, 
                    pacienteNome: '', pacienteId: null, isRetorno: false,
                    // ANTES: pegava data[0].nome e data[0].id
                    // AGORA: Deixa em branco para obrigar seleção
                    profissionalNome: '', 
                    profissionalId: null,
                }));
                setHasDebito(false);
            };
            run();
        }
    }, [formData.area]);

    // 🌟 EFEITO 2: Retorno/Orçamento (Lógica Inteligente de Preenchimento)
    useEffect(() => {
        if (pacienteIdUrl) {
            const fetchRetorno = async () => {
                setLoading(true);
                setJaConfirmado(false); 
                try {
                    const paciente = await PacienteService.buscarPorId(pacienteIdUrl); 
                    let area = paciente.areaAtendimento || 'ODONTOLOGIA';
                    if (!areaData[area]) area = 'ODONTOLOGIA';

                    const profs = await fetchProfissionaisPorArea(area);
                    
                    let profId = null;
                    let profNome = '';

                    const isOrcamento = tipoAgendamento === 'orcamento';
                    
                    // 🌟 LÓGICA CONDICIONAL: Só busca o último dentista se for RETORNO ou ORÇAMENTO
                    if (isOrcamento || isRetornoParam) {
                        try {
                            const ultimo = await AgendamentoService.buscarUltimoAgendamentoConcluidoPorPaciente(pacienteIdUrl);
                            if (ultimo?.profissional && profs.find(p => p.id === ultimo.profissional.id)) {
                                profId = ultimo.profissional.id;
                                profNome = ultimo.profissional.nome;
                            }
                        } catch (e) {
                            console.error("Erro ao buscar histórico do profissional:", e);
                        }
                    }
                    // Se for Consulta Inicial (busca rápida ou sem tipo), profId continua null (vazio)

                    let procDescricao = areaData[area]?.procedimento || 'Consulta';
                    if (isOrcamento) {
                        procDescricao = 'Execução de Orçamento';
                    } else if (isRetornoParam) { 
                        procDescricao = 'Retorno para ' + area;
                    }

                    setFormData(prev => ({
                        ...prev,
                        pacienteNome: paciente.nome,
                        pacienteId: paciente.id, 
                        area: area,
                        procedimento: procDescricao,
                        isRetorno: isRetornoParam, 
                        profissionalNome: profNome, // Preenchido se for retorno/orçamento, Vazio se for inicial
                        profissionalId: profId,     
                    }));
                    checarProcedimentoPendente(paciente.id);
                    verificarDebitos(paciente.id); 
                } catch (err) {
                    setError("Erro ao carregar dados do paciente.");
                    navigate('/agenda/nova', { replace: true });
                } finally { setLoading(false); }
            };
            fetchRetorno();
        }
    }, [pacienteIdUrl, tipoAgendamento, isRetornoParam]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let next = { ...prev, [name]: value };
            if (name === 'area' && !isPacienteBloqueado) next.procedimento = areaData[value]?.procedimento || '';
            
            if (name === 'pacienteNome') {
                if (!isPacienteBloqueado) {
                    next.pacienteId = null; 
                    searchPacientes(value); 
                    setAlertaPendente(null);
                    setHasDebito(false);
                }
            }

            if (name === 'profissionalNome') {
                const prof = profissionaisDisponiveis.find(p => p.nome === value);
                if (prof) { next.profissionalId = prof.id; next.profissionalNome = prof.nome; }
                else { next.profissionalId = null; next.profissionalNome = ''; }
                next.hora = ''; 
            }
            return next;
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { data, hora, pacienteId, profissionalId, procedimento, notas, isRetorno, area, pacienteNome } = formData;
        
        if (!pacienteId || !profissionalId) { setError("Selecione Paciente e Profissional."); setLoading(false); return; }
        if (hasDebito && !window.confirm(`Paciente ${pacienteNome} tem DÉBITOS. Continuar?`)) { setLoading(false); return; }

        try {
            let notasFinais = notas || ''; 
            
            if (orcamentoId) {
                const flagOrcamento = "[EXECUÇÃO DE ORÇAMENTO]";
                if (!notasFinais.includes(flagOrcamento)) {
                    notasFinais = `${flagOrcamento} ${notasFinais}`.trim();
                }
            }

            let statusInicial = 'PENDENTE'; 
            
            if (isRetorno) statusInicial = 'AGUARDANDO_RETORNO';
            if (jaConfirmado) statusInicial = 'CONFIRMADO'; 

            await AgendamentoService.salvarAgendamento({
                paciente: { id: parseInt(pacienteId) }, 
                dataHora: `${data}T${hora}:00`, 
                profissional: { id: parseInt(profissionalId) }, 
                procedimento, area, 
                status: statusInicial, 
                notas: notasFinais 
            });

            if (isRetorno) await PacienteService.limparMarcacaoRetorno(pacienteId);
            
            if (orcamentoId) {
                await ProcedimentoService.marcarOrcamentoComoAgendado(orcamentoId);
            }

            navigate('/agenda');
        } catch (err) { setError(err.message); } 
        finally { setLoading(false); }
    };
    
    const areasKeys = Object.keys(areaData);
    const profOptions = profissionaisDisponiveis.map(p => ({ id: p.id, nome: p.nome }));

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-y-auto w-full">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium text-sm md:text-base">
                    <FaArrowLeft /> Voltar
                </button>
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                    {tipoAgendamento === 'orcamento' ? '💰 Agendar Execução de Orçamento' : (formData.isRetorno ? '📅 Agendar Retorno' : 'Agendar Nova Consulta')}
                </h2>
                
                {tipoAgendamento === 'orcamento' && <div className="bg-yellow-100 text-yellow-800 p-4 mb-6 rounded-lg shadow-md font-bold text-sm md:text-base border border-yellow-200">Modo Execução: Os dados do orçamento serão carregados no atendimento.</div>}
                
                {/* 🌟 CORREÇÃO VISUAL: Só mostra o aviso de retorno se for type=retorno */}
                {formData.isRetorno && <div className="bg-blue-100 text-blue-700 p-4 mb-6 rounded-lg shadow-md font-bold text-sm md:text-base">Modo Retorno: Dados pré-preenchidos.</div>}
                
                {alertaPendente && <div className="bg-orange-100 text-orange-800 p-4 mb-6 rounded-lg shadow-md text-sm md:text-base border border-orange-200">⚠️ Serviço Pendente! <button onClick={() => navigate(`/procedimentos/registro/${alertaPendente.agendamentoId}`)} className="underline ml-2 font-bold">Ir para conclusão</button></div>}
                {hasDebito && formData.pacienteId && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg shadow-md font-bold text-sm md:text-base border border-red-200">⚠️ Paciente com Débitos!</div>}
                {error && <div className="bg-red-100 text-red-700 p-4 mb-4 rounded-lg text-sm md:text-base">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center">
                        <div className="w-full max-w-2xl space-y-6 bg-white p-4 sm:p-8 rounded-xl shadow-lg">
                            <h3 className="text-lg md:text-xl font-semibold text-indigo-700 mb-4 border-b pb-2">Dados do Agendamento</h3>
                            
                            <div className="relative">
                                {/* Se tiver ID na URL, bloqueia busca */}
                                <InputField name="pacienteNome" placeholder="Buscar Paciente *" icon={FaSearch} required value={formData.pacienteNome} onChange={handleChange} disabled={isPacienteBloqueado}/>
                                {searchResult.length > 0 && !isPacienteBloqueado && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                                        {searchResult.map(p => {
                                            const dataNasc = p.nascimento || p.dataNascimento;
                                            return (
                                                <div 
                                                    key={p.id} 
                                                    className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0 flex flex-col gap-1 transition-colors" 
                                                    onClick={() => handleSelectPaciente(p)}
                                                >
                                                    <span className="font-bold text-gray-800">{p.nome}</span>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <FaIdCard className="text-indigo-400" /> {p.cpf || 'Sem CPF'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <FaBirthdayCake className="text-indigo-400" /> {formatDateDisplay(dataNasc)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField name="area" placeholder="Selecione a Área *" icon={FaBriefcaseMedical} options={areasKeys} required disabled={isPacienteBloqueado} value={formData.area} onChange={handleChange}/>
                                <SelectField 
                                    name="profissionalNome" 
                                    placeholder={loading ? "Buscando..." : profOptions.length > 0 ? "Selecione o Profissional *" : "Nenhum disponível"} 
                                    icon={FaUser} 
                                    required 
                                    value={formData.profissionalNome} 
                                    onChange={handleChange} 
                                    options={profOptions.map(p => p.nome)} 
                                />
                            </div>
                            
                            <InputField name="procedimento" value={formData.procedimento} placeholder="Procedimento" icon={FaTooth} onChange={handleChange} required/>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField name="data" type="date" placeholder="Data *" icon={FaCalendarDay} required value={formData.data} onChange={handleChange} min={MIN_DATE} />
                                
                                <SelectField
                                    name="hora"
                                    placeholder="Selecione a Hora *"
                                    icon={FaClock}
                                    options={timeOptions} 
                                    required
                                    disabled={!formData.profissionalId}
                                    value={formData.hora}
                                    onChange={handleChange}
                                />
                            </div>

                            <textarea name="notas" rows="3" value={formData.notas} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 ring-indigo-500" placeholder="Observações..."></textarea>

                            <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <input 
                                    type="checkbox" 
                                    id="checkConfirmado"
                                    checked={jaConfirmado}
                                    onChange={(e) => setJaConfirmado(e.target.checked)}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <label htmlFor="checkConfirmado" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                    Paciente já confirmou presença? (Agendar como Confirmado)
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={loading || !formData.pacienteId || !formData.profissionalId || !formData.hora} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                                    {loading ? 'Salvando...' : <><FaSave /> Confirmar</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}