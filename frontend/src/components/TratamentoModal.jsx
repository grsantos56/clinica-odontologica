// src/components/TratamentoModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaSave, FaShoppingCart, FaPlus, FaCheck, FaTimesCircle, FaSearch } from 'react-icons/fa';

// Array de tratamentos placeholder (Assumido)
const tiposTratamentoPlaceholder = [
    { id: 1, value: 'restauracao', label: 'Restauração', preco: 300.00, nome: 'Restauração' },
    { id: 2, value: 'extracao', label: 'Extração', preco: 150.00, nome: 'Extração' },
    { id: 3, value: 'limpeza', label: 'Limpeza/Profilaxia', preco: 100.00, nome: 'Limpeza/Profilaxia' },
    { id: 4, value: 'canal', label: 'Tratamento de Canal', preco: 800.00, nome: 'Tratamento de Canal' },
];

export default function TratamentoModal({ fdi, isOpen, onClose, onSaveTratamento, servicosDisponiveis, onAddProcedureToBill, actionPrefix, teethStatusMap }) {
    
    const servicesList = servicosDisponiveis && servicosDisponiveis.length > 0 ? servicosDisponiveis : tiposTratamentoPlaceholder;

    // ESTADOS
    const [selectedTratamentoName, setSelectedTratamentoName] = useState(servicesList[0]?.nome || servicesList[0]?.label || '');
    const [observacao, setObservacao] = useState('');
    const [acrescimo, setAcrescimo] = useState(0); 
    const [targetFDI, setTargetFDI] = useState(fdi || 0); 
    const [searchTerm, setSearchTerm] = useState(''); 
    
    const [procedimentosDoDente, setProcedimentosDoDente] = useState([]);
    
    const currentActionPrefix = useMemo(() => {
        return actionPrefix === 'tratado' ? 'tratado-' : 'plano-';
    }, [actionPrefix]);

    const currentServiceData = servicesList.find(s => s.nome === selectedTratamentoName || s.label === selectedTratamentoName);
    const precoBase = currentServiceData?.preco || 0;

    const filteredServices = useMemo(() => {
        if (!searchTerm) return servicesList;
        return servicesList.filter(s => 
            (s.nome || s.label).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [servicesList, searchTerm]);

    useEffect(() => {
        if (isOpen && fdi) {
            setTargetFDI(fdi); 
            setSelectedTratamentoName(servicesList[0]?.nome || servicesList[0]?.label || '');
            setObservacao('');
            setAcrescimo(0); 
            setSearchTerm('');

            const status = teethStatusMap[fdi];

            if (currentActionPrefix === 'tratado-' && typeof status !== 'string' && status?.procedimentos) {
                setProcedimentosDoDente(status.procedimentos);
            } else {
                setProcedimentosDoDente([]); 
            }
        }
    }, [fdi, isOpen, servicesList, currentActionPrefix, teethStatusMap]); 

    if (!isOpen || !fdi || servicesList.length === 0) return null;

    const addPlanToOdontograma = (fdiCode, name, preco, acr) => {
        const procedureSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const uniqueId = Date.now() + Math.random(); 
        
        const newProcedure = {
            id: uniqueId, 
            servico: name,
            slug: procedureSlug,
            valorBase: preco,
            acrescimo: acr,
            valorCobrado: preco + acr,
            observacao: observacao,
            concluido: false,
            comissaoPercentual: currentServiceData?.comissaoPercentual || 0,
            recomendacoesPosProcedimento: currentServiceData?.recomendacoesPosProcedimento || '' 
        };
        
        const currentStatus = teethStatusMap[fdiCode];
        let updatedProcedures = [];
        if (typeof currentStatus === 'object' && currentStatus?.procedimentos) {
            updatedProcedures = [...currentStatus.procedimentos, newProcedure];
        } else {
            updatedProcedures = [newProcedure];
        }
        const newStatusObject = { status: 'plano', procedimentos: updatedProcedures };
        const newMap = { ...teethStatusMap, [fdiCode]: newStatusObject };
        return newMap;
    };
    
    const handleToggleConcluido = (procedureId) => {
        const updatedProcedures = procedimentosDoDente.map(proc => 
            proc.id === procedureId ? { ...proc, concluido: !proc.concluido } : proc
        );
        setProcedimentosDoDente(updatedProcedures);
    };

    const handleSaveCompletedTreatments = () => {
        const updatedStatus = { status: 'plano', procedimentos: procedimentosDoDente };
        const newMap = { ...teethStatusMap, [fdi]: updatedStatus };
        onSaveTratamento(newMap); 
    };
    
    const handleAddPlanProcedure = (saveAndClose) => {
        if (!currentServiceData || !targetFDI) return;
        const serviceName = currentServiceData.nome || currentServiceData.label;
        const valorTotal = precoBase + (acrescimo || 0);
        onAddProcedureToBill({
            fdi: targetFDI, 
            status: 'plano', 
            acrescimo: acrescimo || 0,
            descricao: `${serviceName} (Plano: Dente ${targetFDI})`,
            valor: precoBase, 
            valorCobrado: valorTotal, 
            notas: observacao,
            comissaoPercentual: currentServiceData?.comissaoPercentual || 0 
        });
        const newMap = addPlanToOdontograma(targetFDI, serviceName, precoBase, acrescimo || 0);
        onSaveTratamento(newMap);
        if (saveAndClose) {
            onClose();
        } else {
            setObservacao('');
            setAcrescimo(0);
            alert(`Plano adicionado ao Dente ${targetFDI}!`);
        }
    };
    
    const handleSaveAndClose = (e) => {
        e.preventDefault(); 
        if (currentActionPrefix === 'plano-') {
            handleAddPlanProcedure(true); 
        } else {
            handleSaveCompletedTreatments();
            onClose();
        }
    };
    
    const handleAddAndContinue = (e) => {
        e.preventDefault();
        if (currentActionPrefix !== 'plano-') {
            onClose();
            return;
        }
        handleAddPlanProcedure(false);
    }
    
    const isTreatingWithoutPlans = currentActionPrefix === 'tratado-' && procedimentosDoDente.length === 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
            {/* Responsividade: max-h customizada para caber em telas de notebook e mobile */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                
                {/* Header fixo */}
                <div className="flex justify-between items-center border-b p-4 shrink-0">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 leading-tight">
                        {currentActionPrefix === 'plano-' ? 'Plano de Tratamento' : 'Concluir Tratamento'} - Dente {fdi}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1"><FaTimes size={20} /></button>
                </div>
                
                {/* Corpo com rolagem para telas pequenas */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-5"> 
                        
                        {currentActionPrefix === 'plano-' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Dente de Referência (FDI)</label>
                                    <input
                                        type="number"
                                        min="11" max="85"
                                        value={targetFDI || ''} 
                                        onChange={(e) => setTargetFDI(parseInt(e.target.value) || fdi)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 ring-indigo-500 text-sm"
                                    />
                                </div>
                                
                                <div className="flex flex-col">
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Selecione o Serviço</label>
                                    <div className="relative mb-2">
                                        <input 
                                            type="text" 
                                            placeholder="Buscar serviço..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full p-2 pl-8 border border-gray-300 rounded-lg text-sm focus:ring-2 ring-indigo-500"
                                        />
                                        <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                    </div>

                                    {/* Lista de serviços com altura limitada */}
                                    <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-40 sm:max-h-52 bg-gray-50">
                                        {filteredServices.length > 0 ? (
                                            filteredServices.map(servico => {
                                                const val = servico.nome || servico.label;
                                                const isSelected = selectedTratamentoName === val;
                                                return (
                                                    <div 
                                                        key={servico.id || val}
                                                        onClick={() => setSelectedTratamentoName(val)}
                                                        className={`p-3 cursor-pointer text-xs sm:text-sm border-b last:border-b-0 hover:bg-indigo-50 transition-colors ${isSelected ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-700 bg-white'}`}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="truncate pr-2">{val}</span>
                                                            <span className={`shrink-0 font-mono font-bold ${isSelected ? 'text-white' : 'text-green-600'}`}>
                                                                R$ {servico.preco ? servico.preco.toFixed(2) : '0.00'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 text-xs">Nenhum serviço encontrado.</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Acréscimo (Opcional)</label>
                                    <div className="flex items-center">
                                        <span className="p-2 border border-gray-300 bg-gray-100 rounded-l-lg text-gray-600 font-bold text-sm">R$</span>
                                        <input
                                            type="number"
                                            value={acrescimo || 0} 
                                            onChange={(e) => setAcrescimo(parseFloat(e.target.value) || 0)}
                                            className="w-full p-2 border border-gray-300 rounded-r-lg focus:ring-2 ring-indigo-500 text-sm"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 px-1">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Preço Base: R$ {precoBase.toFixed(2)}</span>
                                        <span className="text-[10px] text-indigo-600 uppercase font-black text-right">Total: R$ {(precoBase + (acrescimo || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {currentActionPrefix === 'tratado-' && (
                            <div className="space-y-4">
                                {isTreatingWithoutPlans ? (
                                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3">
                                        <FaTimesCircle className="shrink-0" />
                                        <p className="text-xs font-bold uppercase">Sem planos pendentes neste dente.</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                                        <div className="bg-gray-200 px-3 py-2 text-[10px] font-black uppercase text-gray-600">Procedimentos em Plano:</div>
                                        <div className="max-h-60 overflow-y-auto divide-y divide-gray-200">
                                            {procedimentosDoDente.map(proc => (
                                                <div key={proc.id} className="flex items-center justify-between p-3 bg-white hover:bg-indigo-50 cursor-pointer" onClick={() => handleToggleConcluido(proc.id)}>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={proc.concluido}
                                                            readOnly 
                                                            className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                                        />
                                                        <span className={`text-sm font-medium ${proc.concluido ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                            {proc.servico}
                                                        </span>
                                                    </div>
                                                    {proc.concluido && <FaCheck className="text-green-500 shrink-0" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Observações Clínicas</label>
                            <textarea
                                rows="2"
                                value={observacao || ''} 
                                onChange={(e) => setObservacao(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 ring-indigo-500 text-sm"
                                placeholder="Detalhes técnicos ou do tratamento..."
                            />
                        </div>
                    </form>
                </div>

                {/* Footer fixo com botões empilhados no mobile */}
                <div className="p-4 border-t bg-gray-50 shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button type="button" onClick={onClose} className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold text-xs uppercase hover:bg-gray-100 transition-colors">
                            Cancelar
                        </button>
                        
                        {currentActionPrefix === 'plano-' && (
                            <button 
                                type="button" 
                                onClick={handleAddAndContinue} 
                                className="w-full sm:flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                            >
                                <FaPlus /> Adicionar
                            </button>
                        )}
                        
                        <button 
                            type="submit" 
                            onClick={handleSaveAndClose} 
                            className="w-full sm:flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:bg-gray-400"
                            disabled={isTreatingWithoutPlans && currentActionPrefix === 'tratado-'}
                        >
                            <FaSave /> {currentActionPrefix === 'plano-' ? 'Salvar' : 'Concluir'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}