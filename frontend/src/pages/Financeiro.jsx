import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/SideBar';
import CardInfo from '../components/CardInfo';
import FinanceiroService from '../services/FinanceiroService';
import ProcedimentoService from '../services/ProcedimentoService';
import ServicoService from '../services/ServicoService'; 
import { 
    FaArrowDown, FaArrowUp, FaCheckCircle, FaHandHoldingUsd, FaSearch, 
    FaPercentage, FaWallet, FaChartPie, FaExclamationCircle, FaFileInvoiceDollar, 
    FaChartLine, FaCreditCard 
} from 'react-icons/fa';

import ModalPagamento from '../components/Financeiro/ModalPagamento';
import TabelaTransacoes from '../components/Financeiro/TabelaTransacoes';
import PainelProducao from '../components/Financeiro/PainelProducao';
import { formatMoney, extrairValor, extrairNome, normalizarTexto } from '../utils/financeiroUtils';

export default function FinanceiroPage() {
    const [activeTab, setActiveTab] = useState('geral');
    const hoje = new Date();
    const [dataInicio, setDataInicio] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [transacoes, setTransacoes] = useState([]); 
    const [producaoRaw, setProducaoRaw] = useState([]);
    const [listaServicosRef, setListaServicosRef] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [payData, setPayData] = useState({ nome: '', valor: 0 });
    
    // 🌟 ESTADO DO MODAL DE ESTORNO ATUALIZADO (Inclui valorTotal e valorEstorno)
    const [estornoModal, setEstornoModal] = useState({ isOpen: false, id: null, senha: '', valorTotal: 0, valorEstorno: '', loading: false });

    useEffect(() => {
        const fetchServicos = async () => {
            try {
                const dados = await ServicoService.listarTodos();
                const servicosUteis = dados.filter(s => s.comissaoPercentual > 0).map(s => ({
                    nomeNorm: normalizarTexto(s.nome),
                    percentual: s.comissaoPercentual
                }));
                servicosUteis.sort((a, b) => b.nomeNorm.length - a.nomeNorm.length);
                setListaServicosRef(servicosUteis);
            } catch (error) { console.error("Erro ao carregar serviços:", error); }
        };
        fetchServicos();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [dataTransacoes, dataProd] = await Promise.all([
                FinanceiroService.listarTransacoes(),
                ProcedimentoService.listarRelatorio(dataInicio, dataFim)
            ]);
            setTransacoes(Array.isArray(dataTransacoes) ? dataTransacoes : []);
            setProducaoRaw(dataProd || []);
        } catch (error) { console.error("Erro ao buscar dados", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, [dataInicio, dataFim]);

    // 🌟 CÁLCULOS GERAIS E DE PRODUÇÃO
    const producaoCalculada = useMemo(() => {
        let totalGerado = 0; 
        let totalLiquido = 0; 
        let totalPendente = 0; 
        let totalOrcamento = 0; 
        let totalTaxas = 0; 
        
        const filtrados = producaoRaw.filter(reg => !searchTerm || reg.agendamento?.profissional?.nome?.toLowerCase().includes(searchTerm.toLowerCase()));

        const lista = filtrados.map(reg => {
            let valorCobradoTotal = 0;
            let comissaoNominal = 0;
            let nomesProcedimentos = [];

            if (reg.itens && reg.itens.length > 0) {
                reg.itens.forEach(item => {
                    const cobradoItem = (item.valorBase || 0) + (item.acrescimo || 0) - (item.desconto || 0);
                    valorCobradoTotal += cobradoItem;
                    nomesProcedimentos.push(item.descricao.split(' (')[0]);

                    const nomeItemNorm = normalizarTexto(item.descricao.split(' (')[0]);
                    const servicoEncontrado = listaServicosRef.find(svc => nomeItemNorm.includes(svc.nomeNorm));
                    if (servicoEncontrado) comissaoNominal += (cobradoItem * (servicoEncontrado.percentual / 100));
                });
            } else if (reg.procedimentosRealizados && reg.procedimentosRealizados.length > 0) {
                reg.procedimentosRealizados.forEach(procStr => {
                    const valorItem = extrairValor(procStr);
                    const nomeItem = extrairNome(procStr);
                    nomesProcedimentos.push(nomeItem);
                    valorCobradoTotal += valorItem;

                    const nomeItemNorm = normalizarTexto(nomeItem);
                    const servicoEncontrado = listaServicosRef.find(svc => nomeItemNorm.includes(svc.nomeNorm));
                    if (servicoEncontrado) comissaoNominal += (valorItem * (servicoEncontrado.percentual / 100));
                });
            }

            const dbValorLiquido = (reg.valorLiquido !== undefined && reg.valorLiquido !== null) ? reg.valorLiquido : (reg.valorPago || 0);
            let liquidoItem = 0;
            let pendenteItem = 0;

            if (reg.statusPagamento === 'PAGO') {
                liquidoItem = dbValorLiquido > 0 ? dbValorLiquido : valorCobradoTotal;
                pendenteItem = 0;
            } else if (reg.statusPagamento === 'PARCIALMENTE_PAGO') {
                liquidoItem = dbValorLiquido;
                pendenteItem = Math.max(0, valorCobradoTotal - (reg.valorPago || 0));
            } else if (reg.statusPagamento === 'ORCAMENTO') {
                liquidoItem = 0; 
                pendenteItem = 0;
            } else {
                liquidoItem = 0;
                pendenteItem = valorCobradoTotal;
            }

            let valorTaxa = 0;
            if (reg.statusPagamento === 'PAGO' || reg.statusPagamento === 'PARCIALMENTE_PAGO') {
                const valorPagoBruto = reg.valorPago || valorCobradoTotal;
                if (liquidoItem < valorPagoBruto) {
                    valorTaxa = valorPagoBruto - liquidoItem;
                }
            }

            let comissaoReal = 0;
            if (valorCobradoTotal > 0 && reg.statusPagamento !== 'ORCAMENTO') {
                comissaoReal = comissaoNominal * (liquidoItem / valorCobradoTotal);
            }

            if (reg.statusPagamento === 'ORCAMENTO') {
                if (!reg.orcamentoAgendado) {
                    totalOrcamento += valorCobradoTotal;
                }
            } else {
                totalGerado += valorCobradoTotal;
                totalLiquido += liquidoItem;
                totalPendente += pendenteItem;
                totalTaxas += valorTaxa; 
            }

            return { 
                ...reg, 
                valorTotal: valorCobradoTotal, 
                valorLiquido: liquidoItem,     
                valorFalta: pendenteItem,
                valorTaxa: valorTaxa,
                valorComissao: comissaoReal,
                listaProcedimentos: nomesProcedimentos.join(', '),
                profissionalNome: reg.agendamento?.profissional?.nome || 'N/A',
                pacienteNome: reg.agendamento?.paciente?.nome || 'Desconhecido', 
                data: reg.dataRegistro
            };
        }).filter(item => {
            return activeTab === 'producao' ? item.statusPagamento !== 'ORCAMENTO' : true;
        }).reverse();

        return { lista, totalGerado, totalLiquido, totalPendente, totalOrcamento, totalTaxas };
    }, [producaoRaw, searchTerm, listaServicosRef, activeTab]);

    const fluxoCalculado = useMemo(() => {
        const lista = transacoes.filter(t => {
            const dt = t.data ? t.data.split('T')[0] : '';
            const matchDate = (!dataInicio || dt >= dataInicio) && (!dataFim || dt <= dataFim);
            const desc = t.descricao || ''; 
            return matchDate && (!searchTerm || desc.toLowerCase().includes(searchTerm.toLowerCase()));
        });
        
        const entBruta = lista.filter(t => t.tipo === 'ENTRADA' || (t.pacienteNome && !t.descricao?.includes('Repasse'))).reduce((acc, t) => acc + (t.valor || 0), 0);
        const entLiquida = lista.filter(t => t.tipo === 'ENTRADA' || (t.pacienteNome && !t.descricao?.includes('Repasse'))).reduce((acc, t) => acc + ((t.valorLiquido !== undefined ? t.valorLiquido : t.valor) || 0), 0);
        const sai = lista.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + (t.valor || 0), 0);
        
        return { lista, entBruta, entLiquida, sai, saldo: entLiquida - sai };
    }, [transacoes, dataInicio, dataFim, searchTerm]);

    const handleConfirmPayment = async (transacao) => {
        try {
            await FinanceiroService.salvarTransacao(transacao);
            setModalOpen(false);
            await fetchData(); 
            alert("Repasse registrado com sucesso!");
        } catch (e) { alert("Erro ao registrar repasse."); }
    };

    // 🌟 FUNÇÃO PARA CONFIRMAR O ESTORNO COM VALOR PARCIAL/TOTAL
    const handleEstornoConfirm = async () => {
        const valorNum = parseFloat(estornoModal.valorEstorno);
        
        // Validações do valor digitado
        if (isNaN(valorNum) || valorNum <= 0) return alert("Digite um valor válido para o estorno.");
        if (valorNum > estornoModal.valorTotal) return alert("O estorno não pode ser maior que o valor da transação.");

        setEstornoModal(prev => ({ ...prev, loading: true }));
        try {
            await FinanceiroService.estornarTransacao(estornoModal.id, estornoModal.senha, valorNum);
            alert("Transação estornada com sucesso!");
            setEstornoModal({ isOpen: false, id: null, senha: '', valorTotal: 0, valorEstorno: '', loading: false });
            fetchData(); 
        } catch (error) {
            alert(error.message || "Senha incorreta ou erro ao estornar.");
            setEstornoModal(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />
            
            <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-y-auto w-full">
                
                <div className="mb-6"><h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">Gestão Financeira</h2></div>
                <div className="bg-white p-4 rounded-xl shadow mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border rounded p-2 text-sm w-full sm:w-auto"/>
                            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border rounded p-2 text-sm w-full sm:w-auto"/>
                        </div>
                        <div className="relative w-full md:w-64">
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 p-2 border rounded text-sm"/>
                            <FaSearch className="absolute left-3 top-2.5 text-gray-400"/>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 border-b overflow-x-auto">
                        <button onClick={() => setActiveTab('geral')} className={`px-6 py-2 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'geral' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Visão Geral</button>
                        <button onClick={() => setActiveTab('fluxo')} className={`px-6 py-2 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'fluxo' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Fluxo de Caixa</button>
                        <button onClick={() => setActiveTab('producao')} className={`px-6 py-2 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'producao' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Produção Médica</button>
                    </div>
                </div>

                {activeTab === 'geral' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500 flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start">
                                    <p className="text-green-700 font-bold uppercase text-xs tracking-wider">Em Caixa (Líquido)</p>
                                    <FaWallet className="text-green-200 text-xl"/>
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-green-700 truncate">{formatMoney(producaoCalculada.totalLiquido)}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Disponível</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-gray-400 flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start">
                                    <p className="text-gray-600 font-bold uppercase text-xs tracking-wider">Taxas (Maquininha)</p>
                                    <FaCreditCard className="text-gray-300 text-xl"/>
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-gray-600 truncate">{formatMoney(producaoCalculada.totalTaxas)}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Despesas Financeiras</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-red-500 flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start">
                                    <p className="text-red-700 font-bold uppercase text-xs tracking-wider">A Receber</p>
                                    <FaExclamationCircle className="text-red-200 text-xl"/>
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-red-600 truncate">{formatMoney(producaoCalculada.totalPendente)}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Inadimplência</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-600 flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start">
                                    <p className="text-blue-700 font-bold uppercase text-xs tracking-wider">Produção Total</p>
                                    <FaChartLine className="text-blue-200 text-xl"/>
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-blue-700 truncate">{formatMoney(producaoCalculada.totalGerado)}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Soma (Caixa + Taxas + Falta)</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-yellow-400 flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start">
                                    <p className="text-yellow-700 font-bold uppercase text-xs tracking-wider">Em Orçamento</p>
                                    <FaFileInvoiceDollar className="text-yellow-200 text-xl"/>
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-yellow-600 truncate">{formatMoney(producaoCalculada.totalOrcamento)}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Potencial</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><FaChartPie/> Detalhamento da Produção</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">Recebido (Líquido)</span>
                                        <span className="font-bold text-green-600">{formatMoney(producaoCalculada.totalLiquido)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(producaoCalculada.totalLiquido / producaoCalculada.totalGerado) * 100 || 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">Taxas Administrativas</span>
                                        <span className="font-bold text-gray-600">{formatMoney(producaoCalculada.totalTaxas)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${(producaoCalculada.totalTaxas / producaoCalculada.totalGerado) * 100 || 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">A Receber</span>
                                        <span className="font-bold text-red-500">{formatMoney(producaoCalculada.totalPendente)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(producaoCalculada.totalPendente / producaoCalculada.totalGerado) * 100 || 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800">
                            <p className="font-bold flex items-center gap-2 mb-1"><FaCheckCircle/> Resumo do Período</p>
                            <p>
                                A produção total foi de <strong>{formatMoney(producaoCalculada.totalGerado)}</strong>. 
                                Deste montante, <strong>{formatMoney(producaoCalculada.totalLiquido)}</strong> entrou no caixa, 
                                <strong>{formatMoney(producaoCalculada.totalTaxas)}</strong> foram descontados em taxas e 
                                <strong>{formatMoney(producaoCalculada.totalPendente)}</strong> ainda está aguardando pagamento.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'fluxo' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <CardInfo title="Entradas (Bruto)" value={formatMoney(fluxoCalculado.entBruta)} icon={<FaArrowUp />} color="border-green-500" />
                            <CardInfo title="Entradas (Líquido)" value={formatMoney(fluxoCalculado.entLiquida)} icon={<FaPercentage />} color="border-teal-500" />
                            <CardInfo title="Saídas" value={formatMoney(fluxoCalculado.sai)} icon={<FaArrowDown />} color="border-red-500" />
                            <div className={`bg-white p-4 rounded-xl shadow border-l-4 flex items-center justify-between ${fluxoCalculado.saldo >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
                                <div><h4 className="text-gray-500 font-bold text-xs uppercase">Saldo (Real)</h4><p className={`text-xl md:text-2xl font-bold ${fluxoCalculado.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatMoney(fluxoCalculado.saldo)}</p></div>
                                <FaWallet className="text-gray-300 text-2xl" />
                            </div>
                        </div>
                        {/* 🌟 PASSANDO O PROP onEstornar PARA A TABELA */}
                        <TabelaTransacoes 
                            transacoes={fluxoCalculado.lista} 
                            isLoading={isLoading} 
                            onEstornar={(id, valor) => setEstornoModal({ isOpen: true, id, senha: '', valorTotal: valor, valorEstorno: valor, loading: false })}
                        />
                    </div>
                )}

                {activeTab === 'producao' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <CardInfo title="Entradas Líquidas" value={formatMoney(producaoCalculada.totalLiquido)} icon={<FaCheckCircle />} color="border-green-500" />
                            <CardInfo title="Total de Saídas (Pagos)" value={formatMoney(fluxoCalculado.sai)} icon={<FaHandHoldingUsd />} color="border-red-500" />
                            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-indigo-500 flex items-center justify-between">
                                <div><h4 className="text-gray-500 font-bold text-xs uppercase">Em Caixa (Resultado)</h4><p className="text-xl md:text-2xl font-bold text-indigo-700">{formatMoney(producaoCalculada.totalLiquido - fluxoCalculado.sai)}</p></div>
                                <FaWallet className="text-gray-300 text-2xl" />
                            </div>
                        </div>
                        <PainelProducao dadosProducao={producaoCalculada} transacoesFinanceiras={fluxoCalculado.lista} isLoading={isLoading} onPagar={(nome, valor) => { setPayData({ nome, valor }); setModalOpen(true); }} />
                    </div>
                )}
            </main>
            
            <ModalPagamento isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleConfirmPayment} profissional={payData.nome} valorSugerido={payData.valor} />

            {/* 🌟 MODAL DE ESTORNO ATUALIZADO COM CAMPO DE VALOR */}
            {estornoModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold text-red-600 mb-2">Estornar Transação</h3>
                        <p className="text-sm text-gray-600 mb-4">Digite o valor a ser devolvido e a sua senha:</p>
                        
                        <label className="block text-xs font-bold text-gray-500 mb-1">Valor do Estorno (Máx: {formatMoney(estornoModal.valorTotal)})</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={estornoModal.valorEstorno} 
                            onChange={e => setEstornoModal(prev => ({ ...prev, valorEstorno: e.target.value }))}
                            className="w-full border p-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-red-500" 
                        />

                        <label className="block text-xs font-bold text-gray-500 mb-1">Senha de Administrador</label>
                        <input 
                            type="password" 
                            value={estornoModal.senha} 
                            onChange={e => setEstornoModal(prev => ({ ...prev, senha: e.target.value }))}
                            className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-red-500" 
                            placeholder="Sua senha"
                        />

                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setEstornoModal({ isOpen: false, id: null, senha: '', valorTotal: 0, valorEstorno: '', loading: false })} 
                                className="px-4 py-2 text-gray-500 bg-gray-100 rounded hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleEstornoConfirm} 
                                disabled={estornoModal.loading || !estornoModal.senha || !estornoModal.valorEstorno} 
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
                            >
                                {estornoModal.loading ? 'Processando...' : 'Confirmar Estorno'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}