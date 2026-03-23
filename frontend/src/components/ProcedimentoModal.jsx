// src/components/ProcedimentoModal.jsx
import React from 'react';
import { FaTimes, FaTooth, FaBan, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';

// Recebe novas funções de callback para delegação de ações detalhadas
export default function ProcedimentoModal({ fdi, isOpen, onClose, onExecuteSimpleAction, onOpenTratamentoModal }) { 
    if (!isOpen || !fdi) return null;

    const handleAction = (type, actionPrefix) => {
        onClose(); // Fecha este modal imediatamente

        if (type === 'tratamento') {
             // Se for Plano ou Histórico, delega a abertura do modal de detalhe
             onOpenTratamentoModal(fdi, actionPrefix);
        } else if (type === 'simple') {
             // Ações simples (ausente, resetar) que não requerem detalhamento
             onExecuteSimpleAction(fdi, actionPrefix);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Ação para Dente {fdi}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 font-semibold">O que deve ser registrado neste dente?</p>

                <div className="space-y-3">
                    
                    {/* 1. DENTE A SER TRATADO / TRATAMENTO A SER REALIZADO (PLANO) */}
                    <button 
                        onClick={() => handleAction('tratamento', 'plano')}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                    >
                        <FaTooth /> Dente a Ser Tratado (Orçamento)
                    </button>

                    {/* 2. TRATADO EM OUTRA CLÍNICA (HISTÓRICO) */}
                    <button 
                        onClick={() => handleAction('tratamento', 'tratado')} 
                        className="w-full flex items-center gap-3 px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
                    >
                        <FaCheckCircle /> Dente Já Tratado (Histórico)
                    </button>
                    
                    {/* 3. DENTE AUSENTE (Ação Simples: ausente) */}
                    <button 
                        onClick={() => handleAction('simple', 'ausente')}
                        className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                    >
                        <FaBan className="text-red-500" /> Dente Ausente
                    </button>
                    
                    {/* 4. VOLTAR AO NORMAL (Resetar - Ação Simples: vazio) */}
                    <button 
                        onClick={() => handleAction('simple', 'vazio')}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 pt-2 border-t mt-3"
                    >
                        Resetar Status
                    </button>
                </div>
            </div>
        </div>
    );
}