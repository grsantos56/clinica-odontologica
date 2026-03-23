import React from 'react';
import { FaCheckCircle, FaWhatsapp, FaEdit, FaTimes, FaUser, FaDollarSign } from 'react-icons/fa';
import { extractHorarioFromDataHora, mapToValidString } from '../../utils/agendaUtils';
import { StatusBadge, RetornoBadge } from './Badges';

const AgendaTable = ({ 
    agendamentos, 
    retornosPendentes, 
    handleRowClick, 
    handleConfirmarPresenca, 
    handleWhatsApp, 
    handleEdit, 
    handleCancel,
    handleOpenFinanceiro // Prop recebido
}) => {
    
    if (agendamentos.length === 0) {
        return <tr><td colSpan="6" className="py-8 text-center text-gray-500 text-sm">Nenhum agendamento encontrado para a data selecionada com os filtros aplicados.</td></tr>;
    }

    return (
        <>
            {agendamentos.map(item => { 
                const temRetornoPendente = retornosPendentes.some(p => p.id === item.paciente?.id);
                const fotoUrl = item.paciente?.foto;
                const pacienteNome = mapToValidString(item, 'paciente');
                const profissionalNome = mapToValidString(item, 'profissional'); 
                const status = item.status;
                const podeConfirmar = status === 'PENDENTE' || status === 'AGUARDANDO_RETORNO';
                const isCancelled = status === 'CANCELADO';
                const isConcluido = status === 'CONCLUIDO' || status === 'CONCLUIDO_RETORNO';

                return (
                    <tr key={item.id} className="hover:bg-gray-50 cursor-pointer transition duration-150 text-sm" onClick={() => handleRowClick(item)}>
                        <td className="py-3 px-3 font-medium whitespace-nowrap w-20">{extractHorarioFromDataHora(item.dataHora) || 'N/A'}</td>
                        
                        <td className="py-3 px-3 font-medium">
                            <div className="flex items-center gap-2">
                                {fotoUrl ? (
                                    <img 
                                        src={fotoUrl} 
                                        alt={`Foto`} 
                                        className="w-8 h-8 object-cover rounded-full shadow-sm shrink-0"
                                        onError={(e) => { e.target.onerror = null; e.target.parentNode.innerHTML = `<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg></div>`; }}
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                                        <FaUser className='w-4 h-4' />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className='truncate max-w-[120px] sm:max-w-xs font-semibold'>{pacienteNome}</p>
                                    {temRetornoPendente && <RetornoBadge />}
                                </div>
                            </div>
                        </td>
                        
                        <td className="py-3 px-3">
                            <span className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded inline-block max-w-[100px] truncate ${item.procedimento === 'Consulta Inicial Odontológica' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.procedimento || 'N/A'}
                            </span>
                        </td>
                        
                        <td className="py-3 px-3 hidden md:table-cell text-xs">{profissionalNome}</td>
                        {/* Coluna 'Área' REMOVIDA DAQUI */}
                        <td className="py-3 px-3"><StatusBadge status={item.status} /></td>
                        
                        <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                                {podeConfirmar && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleConfirmarPresenca(item); }} 
                                        className="text-gray-400 hover:text-green-600 p-1.5 rounded hover:bg-green-50 transition border border-transparent hover:border-green-200"
                                        title="Confirmar Presença"
                                    >
                                        <FaCheckCircle className="text-lg" />
                                    </button>
                                )}

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(item.paciente?.telefone); }} 
                                    className="text-green-500 hover:text-green-700 p-1.5 rounded hover:bg-green-50 transition"
                                    title="Enviar WhatsApp"
                                >
                                    <FaWhatsapp className="text-lg" />
                                </button>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleOpenFinanceiro(item); }} 
                                    className="text-yellow-500 hover:text-yellow-700 p-1.5 rounded hover:bg-yellow-50 transition"
                                    title="Ir para Financeiro do Paciente"
                                >
                                    <FaDollarSign className="text-lg" />
                                </button>

                                <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                                    <FaEdit />
                                </button>
                                {!isConcluido && !isCancelled && ( 
                                    <button onClick={(e) => { e.stopPropagation(); handleCancel(item); }} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                );
            })}
        </>
    );
};

export default AgendaTable;