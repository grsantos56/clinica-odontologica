import React, { useState, useEffect } from 'react';
import Sidebar from '../components/SideBar';
// Adicionado FaSyncAlt para o botão de atualizar
import { FaArrowLeft, FaLaptop, FaTrashAlt, FaClock, FaNetworkWired, FaSpinner, FaUserShield, FaUserMd, FaUserTie, FaSyncAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SessoesAtivasPage() {
    const navigate = useNavigate();
    const [sessoes, setSessoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchSessoes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/sessoes');
            setSessoes(response.data);
        } catch (error) {
            console.error("Erro ao buscar sessões:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSessoes(); }, []);

    const handleEncerrarSessao = async (id, isAtual) => {
        if (isAtual) {
            alert("Para encerrar a sua sessão atual, use o botão Sair no menu.");
            return;
        }
        if (window.confirm("Deseja desconectar este usuário remotamente?")) {
            setActionLoading(id);
            try {
                await api.delete(`/auth/sessoes/${id}`);
                setSessoes(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                alert("Erro ao encerrar sessão.");
            } finally {
                setActionLoading(null);
            }
        }
    };

    const getBadgeStyle = (tipo) => {
        switch (tipo) {
            case 'ADMINISTRADOR': return { color: 'bg-red-100 text-red-700', icon: <FaUserShield /> };
            case 'DENTISTA': return { color: 'bg-blue-100 text-blue-700', icon: <FaUserMd /> };
            default: return { color: 'bg-gray-100 text-gray-700', icon: <FaUserTie /> };
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <h2 className="mt-14 md:mt-0 text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Segurança: Gerenciamento de Acessos
                </h2>
                <p className="text-gray-600 mb-8">Controle os dispositivos conectados ao sistema.</p>

                {/* Container de Botões de Ação */}
                <div className="flex items-center justify-between mb-8 max-w-4xl">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                        <FaArrowLeft /> Voltar
                    </button>

                    {/* Botão para resolver o problema de sincronização entre navegadores */}
                    <button 
                        onClick={fetchSessoes} 
                        disabled={loading}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold transition-all shadow-sm active:scale-95"
                    >
                        <FaSyncAlt className={loading ? "animate-spin" : ""} />
                        ATUALIZAR LISTA
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center gap-3 text-indigo-600"><FaSpinner className="animate-spin" /> Carregando...</div>
                ) : (
                    <div className="max-w-4xl space-y-4">
                        {sessoes.map((sessao) => {
                            const badge = getBadgeStyle(sessao.tipoProfissional);
                            return (
                                <div key={sessao.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 bg-white rounded-xl shadow-sm border ${sessao.sessaoAtual ? 'border-green-300 ring-2 ring-green-50' : 'border-gray-100'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full mt-1 ${sessao.sessaoAtual ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <FaLaptop size={20} />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">
                                                    {sessao.nomeProfissional}
                                                </h4>
                                                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badge.color}`}>
                                                    {badge.icon} {sessao.tipoProfissional}
                                                </span>
                                                {sessao.sessaoAtual && (
                                                    <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase shadow-sm">ESTA SESSÃO</span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                                                <p className="flex items-center gap-1"><FaNetworkWired /> IP: {sessao.ip}</p>
                                                <p className="flex items-center gap-1"><FaClock /> Login: {new Date(sessao.dataLogin).toLocaleString('pt-BR')}</p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2 italic truncate max-w-xs md:max-w-md">
                                                Navegador: {sessao.dispositivo}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-0 flex justify-end">
                                        {!sessao.sessaoAtual && (
                                            <button
                                                onClick={() => handleEncerrarSessao(sessao.id, false)}
                                                disabled={actionLoading === sessao.id}
                                                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-200 uppercase tracking-widest shadow-sm"
                                            >
                                                {actionLoading === sessao.id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                                                ENCERRAR ACESSO
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}