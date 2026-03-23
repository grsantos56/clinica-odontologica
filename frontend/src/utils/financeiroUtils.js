// src/utils/financeiroUtils.js

export const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export const formatDate = (isoDate) => isoDate ? new Date(isoDate).toLocaleDateString('pt-BR') : '-';

export const formatTexto = (str) => str ? str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : '-';

export const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export const extrairValor = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const match = str.match(/R\$\s*([\d,.]+)/);
    if (match) {
        let v = match[1];
        if (v.includes('.') && !v.includes(',')) return parseFloat(v) || 0;
        return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return 0;
};

export const extrairNome = (procedimentoString) => {
    if (!procedimentoString) return "";
    return procedimentoString.split(' - R$')[0].trim();
};