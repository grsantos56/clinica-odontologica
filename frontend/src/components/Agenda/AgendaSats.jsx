import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarCheck, FaArrowRight, FaFileInvoiceDollar } from 'react-icons/fa';

export const RetornosPendentesCard = ({ count }) => (
    <section className='bg-orange-50 p-4 rounded-xl shadow-md mb-4 border border-orange-200'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <h3 className='text-base md:text-lg font-bold text-orange-700 flex items-center gap-2'>
                <FaCalendarCheck className="shrink-0" /> <span className="break-words">Retornos Pendentes</span>
            </h3>
            <Link
                // 🌟 CORREÇÃO: Rota exata conforme seu App.jsx
                to="/retorno-agendamento" 
                className={`flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-200 justify-center text-sm w-full md:w-auto ${count > 0 ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'}`}
            >
                Ver Lista ({count}) <FaArrowRight />
            </Link>
        </div>
    </section>
);

export const OrcamentosPendentesCard = ({ count }) => (
    <section className='bg-yellow-50 p-4 rounded-xl shadow-md mb-6 border border-yellow-200'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <h3 className='text-base md:text-lg font-bold text-yellow-800 flex items-center gap-2'>
                <FaFileInvoiceDollar className="shrink-0" /> <span className="break-words">Orçamentos em Aberto</span>
            </h3>
            <Link
                // 🌟 CORREÇÃO: Rota exata conforme seu App.jsx
                to="/orcamentos/agendar" 
                className={`flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-200 justify-center text-sm w-full md:w-auto ${count > 0 ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'}`}
            >
                Ver Orçamentos ({count}) <FaArrowRight />
            </Link>
        </div>
    </section>
);