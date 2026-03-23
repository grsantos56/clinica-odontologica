import React from 'react';
import { FaCalendarCheck } from 'react-icons/fa';
import { statusConfig } from '../../utils/agendaUtils';

export const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig["PENDENTE"];
    const Icon = config.Icon;
    return (
        <span className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap w-fit ${config.style}`}>
            <Icon className="text-[10px]" />
            {config.descricao || status}
        </span>
    );
};

export const RetornoBadge = () => (
    <span className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1 whitespace-nowrap ml-2">
        <FaCalendarCheck className='text-[10px]' /> RETORNO
    </span>
);