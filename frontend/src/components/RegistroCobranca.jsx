import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaDollarSign, FaTrashAlt, FaCreditCard, FaSave, FaCalendarCheck,
    FaFileInvoiceDollar, FaCheckCircle, FaRedoAlt, FaHandHoldingUsd, 
    FaCheckSquare, FaSquare
} from 'react-icons/fa';

export default function RegistroCobranca({
    procedimentosRealizados, 
    setProcedimentosRealizados, 
    subtotal, isSaving, handleSalvar,
    handleAcrescimoChange, handleRemoveProcedureFromBill, handleEncerrar,
    numeroParcelas, setNumeroParcelas, handleMarcarRetorno, isReadOnly,
    descontoValor, setDescontoValor, descontoTipo,
    setDescontoTipo, totalComDesconto, userRole, agendamento 
}) {
    // --- ESTADOS ---
    const [showRecorrencia, setShowRecorrencia] = useState(false);
    const [diasRecorrencia, setDiasRecorrencia] = useState(agendamento?.paciente?.diasRecorrencia || 30);
    const [manterCiclo, setManterCiclo] = useState(false);

    // Sincroniza dados de manutenção ativa
    useEffect(() => {
        if (agendamento?.paciente) {
            const ehRecorrente = agendamento.paciente.recorrente;
            const ehStatusRetorno = agendamento.status === 'CONCLUIDO_RETORNO' || agendamento.status === 'AGUARDANDO_RETORNO';

            if (ehRecorrente || ehStatusRetorno) {
                setManterCiclo(true);
                if (agendamento.paciente.diasRecorrencia > 0) {
                    setDiasRecorrencia(agendamento.paciente.diasRecorrencia);
                }
            } else {
                setManterCiclo(false);
            }
        }
    }, [agendamento]);

    // 🌟 CORREÇÃO DO ERRO: Proteção contra falha no Setter
    const toggleFaturado = (id) => {
        if (isReadOnly) return;
        
        // Se a função não existir, para a execução sem quebrar a tela
        if (typeof setProcedimentosRealizados !== 'function') {
            console.error("Erro: setProcedimentosRealizados não é uma função.");
            return;
        }

        setProcedimentosRealizados(prev => prev.map(proc => {
            if (proc.id === id) {
                // Se undefined, considera true (faturado) e inverte para false (orçamento)
                const statusAtual = proc.faturado === undefined ? true : proc.faturado;
                return { ...proc, faturado: !statusAtual };
            }
            return proc;
        }));
    };

    // 🌟 CÁLCULO DA COMISSÃO (Apenas itens faturados)
    const comissaoTotal = useMemo(() => {
        const comissaoBruta = procedimentosRealizados.reduce((acc, proc) => {
            // Se faturado for false explicitamente, ignora. Se undefined, considera faturado.
            if (proc.faturado === false) return acc;
            
            const pct = proc.comissaoPercentual || 0;
            const valor = proc.valorCobrado || 0;
            return acc + (valor * (pct / 100));
        }, 0);
        
        const fator = subtotal > 0 ? (totalComDesconto / subtotal) : 0;
        return comissaoBruta * fator;
    }, [procedimentosRealizados, subtotal, totalComDesconto]);

    const parcelasValidas = (numeroParcelas && numeroParcelas > 0) ? numeroParcelas : 1;
    const valorParcela = totalComDesconto / parcelasValidas;

    // LÓGICA DE DESCONTO
    const handleDescontoChange = (e) => {
        let valorInput = parseFloat(e.target.value);
        if (isNaN(valorInput)) valorInput = 0;

        if (userRole !== 'ADMINISTRADOR') {
            const MAX_PERCENT = 5;
            if (descontoTipo === 'PORCENTAGEM') {
                if (valorInput > MAX_PERCENT) valorInput = MAX_PERCENT;
            } else {
                const maxReais = subtotal * (MAX_PERCENT / 100);
                if (valorInput > maxReais) valorInput = parseFloat(maxReais.toFixed(2));
            }
        }
        setDescontoValor(valorInput);
    };

    const confirmarRetornoRecorrente = () => {
        if (window.confirm(`Confirmar retorno recorrente para daqui a ${diasRecorrencia} dias?`)) {
            handleMarcarRetorno(diasRecorrencia);
            setShowRecorrencia(false);
            setManterCiclo(true); 
        }
    };

    // Ação final unificada
    const handleFinalizar = () => {
        handleEncerrar(manterCiclo, totalComDesconto);
    };

    const qtdFaturados = procedimentosRealizados.filter(p => p.faturado !== false).length;
    const qtdOrcamento = procedimentosRealizados.length - qtdFaturados;

    return (
        <div className="lg:col-span-1 space-y-6 relative">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                    <FaDollarSign /> Registro de Cobrança
                </h3>
                
                {/* LISTA PRINCIPAL */}
                <div className="space-y-3 divide-y divide-gray-200">
                    <div className="text-[10px] text-gray-500 grid grid-cols-7 font-bold uppercase">
                        <div className="col-span-4 pl-8">Procedimento</div>
                        <div className="col-span-2 text-center">Acréscimo</div>
                        <div className="col-span-1 text-right">Valor</div>
                    </div>

                    {procedimentosRealizados.length === 0 ? (
                        <p className="text-center text-gray-400 py-4 text-sm">Adicione procedimentos à esquerda.</p>
                    ) : (
                        procedimentosRealizados.map((proc) => {
                            // Se undefined, é faturado por padrão
                            const isFaturado = proc.faturado !== false; 

                            return (
                                <div key={proc.id} className={`grid grid-cols-7 items-center pt-3 gap-2 transition-all ${!isFaturado ? 'bg-yellow-50/50' : ''}`}>
                                    <div className="col-span-4 text-sm pr-1 flex items-start relative">
                                        
                                        {/* CHECKBOX DE STATUS */}
                                        <div className="absolute left-0 top-0.5">
                                            <button 
                                                type="button"
                                                onClick={() => toggleFaturado(proc.id)}
                                                disabled={isReadOnly}
                                                className={`text-lg transition-transform active:scale-90 ${isFaturado ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-400'}`}
                                                title={isFaturado ? "Item será Cobrado" : "Item ficará em Orçamento"}
                                            >
                                                {isFaturado ? <FaCheckSquare /> : <FaSquare />}
                                            </button>
                                        </div>
                                        
                                        <div className="pl-8 w-full overflow-hidden">
                                            <p className={`font-medium truncate ${isFaturado ? 'text-gray-800' : 'text-gray-400 line-through decoration-gray-300'}`} title={proc.descricao}>
                                                {proc.descricao}
                                            </p>
                                            
                                            {!isFaturado && (
                                                <span className="inline-block mt-1 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold border border-yellow-200 uppercase tracking-wide">
                                                    Orçamento Futuro
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="col-span-2">
                                        <input 
                                            type="number" step="0.01" min="0" 
                                            value={proc.acrescimo || 0} 
                                            onChange={(e) => handleAcrescimoChange(e, proc.id)} 
                                            className="w-full p-1 border border-gray-300 rounded-lg text-xs text-right disabled:bg-gray-100" 
                                            disabled={isReadOnly || !isFaturado} 
                                        />
                                    </div>
                                    
                                    <div className="col-span-1 flex flex-col items-end">
                                        <span className={`text-sm font-bold ${isFaturado ? 'text-green-600' : 'text-gray-300'}`}>
                                            R$ {proc.valorCobrado?.toFixed(2)}
                                        </span>
                                        {!isReadOnly && (
                                            <button type="button" onClick={() => handleRemoveProcedureFromBill(proc.id)} className="text-red-400 hover:text-red-600 p-1 mt-1">
                                                <FaTrashAlt size={10} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    
                    {/* TOTAIS */}
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t">
                        <div className="flex flex-col">
                            <span>Subtotal (Selecionados):</span>
                            {qtdOrcamento > 0 && <span className="text-[10px] text-yellow-600">({qtdOrcamento} itens em orçamento)</span>}
                        </div>
                        <span className="font-bold text-gray-700">R$ {subtotal.toFixed(2)}</span>
                    </div>

                    {/* DESCONTO */}
                    <div className="flex items-center justify-between bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-700 mr-1">Desconto:</span>
                            <div className="flex bg-white rounded border border-red-200 overflow-hidden">
                                <button type="button" onClick={() => setDescontoTipo('REAL')} className={`px-2 py-1 text-xs font-bold transition-colors ${descontoTipo === 'REAL' ? 'bg-red-500 text-white' : 'text-gray-500'}`}>R$</button>
                                <button type="button" onClick={() => setDescontoTipo('PORCENTAGEM')} className={`px-2 py-1 text-xs font-bold transition-colors ${descontoTipo === 'PORCENTAGEM' ? 'bg-red-500 text-white' : 'text-gray-500'}`}>%</button>
                            </div>
                        </div>
                        <input type="number" value={descontoValor} onChange={handleDescontoChange} className="w-24 p-1 border border-red-300 rounded text-right font-bold text-red-600 outline-none" disabled={isReadOnly} />
                    </div>

                    <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-2">
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-indigo-800">TOTAL A DEBITAR:</span>
                            {subtotal === 0 && qtdOrcamento > 0 && (
                                <span className="text-[10px] text-indigo-600">Apenas registro de orçamento</span>
                            )}
                        </div>
                        <span className="text-2xl font-bold text-indigo-700">R$ {totalComDesconto.toFixed(2)}</span>
                    </div>

                    {comissaoTotal > 0 && (
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-dashed border-gray-300 mt-2">
                            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><FaHandHoldingUsd /> Comissão Líquida:</span>
                            <span className="text-sm font-bold text-gray-700">R$ {comissaoTotal.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                    <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><FaCreditCard /> Condições para Contrato</h4>
                    <div className="flex items-center justify-between gap-4">
                        <label className="text-sm text-gray-700 font-medium">Parcelas:</label>
                        <div className="flex items-center gap-2">
                            <input type="number" min="1" max="24" value={numeroParcelas} onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)} className="w-16 p-2 border border-blue-300 rounded text-center text-sm font-bold" disabled={isReadOnly}/>
                            {!isReadOnly && (
                                <button type="button" onClick={handleSalvar} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" disabled={isSaving} title="Salvar Rascunho">
                                    {isSaving ? <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span> : <FaSave size={14} />}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 text-sm text-right text-blue-900 border-t border-blue-200 pt-2">
                        {parcelasValidas}x de <b>R$ {valorParcela.toFixed(2)}</b>
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg space-y-3">
                <h3 className="text-xl font-semibold text-indigo-700 border-b pb-2">Próximas Ações</h3>
                
                {!isReadOnly && (
                    <>
                        <button type="button" onClick={handleFinalizar} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-sm" disabled={isSaving}>
                            <FaFileInvoiceDollar /> 
                            {qtdFaturados > 0 ? "Lançar Débito & Finalizar" : "Salvar Apenas Orçamento"}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => handleMarcarRetorno(null)} className="flex items-center justify-center gap-2 px-3 py-3 bg-orange-500 text-white font-semibold rounded-lg text-sm" disabled={isSaving}>
                                <FaCalendarCheck /> Retorno Único
                            </button>
                            <button type="button" onClick={() => setShowRecorrencia(!showRecorrencia)} className={`flex items-center justify-center gap-2 px-3 py-3 font-semibold rounded-lg text-sm ${showRecorrencia ? 'bg-teal-700 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'}`} disabled={isSaving}>
                                <FaRedoAlt /> Recorrente...
                            </button>
                        </div>
                    </>
                )}

                {showRecorrencia && !isReadOnly && (
                    <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 animate-fade-in space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {[7, 15, 30, 45, 60, 90].map(dias => (
                                <button key={dias} type="button" onClick={() => setDiasRecorrencia(dias)} className={`py-1 px-2 rounded text-xs font-bold border ${diasRecorrencia === dias ? 'bg-teal-600 text-white' : 'bg-white text-teal-700 hover:bg-teal-100'}`}>
                                    {dias} dias
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={confirmarRetornoRecorrente} className="w-full py-2 bg-teal-600 text-white font-bold rounded text-sm flex items-center justify-center gap-2">
                            <FaSave /> Salvar Recorrência ({diasRecorrencia} dias)
                        </button>
                    </div>
                )}

                {(agendamento?.paciente?.recorrente || agendamento?.status?.includes('RETORNO')) && !isReadOnly && (
                    <div className="flex items-center gap-2 p-4 bg-teal-50 border-2 border-teal-200 rounded-xl mb-4 shadow-sm">
                        <input type="checkbox" id="manterCicloCheck" checked={manterCiclo} onChange={(e) => setManterCiclo(e.target.checked)} className="w-5 h-5 text-teal-600 rounded cursor-pointer" />
                        <label htmlFor="manterCicloCheck" className="text-xs font-bold text-teal-700 cursor-pointer select-none uppercase">
                            Renovar ciclo e dados automaticamente
                        </label>
                    </div>
                )}

                <button type="button" onClick={handleFinalizar} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition" disabled={isSaving}>
                    <FaCheckCircle /> {isSaving ? 'Finalizando...' : 'Encerrar Atendimento'}
                </button>
            </div>
        </div>
    );
}