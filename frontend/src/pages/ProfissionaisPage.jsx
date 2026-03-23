import React, { useState, useEffect } from 'react';
import Sidebar from '../components/SideBar';
import ProfissionalService from '../services/ProfissionalService';
import { FaArrowLeft, FaEdit, FaTrash, FaUserPlus, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// 🌟 IMPORTAÇÃO DO MODAL 🌟
import ModalEdicaoProfissional from '../components/ModalEdicaoProfissional'; 


// =======================================
// DADOS AUXILIARES
// =======================================
const getDisplayValue = (value) => {
    if (!value) return '—';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, ' ');
};

// =======================================
// COMPONENTE PRINCIPAL
// =======================================

export default function ProfissionaisPage() {
    const navigate = useNavigate();
    const [profissionais, setProfissionais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profissionalEditando, setProfissionalEditando] = useState(null);

    const fetchProfissionais = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ProfissionalService.listarTodos();
            setProfissionais(data);
        } catch (err) {
            setError('Erro ao carregar a lista de profissionais. Verifique se o backend está ativo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfissionais();
    }, []);

    const handleEditar = (profissional) => {
        setProfissionalEditando(profissional);
        setIsModalOpen(true);
    };
    
    const handleDeletar = async (id, nome) => {
        if (!window.confirm(`Tem certeza que deseja deletar o profissional ${nome}?`)) {
            return;
        }
        try {
            await ProfissionalService.deletarProfissional(id);
            alert(`Profissional ${nome} deletado com sucesso!`);
            fetchProfissionais();
        } catch (err) {
            alert('Falha ao deletar profissional. Verifique se há agendamentos vinculados.');
            console.error(err);
        }
    };

    const handleSave = async (formDataMultipart) => { 
        try {
            await ProfissionalService.salvarProfissionalComFoto(formDataMultipart); 
            await fetchProfissionais(); 
            setIsModalOpen(false);
            setProfissionalEditando(null);
        } catch (err) {
            throw new Error(err.message || "Erro desconhecido ao salvar.");
        }
    };
    
    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />

            {/* Ajuste Responsivo: 
               - pt-16: Adiciona espaço no topo (mobile) para o ícone hambúrguer não cobrir o conteúdo.
               - md:pt-8: Retorna ao padding normal no desktop.
               - p-4: Padding menor nas laterais para mobile.
            */}
            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                <button
                    onClick={() => navigate('/configuracoes')}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
                >
                    <FaArrowLeft /> Voltar para Configurações
                </button>
                
                {/* Ajuste: Tamanho da fonte responsivo */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaUsers /> Gerenciamento de Profissionais ({profissionais.length})
                </h2>
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">{error}</div>
                )}

                {profissionais.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-lg shadow-md">
                        <p className="text-gray-600">Nenhum profissional cadastrado.</p>
                    </div>
                ) : (
                    /* O overflow-x-auto garante a rolagem horizontal da tabela no mobile */
                    <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {profissionais.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <img 
                                                src={p.foto ? p.foto : `https://placehold.co/40x40/d1d5db/4b5563?text=PF`}
                                                alt={`Foto de ${p.nome}`}
                                                className="w-10 h-10 object-cover rounded-full mx-auto"
                                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/d1d5db/4b5563?text=PF`; }}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.nome}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDisplayValue(p.tipoProfissional)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDisplayValue(p.areaAtendimento)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.crmOuRegistro}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button 
                                                onClick={() => handleEditar(p)}
                                                className="text-indigo-600 hover:text-indigo-900 mx-1 p-2 rounded-full hover:bg-indigo-100 transition"
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleDeletar(p.id, p.nome)}
                                                className="text-red-600 hover:text-red-900 mx-1 p-2 rounded-full hover:bg-red-100 transition"
                                                title="Excluir"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* BOTÃO DE CADASTRO: Largura total no mobile */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => navigate('/configuracoes/profissionais/novo')}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-200"
                    >
                        <FaUserPlus /> Cadastrar Novo Profissional
                    </button>
                </div>
            </main>
            
            {isModalOpen && profissionalEditando && (
                <ModalEdicaoProfissional 
                    profissional={profissionalEditando} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                />
            )}
        </div>
    );
}