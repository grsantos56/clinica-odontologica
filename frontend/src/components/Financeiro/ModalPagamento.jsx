import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';

const ModalPagamento = ({ isOpen, onClose, onConfirm, profissional, valorSugerido }) => {
    // Inicializa com 0 (número) em vez de string vazia
    const [valor, setValor] = useState(0);
    const [forma, setForma] = useState('PIX'); 

    useEffect(() => { 
        if(isOpen) {
            // Garante que seja um número válido ao abrir
            setValor(valorSugerido > 0 ? valorSugerido : 0); 
            setForma('PIX'); 
        }
    }, [isOpen, valorSugerido]);

    if (!isOpen) return null;

    // 🌟 NOVA FUNÇÃO DE MÁSCARA AUTOMÁTICA
    const handleValorChange = (e) => {
        const rawValue = e.target.value;
        // Remove tudo que não for dígito
        const onlyDigits = rawValue.replace(/\D/g, "");
        // Divide por 100 para mover a vírgula 2 casas (ex: 1234 -> 12.34)
        const numero = parseFloat(onlyDigits) / 100;
        
        setValor(isNaN(numero) ? 0 : numero);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ 
            descricao: `Repasse: ${profissional}`, 
            valor: valor, // Já é um número, não precisa parseFloat
            tipo: 'SAIDA', 
            forma: forma, 
            data: new Date().toISOString().split('T')[0],
            profissionalNome: profissional
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Realizar Repasse</h3>
                    <button onClick={onClose}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded border">
                        <span className="text-xs text-gray-500 uppercase font-bold">Profissional</span>
                        <p className="font-bold text-gray-800">{profissional}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                        
                        {/* 🌟 INPUT ATUALIZADO */}
                        <input 
                            required 
                            type="text" 
                            inputMode="numeric"
                            className="w-full border p-2 rounded text-lg font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500" 
                            // Formata o valor visualmente para BRL (ex: 1.250,00)
                            value={valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                            onChange={handleValorChange} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Forma</label>
                        <select className="w-full border p-2 rounded bg-white" value={forma} onChange={e => setForma(e.target.value)}>
                            <option value="PIX">Pix</option>
                            <option value="DINHEIRO">Dinheiro</option>
                            <option value="TRANSFERENCIA">Transferência</option>
                            <option value="CHEQUE">Cheque</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 mt-2 flex justify-center items-center gap-2 transition transform active:scale-95">
                        <FaCheckCircle /> Confirmar Saída
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ModalPagamento;