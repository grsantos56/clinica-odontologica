import React, { useState, useEffect } from 'react';
import Dente from './Dente';
import ProcedimentoModal from './ProcedimentoModal';
import TratamentoModal from './TratamentoModal'; 
import GeneralTreatmentModal from './GeneralTreatmentModal';
import { FaUndo, FaSave, FaSpinner, FaListAlt, FaCheckCircle, FaExclamationCircle, FaArrowsAltH } from 'react-icons/fa'; 
import ServicoService from '../services/ServicoService'; 

// Função auxiliar
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export default function Odontograma({ onAddProcedureToBill, odontogramaMap, onUpdateOdontogramaMap, onSaveOdontograma, isReadOnly }) { 
    const [selectedFDI, setSelectedFDI] = useState(null);
    const [isProcedimentoModalOpen, setIsProcedimentoModalOpen] = useState(false);
    const [isTratamentoModalOpen, setIsTratamentoModalOpen] = useState(false); 
    const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false); 
    
    const [tratamentoPrefix, setTratamentoPrefix] = useState(null); 
    const [teethStatus, setTeethStatus] = useState(odontogramaMap || {}); 
    
    const [servicosDisponiveis, setServicosDisponiveis] = useState([]);
    const [isServicesLoading, setIsServicesLoading] = useState(false);

    // --- ESTATÍSTICAS ---
    const geralInfo = teethStatus['GERAL']?.procedimentos || [];
    const geralTotal = geralInfo.length;
    const geralConcluidos = geralInfo.filter(p => p.concluido).length;
    const geralPendentes = geralTotal - geralConcluidos;
    const porcentagemConclusao = geralTotal > 0 ? Math.round((geralConcluidos / geralTotal) * 100) : 0;

    const FDI = {
        superiorDireito: ['11', '12', '13', '14', '15', '16', '17', '18'], 
        superiorEsquerdo: ['21', '22', '23', '24', '25', '26', '27', '28'],
        inferiorEsquerdo: ['31', '32', '33', '34', '35', '36', '37', '38'],
        inferiorDireito: ['41', '42', '43', '44', '45', '46', '47', '48'],
    };

    useEffect(() => {
        const fetchServices = async () => {
            setIsServicesLoading(true);
            try {
                const data = await ServicoService.listarTodos();
                setServicosDisponiveis(data);
            } catch (error) {
                console.error("Erro ao carregar serviços:", error);
            } finally {
                setIsServicesLoading(false);
            }
        };
        fetchServices();
    }, []);
    
    useEffect(() => {
        if (odontogramaMap) {
            setTeethStatus(deepClone(odontogramaMap));
        }
    }, [odontogramaMap]);

    const servicosPorDente = servicosDisponiveis.filter(s => s.requerDente !== false);
    const servicosGerais = servicosDisponiveis.filter(s => s.requerDente === false);

    // --- HANDLERS ---
    const handleDenteClick = (fdi) => {
        if (isReadOnly) return; 
        setSelectedFDI(fdi);
        setIsProcedimentoModalOpen(true);
    };
    
    const handleOpenTratamentoModal = (fdi, prefix) => {
        setSelectedFDI(fdi); 
        setTratamentoPrefix(prefix); 
        setIsTratamentoModalOpen(true);
        setIsProcedimentoModalOpen(false); 
    };

    const handleExecuteSimpleAction = (fdi, action) => {
        let statusToSet = action; 
        const newMap = deepClone(teethStatus);
        newMap[fdi] = statusToSet;
        setTeethStatus(newMap);
        onUpdateOdontogramaMap(newMap); 
        setIsProcedimentoModalOpen(false); 
        setSelectedFDI(null);
    };
    
    const handleSaveTratamento = (newOdontogramaMap) => {
        const clonedMap = deepClone(newOdontogramaMap); 
        setTeethStatus(clonedMap);
        onUpdateOdontogramaMap(clonedMap); 
        setIsTratamentoModalOpen(false); 
        setTratamentoPrefix(null); 
        setSelectedFDI(null);
    };

    // 🌟 NOVA FUNÇÃO: Garante o salvamento correto dos Procedimentos Gerais
    const handleSaveGeneralTreatment = (dadosRetorno) => {
        const newMap = deepClone(teethStatus);

        // Verifica se o modal retornou a LISTA de itens (array) ou o MAPA completo
        if (Array.isArray(dadosRetorno)) {
            // Se for lista, injeta na chave GERAL
            if (!newMap['GERAL']) {
                newMap['GERAL'] = { procedimentos: [] };
            }
            newMap['GERAL'].procedimentos = dadosRetorno;
        } else if (dadosRetorno && typeof dadosRetorno === 'object') {
            // Se for mapa, mescla
            if (dadosRetorno['GERAL']) {
                newMap['GERAL'] = dadosRetorno['GERAL'];
            }
        }

        setTeethStatus(newMap);
        onUpdateOdontogramaMap(newMap); // ⚠️ Importante: Avisa o componente pai
        setIsGeneralModalOpen(false);
    };

    const handleReset = () => {
        if (window.confirm("Limpar toda a ficha?")) {
            const newMap = {};
            setTeethStatus(newMap); 
            onUpdateOdontogramaMap(newMap); 
            setSelectedFDI(null);
        }
    };
    
    const getDisplayStatus = (fdi) => {
        const status = teethStatus[fdi] || 'vazio'; 
        if (typeof status === 'string') return status;
        
        if (status.procedimentos) {
            const total = status.procedimentos.length;
            const concluidos = status.procedimentos.filter(p => p.concluido).length;
            if (total === 0) return 'vazio';
            if (concluidos === total) return 'tratado-completo'; 
            if (concluidos > 0) return 'tratado-parcial'; 
            return 'plano'; 
        }
        return 'vazio';
    };

    const renderQuadrante = (quadrante, reverse = false) => {
        const dentes = FDI[quadrante];
        // 🌟 ALTERADO AQUI: Ajustes para os novos dentes SVG
        const className = reverse ? 'flex flex-row-reverse gap-1 md:gap-2 flex-nowrap' : 'flex gap-1 md:gap-2 flex-nowrap';
        return (
            <div className={className}>
                {dentes.map(fdi => (
                    <Dente key={fdi} fdi={fdi} onClick={handleDenteClick} status={getDisplayStatus(fdi)} />
                ))}
            </div>
        );
    };

    const handleCloseModal = () => {
        setIsProcedimentoModalOpen(false);
        setIsTratamentoModalOpen(false);
        setIsGeneralModalOpen(false);
        setSelectedFDI(null);
        setTratamentoPrefix(null);
    };

    return (
        <>
            <div className="p-2 md:p-6 bg-white shadow-xl rounded-xl w-full mx-auto my-4 relative">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Ficha Odontológica</h2>
                    <div className="flex gap-2 w-full md:w-auto justify-center"> 
                        <button onClick={handleReset} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 text-xs md:text-sm shadow">
                            <FaUndo /> Limpar
                        </button>
                    </div>
                </div>

                {isServicesLoading && <div className="text-center text-sm text-indigo-500 mb-4"><FaSpinner className="animate-spin inline mr-2" /> Carregando...</div>}

                {/* Card de Procedimentos Gerais */}
                <div className="mb-8 flex justify-center px-1">
                    <div 
                        onClick={() => !isReadOnly && setIsGeneralModalOpen(true)}
                        className={`
                            cursor-pointer group relative w-full max-w-lg rounded-xl border-2 border-dashed transition-all duration-300
                            ${geralTotal > 0 
                                ? 'border-indigo-400 bg-white shadow-md hover:shadow-lg hover:border-indigo-500' 
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                            }
                        `}
                    >
                        <div className="p-4 md:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-full shrink-0 ${geralTotal > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
                                        <FaListAlt size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-base md:text-lg group-hover:text-indigo-700 transition-colors">
                                            Procedimentos Gerais
                                        </h4>
                                        <p className="text-xs md:text-sm text-gray-500">
                                            {geralTotal === 0 
                                                ? "Toque para adicionar (Limpeza...)" 
                                                : `${geralConcluidos}/${geralTotal} item(s) concluídos`}
                                        </p>
                                    </div>
                                </div>
                                {geralTotal > 0 && (
                                    <div className="flex flex-col items-end gap-1">
                                        {geralPendentes > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                                                <FaExclamationCircle /> {geralPendentes}
                                            </span>
                                        )}
                                        {geralConcluidos > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                <FaCheckCircle /> {geralConcluidos}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {geralTotal > 0 && (
                                <div className="mt-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${porcentagemConclusao === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${porcentagemConclusao}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full relative">
                    <div className="md:hidden flex items-center justify-center gap-2 text-gray-400 text-xs mb-2 animate-pulse">
                        <FaArrowsAltH /> Arraste para o lado para ver toda a arcada
                    </div>

                    <div className="overflow-x-auto pb-4 w-full scrollbar-hide">
                        {/* 🌟 ALTERADO AQUI: Removido min-w-max */}
                        <div className="flex flex-col items-center w-full px-1 md:px-4">
                            <div className="flex justify-center mb-4 border-b-2 border-gray-300 pb-4 gap-0.5 md:gap-2 w-full">
                                {renderQuadrante('superiorDireito', true)} 
                                <div className="w-1 bg-red-600 mx-2 md:mx-4 rounded-full flex-shrink-0 h-10 self-center"></div> 
                                {renderQuadrante('superiorEsquerdo', false)} 
                            </div>

                            <div className="flex justify-center mt-4 pt-4 border-t-2 border-gray-300 gap-0.5 md:gap-2 w-full">
                                {renderQuadrante('inferiorDireito', true)}
                                <div className="w-1 bg-red-600 mx-2 md:mx-4 rounded-full flex-shrink-0 h-10 self-center"></div> 
                                {renderQuadrante('inferiorEsquerdo', false)} 
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAIS */}
            <ProcedimentoModal
                fdi={selectedFDI}
                isOpen={isProcedimentoModalOpen}
                onClose={handleCloseModal}
                onExecuteSimpleAction={handleExecuteSimpleAction}
                handleAddAcao={handleExecuteSimpleAction} 
                onOpenTratamentoModal={handleOpenTratamentoModal} 
            />
            
            <TratamentoModal
                fdi={selectedFDI}
                isOpen={isTratamentoModalOpen}
                onClose={handleCloseModal}
                onSaveTratamento={handleSaveTratamento} 
                actionPrefix={tratamentoPrefix} 
                teethStatusMap={teethStatus} 
                servicosDisponiveis={servicosPorDente} 
                onAddProcedureToBill={onAddProcedureToBill} 
            />

            <GeneralTreatmentModal 
                isOpen={isGeneralModalOpen}
                onClose={handleCloseModal}
                servicosGerais={servicosGerais}
                onAddProcedureToBill={onAddProcedureToBill}
                teethStatusMap={teethStatus}     
                onSaveTratamento={handleSaveGeneralTreatment} 
            />
        </>
    );
}