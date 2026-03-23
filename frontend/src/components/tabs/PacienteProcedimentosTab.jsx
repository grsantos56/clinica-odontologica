import React, { useState, useEffect } from 'react';
import { FaSpinner, FaEye, FaTooth, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ProcedimentoService from '../../services/ProcedimentoService';

const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

// Fallback para extrair valores de registros antigos (strings)
const extrairValorAntigo = (str) => {
    const match = str.match(/R\$\s*([\d,.]+)/);
    if (match) return parseFloat(match[1].replace(/\./g, '').replace(',', '.')) || 0;
    return 0;
};

export default function PacienteProcedimentosTab({ paciente }) {
    const navigate = useNavigate();
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistorico = async () => {
            setLoading(true);
            try {
                const data = await ProcedimentoService.listarHistoricoPorPacienteId(paciente.id);
                
                // Processa os dados para exibição uniforme
                const listaProcessada = data.map(proc => {
                    let totalSessao = 0;
                    let descSessao = 0;
                    let acrescSessao = 0;
                    let itensTexto = [];

                    // 1. Tenta pegar da estrutura nova (Itens)
                    if (proc.itens && proc.itens.length > 0) {
                        proc.itens.forEach(item => {
                            totalSessao += (item.valorLiquido || (item.valorBase + (item.acrescimo||0) - (item.desconto||0)));
                            descSessao += (item.desconto || 0);
                            acrescSessao += (item.acrescimo || 0);
                            itensTexto.push(item.descricao);
                        });
                    } 
                    // 2. Fallback estrutura antiga
                    else if (proc.procedimentosRealizados && proc.procedimentosRealizados.length > 0) {
                        proc.procedimentosRealizados.forEach(str => {
                            const val = extrairValorAntigo(str);
                            totalSessao += val;
                            itensTexto.push(str.split('- R$')[0].trim());
                        });
                        // Tenta extrair desconto antigo se houver JSON
                        try {
                            if (proc.acoesDiarioJson) {
                                const json = JSON.parse(proc.acoesDiarioJson);
                                if (json.descontoValor) {
                                    totalSessao = Math.max(0, totalSessao - json.descontoValor);
                                    descSessao = json.descontoValor;
                                }
                            }
                        } catch(e){}
                    }

                    const valorPago = proc.valorPago || 0;
                    // Se estiver PAGO, o falta é 0, senão calcula
                    const valorFalta = (proc.statusPagamento === 'PAGO') ? 0 : Math.max(0, totalSessao - valorPago);

                    return {
                        id: proc.id,
                        agendamentoId: proc.agendamento?.id,
                        data: proc.dataRegistro,
                        profissional: proc.agendamento?.profissional?.nome || 'N/A',
                        status: proc.statusPagamento,
                        statusAgenda: proc.agendamento?.status,
                        itens: itensTexto,
                        total: totalSessao,
                        pago: valorPago,
                        falta: valorFalta,
                        desconto: descSessao,
                        acrescimo: acrescSessao
                    };
                });

                // Ordena do mais recente para o mais antigo
                setHistorico(listaProcessada.sort((a, b) => new Date(b.data) - new Date(a.data)));

            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
            } finally {
                setLoading(false);
            }
        };

        if (paciente?.id) fetchHistorico();
    }, [paciente]);

    if (loading) return <div className="p-10 text-center"><FaSpinner className="animate-spin text-3xl text-indigo-600 mx-auto"/></div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <FaTooth className="text-indigo-500" /> Histórico Clínico de Procedimentos
                    </h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Apenas Visualização</span>
                </div>

                {historico.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum procedimento registrado para este paciente.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3">Data / Profissional</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3">Procedimentos Realizados</th>
                                    <th className="px-4 py-3 text-right text-gray-700">Total (Liq)</th>
                                    <th className="px-4 py-3 text-right text-green-600">Pago</th>
                                    <th className="px-4 py-3 text-right text-red-500">Falta</th>
                                    <th className="px-4 py-3 text-center">Ver</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {historico.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="font-bold text-gray-700">
                                                {item.data ? new Date(item.data).toLocaleDateString() : 'N/A'}
                                            </p>
                                            <p className="text-xs text-gray-500">{item.profissional}</p>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border w-fit ${
                                                    item.status === 'PAGO' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                    item.status === 'ORCAMENTO' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                                    item.status === 'PARCIALMENTE_PAGO' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {item.status?.replace('_', ' ') || 'N/A'}
                                                </span>
                                                {/* Status da Agenda para contexto */}
                                                {item.statusAgenda === 'CONCLUIDO' && <FaCheckCircle className="text-green-400 text-xs" title="Atendimento Concluído"/>}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <ul className="list-disc list-inside text-xs text-gray-600">
                                                {item.itens.slice(0, 3).map((desc, i) => (
                                                    <li key={i} className="truncate max-w-[250px]">{desc}</li>
                                                ))}
                                                {item.itens.length > 3 && <li className="italic text-gray-400">...mais {item.itens.length - 3} itens</li>}
                                                {item.itens.length === 0 && <li className="italic text-gray-400">Sem descrição</li>}
                                            </ul>
                                        </td>

                                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                                            {formatMoney(item.total)}
                                            {(item.desconto > 0) && <span className="block text-[10px] text-orange-500 font-normal">Desc: -{formatMoney(item.desconto)}</span>}
                                        </td>

                                        <td className="px-4 py-3 text-right font-bold text-green-600">
                                            {formatMoney(item.pago)}
                                        </td>

                                        <td className="px-4 py-3 text-right font-bold text-red-500">
                                            {item.status === 'ORCAMENTO' ? '-' : formatMoney(item.falta)}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            {item.agendamentoId && (
                                                <button 
                                                    onClick={() => navigate(`/procedimentos/registro/${item.agendamentoId}`)} 
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                                                    title="Ver Detalhes Completos"
                                                >
                                                    <FaEye />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}