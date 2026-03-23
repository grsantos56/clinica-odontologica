import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash, Printer, Loader2, UserPlus, FileText } from 'lucide-react';
import Sidebar from '../components/SideBar';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// --- LISTAS DE SUGESTÕES (MANTIDAS) ---
const OPTIONS_VIA = [
    "Via Oral", "Via Sublingual", "Via Tópica", "Uso Externo",
    "Bochecho", "Intramuscular", "Intravenosa", "Oftálmica", "Nasal"
];

const OPTIONS_FREQ = [
    "Dose única", "De 4 em 4 horas", "De 6 em 6 horas", "De 8 em 8 horas",
    "De 12 em 12 horas", "De 24 em 24 horas", "Ao acordar", "Ao deitar",
    "Após as refeições", "Se houver dor"
];

const OPTIONS_DURA = [
    "Uso Contínuo", "1 dia", "2 dias", "3 dias", "5 dias",
    "7 dias", "10 dias", "14 dias", "15 dias", "30 dias"
];

const initialItem = {
    nomeMedicamento: '',
    viaAdministracao: 'Via Oral',
    frequencia: 'De 8 em 8 horas',
    duracao: '5 dias',
    quantidade: ''
};

export default function ReceituarioPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [paciente, setPaciente] = useState(null);
    const [profissionais, setProfissionais] = useState([]);
    const [receita, setReceita] = useState({
        paciente: { id: id },
        profissional: null,
        itens: [initialItem],
        observacoes: ''
    });
    
    const [ultimoId, setUltimoId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const savedId = localStorage.getItem('lastReceitaId');
                if (savedId) {
                    setUltimoId(savedId);
                }

                const pacienteRes = await api.get(`/pacientes/${id}`);
                setPaciente(pacienteRes.data);
                
                const profRes = await api.get('/profissionais');
                const todosProfissionais = profRes.data || [];
                
                const prescritores = todosProfissionais.filter(p => {
                    const role = p.role ? p.role.toUpperCase() : '';
                    const tipo = p.tipoProfissional ? p.tipoProfissional.toUpperCase() : '';
                    const temCro = p.crmOuRegistro && p.crmOuRegistro.trim().length > 0;

                    return role === 'DENTISTA' || 
                           role === 'ADMINISTRADOR' || 
                           tipo === 'DENTISTA' || 
                           tipo === 'ADMINISTRADOR' ||
                           temCro;
                });

                setProfissionais(prescritores);
                
                if (prescritores.length > 0) {
                     setReceita(prev => ({ ...prev, profissional: { id: prescritores[0].id } }));
                }

            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                alert('Erro de conexão ao buscar dados.');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    const handleAddItem = () => {
        setReceita(prev => ({ 
            ...prev, 
            itens: [...prev.itens, { ...initialItem }] 
        }));
    };

    const handleRemoveItem = (index) => {
        setReceita(prev => ({
            ...prev,
            itens: prev.itens.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItens = receita.itens.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        );
        setReceita(prev => ({ ...prev, itens: newItens }));
    };

    const handleSalvarReceita = async (e) => {
        e.preventDefault();
        
        if (!receita.profissional || !receita.profissional.id) {
            alert('Atenção: É necessário selecionar um Profissional Prescritor.');
            return;
        }

        if (receita.itens.length === 0 || receita.itens.every(item => item.nomeMedicamento.trim() === '')) {
            alert('Adicione pelo menos um medicamento.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await api.post('/receitas', receita);
            localStorage.setItem('lastReceitaId', res.data.id);
            setUltimoId(res.data.id);

            alert('Receita salva com sucesso!');
            navigate(`/receitas/imprimir/${res.data.id}`);
        } catch (error) {
            console.error('Erro ao salvar receita:', error);
            const msg = error.response?.data?.message || error.response?.data || 'Erro ao salvar receita.';
            alert(`Falha ao salvar: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin mr-2"/> Carregando...</div>;
    if (!paciente) return <p className="p-8">Paciente não encontrado.</p>;

    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />
            
            {/* Ajuste Responsivo Main:
               pt-16: Espaço topo mobile (menu hambúrguer)
               p-4: Padding menor no mobile
               md:p-8: Padding original no desktop
            */}
            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                
                {/* Header: Flex-col no mobile para empilhar os botões se necessário */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                        <ArrowLeft className="w-5 h-5" /> Voltar
                    </button>

                    {ultimoId && (
                        <button 
                            onClick={() => navigate(`/receitas/imprimir/${ultimoId}`)}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200 transition shadow-sm border border-indigo-200"
                            title="Visualizar a última receita gerada sem criar uma nova"
                        >
                            <FileText className="w-5 h-5" /> Ver Última Receita Gerada
                        </button>
                    )}
                </div>

                {/* Títulos Responsivos */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Nova Prescrição para {paciente.nome}</h2>
                <p className="text-lg md:text-xl text-gray-600 mb-6">Criação de Receituário</p>

                <form onSubmit={handleSalvarReceita} className="space-y-8">
                    
                    {/* Bloco de Dados Principais: p-4 no mobile, p-6 desktop */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Detalhes da Receita</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Paciente:</label>
                                <input type="text" value={paciente.nome} disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2" />
                            </div>
                            <div>
                                <label htmlFor="profissionalId" className="block text-sm font-medium text-gray-700">Profissional Prescritor:</label>
                                {profissionais.length > 0 ? (
                                    <select
                                        id="profissionalId"
                                        value={receita.profissional?.id || ''}
                                        onChange={(e) => setReceita(prev => ({ ...prev, profissional: { id: Number(e.target.value) } }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white"
                                        required
                                    >
                                        <option value="" disabled>Selecione o Profissional</option>
                                        {profissionais.map(prof => (
                                            <option key={prof.id} value={prof.id}>
                                                {prof.nome} {prof.crmOuRegistro ? `(CRO: ${prof.crmOuRegistro})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="mt-2 text-red-600 text-sm">Nenhum profissional habilitado encontrado.</div>
                                )}
                            </div>
                        </div>
                        <label className="block text-sm font-medium text-gray-700">Observações Gerais (Opcional):</label>
                        <textarea
                            rows="2"
                            value={receita.observacoes}
                            onChange={(e) => setReceita(prev => ({ ...prev, observacoes: e.target.value }))}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            placeholder="Instruções adicionais..."
                        ></textarea>
                    </div>

                    {/* Bloco de Itens: p-4 no mobile */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
                            <Printer className="w-5 h-5" /> Itens Prescritos
                        </h3>

                        <div className="space-y-4">
                            {receita.itens.map((item, index) => (
                                <div key={index} className="border p-4 rounded-lg bg-gray-50 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium text-indigo-700">Item {index + 1}</h4>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                                            disabled={receita.itens.length === 1}
                                        >
                                            <Trash className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700">Medicamento (Nome/Dose):</label>
                                            <input
                                                type="text"
                                                value={item.nomeMedicamento}
                                                onChange={(e) => handleItemChange(index, 'nomeMedicamento', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2"
                                                placeholder="Ex: Amoxicilina 500mg"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Via de Adm.:</label>
                                            <input
                                                type="text"
                                                list={`list-via-${index}`}
                                                value={item.viaAdministracao}
                                                onChange={(e) => handleItemChange(index, 'viaAdministracao', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2"
                                                placeholder="Selecione ou digite"
                                            />
                                            <datalist id={`list-via-${index}`}>
                                                {OPTIONS_VIA.map(opt => <option key={opt} value={opt} />)}
                                            </datalist>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Frequência:</label>
                                            <input
                                                type="text"
                                                list={`list-freq-${index}`}
                                                value={item.frequencia}
                                                onChange={(e) => handleItemChange(index, 'frequencia', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2"
                                                placeholder="Selecione ou digite"
                                            />
                                            <datalist id={`list-freq-${index}`}>
                                                {OPTIONS_FREQ.map(opt => <option key={opt} value={opt} />)}
                                            </datalist>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Duração:</label>
                                            <input
                                                type="text"
                                                list={`list-dura-${index}`}
                                                value={item.duracao}
                                                onChange={(e) => handleItemChange(index, 'duracao', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2"
                                                placeholder="Selecione ou digite"
                                            />
                                            <datalist id={`list-dura-${index}`}>
                                                {OPTIONS_DURA.map(opt => <option key={opt} value={opt} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Botão Adicionar: Full width no mobile */}
                        <button 
                            type="button"
                            onClick={handleAddItem}
                            className="mt-4 w-full md:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition"
                        >
                            <Plus className="w-5 h-5" /> Adicionar Medicamento
                        </button>
                    </div>

                    {/* Footer Fixo: Centralizado no mobile */}
                    <div className="sticky bottom-0 bg-white p-4 border-t shadow-inner flex justify-center md:justify-end">
                        <button
                            type="submit" 
                            className="w-full md:w-auto flex justify-center items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition duration-200"
                            disabled={isSaving}
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Salvando...' : 'Salvar e Gerar Receita'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}