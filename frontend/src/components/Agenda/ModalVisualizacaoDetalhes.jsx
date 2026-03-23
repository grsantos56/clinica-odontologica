import React from 'react';
import { FaInfoCircle, FaTimes, FaUser, FaPhone, FaEnvelope, FaCalendarCheck } from 'react-icons/fa';
import { extractDateFromDataHora, extractHorarioFromDataHora, formatDisplayDate, mapToValidString } from '../../utils/agendaUtils';
import { StatusBadge } from './Badges';

const ModalVisualizacaoDetalhes = ({ item, onClose }) => {
    const pacienteNome = mapToValidString(item, 'paciente');
    const pacienteData = item.paciente || {};
    const profissionalNome = mapToValidString(item, 'profissional');
    const tipo = item.procedimento; 
    const area = item.area;
    const data = extractDateFromDataHora(item.dataHora);
    const horario = extractHorarioFromDataHora(item.dataHora);
    const fotoUrl = pacienteData.foto;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-lg w-full m-2">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2"><FaInfoCircle className='text-indigo-600' /> Detalhes</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                </div>
                
                <div className="flex flex-col items-center mb-4 border-b pb-4">
                    {fotoUrl ? (
                        <img 
                            src={fotoUrl} 
                            alt={`Foto de ${pacienteNome}`} 
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full shadow-md mb-2" 
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mb-2">
                            <FaUser className='w-8 h-8 sm:w-10 sm:h-10' />
                        </div>
                    )}
                    <h4 className="font-bold text-lg text-gray-800 text-center">{pacienteNome}</h4>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <p><strong>Data:</strong> {formatDisplayDate(data)} às {horario || 'N/A'}</p> 
                        <p className="flex items-center gap-2"><strong>Status:</strong> <StatusBadge status={item.status} /></p>
                        <p><strong>Área:</strong> {area || 'N/A'}</p>
                        <p><strong>Profissional:</strong> {profissionalNome}</p>
                        <p className="sm:col-span-2"><strong>Tipo:</strong> {tipo || 'N/A'}</p>
                        
                        {pacienteData.retornoPendente && (
                            <p className="sm:col-span-2 text-orange-700 font-bold flex items-center gap-2 text-xs sm:text-sm bg-orange-50 p-2 rounded">
                                <FaCalendarCheck /> Retorno pendente.
                            </p>
                        )}
                    </div>
                    <div className="pt-3 border-t">
                        <h5 className="font-semibold text-gray-700 mb-2">Contato</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p className='flex items-center gap-2'><FaPhone className='text-xs' /> {pacienteData.telefone || 'N/A'}</p>
                            <p className='flex items-center gap-2'><FaEnvelope className='text-xs' /> {pacienteData.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalVisualizacaoDetalhes;