// src/components/ConfirmCodeModal.jsx
import React, { useState } from 'react';
import AuthService from '../services/AuthService';

export default function ConfirmCodeModal({ show, onClose, email, onSuccess }) {
    if (!show) return null;

    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [confirming, setConfirming] = useState(false);

    const handleConfirm = async (e) => {
        e.preventDefault();
        setMessage('');
        setConfirming(true);

        try {
            await AuthService.confirmAccount(email, code);
            setMessage('Sucesso! Sua conta está ativa. Redirecionando para o login...');
            
            setTimeout(() => {
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
            }, 1500);
            
        } catch (error) {
            const resMessage = error.response?.data || error.message || 'Código inválido ou expirado.';
            setMessage(resMessage);
            setConfirming(false);
        }
    };

    return (
        /* Ajuste: px-4 no overlay para garantir margem lateral no mobile */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-2xl w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4 text-indigo-600">Confirmação por E-mail</h3>
                <p className="mb-4 text-sm text-gray-700">
                    Um código de 6 dígitos foi enviado para **{email}**. Insira-o abaixo para ativar sua conta.
                </p>

                <form onSubmit={handleConfirm} className="space-y-4">
                    <input 
                        type="text" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        placeholder="Código de Confirmação (6 dígitos)" 
                        required 
                        maxLength="6" 
                        className="w-full px-4 py-2 border rounded-lg text-center text-xl tracking-wider outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                    
                    <button 
                        type="submit" 
                        disabled={confirming} 
                        className={`w-full py-2 font-semibold text-white rounded-lg transition duration-200 ${confirming ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {confirming ? 'Confirmando...' : 'Confirmar Conta'}
                    </button>
                </form>
                
                {message && (
                    <div className={`mt-4 text-sm text-center ${message.startsWith('Sucesso') ? 'text-green-600' : 'text-red-500'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}