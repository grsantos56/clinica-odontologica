import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/SideBar';
import { 
    FaMoneyBillWave, FaSpinner, FaEye, FaArrowLeft, FaUserMd, 
    FaWallet, FaHandHoldingUsd, FaTags 
} from 'react-icons/fa';
import ProcedimentoService from '../services/ProcedimentoService';
import ServicoService from '../services/ServicoService'; 
import { useNavigate } from 'react-router-dom';

const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

// Fallback para registros antigos (apenas strings)
const extrairValor = (procedimentoString) => {
    if (!procedimentoString) return 0;
    const regex = /R\$\s*([\d,.]+)/;
    const match = procedimentoString.match(regex);
    if (match) {
        let valorStr = match[1];
        if (valorStr.includes('.') && !valorStr.includes(',')) {
            return parseFloat(valorStr) || 0;
        }
        return parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return 0;
};

const extrairNome = (procedimentoString) => {
    if (!procedimentoString) return "";
    return procedimentoString.split(' - R$')[0].trim();
};

const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function RelatorioFinanceiroPage() {
    const navigate = useNavigate();
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

    const [dataInicio, setDataInicio] = useState(primeiroDia);
    const [dataFim, setDataFim] = useState(ultimoDia);
    const [selectedProfissional, setSelectedProfissional] = useState('');
    const [registros, setRegistros] = useState([]);
    const [listaServicosRef, setListaServicosRef] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);

    // 1. Carrega Serviços
    useEffect(() => {
        const fetchServicos = async () => {
            try {
                const listaServicos = await ServicoService.listarTodos();
                
                const servicosUteis = listaServicos
                    .filter(s => s.comissaoPercentual > 0)
                    .map(s => ({
                        nomeNorm: normalizarTexto(s.nome),
                        percentual: s.comissaoPercentual
                    }));
                
                servicosUteis.sort((a, b) => b.nomeNorm.length - a.nomeNorm.length);
                setListaServicosRef(servicosUteis);

            } catch (error) {
                console.error("Erro ao carregar serviços:", error);
            }
        };
        fetchServicos();
    }, []);

    // 2. Carrega Relatório
    useEffect(() => {
        const fetchRelatorio = async () => {
            setIsLoading(true);
            try {
                const data = await ProcedimentoService.listarRelatorio(dataInicio, dataFim);
                const userRole = localStorage.getItem('user_role');
                const userId = localStorage.getItem('user_id');

                let dadosFinais = data;
                if (userRole === 'DENTISTA') {
                    dadosFinais = data.filter(reg => 
                        reg.agendamento?.profissional?.id && 
                        String(reg.agendamento.profissional.id) === String(userId)
                    );
                }
                setRegistros(dadosFinais);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRelatorio();
    }, [dataInicio, dataFim]);

    const profissionaisDisponiveis = useMemo(() => {
        const nomes = new Set();
        registros.forEach(reg => {
            if (reg.agendamento?.profissional?.nome) {
                nomes.add(reg.agendamento.profissional.nome);
            }
        });
        return Array.from(nomes).sort();
    }, [registros]);

    // 3. Cálculos Detalhados
    const dadosCalculados = useMemo(() => {
        let totalBase = 0;
        let totalAcrescimos = 0;
        let totalDescontos = 0;
        
        let totalGeradoLiquido = 0; // Total após descontos e acréscimos
        let totalRecebidoBruto = 0;
        let totalRecebidoLiquido = 0; 
        let totalPendente = 0;
        let totalComissao = 0;

        const registrosFiltrados = registros.filter(reg => {
            if (!selectedProfissional) return true;
            return reg.agendamento?.profissional?.nome === selectedProfissional;
        });

        const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
            const dateA = new Date(a.dataRegistro).getTime();
            const dateB = new Date(b.dataRegistro).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.id - b.id;
        });

        // 🌟 LÓGICA PROCESSAMENTO
        const listaProcessada = registrosOrdenados.map(reg => {
            const statusAgendamento = reg.agendamento?.status || 'N/A';
            const profissionalNome = reg.agendamento?.profissional?.nome || 'N/A';
            
            let sessaoBase = 0;
            let sessaoAcrescimo = 0;
            let sessaoDesconto = 0;
            let sessaoTotalLiq = 0;
            let comissaoNominal = 0;

            // 🅰️ CENÁRIO 1: DADOS ESTRUTURADOS (Novo Sistema)
            if (reg.itens && reg.itens.length > 0) {
                reg.itens.forEach(item => {
                    const vBase = item.valorBase || 0;
                    const vAcresc = item.acrescimo || 0;
                    const vDesc = item.desconto || 0;
                    const vLiq = item.valorLiquido || (vBase + vAcresc - vDesc);

                    sessaoBase += vBase;
                    sessaoAcrescimo += vAcresc;
                    sessaoDesconto += vDesc;
                    sessaoTotalLiq += vLiq;

                    // Cálculo Comissão (baseado no nome do serviço)
                    const nomeItemNorm = normalizarTexto(item.descricao.split(' (')[0]);
                    const servicoEncontrado = listaServicosRef.find(svc => nomeItemNorm.includes(svc.nomeNorm));
                    
                    if (servicoEncontrado) {
                        // Comissão sobre o valor líquido do item
                        comissaoNominal += (vLiq * (servicoEncontrado.percentual / 100));
                    }
                });
            } 
            // 🅱️ CENÁRIO 2: DADOS ANTIGOS (Strings)
            else if (reg.procedimentosRealizados && reg.procedimentosRealizados.length > 0) {
                reg.procedimentosRealizados.forEach(procStr => {
                    const valorItem = extrairValor(procStr);
                    const nomeItem = extrairNome(procStr);
                    
                    // No antigo não tínhamos base/acrescimo separado, assumimos tudo como Total
                    sessaoBase += valorItem; 
                    sessaoTotalLiq += valorItem;

                    const nomeItemNorm = normalizarTexto(nomeItem);
                    const servicoEncontrado = listaServicosRef.find(svc => nomeItemNorm.includes(svc.nomeNorm));
                    
                    if (servicoEncontrado) {
                        comissaoNominal += (valorItem * (servicoEncontrado.percentual / 100));
                    }
                });
            }

            // --- CÁLCULO FINANCEIRO (Status de Pagamento) ---
            let pagoBruto = 0;
            let pagoLiquido = 0;
            let pendente = 0;

            const dbValorPago = reg.valorPago || 0;
            const dbValorLiquido = (reg.valorLiquido !== undefined && reg.valorLiquido !== null) ? reg.valorLiquido : dbValorPago;

            if (reg.statusPagamento === 'PAGO') {
                pagoBruto = sessaoTotalLiq;
                pagoLiquido = dbValorLiquido > 0 ? dbValorLiquido : sessaoTotalLiq;
                pendente = 0;
            } else if (reg.statusPagamento === 'PARCIALMENTE_PAGO') {
                pagoBruto = dbValorPago;
                pagoLiquido = dbValorLiquido;
                pendente = Math.max(0, sessaoTotalLiq - pagoBruto);
            } else if (reg.statusPagamento === 'ORCAMENTO') {
                // Orçamento não soma em realizados, apenas exibe
                // Para relatório financeiro de produção, geralmente ORCAMENTO é ignorado nas somas globais
                // Mas aqui vamos zerar os pagamentos e manter pendente zerado pois não é divida ainda
            } else {
                // NAO_PAGO ou AGUARDANDO
                pagoBruto = 0; pagoLiquido = 0; pendente = sessaoTotalLiq;
            }

            if (sessaoTotalLiq === 0) {
                pagoBruto = 0; pagoLiquido = 0; pendente = 0; comissaoNominal = 0;
            }

            // Ajuste da comissão pela liquidez
            let comissaoReal = 0;
            if (sessaoTotalLiq > 0) {
                const fatorLiquidez = pagoLiquido / sessaoTotalLiq;
                comissaoReal = comissaoNominal * fatorLiquidez;
            }

            // Se for orçamento, não soma nos totais gerais de produção/recebimento
            if (reg.statusPagamento !== 'ORCAMENTO') {
                totalBase += sessaoBase;
                totalAcrescimos += sessaoAcrescimo;
                totalDescontos += sessaoDesconto;
                totalGeradoLiquido += sessaoTotalLiq;
                
                totalRecebidoBruto += pagoBruto;
                totalRecebidoLiquido += pagoLiquido; 
                totalPendente += pendente;
                totalComissao += comissaoReal;
            }

            return {
                ...reg,
                valorBase: sessaoBase,
                valorAcrescimo: sessaoAcrescimo,
                valorDesconto: sessaoDesconto,
                valorTotal: sessaoTotalLiq, // É o total final cobrado
                
                valorPagoBruto: pagoBruto,
                valorPagoLiquido: pagoLiquido, 
                valorFalta: pendente,
                valorComissao: comissaoReal,
                
                pacienteNome: reg.agendamento?.paciente?.nome || 'Desconhecido',
                profissionalNome: profissionalNome,
                statusAgendamento: statusAgendamento,
                data: reg.dataRegistro ? new Date(reg.dataRegistro).toLocaleDateString() : '-'
            };
        });

        return { 
            lista: listaProcessada.reverse(), 
            totalBase,
            totalAcrescimos,
            totalDescontos,
            totalGeradoLiquido, 
            totalRecebidoBruto, 
            totalRecebidoLiquido, 
            totalPendente,
            totalComissao 
        };
    }, [registros, selectedProfissional, listaServicosRef]);

    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />
            
            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/procedimentos')} className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm">
                        <FaArrowLeft />
                    </button>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">Relatório Financeiro Detalhado</h2>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row md:items-end gap-4">
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-bold text-gray-600 mb-1">Data Início</label>
                        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full md:w-auto p-2 border rounded-lg focus:ring-2 ring-indigo-500 outline-none text-gray-700"/>
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-bold text-gray-600 mb-1">Data Fim</label>
                        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full md:w-auto p-2 border rounded-lg focus:ring-2 ring-indigo-500 outline-none text-gray-700"/>
                    </div>
                    <div className="w-full md:w-auto md:min-w-[200px]">
                        <label className="block text-sm font-bold text-gray-600 mb-1">Filtrar Profissional</label>
                        <div className="relative">
                            <select value={selectedProfissional} onChange={(e) => setSelectedProfissional(e.target.value)} className="w-full p-2 pl-8 border rounded-lg focus:ring-2 ring-indigo-500 outline-none text-gray-700 bg-white appearance-none">
                                <option value="">Todos os Profissionais</option>
                                {profissionaisDisponiveis.map(nome => (<option key={nome} value={nome}>{nome}</option>))}
                            </select>
                            <FaUserMd className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {/* Produção Líquida (o que vale) */}
                    <div className="bg-white p-4 rounded-xl shadow border-l-4 border-indigo-500">
                        <p className="text-gray-500 font-bold uppercase text-[10px]">Produção Total</p>
                        <p className="text-lg font-extrabold text-indigo-700 truncate" title={formatMoney(dadosCalculados.totalGeradoLiquido)}>{formatMoney(dadosCalculados.totalGeradoLiquido)}</p>
                    </div>

                    {/* Descontos Concedidos */}
                    <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-400">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-orange-600 font-bold uppercase text-[10px]">Descontos</p>
                                <p className="text-lg font-extrabold text-orange-600 truncate">{formatMoney(dadosCalculados.totalDescontos)}</p>
                            </div>
                            <FaTags className="text-orange-200 text-2xl"/>
                        </div>
                    </div>

                    {/* Recebido (Caixa) */}
                    <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
                        <p className="text-green-700 font-bold uppercase text-[10px]">Recebido (Liq)</p>
                        <p className="text-lg font-extrabold text-green-600 truncate">{formatMoney(dadosCalculados.totalRecebidoLiquido)}</p>
                    </div>

                     {/* Pendente */}
                     <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
                        <p className="text-red-700 font-bold uppercase text-[10px]">A Receber</p>
                        <p className="text-lg font-extrabold text-red-600 truncate">{formatMoney(dadosCalculados.totalPendente)}</p>
                    </div>

                    {/* Comissão */}
                    <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500 relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-2">
                        <div className="flex justify-between items-center z-10 relative">
                            <div>
                                <p className="text-purple-700 font-bold uppercase text-xs">Comissão Prevista (Pago)</p>
                                <p className="text-2xl font-extrabold text-purple-800">{formatMoney(dadosCalculados.totalComissao)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold">BRUTO (Entrada)</p>
                                <p className="text-sm font-bold text-gray-500">{formatMoney(dadosCalculados.totalRecebidoBruto)}</p>
                            </div>
                        </div>
                        <FaHandHoldingUsd className="text-purple-100 absolute -bottom-4 -right-4 text-7xl opacity-40"/>
                    </div>
                </div>

                {/* Tabela Detalhada */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-700">Detalhamento dos Atendimentos</h3></div>
                    {isLoading ? <div className="p-8 text-center"><FaSpinner className="animate-spin text-2xl mx-auto text-indigo-600"/></div> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                        <th className="px-3 py-3">Data</th>
                                        <th className="px-3 py-3">Profissional / Paciente</th>
                                        <th className="px-3 py-3 text-center">Status</th>
                                        {/* NOVAS COLUNAS */}
                                        <th className="px-3 py-3 text-right text-gray-400">V. Tabela</th>
                                        <th className="px-3 py-3 text-right text-blue-400">Acresc.</th>
                                        <th className="px-3 py-3 text-right text-orange-400">Desc.</th>
                                        
                                        <th className="px-3 py-3 text-right font-black text-gray-700 bg-gray-50">TOTAL</th>
                                        <th className="px-3 py-3 text-right text-green-600">Pago</th>
                                        <th className="px-3 py-3 text-right text-red-500">Falta</th>
                                        <th className="px-3 py-3 text-right text-purple-600">Comissão</th>
                                        <th className="px-3 py-3 text-center">Ver</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {dadosCalculados.lista.map((item) => (
                                        <tr key={item.id} className={`hover:bg-gray-50 ${item.statusPagamento === 'ORCAMENTO' ? 'opacity-60 bg-gray-50' : ''}`}>
                                            <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{item.data}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-indigo-600 text-xs">{item.profissionalNome}</span>
                                                    <span className="text-gray-600 text-xs">{item.pacienteNome}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${
                                                    item.statusPagamento === 'PAGO' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                    item.statusPagamento === 'ORCAMENTO' ? 'bg-gray-100 text-gray-600 border-gray-200' : 
                                                    item.statusPagamento === 'PARCIALMENTE_PAGO' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {item.statusPagamento?.replace('_', ' ') || 'N/A'}
                                                </span>
                                            </td>
                                            
                                            {/* VALORES DETALHADOS */}
                                            <td className="px-3 py-3 text-right text-gray-400 text-xs">{formatMoney(item.valorBase)}</td>
                                            <td className="px-3 py-3 text-right text-blue-400 text-xs">{item.valorAcrescimo > 0 ? `+ ${formatMoney(item.valorAcrescimo)}` : '-'}</td>
                                            <td className="px-3 py-3 text-right text-orange-400 text-xs">{item.valorDesconto > 0 ? `- ${formatMoney(item.valorDesconto)}` : '-'}</td>
                                            
                                            <td className="px-3 py-3 text-right font-black text-gray-800 bg-gray-50 border-l border-r border-gray-100">
                                                {formatMoney(item.valorTotal)}
                                            </td>
                                            
                                            <td className="px-3 py-3 text-right text-green-600 font-bold text-xs">{item.valorPagoLiquido > 0 ? formatMoney(item.valorPagoLiquido) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-red-500 font-bold text-xs">{item.valorFalta > 0 ? formatMoney(item.valorFalta) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-purple-600 font-bold text-xs">{item.valorComissao > 0 ? formatMoney(item.valorComissao) : '-'}</td>
                                            
                                            <td className="px-3 py-3 text-center">
                                                {item.agendamento?.id && (
                                                    <button onClick={() => navigate(`/procedimentos/registro/${item.agendamento.id}`)} className="text-gray-400 hover:text-indigo-600 transition p-1"><FaEye size={14}/></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}