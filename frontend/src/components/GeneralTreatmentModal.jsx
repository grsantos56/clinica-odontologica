import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash, FaListAlt } from 'react-icons/fa';

export default function GeneralTreatmentModal({ 
    isOpen, 
    onClose, 
    servicosGerais, 
    onAddProcedureToBill,
    teethStatusMap,        
    onSaveTratamento       
}) {
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [observacao, setObservacao] = useState('');
    const [acrescimo, setAcrescimo] = useState(0);
    const [procedimentosGerais, setProcedimentosGerais] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // 🛡️ CORREÇÃO DE SEGURANÇA AQUI:
            // Garante que mapSeguro seja um objeto, mesmo que teethStatusMap seja undefined
            const mapSeguro = teethStatusMap || {}; 
            const geralData = mapSeguro['GERAL'];

            if (geralData && geralData.procedimentos) {
                setProcedimentosGerais(geralData.procedimentos);
            } else {
                setProcedimentosGerais([]);
            }

            if (servicosGerais.length > 0) {
                setSelectedServiceId(servicosGerais[0].id);
            }
            setAcrescimo(0);
            setObservacao('');
        }
    }, [isOpen, teethStatusMap, servicosGerais]);

    if (!isOpen) return null;

    const handleAdd = () => {
        const service = servicosGerais.find(s => s.id === Number(selectedServiceId));
        if (!service) return;

        const valorTotal = service.preco + (parseFloat(acrescimo) || 0);
        const uniqueId = Date.now() + Math.random();

        // 1. Adiciona Financeiro
        onAddProcedureToBill({
            fdi: null, 
            status: 'plano',
            acrescimo: parseFloat(acrescimo) || 0,
            descricao: service.nome,
            valor: service.preco,
            valorCobrado: valorTotal,
            notas: observacao,
            comissaoPercentual: service.comissaoPercentual
        });

        // 2. Adiciona Visual
        const newItem = {
            id: uniqueId,
            servico: service.nome,
            valorBase: service.preco,
            acrescimo: parseFloat(acrescimo) || 0,
            observacao: observacao,
            concluido: false,
            dataAdicao: new Date().toISOString()
        };

        const updatedList = [...procedimentosGerais, newItem];
        setProcedimentosGerais(updatedList);
        saveToMap(updatedList);

        setObservacao('');
        setAcrescimo(0);
        alert('Procedimento Geral adicionado!');
    };

    const handleToggleConcluido = (id) => {
        const updatedList = procedimentosGerais.map(proc => 
            proc.id === id ? { ...proc, concluido: !proc.concluido } : proc
        );
        setProcedimentosGerais(updatedList);
        saveToMap(updatedList);
    };

    const handleRemove = (id) => {
        if (!window.confirm("Remover este item da lista visual?")) return;
        const updatedList = procedimentosGerais.filter(proc => proc.id !== id);
        setProcedimentosGerais(updatedList);
        saveToMap(updatedList);
    };

    // 🛡️ CORREÇÃO DE SEGURANÇA TAMBÉM NO SALVAMENTO
    const saveToMap = (list) => {
        const mapSeguro = teethStatusMap || {}; // Garante objeto
        
        const newMap = { 
            ...mapSeguro, 
            'GERAL': { 
                status: list.length > 0 ? 'ativo' : 'vazio', 
                procedimentos: list 
            } 
        };
        onSaveTratamento(newMap);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaListAlt className="text-indigo-600"/> Procedimentos Gerais
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 p-2"><FaTimes /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* Lista Existente */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">Status dos Tratamentos</h4>
                        {procedimentosGerais.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center py-2">Nenhum procedimento geral registrado.</p>
                        ) : (
                            <div className="space-y-2">
                                {procedimentosGerais.map(proc => (
                                    <div key={proc.id} className={`flex items-center justify-between p-3 bg-white border rounded shadow-sm ${proc.concluido ? 'border-green-200 bg-green-50' : ''}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <input type="checkbox" checked={proc.concluido} onChange={() => handleToggleConcluido(proc.id)} className="w-5 h-5 text-green-600 rounded cursor-pointer" />
                                            <div className="flex flex-col">
                                                <span className={`font-medium truncate ${proc.concluido ? 'line-through text-gray-400' : 'text-gray-800'}`}>{proc.servico}</span>
                                                {proc.observacao && <span className="text-xs text-gray-500">{proc.observacao}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {proc.concluido && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Concluído</span>}
                                            {!proc.concluido && (
                                                <button onClick={() => handleRemove(proc.id)} className="text-red-400 hover:text-red-600 p-1"><FaTrash size={14}/></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Adicionar Novo */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2"><FaPlus /> Adicionar Novo Item</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Serviço</label>
                                <select className="w-full p-2 border border-indigo-200 rounded" value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}>
                                    {servicosGerais.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco.toFixed(2)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Acréscimo (R$)</label>
                                <input type="number" min="0" step="0.01" value={acrescimo} onChange={(e) => setAcrescimo(e.target.value)} className="w-full p-2 border border-indigo-200 rounded" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Obs.</label>
                                <input type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)} className="w-full p-2 border border-indigo-200 rounded" />
                            </div>
                        </div>
                        <button onClick={handleAdd} className="mt-3 w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 transition shadow-sm">Confirmar e Adicionar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}