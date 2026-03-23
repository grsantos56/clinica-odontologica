// src/pages/ServicosPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/SideBar';
import { 
    FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSpinner, 
    FaDollarSign, FaBriefcaseMedical, FaTimes, FaSave, 
    FaSearch, FaFilter, FaFileAlt, FaPercentage, FaTooth, FaLayerGroup 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import ServicoService from '../services/ServicoService';

const AreaAtendimentoOptions = [
    { value: 'TODOS', label: 'Todas as Áreas' },
    { value: 'ODONTOLOGIA', label: 'Odontologia' },
    { value: 'FISIOTERAPIA', label: 'Fisioterapia' },
    { value: 'NUTRICIONISTA', label: 'Nutricionista' },
    { value: 'PSICOLOGIA', label: 'Psicologia' },
    { value: 'ATENDIMENTO_GERAL', label: 'Atendimento/Recepção' },
];

const formatCurrency = (value) => {
    if (typeof value === 'number') {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(value || '0,00');
};

const parseCurrency = (valueStr) => {
    if (!valueStr) return 0;
    const cleanStr = valueStr.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr);
};

// ... (Componente ServicoModal permanece igual, vou omitir para focar na tabela) ...
const ServicoModal = ({ currentServico, formData, handleChange, handleSave, isSaving, setIsModalOpen, setFetchError, fetchError, AreaAtendimentoOptions }) => {
    
    const [precoInput, setPrecoInput] = useState(formData.preco);
    const [comissaoInput, setComissaoInput] = useState(formData.comissaoPercentual);

    useEffect(() => {
        setPrecoInput(formData.preco);
        setComissaoInput(formData.comissaoPercentual);
    }, [formData.preco, formData.comissaoPercentual]);

    const handleMoneyInput = (e, fieldName, setLocalState) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value === '') value = '0';
        const numericValue = parseFloat(value) / 100;
        const formattedValue = numericValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        setLocalState(formattedValue);
        handleChange({ target: { name: fieldName, value: formattedValue } });
    };

    const handleFocus = (e) => {
        e.target.select();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSave} className="bg-white p-4 md:p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{currentServico ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                    <button type="button" onClick={() => { setIsModalOpen(false); setFetchError(null); }} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                </div>
                
                {fetchError && <p className="text-red-500 mb-4 text-sm">{fetchError}</p>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Serviço</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg" placeholder="Ex: Manutenção de Aparelho" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Aplicação</label>
                            <select 
                                name="requerDente" 
                                value={formData.requerDente} 
                                onChange={handleChange} 
                                className="mt-1 w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500"
                            >
                                <option value="true">Por Dente (Ex: Extração)</option>
                                <option value="false">Geral / Boca Toda (Ex: Manutenção)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.requerDente === 'true' 
                                    ? "Exige selecionar um dente no odontograma." 
                                    : "Pode ser lançado sem selecionar dentes específicos."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Área</label>
                            <select name="areaEspecialidade" value={formData.areaEspecialidade} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg bg-white">
                                {AreaAtendimentoOptions.filter(o => o.value !== 'TODOS').map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço Base (R$)</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"><FaDollarSign /></span>
                                <input 
                                    type="text"
                                    inputMode="numeric" 
                                    name="preco" 
                                    value={precoInput} 
                                    onChange={(e) => handleMoneyInput(e, 'preco', setPrecoInput)} 
                                    onFocus={handleFocus} 
                                    required 
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-right font-mono font-medium" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Comissão Dentista (%)</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"><FaPercentage /></span>
                                <input 
                                    type="text"
                                    inputMode="numeric"
                                    name="comissaoPercentual" 
                                    value={comissaoInput} 
                                    onChange={(e) => handleMoneyInput(e, 'comissaoPercentual', setComissaoInput)} 
                                    onFocus={handleFocus} 
                                    required 
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-right font-mono font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição Curta (Opcional)</label>
                        <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows="2" className="mt-1 w-full p-3 border border-gray-300 rounded-lg" placeholder="Breve descrição..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FaFileAlt className="text-gray-500" /> 
                            Guia de Recomendações Pós-Procedimento (Opcional)
                        </label>
                        <textarea 
                            name="recomendacoesPosProcedimento" 
                            value={formData.recomendacoesPosProcedimento} 
                            onChange={handleChange} 
                            rows="5" 
                            className="mt-1 w-full p-3 border border-gray-300 rounded-lg text-sm"
                            maxLength={4000}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <button type="button" onClick={() => { setIsModalOpen(false); setFetchError(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
                        <FaSave /> {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default function ServicosPage() {
    const navigate = useNavigate();
    const [servicos, setServicos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentServico, setCurrentServico] = useState(null); 

    const [filterArea, setFilterArea] = useState('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    // const ITEMS_PER_PAGE = 8; // ❌ REMOVIDO: Para permitir que a lista cresça e use o scroll

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco: '0,00',
        comissaoPercentual: '0,00',
        areaEspecialidade: 'ODONTOLOGIA',
        recomendacoesPosProcedimento: '', 
        requerDente: 'true'
    });

    const fetchServicos = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const data = await ServicoService.listarTodos();
            setServicos(data);
        } catch (error) {
            setFetchError("Erro ao carregar a lista de serviços.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchServicos(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFetchError(null);

        const precoNumerico = parseCurrency(formData.preco);
        const comissaoNumerica = parseCurrency(formData.comissaoPercentual);

        if (isNaN(precoNumerico) || precoNumerico < 0) {
             setFetchError("O preço deve ser um valor numérico válido.");
             setIsSaving(false); return;
        }

        const servicoToSave = {
            ...currentServico, 
            ...formData,
            preco: precoNumerico,
            comissaoPercentual: comissaoNumerica,
            requerDente: formData.requerDente === 'true' 
        };

        try {
            await ServicoService.salvar(servicoToSave);
            alert(`Serviço salvo com sucesso!`);
            setIsModalOpen(false);
            setCurrentServico(null);
            await fetchServicos(); 
        } catch (error) {
            setFetchError(error.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleEdit = (servico) => {
        setCurrentServico(servico);
        setFormData({
            nome: servico.nome,
            descricao: servico.descricao || '',
            preco: formatCurrency(servico.preco), 
            comissaoPercentual: formatCurrency(servico.comissaoPercentual || 0),
            areaEspecialidade: servico.areaEspecialidade,
            recomendacoesPosProcedimento: servico.recomendacoesPosProcedimento || '',
            requerDente: (servico.requerDente !== false) ? 'true' : 'false' 
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
            try {
                await ServicoService.deletar(id);
                await fetchServicos();
            } catch (error) {
                alert("Erro ao excluir o serviço.");
            }
        }
    };

    const openCreateModal = () => {
        setCurrentServico(null);
        setFormData({
            nome: '',
            descricao: '',
            preco: '0,00', 
            comissaoPercentual: '0,00',
            areaEspecialidade: 'ODONTOLOGIA',
            recomendacoesPosProcedimento: '', 
            requerDente: 'true'
        });
        setIsModalOpen(true);
    };

    const filteredAndSortedServicos = useMemo(() => {
        let list = servicos;
        const lowerSearchTerm = searchTerm.toLowerCase();
        list = list.filter(servico => {
            const areaMatch = filterArea === 'TODOS' || servico.areaEspecialidade === filterArea;
            const searchMatch = lowerSearchTerm === '' || servico.nome.toLowerCase().includes(lowerSearchTerm);
            return areaMatch && searchMatch;
        });
        list.sort((a, b) => a.nome.localeCompare(b.nome));
        // return list.slice(0, ITEMS_PER_PAGE); // ❌ REMOVIDO: Retorna a lista completa para ativar o scroll
        return list; 
    }, [servicos, filterArea, searchTerm]);

    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 font-medium"><FaArrowLeft /> Voltar</button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Serviços e Preços</h2>
                    <button onClick={openCreateModal} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md"><FaPlus /> Novo Serviço</button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-indigo-500" />
                    </div>
                    <div className="relative w-full md:w-56">
                        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-indigo-500 bg-white">
                            {AreaAtendimentoOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                    </div>
                </div>
                
                {fetchError && !isModalOpen && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{fetchError}</div>}
                
                {/* 👇 SESSÃO ATUALIZADA: ADICIONADA ALTURA MÁXIMA E SCROLL */}
                <section className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                    {isLoading ? (
                        <div className="py-10 text-center text-indigo-600 flex items-center justify-center gap-2"><FaSpinner className="animate-spin text-xl" /> Carregando...</div>
                    ) : (
                        // 👇 WRAPPER DA TABELA COM SCROLL
                        <div className="overflow-y-auto max-h-[600px] border border-gray-100 rounded-lg">
                            <table className="min-w-full text-left table-auto">
                                {/* 👇 CABEÇALHO FIXO (STICKY) */}
                                <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                                    <tr className="text-sm text-gray-600 uppercase tracking-wider">
                                        <th className="py-3 px-4 w-1/3">Nome</th>
                                        <th className="py-3 px-4">Aplicação</th>
                                        <th className="py-3 px-4">Área</th>
                                        <th className="py-3 px-4 text-center">Comissão</th>
                                        <th className="py-3 px-4 text-right">Preço</th>
                                        <th className="py-3 px-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 divide-y divide-gray-200">
                                    {filteredAndSortedServicos.length > 0 ? (
                                        filteredAndSortedServicos.map(servico => (
                                            <tr key={servico.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium min-w-[150px]">{servico.nome}</td>
                                                <td className="py-3 px-4">
                                                    {servico.requerDente !== false ? (
                                                        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded w-fit"><FaTooth/> Por Dente</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded w-fit"><FaLayerGroup/> Geral</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500">{AreaAtendimentoOptions.find(o => o.value === servico.areaEspecialidade)?.label}</td>
                                                <td className="py-3 px-4 text-center font-semibold text-gray-600">{servico.comissaoPercentual || 0}%</td>
                                                <td className="py-3 px-4 text-right font-bold text-green-600 whitespace-nowrap">R$ {servico.preco ? servico.preco.toFixed(2).replace('.', ',') : '0,00'}</td>
                                                <td className="py-3 px-4 text-center space-x-3 whitespace-nowrap">
                                                    <button onClick={() => handleEdit(servico)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(servico.id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="py-8 text-center text-gray-500">Nenhum serviço encontrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
            {isModalOpen && <ServicoModal currentServico={currentServico} formData={formData} handleChange={handleChange} handleSave={handleSave} isSaving={isSaving} setIsModalOpen={setIsModalOpen} setFetchError={setFetchError} fetchError={fetchError} AreaAtendimentoOptions={AreaAtendimentoOptions.filter(o => o.value !== 'TODOS')} />}
        </div>
    );
}