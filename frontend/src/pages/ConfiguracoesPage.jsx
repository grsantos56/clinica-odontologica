import React from 'react';
import Sidebar from '../components/SideBar';
import { FaArrowLeft, FaUsers, FaCalendarCheck, FaShieldAlt } from 'react-icons/fa'; 
import { useNavigate, Link } from 'react-router-dom';

const ConfigCard = ({ icon: Icon, title, description, to }) => (
    <Link 
        to={to} 
        className="flex items-start p-4 md:p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200 hover:scale-[1.02] border border-gray-100 h-full"
    >
        <div className="p-3 bg-indigo-500 rounded-full text-white mr-4 shrink-0">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h4 className="text-lg font-bold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
    </Link>
);

export default function ConfiguracoesPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <h2 className="mt-14 md:mt-0 text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Painel de Configurações
                </h2>
                
                <p className="text-base md:text-xl text-gray-600 font-medium mb-6 md:mb-8">
                    Gerenciamento de Usuários e Dados Mestres
                </p>
                
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 md:mb-8 font-medium"
                >
                    <FaArrowLeft /> Voltar
                </button>

                {/* Ajustado: md:grid-cols-2 para telas médias, lg:grid-cols-3 para telas grandes */}
                <div className="max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    
                    {/* Card 1: Gerenciar Profissionais */}
                    <ConfigCard
                        icon={FaUsers}
                        title="Gerenciar Profissionais"
                        description="Visualize, cadastre e edite dentistas, fisioterapeutas e atendentes."
                        to="/configuracoes/profissionais" 
                    />
                    
                    {/* Card 2: Gerenciar Serviços */}
                    <ConfigCard
                        icon={FaCalendarCheck}
                        title="Gerenciar Serviços e Preços"
                        description="Defina os procedimentos padrão e suas áreas de atuação."
                        to="/configuracoes/servicos" 
                    />

                    {/* Card 3: Sessões Ativas */}
                    <ConfigCard
                        icon={FaShieldAlt}
                        title="Segurança e Acessos"
                        description="Gerencie os dispositivos conectados e encerre sessões remotas."
                        to="/configuracoes/sessoes" 
                    />
                    
                </div>
            </main>
        </div>
    );
}