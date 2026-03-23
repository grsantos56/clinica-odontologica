import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/SideBar'; 
import { FaUser, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import PacienteService from '../services/PacienteService';

// Import dos componentes das abas
import PacienteCadastroTab from '../components/tabs/PacienteCadastroTab';
import PacienteFinanceiroTab from '../components/tabs/PacienteFinanceiroTab';
// 🌟 1. Import Novo
import PacienteProcedimentosTab from '../components/tabs/PacienteProcedimentosTab';

export default function PacienteDetalhesPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [paciente, setPaciente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('cadastro');

    const fetchPaciente = async () => {
        setLoading(true);
        try {
            const data = await PacienteService.buscarPorId(id);
            setPaciente(data);
        } catch (error) {
            console.error("Erro ao carregar paciente:", error);
            alert("Erro ao carregar paciente. Retornando à lista.");
            navigate('/pacientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPaciente();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <FaSpinner className="animate-spin text-4xl text-indigo-600" />
            </div>
        );
    }

    if (!paciente) return null;

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />
            
            <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-y-auto w-full">
                
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/pacientes')} 
                            className="p-2 text-gray-500 hover:text-indigo-600 transition rounded-full hover:bg-gray-100 bg-white shadow-sm sm:shadow-none"
                            title="Voltar para lista"
                        >
                            <FaArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <FaUser className="text-indigo-600 hidden sm:inline"/> {paciente.nome}
                            </h2>
                            <p className="text-gray-500 text-xs sm:text-sm">Gerenciamento de perfil e histórico financeiro</p>
                        </div>
                    </div>
                </div>

                {/* Navegação de Abas */}
                <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200 px-4 sm:px-6 pt-4 overflow-x-auto">
                    <div className="flex space-x-4 sm:space-x-6 min-w-max">
                        <button
                            onClick={() => setActiveTab('cadastro')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'cadastro' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Informações Cadastrais
                        </button>
                        
                        {/* 🌟 2. Botão da Nova Aba */}
                        <button
                            onClick={() => setActiveTab('procedimentos')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'procedimentos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Procedimentos Realizados
                        </button>

                        <button
                            onClick={() => setActiveTab('financeiro')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'financeiro' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Financeiro & Pagamentos
                        </button>
                    </div>
                </div>

                {/* Conteúdo das Abas */}
                <div className="bg-white rounded-b-xl shadow-lg p-4 sm:p-6 min-h-[500px]">
                    {activeTab === 'cadastro' && (
                        <PacienteCadastroTab 
                            paciente={paciente} 
                            onUpdate={fetchPaciente} 
                        />
                    )}
                    
                    {/* 🌟 3. Renderização da Nova Aba */}
                    {activeTab === 'procedimentos' && (
                        <PacienteProcedimentosTab 
                            paciente={paciente} 
                        />
                    )}
                    
                    {activeTab === 'financeiro' && (
                        <PacienteFinanceiroTab 
                            paciente={paciente} 
                            onUpdate={fetchPaciente} 
                        />
                    )}
                </div>
            </main>
        </div>
    );
}