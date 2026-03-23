import { FaClock, FaCheckCircle, FaRedoAlt, FaSmile, FaBan } from 'react-icons/fa';

export const getTodayDate = () => new Date().toISOString().slice(0, 10);

export const extractDateFromDataHora = (dataHoraStr) => {
    if (!dataHoraStr || typeof dataHoraStr !== 'string' || dataHoraStr.length < 10) return '';
    return dataHoraStr.substring(0, 10);
};

export const extractHorarioFromDataHora = (dataHoraStr) => {
    if (!dataHoraStr || typeof dataHoraStr !== 'string' || dataHoraStr.length < 16) return 'N/A';
    return dataHoraStr.substring(11, 16);
};

export const formatDisplayDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 10) return 'N/A';
    return dateStr.substring(0, 10).split('-').reverse().join('/');
};

export const mapToValidString = (item, key) => {
    const value = item[key];
    if (key === 'paciente' && typeof value === 'object' && value !== null) return String(value.nome || ''); 
    if (key === 'profissional' && typeof value === 'object' && value !== null) return String(value.nome || '');
    return String(value || '');
};

export const statusConfig = {
    "PENDENTE": { style: "bg-blue-100 text-blue-700", Icon: FaClock, descricao: "Aguardando" },
    "CONFIRMADO": { style: "bg-green-100 text-green-700", Icon: FaCheckCircle, descricao: "Confirmado" },
    "REAGENDADO": { style: "bg-yellow-100 text-yellow-700", Icon: FaRedoAlt },
    "CONCLUIDO": { style: "bg-indigo-100 text-indigo-700", Icon: FaSmile },
    "CANCELADO": { style: "bg-red-100 text-red-700", Icon: FaBan },
    "AGUARDANDO_RETORNO": { style: "bg-orange-100 text-orange-700", Icon: FaRedoAlt },
    "CONCLUIDO_RETORNO": { style: "bg-gray-300 text-gray-700", Icon: FaSmile },
    "RETORNO": { style: "bg-gray-400 text-white", Icon: FaRedoAlt },
};