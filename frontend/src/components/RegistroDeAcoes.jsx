import React, { useState } from 'react';
import { FaPlusCircle, FaTimes, FaClipboardList } from 'react-icons/fa';

export default function RegistroDeAcoes({ acoesDaSessao, handleAddAcao, handleRemoveAcao, isReadOnly = false }) {
    const [novaAcao, setNovaAcao] = useState('');

    const handleSubmit = () => {
        if (!novaAcao.trim()) return;
        handleAddAcao(novaAcao);
        setNovaAcao('');
    };

    // 🌟 CORREÇÃO 1: Função robusta para ler dataCriacao ou timestamp
    const formatarHora = (dataString) => {
        if (!dataString) return '--:--';
        try {
            return new Date(dataString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '--:--';
        }
    };

    // 🌟 CORREÇÃO 2: Função para extrair nome do profissional (Objeto ou String)
    const getNomeProfissional = (profissionalData) => {
        if (!profissionalData) return 'Profissional';
        if (typeof profissionalData === 'object') return profissionalData.nome || 'Profissional';
        return profissionalData; // Se for string
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                <FaClipboardList /> Diário de Ações da Sessão
            </h3>

            {/* Input de Nova Ação */}
            {!isReadOnly && (
                <div className="flex gap-2 mb-4"
                     onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                             e.preventDefault();
                             handleSubmit();
                         }
                     }}
                >
                    <input
                        type="text"
                        value={novaAcao}
                        onChange={(e) => setNovaAcao(e.target.value)}
                        placeholder="Ex: Anestesia aplicada (Dente 16)"
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={handleSubmit} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <FaPlusCircle />
                    </button>
                </div>
            )}

            {/* Lista de Ações */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {acoesDaSessao.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">Nenhuma ação registrada nesta sessão.</p>
                ) : (
                    acoesDaSessao.map(acao => (
                        <div key={acao.id} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex-1 pr-4">
                                {/* 🌟 CORREÇÃO 3: Exibe Hora E Nome do Profissional */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                        {formatarHora(acao.dataCriacao || acao.timestamp)}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                        {getNomeProfissional(acao.profissional)}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-gray-800 leading-snug">{acao.descricao}</p>
                            </div>
                            
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAcao(acao.id)}
                                    className="text-red-400 hover:text-red-600 transition p-1"
                                    title="Remover ação"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}