import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaCheckCircle, FaSpinner, FaFileInvoiceDollar, FaTooth, FaCreditCard, 
    FaExclamationCircle, FaPlus, FaTrashAlt, FaHistory, FaArrowDown, FaArrowUp 
} from 'react-icons/fa';
import PacienteService from '../../services/PacienteService'; 
import ProcedimentoService from '../../services/ProcedimentoService';
import FinanceiroService from '../../services/FinanceiroService'; // 🌟 1. Import Novo

// --- CONFIGURAÇÕES E UTILITÁRIOS ---
const FORMAS_PAGAMENTO = [
    { value: 'PIX', label: 'PIX' },
    { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
    { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'BOLETO', label: 'Boleto' }
];

const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const parseValorProcedimento = (procString) => {
    if (!procString) return 0;
    const regex = /R\$\s*([\d,.]+)/;
    const match = procString.match(regex);
    if (match) {
        return match[1].includes(',') 
            ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) 
            : parseFloat(match[1]);
    }
    return 0;
};

export default function PacienteFinanceiroTab({ paciente, onUpdate }) {
    const [saldoAtual, setSaldoAtual] = useState(parseFloat(paciente.saldoDevedor) || 0);
    const [procedimentosDetalhados, setProcedimentosDetalhados] = useState([]);
    const [selectedProcedimentos, setSelectedProcedimentos] = useState([]); 
    
    // 🌟 2. Novo Estado para Histórico
    const [historicoPagamentos, setHistoricoPagamentos] = useState([]);

    const [pagamentos, setPagamentos] = useState([{ id: 1, valor: 0, forma: 'PIX', taxa: 0 }]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // 1. Carrega dados e processa histórico
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const saldoTotalDevedor = await PacienteService.verificarDebitos(paciente.id);
                setSaldoAtual(saldoTotalDevedor);

                // 🌟 3. Carrega Histórico de Transações
                const transacoes = await FinanceiroService.listarPorPaciente(paciente.id);
                setHistoricoPagamentos(transacoes || []);

                const historico = await ProcedimentoService.listarHistoricoPorPacienteId(paciente.id);
                
                const listaProcessada = [];
                
                (historico || []).forEach(registro => {
                    if (['NAO_PAGO', 'DEBITO_SESSAO', 'PARCIALMENTE_PAGO', 'PARCIAL', 'PAGO'].includes(registro.statusPagamento)) {
                        
                        // CENÁRIO 1: ESTRUTURA NOVA
                        if (registro.itens && registro.itens.length > 0) {
                            registro.itens.forEach((item) => {
                                listaProcessada.push({
                                    uniqueId: `${registro.id}-item-${item.id}`,
                                    registroId: registro.id,
                                    descricao: item.descricao,
                                    valorTotal: item.valorBase + (item.acrescimo || 0),
                                    acrescimo: item.acrescimo,
                                    desconto: item.desconto,
                                    valorLiquido: item.valorLiquido,
                                    data: registro.dataRegistro,
                                    statusOriginal: registro.statusPagamento
                                });
                            });
                        }
                        // CENÁRIO 2: ESTRUTURA ANTIGA
                        else if (registro.procedimentosRealizados && registro.procedimentosRealizados.length > 0) {
                            let descontoSessaoTotal = 0;
                            let tipoDesconto = 'REAL';
                            try {
                                if (registro.acoesDiarioJson) {
                                    const extra = JSON.parse(registro.acoesDiarioJson);
                                    descontoSessaoTotal = extra.descontoValor || 0;
                                    tipoDesconto = extra.descontoTipo || 'REAL';
                                }
                            } catch (e) {}

                            const totalBrutoSessao = registro.procedimentosRealizados.reduce((acc, str) => acc + parseValorProcedimento(str), 0);
                            
                            registro.procedimentosRealizados.forEach((procStr, idx) => {
                                const valorItem = parseValorProcedimento(procStr);
                                if (valorItem > 0) {
                                    let descontoItem = 0;
                                    if (totalBrutoSessao > 0) {
                                        if (tipoDesconto === 'PORCENTAGEM') {
                                            descontoItem = valorItem * (descontoSessaoTotal / 100);
                                        } else {
                                            descontoItem = (valorItem / totalBrutoSessao) * descontoSessaoTotal;
                                        }
                                    }
                                    const valorLiquidoItem = Math.max(0, valorItem - descontoItem);
                                    listaProcessada.push({
                                        uniqueId: `${registro.id}-str-${idx}`,
                                        registroId: registro.id,
                                        descricao: procStr.split('- R$')[0].trim(),
                                        valorTotal: valorItem, 
                                        acrescimo: 0,
                                        desconto: descontoItem,
                                        valorLiquido: valorLiquidoItem,
                                        data: registro.dataRegistro,
                                        statusOriginal: registro.statusPagamento
                                    });
                                }
                            });
                        }
                    }
                });

                // Distribui o saldo devedor
                const totalLiquidoCalculado = listaProcessada.reduce((acc, p) => acc + p.valorLiquido, 0);
                let valorJaPagoGlobal = Math.max(0, totalLiquidoCalculado - saldoTotalDevedor);

                const listaComValoresCalculados = listaProcessada.map(item => {
                    let valorPagoNesteItem = 0;
                    if (valorJaPagoGlobal > 0) {
                        const aPagar = Math.min(item.valorLiquido, valorJaPagoGlobal);
                        valorPagoNesteItem = aPagar;
                        valorJaPagoGlobal -= aPagar;
                    }
                    
                    const restante = Math.max(0, item.valorLiquido - valorPagoNesteItem);
                    
                    let statusVisual = item.statusOriginal;
                    if (restante <= 0.01) statusVisual = 'PAGO';
                    else if (valorPagoNesteItem > 0) statusVisual = 'PARCIALMENTE_PAGO';
                    else statusVisual = 'NAO_PAGO';

                    return { 
                        ...item, 
                        valorPago: valorPagoNesteItem, 
                        valorRestante: restante, 
                        statusVisual: statusVisual 
                    };
                });

                setProcedimentosDetalhados(listaComValoresCalculados.filter(i => i.valorRestante > 0.01));

            } catch (e) { console.error("Erro ao carregar financeiro:", e); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [paciente.id]);

    useEffect(() => {
        const totalSelecionado = selectedProcedimentos.reduce((acc, item) => acc + item.valorRestante, 0);
        if (totalSelecionado > 0) {
            setPagamentos([{ id: 1, valor: totalSelecionado, forma: 'PIX', taxa: 0 }]);
        }
    }, [selectedProcedimentos]);

    const handleSelectProcedimento = (proc) => {
        const isSelected = selectedProcedimentos.some(p => p.uniqueId === proc.uniqueId);
        if (isSelected) {
            setSelectedProcedimentos(prev => prev.filter(p => p.uniqueId !== proc.uniqueId));
        } else {
            setSelectedProcedimentos(prev => [...prev, proc]);
        }
    };

    const updatePagamento = (id, field, value) => {
        setPagamentos(prev => prev.map(p => {
            if (p.id === id) {
                const updated = { ...p, [field]: value };
                if (field === 'forma') {
                    if (value === 'CARTAO_CREDITO') updated.taxa = 5.00;
                    else if (value === 'CARTAO_DEBITO') updated.taxa = 2.00;
                    else updated.taxa = 0;
                }
                return updated;
            }
            return p;
        }));
    };

    const handleMoedaChange = (id, rawValue) => {
        const onlyDigits = rawValue.replace(/\D/g, "");
        const numero = parseFloat(onlyDigits) / 100;
        updatePagamento(id, 'valor', isNaN(numero) ? 0 : numero);
    };

    const { valorDevidoFinal, valorRecebido, troco, valorAjusteBackend, podeFinalizar } = useMemo(() => {
        const totalSelecionado = selectedProcedimentos.length > 0 
            ? selectedProcedimentos.reduce((acc, p) => acc + p.valorRestante, 0)
            : saldoAtual;

        const recebido = pagamentos.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
        const devido = totalSelecionado; 
        const ajuste = Math.min(recebido, devido); 
        const trocoCalc = Math.max(0, recebido - devido);
        
        return {
            valorDevidoFinal: devido,
            valorRecebido: recebido,
            troco: trocoCalc,
            valorAjusteBackend: -ajuste, 
            podeFinalizar: recebido > 0
        };
    }, [saldoAtual, pagamentos, selectedProcedimentos]);

    const handleProcessarPagamento = async () => {
        if (!podeFinalizar) return;
        setProcessing(true);
        try {
            // 🌟 1. CRIAR A DESCRIÇÃO COM OS NOMES DOS PROCEDIMENTOS SELECIONADOS
            let descricaoPagamento = "Pagamento Avulso"; // Padrão se não selecionar nada
            
            if (selectedProcedimentos.length > 0) {
                // Junta os nomes: "Restauração, Limpeza, Extração"
                const nomes = selectedProcedimentos.map(p => p.descricao).join(', ');
                // Corta se for muito longo para não dar erro no banco
                descricaoPagamento = nomes.length > 200 ? nomes.substring(0, 197) + '...' : nomes;
            }

            let montanteParaAbater = Math.abs(valorAjusteBackend);
            let montanteDisponivelParaStatus = montanteParaAbater;
            
            let tempFaltante = montanteParaAbater;
            for (const pg of pagamentos) {
                const valorPg = parseFloat(pg.valor) || 0;
                if (valorPg > 0 && tempFaltante > 0) {
                    const valorIndividual = Math.min(valorPg, tempFaltante);
                    
                    // 🌟 2. ENVIAR A DESCRIÇÃO AQUI NO FINAL (5º Parâmetro)
                    await PacienteService.ajustarSaldoDevedor(
                        paciente.id, 
                        -valorIndividual, 
                        pg.forma, 
                        pg.taxa,
                        descricaoPagamento // <--- AQUI ESTAVA FALTANDO!
                    );
                    tempFaltante -= valorIndividual;
                }
            }

            // ... (O resto do código abaixo continua IGUAL) ...
            const registrosAfetados = [...new Set(selectedProcedimentos.map(p => p.registroId))];

            for (const regId of registrosAfetados) {
                const todosItensDoRegistro = procedimentosDetalhados.filter(p => p.registroId === regId);
                const dividaTotalDoRegistro = todosItensDoRegistro.reduce((sum, item) => sum + item.valorRestante, 0);
                const valorPagoNesteRegistroAgora = Math.min(dividaTotalDoRegistro, montanteDisponivelParaStatus);
                const valorJaPagoAnteriormente = todosItensDoRegistro.reduce((sum, item) => sum + (item.valorPago || 0), 0);
                const valorTotalPagoAcumulado = valorJaPagoAnteriormente + valorPagoNesteRegistroAgora;

                let novoStatus = 'NAO_PAGO';
                if (valorPagoNesteRegistroAgora >= dividaTotalDoRegistro - 0.05) {
                    novoStatus = 'PAGO';
                } 
                else if (valorTotalPagoAcumulado > 0) {
                    novoStatus = 'PARCIALMENTE_PAGO';
                } 
                else {
                    novoStatus = todosItensDoRegistro[0].statusOriginal;
                }

                if (valorPagoNesteRegistroAgora > 0) {
                    const taxaAplicada = pagamentos[0]?.taxa || 0;
                    const valorLiquidoParaSalvar = valorTotalPagoAcumulado * (1 - (taxaAplicada / 100));

                    await ProcedimentoService.atualizarStatusPagamento(
                        regId, 
                        novoStatus, 
                        valorTotalPagoAcumulado,
                        valorLiquidoParaSalvar
                    );
                    
                    montanteDisponivelParaStatus -= valorPagoNesteRegistroAgora;
                }
            }
            
            // Atualiza a lista
            const transacoesAtualizadas = await FinanceiroService.listarPorPaciente(paciente.id);
            setHistoricoPagamentos(transacoesAtualizadas);

            alert("Pagamento registrado com sucesso!");
            setPagamentos([{ id: Date.now(), valor: 0, forma: 'PIX', taxa: 0 }]);
            setSelectedProcedimentos([]);
            onUpdate(); 
        } catch (e) { 
            alert("Erro ao processar: " + e.message); 
        } finally { 
            setProcessing(false); 
        }
    };

    if (loading) return <div className="p-10 text-center"><FaSpinner className="animate-spin text-3xl text-indigo-600 mx-auto"/></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* LISTA DETALHADA (Esquerda) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-indigo-50 px-3 sm:px-4 py-3 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-center">
                        <h3 className="font-bold text-indigo-800 flex items-center gap-2 text-sm sm:text-base">
                            <FaTooth/> Contas a Receber
                        </h3>
                        <span className="text-[10px] sm:text-xs font-semibold text-indigo-600 bg-white px-2 py-1 rounded border border-indigo-200">
                            Selecione os itens para pagar
                        </span>
                    </div>
                    
                    {procedimentosDetalhados.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-gray-50">
                            <FaCheckCircle className="mx-auto text-green-400 text-3xl mb-2"/>
                            <p className="text-sm">Nenhum débito em aberto encontrado.</p>
                        </div>
                    ) : (
                        <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto overflow-x-auto">
                            <table className="min-w-[800px] sm:min-w-full text-sm text-left">
                                <thead className="bg-white text-gray-500 uppercase text-xs sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th className="px-2 py-3 w-8"></th>
                                        <th className="px-2 py-3">Procedimento</th>
                                        <th className="px-2 py-3 text-right">Valor</th>
                                        <th className="px-2 py-3 text-right text-gray-400">Acrés.</th>
                                        <th className="px-2 py-3 text-right text-orange-500">Desc.</th>
                                        <th className="px-2 py-3 text-right font-bold">Líquido</th>
                                        <th className="px-2 py-3 text-right text-red-600">Restante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {procedimentosDetalhados.map((proc) => {
                                        const isSelected = selectedProcedimentos.some(p => p.uniqueId === proc.uniqueId);
                                        return (
                                            <tr 
                                                key={proc.uniqueId} 
                                                className={`cursor-pointer transition duration-150 ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                                onClick={() => handleSelectProcedimento(proc)}
                                            >
                                                <td className="px-2 py-3">
                                                    <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-4 h-4 text-indigo-600 rounded border-gray-300"/>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <p className="font-medium text-gray-800 text-xs sm:text-sm max-w-[150px] truncate">{proc.descricao}</p>
                                                    <p className="text-[10px] text-gray-500">{new Date(proc.data).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-2 py-3 text-right text-gray-600 text-xs">
                                                    {formatMoney(proc.valorTotal)}
                                                </td>
                                                <td className="px-2 py-3 text-right text-gray-400 text-xs">
                                                    {proc.acrescimo > 0 ? `+ ${formatMoney(proc.acrescimo)}` : '-'}
                                                </td>
                                                <td className="px-2 py-3 text-right text-orange-500 text-xs">
                                                    {proc.desconto > 0 ? `- ${formatMoney(proc.desconto)}` : '-'}
                                                </td>
                                                <td className="px-2 py-3 text-right font-bold text-gray-800 text-xs sm:text-sm">
                                                    {formatMoney(proc.valorLiquido)}
                                                </td>
                                                <td className="px-2 py-3 text-right font-bold text-red-600 text-xs sm:text-sm">
                                                    {formatMoney(proc.valorRestante)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* PAINEL DE PAGAMENTO (Direita) */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                    <h4 className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">SALDO DEVEDOR TOTAL</h4>
                    <div className="flex justify-between items-end">
                        <span className={`text-3xl sm:text-4xl font-extrabold ${saldoAtual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatMoney(Math.abs(saldoAtual))}
                            {saldoAtual > 0 && <span className="text-sm sm:text-lg text-red-400 ml-1">(Devendo)</span>}
                        </span>
                        {saldoAtual <= 0 && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] sm:text-xs font-bold">Sem Débitos</span>}
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-indigo-100 ring-1 ring-indigo-50">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FaFileInvoiceDollar className="text-indigo-600"/> Registrar Pagamento
                    </h3>
                    
                    {selectedProcedimentos.length > 0 && (
                        <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded text-xs sm:text-sm text-indigo-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
                            <span>Itens selecionados: <strong>{selectedProcedimentos.length}</strong></span>
                            <span>Total: <strong>{formatMoney(selectedProcedimentos.reduce((a,b)=>a+b.valorRestante,0))}</strong></span>
                        </div>
                    )}

                    <div className="space-y-4 mb-6">
                        {pagamentos.map((p) => (
                            <div key={p.id} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="w-full sm:flex-1">
                                        <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 block">Valor</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-gray-400 font-bold text-sm">R$</span>
                                            
                                            <input 
                                                type="text" 
                                                inputMode="numeric"
                                                value={p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                onChange={(e) => handleMoedaChange(p.id, e.target.value)} 
                                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 ring-indigo-500 outline-none font-bold text-gray-700 text-sm"
                                            />

                                        </div>
                                    </div>
                                    <div className="w-full sm:w-1/2">
                                        <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 block">Forma</label>
                                        <select 
                                            value={p.forma} 
                                            onChange={(e) => updatePagamento(p.id, 'forma', e.target.value)} 
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 ring-indigo-500 outline-none"
                                        >
                                            {FORMAS_PAGAMENTO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                        </select>
                                    </div>
                                    {pagamentos.length > 1 && (
                                        <button onClick={() => setPagamentos(prev => prev.filter(item => item.id !== p.id))} className="p-3 text-red-500 hover:bg-red-50 rounded-lg self-end sm:self-auto"><FaTrashAlt/></button>
                                    )}
                                </div>

                                {(p.forma.includes('CARTAO')) && (
                                    <div className="flex items-center justify-between mt-1 text-xs sm:text-sm text-gray-600 px-1">
                                        <div className="flex items-center gap-2">
                                            <FaCreditCard className="text-gray-400"/>
                                            <span>Taxa Máquina (%):</span>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                min="0" 
                                                max="100"
                                                value={p.taxa}
                                                onChange={(e) => updatePagamento(p.id, 'taxa', parseFloat(e.target.value) || 0)}
                                                className="w-16 p-1 border border-gray-300 rounded text-center font-bold text-xs"
                                            />
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-gray-400 text-right">
                                            Líquido: <b>{formatMoney(p.valor * (1 - p.taxa/100))}</b>
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        <button onClick={() => setPagamentos([...pagamentos, { id: Date.now(), valor: 0, forma: 'PIX', taxa: 0 }])} className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                            <FaPlus size={12}/> Adicionar forma de pagamento
                        </button>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mb-6 space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                            <span>Total a Pagar:</span>
                            <span className="font-bold text-gray-800">{formatMoney(valorDevidoFinal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-indigo-700">
                            <span>Valor Recebido:</span>
                            <span className="font-bold text-base sm:text-lg">{formatMoney(valorRecebido)}</span>
                        </div>
                        {troco > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-bold bg-green-50 p-2 rounded mt-2">
                                <span>Troco:</span>
                                <span>{formatMoney(troco)}</span>
                            </div>
                        )}
                    </div>

                    <button onClick={handleProcessarPagamento} disabled={processing || !podeFinalizar} className="w-full py-3 sm:py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base">
                        {processing ? <FaSpinner className="animate-spin text-xl"/> : <><FaCheckCircle className="text-lg sm:text-xl"/> Confirmar Pagamento</>}
                    </button>
                </div>
            </div>

            {/* 🌟 5. NOVA SEÇÃO: HISTÓRICO DE TRANSAÇÕES FINANCEIRAS */}
            <div className="lg:col-span-12 mt-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                        <FaHistory className="text-gray-500" />
                        <h3 className="font-bold text-gray-700 text-sm sm:text-base">Histórico de Pagamentos Realizados</h3>
                    </div>

                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-white text-gray-500 text-xs uppercase font-bold border-b sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Descrição</th>
                                    <th className="px-4 py-3">Forma</th>
                                    <th className="px-4 py-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {historicoPagamentos.length === 0 ? (
                                    <tr><td colSpan="4" className="p-6 text-center text-gray-400">Nenhum pagamento registrado.</td></tr>
                                ) : (
                                    historicoPagamentos.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                {new Date(t.data).toLocaleDateString()} <small className="text-gray-400">{new Date(t.data).toLocaleTimeString().slice(0,5)}</small>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{t.descricao || "Pagamento"}</td>
                                            <td className="px-4 py-3 text-gray-600 text-xs uppercase font-bold">{t.forma}</td>
                                            <td className="px-4 py-3 text-right font-bold flex justify-end items-center gap-1">
                                                {/* Se for SAIDA (devolução) fica vermelho, ENTRADA (pagamento) verde */}
                                                {t.tipo === 'SAIDA' ? (
                                                    <span className="text-red-600 flex items-center gap-1"><FaArrowUp size={10}/> - {formatMoney(t.valor)}</span>
                                                ) : (
                                                    <span className="text-green-600 flex items-center gap-1"><FaArrowDown size={10}/> + {formatMoney(t.valor)}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}