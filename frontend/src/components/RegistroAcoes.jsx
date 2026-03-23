import React, { useState } from 'react';
import { FaClipboardList, FaPlus, FaTrash, FaUserMd } from 'react-icons/fa';

export default function RegistroDeAcoes({ 
    acoesDaSessao = [], 
    handleAddAcao, 
    handleRemoveAcao, 
    isReadOnly 
}) {
    const [novaAcaoTexto, setNovaAcaoTexto] = useState('');

    const handleAddClick = () => {
        if (!novaAcaoTexto || novaAcaoTexto.trim() === "") return;

        // O Hook já trata a criação do objeto completo com profissional
        handleAddAcao(novaAcaoTexto);
        setNovaAcaoTexto(''); 
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddClick();
        }
    };

    const getDescricao = (acao) => {
        if (!acao) return null;
        if (typeof acao === 'string') return acao;
        
        // Tenta ler a descrição válida
        if (acao.descricao && acao.descricao.trim() !== "") return acao.descricao;
        if (acao.texto && acao.texto.trim() !== "") return acao.texto;

        return null;
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                <FaClipboardList /> Diário de Ações da Sessão
            </h3>

            {!isReadOnly && (
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ex: Anestesia aplicada (Dente 16)"
                        value={novaAcaoTexto}
                        onChange={(e) => setNovaAcaoTexto(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        type="button"
                        onClick={handleAddClick}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2 transition"
                    >
                        <FaPlus />
                    </button>
                </div>
            )}

            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {acoesDaSessao && acoesDaSessao.length > 0 ? (
                    acoesDaSessao.map((acao, index) => {
                        const texto = getDescricao(acao);
                        const itemId = acao.id || index;
                        const nomeDentista = acao.profissional || "";

                        // 🔒 FILTRO DE LIMPEZA (Remove N/A e Lixo)
                        // Se não tiver texto, ou se o texto for literalmente "N/A" (salvo errado antes), esconde.
                        if (!texto || texto === "N/A") {
                            // Se quiser ver no console o que está sendo escondido, descomente:
                            // console.warn("Item inválido ocultado:", acao);
                            return null;
                        }

                        return (
                            <li 
                                key={itemId} 
                                className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200"
                            >
                                <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium break-all">
                                        {texto}
                                    </span>
                                    
                                    {/* Exibe o nome do Profissional se existir */}
                                    {nomeDentista && (
                                        <span className="text-xs text-indigo-500 flex items-center gap-1 mt-1 font-semibold">
                                            <FaUserMd size={12} /> {nomeDentista}
                                        </span>
                                    )}
                                </div>
                                
                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAcao(acao.id)}
                                        className="text-red-500 hover:text-red-700 p-1 ml-2"
                                        title="Remover ação"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                )}
                            </li>
                        );
                    })
                ) : (
                    <li className="text-gray-400 italic text-sm text-center py-2">
                        Nenhuma ação registrada nesta sessão.
                    </li>
                )}
            </ul>
        </div>
    );
}