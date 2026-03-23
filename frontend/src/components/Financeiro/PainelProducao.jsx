import React, { useMemo } from 'react';
import { FaSpinner, FaUserMd, FaHandHoldingUsd, FaCheckCircle, FaHistory, FaTags, FaUserInjured, FaCreditCard } from 'react-icons/fa';
import { formatMoney, formatDate } from '../../utils/financeiroUtils'; 

const PainelProducao = ({ dadosProducao, transacoesFinanceiras, isLoading, onPagar }) => {
    
    const resumoPorProfissional = useMemo(() => {
        const resumo = {};
        
        // Processa Entradas
        dadosProducao.lista.forEach(item => {
            const prof = item.profissionalNome;
            if (!prof || prof === 'N/A') return; 
            
            if (!resumo[prof]) resumo[prof] = { bruto: 0, liquido: 0, comissao: 0, count: 0, jaPago: 0 };
            
            resumo[prof].bruto += item.valorTotal; // Valor cobrado
            resumo[prof].liquido += item.valorLiquido; // Valor real
            resumo[prof].comissao += (item.valorComissao || 0); 
            resumo[prof].count += 1;
        });

        // Processa Saídas
        transacoesFinanceiras.forEach(t => {
            if (t.tipo === 'SAIDA' && t.profissionalNome) {
                const prof = t.profissionalNome;
                if (!resumo[prof]) {
                    resumo[prof] = { bruto: 0, liquido: 0, comissao: 0, count: 0, jaPago: 0 };
                }
                resumo[prof].jaPago += t.valor;
            }
        });
        
        return resumo;
    }, [dadosProducao.lista, transacoesFinanceiras]);

    const historicoRepasses = useMemo(() => transacoesFinanceiras.filter(t => t.tipo === 'SAIDA' && t.profissionalNome), [transacoesFinanceiras]);

    if (isLoading) return <div className="p-8 text-center"><FaSpinner className="animate-spin text-2xl mx-auto text-indigo-600"/></div>;

    return (
        <div className="space-y-8">
            {/* 1. Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(resumoPorProfissional).map(([nome, info]) => {
                    const totalDevido = info.comissao;
                    const saldoDevedor = Math.max(0, totalDevido - info.jaPago);
                    const tudoPago = saldoDevedor <= 0.01; 

                    return (
                        <div key={nome} className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base"><FaUserMd className="text-indigo-500"/> {nome}</h4>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap text-gray-600">{info.count} sessões</span>
                                </div>
                                <div className="mt-3 space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-500"><span>Produção Bruta:</span><span>{formatMoney(info.bruto)}</span></div>
                                    <div className="flex justify-between text-teal-700 font-medium"><span>Líquido (Caixa):</span><span>{formatMoney(info.liquido)}</span></div>
                                    
                                    <div className="flex justify-between text-purple-600 font-medium border-t border-dashed pt-1 mt-1"><span>Comissão Total:</span><span>{formatMoney(info.comissao)}</span></div>
                                    <div className="flex justify-between text-red-500 text-xs"><span>(-) Já Repassado:</span><span>{formatMoney(info.jaPago)}</span></div>
                                    
                                    <div className="flex justify-between font-bold text-gray-800 pt-2 border-t mt-1 text-base">
                                        <span>A Pagar:</span>
                                        <span className={tudoPago ? 'text-green-600' : 'text-orange-600'}>
                                            {tudoPago ? 'QUITADO' : formatMoney(saldoDevedor)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onPagar(nome, saldoDevedor)} 
                                disabled={tudoPago} 
                                className={`mt-4 w-full text-white py-2 rounded shadow text-sm font-bold flex justify-center items-center gap-2 transition-colors ${tudoPago ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                            >
                                <FaHandHoldingUsd /> {tudoPago ? 'Nada a Pagar' : 'Pagar Comissão'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* 2. Área das Tabelas */}
            <div className="space-y-6">
                
                {/* Tabela de Produção */}
                <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                    <div className="p-3 bg-gray-50 border-b text-sm font-bold text-gray-600 uppercase flex items-center gap-2">
                        <FaCheckCircle className="text-teal-500"/> Produção Detalhada
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-100 sticky top-0 shadow-sm text-xs font-extrabold uppercase text-gray-700 border-b-2 border-gray-200 tracking-wide">
                                <tr>
                                    <th className="p-3 whitespace-nowrap">Data</th>
                                    <th className="p-3">Info</th>
                                    <th className="p-3">Procedimentos</th>
                                    
                                    <th className="p-3 text-right">Valor Bruto</th>
                                    <th className="p-3 text-right text-orange-600" title="Desconto dado pelo Dentista">Desc.</th>
                                    
                                    {/* 🌟 NOVA COLUNA: RECEBIDO */}
                                    <th className="p-3 text-right text-blue-600" title="Valor Pago pelo Paciente (Bruto - Desc)">Recebido</th>

                                    <th className="p-3 text-right text-gray-500" title="Taxa da Maquininha/Sistema">Taxa (Maq.)</th>
                                    
                                    <th className="p-3 text-right text-teal-700">Líquido</th>
                                    <th className="p-3 text-right text-purple-700">Comissão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dadosProducao.lista.map(i => {
                                    const percentualDesconto = (i.valorBruto > 0 && i.valorDesconto > 0) 
                                        ? ((i.valorDesconto / i.valorBruto) * 100).toFixed(1) 
                                        : 0;
                                    
                                    return (
                                        <tr key={i.id} className="hover:bg-gray-50">
                                            <td className="p-3 text-gray-500 whitespace-nowrap align-top">{formatDate(i.data)}</td>
                                            
                                            <td className="p-3 align-top">
                                                <div className="font-medium text-indigo-600">{i.profissionalNome}</div>
                                                <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                                                    <FaUserInjured/> {i.pacienteNome}
                                                </div>
                                            </td>
                                            
                                            <td className="p-3 text-gray-700 text-xs align-top">
                                                <p className="line-clamp-2" title={i.listaProcedimentos}>{i.listaProcedimentos || 'Não informado'}</p>
                                            </td>

                                            {/* Valor Bruto */}
                                            <td className="p-3 text-right text-gray-600 font-medium whitespace-nowrap align-top">
                                                {formatMoney(i.valorBruto || i.valorTotal)}
                                            </td>

                                            {/* Desconto (Dentista) */}
                                            <td className="p-3 text-right text-orange-500 text-xs font-medium whitespace-nowrap align-top">
                                                {i.valorDesconto > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span>- {formatMoney(i.valorDesconto)}</span>
                                                        <span className="bg-orange-100 text-orange-700 px-1.5 rounded text-[10px] mt-0.5 font-bold">
                                                            {percentualDesconto}%
                                                        </span>
                                                    </div>
                                                ) : '-'}
                                            </td>

                                            {/* 🌟 COLUNA TOTAL RECEBIDO 🌟 */}
                                            <td className="p-3 text-right text-blue-600 font-bold whitespace-nowrap align-top">
                                                {formatMoney(i.valorTotal)}
                                            </td>

                                            {/* Taxa (Maquininha) */}
                                            <td className="p-3 text-right text-gray-500 text-xs font-medium whitespace-nowrap align-top">
                                                {i.valorTaxa > 0 ? (
                                                    <div className="flex items-center gap-1 justify-end" title="Taxa da Operadora">
                                                        <FaCreditCard size={10} className="text-gray-400"/>
                                                        - {formatMoney(i.valorTaxa)}
                                                    </div>
                                                ) : '-'}
                                            </td>

                                            {/* Líquido */}
                                            <td className="p-3 text-right text-teal-700 font-bold whitespace-nowrap align-top">
                                                {formatMoney(i.valorLiquido)}
                                            </td>

                                            {/* Comissão */}
                                            <td className="p-3 text-right text-purple-600 font-medium whitespace-nowrap align-top">{i.valorComissao > 0 ? formatMoney(i.valorComissao) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabela de Repasses */}
                <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                    <div className="p-3 bg-gray-50 border-b text-sm font-bold text-gray-600 uppercase flex items-center gap-2">
                        <FaHistory className="text-orange-500"/> Histórico de Repasses (Saídas)
                    </div>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-100 sticky top-0 shadow-sm text-xs font-extrabold uppercase text-gray-700 border-b-2 border-gray-200 tracking-wide">
                                <tr>
                                    <th className="p-3 whitespace-nowrap">Data</th>
                                    <th className="p-3">Para</th>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3 text-right">Valor Pago</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {historicoRepasses.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-400">Nenhum repasse neste período.</td></tr>
                                ) : (historicoRepasses.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-600 whitespace-nowrap">{formatDate(t.data)}</td>
                                        <td className="p-3 font-medium text-gray-800">{t.profissionalNome}</td>
                                        <td className="p-3 text-gray-500 text-xs">{t.descricao}</td>
                                        <td className="p-3 text-right text-red-600 font-bold whitespace-nowrap">- {formatMoney(t.valor)}</td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PainelProducao;