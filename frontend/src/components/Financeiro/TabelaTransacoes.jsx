import React from 'react';
import { FaSpinner, FaCreditCard, FaUndo } from 'react-icons/fa';
import { formatMoney, formatDate, formatTexto } from '../../utils/financeiroUtils'; 

const TabelaTransacoes = ({ transacoes, isLoading, onEstornar }) => {
    if (isLoading) return <div className="p-8 text-center"><FaSpinner className="animate-spin text-2xl mx-auto text-indigo-600"/></div>;
    if (transacoes.length === 0) return <p className="text-center py-10 text-gray-500">Nenhum registro encontrado.</p>;

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
                    <tr>
                        <th className="p-4 whitespace-nowrap">Data</th>
                        <th className="p-4 min-w-[200px]">Descrição / Responsável</th>
                        <th className="p-4 whitespace-nowrap">Forma</th>
                        <th className="p-4 text-center">Tipo</th>
                        <th className="p-4 text-right">Valor (Líquido)</th>
                        {/* 🌟 NOVA COLUNA: Ações */}
                        <th className="p-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {transacoes.map(t => {
                        const desc = t.descricao || '';
                        const isEntrada = t.tipo === 'ENTRADA' || (t.pacienteNome && !desc.includes('Repasse'));
                        let textoPrincipal = isEntrada ? (t.pacienteNome || desc || 'Entrada') : (t.profissionalNome || desc || 'Saída');
                        let textoSecundario = (isEntrada && t.pacienteNome && desc !== t.pacienteNome) ? desc : ((!isEntrada && t.profissionalNome && desc.includes('Repasse')) ? desc : null);
                        
                        // Valor a exibir (Prioridade para o Líquido se existir taxa descontada)
                        const valorExibir = t.valorLiquido !== undefined ? t.valorLiquido : t.valor;
                        const taxa = t.taxa || 0;

                        return (
                            <tr key={t.id || Math.random()} className="hover:bg-gray-50">
                                <td className="p-4 whitespace-nowrap">{formatDate(t.data)}</td>
                                <td className="p-4 font-medium text-gray-700">
                                    <span className="block text-base">{textoPrincipal}</span>
                                    {textoSecundario && <span className="block text-xs text-gray-400">{textoSecundario}</span>}
                                </td>
                                <td className="p-4 text-gray-600">
                                    <div className="flex items-center gap-2 whitespace-nowrap"><FaCreditCard className="text-gray-300"/> {formatTexto(t.forma)}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isEntrada ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isEntrada ? 'ENTRADA' : 'SAÍDA'}</span>
                                </td>
                                <td className={`p-4 text-right font-bold whitespace-nowrap align-top`}>
                                    <div className={isEntrada ? 'text-green-600' : 'text-red-600'}>
                                        {isEntrada ? '+ ' : '- '} {formatMoney(valorExibir)}
                                    </div>
                                    {/* Exibe taxa da maquininha se houver */}
                                    {taxa > 0 && (
                                        <div className="text-xs text-gray-400 font-normal mt-1" title="Taxa descontada (ex: Maquininha)">
                                            (Taxa: -{formatMoney(taxa)})
                                        </div>
                                    )}
                                </td>
                                {/* 🌟 NOVO BOTÃO DE ESTORNO */}
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => onEstornar(t.id, valorExibir)} 
                                        className="text-red-500 hover:text-red-700 transition p-2" 
                                        title="Estornar Transação"
                                    >
                                        <FaUndo />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default TabelaTransacoes;