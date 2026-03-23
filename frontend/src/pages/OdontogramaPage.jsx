import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSave, FaHandPointLeft, FaSpinner, FaEdit, FaLockOpen, FaCheckDouble, FaTag } from 'react-icons/fa';
import Sidebar from '../components/SideBar';
import Odontograma from '../components/Odontograma'; 
import FotoUpload from '../components/FotoUpload'; 

import { useRegistroProcedimento } from '../hooks/useRegistroProcedimento'; 
import { useLocation } from 'react-router-dom'; // Para verificar se veio desbloqueado

// 💡 FUNÇÃO DE CLONAGEM PROFUNDA
const deepClone = (obj) => {
    if (!obj) return {};
    return JSON.parse(JSON.stringify(obj));
};

export default function OdontogramaPage() {
    const location = useLocation();
    
    // Verifica se veio da tela anterior já com pedido de edição (opcional, mas útil)
    const [modoEdicaoManual, setModoEdicaoManual] = useState(location.state?.modoEdicao || false);

    const {
        // Dados e Estados
        agendamento, isLoading, isSaving, navigate,
        id, pacienteNome, 
        
        // Mapas do Odontograma
        odontogramaDisplayMap,  
        odontogramaInicialMap,  
        
        // Controle de Visualização
        currentOdontogramaView, setCurrentOdontogramaView,
        isInitialMapSaved, 
        
        // Handlers
        handleUpdateOdontogramaMap, 
        handleUpdateOdontogramaInicialMap, 
        handleAddProcedureToBill, 
        handleSaveOdontogramaInicial, 
        handleSaveRegistro,
        
        // Fotos
        fotos, handleAddFoto, handleRemoveFoto,
    } = useRegistroProcedimento();
    
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <FaSpinner className="animate-spin text-4xl text-indigo-600" />
                <span className="ml-3 text-lg text-indigo-600">Carregando Odontograma...</span>
            </div>
        );
    }
    
    if (!agendamento) return <p className="text-red-500 text-center mt-10 font-bold">Erro Crítico: Agendamento não encontrado.</p>;

    // 🔑 LÓGICA DE BLOQUEIO ATUALIZADA
    const isConcluido = agendamento.status === 'CONCLUIDO' || agendamento.status === 'CONCLUIDO_RETORNO';
    // Só bloqueia se estiver concluído E o usuário não tiver clicado em "Habilitar Edição"
    const isReadOnly = isConcluido && !modoEdicaoManual;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            <Sidebar /> 

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <button
                    onClick={() => navigate(`/procedimentos/registro/${id}`)}
                    className="mt-14 md:mt-0 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium transition-colors"
                >
                    <FaHandPointLeft /> Voltar para Detalhes e Cobrança
                </button>

                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b pb-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            🦷 Odontograma: {pacienteNome}
                        </h2>
                        <div className="flex items-center flex-wrap gap-2 text-base md:text-xl text-gray-600">
                            <span>Agendamento ID: {id}</span>
                            
                            {/* Tags de Status */}
                            {isConcluido && !modoEdicaoManual && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-sm rounded flex items-center gap-1">
                                    <FaCheckDouble /> Finalizado (Visualização)
                                </span>
                            )}
                            {modoEdicaoManual && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 font-bold text-sm rounded flex items-center gap-1 border border-yellow-300 animate-pulse">
                                    <FaLockOpen /> Modo de Edição Ativo
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 🌟 BOTÃO DE HABILITAR EDIÇÃO */}
                    {isConcluido && !modoEdicaoManual && (
                        <button 
                            type="button" 
                            onClick={() => {
                                if (window.confirm("Atenção: Este atendimento já foi finalizado. Alterações no odontograma podem gerar novos débitos ou inconsistências.\n\nDeseja habilitar a edição mesmo assim?")) {
                                    setModoEdicaoManual(true);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition"
                        >
                            <FaEdit /> Habilitar Edição
                        </button>
                    )}
                </div>
                
                {/* BLOCO: Upload de Fotos */}
                <FotoUpload
                    fotos={fotos}
                    onAddFoto={isReadOnly ? () => {} : handleAddFoto} 
                    onRemoveFoto={isReadOnly ? () => {} : handleRemoveFoto}
                    isReadOnly={isReadOnly} 
                />
                
                {/* BLOCO DO ODONTOGRAMA */}
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mt-6">
                    <div className="grid grid-cols-1 gap-4"> 
                        
                        {/* Botões de Visualização (Tabs) */}
                        <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-4'>
                            <button 
                                type="button" 
                                onClick={() => setCurrentOdontogramaView('INICIAL')}
                                className={`w-full md:w-auto px-4 py-2 rounded-lg font-medium transition duration-200 text-center ${
                                    currentOdontogramaView === 'INICIAL' 
                                        ? 'bg-gray-800 text-white shadow-md' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Odontograma Inicial {isInitialMapSaved ? '(Visualização Fixa)' : '(Edição Inicial)'}
                            </button>
                            
                            <button 
                                type="button" 
                                onClick={() => setCurrentOdontogramaView('ATUAL')}
                                className={`w-full md:w-auto px-4 py-2 rounded-lg font-medium transition duration-200 text-center ${
                                    currentOdontogramaView === 'ATUAL' 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                }`}
                            >
                                Odontograma Atual (Tratamento)
                            </button>
                        </div>
                        
                        {/* Área de Renderização do Odontograma */}
                        <div className='border p-2 md:p-4 bg-gray-50 rounded-lg min-h-[400px] md:min-h-[500px] overflow-x-auto'>
                            {currentOdontogramaView === 'INICIAL' ? (
                                <Odontograma 
                                    odontogramaMap={deepClone(odontogramaInicialMap)} 
                                    onUpdateOdontogramaMap={isInitialMapSaved ? () => {} : handleUpdateOdontogramaInicialMap} 
                                    isReadOnly={isInitialMapSaved || isReadOnly} 
                                    onAddProcedureToBill={() => {}} 
                                    onSaveOdontograma={isReadOnly ? () => {} : handleSaveOdontogramaInicial} 
                                />
                            ) : (
                                <Odontograma 
                                    odontogramaMap={deepClone(odontogramaDisplayMap)} 
                                    onUpdateOdontogramaMap={isReadOnly ? () => {} : handleUpdateOdontogramaMap} 
                                    onAddProcedureToBill={isReadOnly ? () => {} : handleAddProcedureToBill} 
                                    onSaveOdontograma={isReadOnly ? () => {} : handleSaveRegistro}
                                    isReadOnly={isReadOnly}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Botão Salvar Geral (Rodapé) */}
                {!isReadOnly && (
                    <div className="flex justify-end mt-6 pb-6">
                        <button
                            onClick={handleSaveRegistro}
                            className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 text-white font-bold rounded-lg shadow-md transition duration-200 ${
                                isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                            disabled={isSaving}
                        >
                            {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {isSaving ? 'Salvando...' : 'Salvar Odontograma & Registro'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}