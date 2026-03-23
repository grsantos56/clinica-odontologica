import React, { useState } from 'react';
import AuthService from '../services/AuthService';
import { FaEnvelope, FaLock, FaKey, FaCheckCircle, FaSpinner } from 'react-icons/fa';

export default function ForgotPasswordModal({ show, onClose }) {
    if (!show) return null;

    // Estados do Fluxo
    const [step, setStep] = useState(1); // 1: Email, 2: Código + Nova Senha
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Dados do Formulário
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Passo 1: Enviar Código
    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await AuthService.sendResetCode(email);
            setMessage({ text: 'Código enviado! Verifique seu e-mail.', type: 'success' });
            setStep(2); // Avança para o próximo passo
        } catch (error) {
            const msg = error.response?.data?.message || 'Erro ao enviar código. Verifique o e-mail.';
            setMessage({ text: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Passo 2: Redefinir Senha
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'As senhas não conferem.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            await AuthService.resetPassword(email, code, newPassword);
            setMessage({ text: 'Senha alterada com sucesso! Faça login.', type: 'success' });
            
            // Fecha o modal após 2 segundos
            setTimeout(() => {
                onClose();
                setStep(1); // Reseta para a próxima vez
                setCode('');
                setNewPassword('');
                setConfirmPassword('');
                setMessage('');
            }, 2000);

        } catch (error) {
            const msg = error.response?.data?.message || 'Erro ao redefinir senha. Código inválido?';
            setMessage({ text: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
                
                {/* Botão Fechar */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">
                    &times;
                </button>

                <h3 className="text-2xl font-bold mb-2 text-indigo-700 text-center">Recuperar Senha</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    {step === 1 ? 'Informe seu e-mail para receber o código.' : 'Insira o código recebido e sua nova senha.'}
                </p>

                {step === 1 ? (
                    /* --- ETAPA 1: E-MAIL --- */
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="relative">
                            <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="Seu e-mail cadastrado" 
                                required 
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : 'Enviar Código'}
                        </button>
                    </form>
                ) : (
                    /* --- ETAPA 2: CÓDIGO + NOVA SENHA --- */
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="relative">
                            <FaKey className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                value={code} 
                                onChange={(e) => setCode(e.target.value)} 
                                placeholder="Código de 6 dígitos" 
                                required 
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="Nova Senha" 
                                required 
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="relative">
                            <FaCheckCircle className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                placeholder="Confirme a Nova Senha" 
                                required 
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none ${
                                    confirmPassword && newPassword !== confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                                }`} 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : 'Alterar Senha'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setStep(1)}
                            className="w-full text-sm text-gray-500 hover:text-indigo-600 underline"
                        >
                            Voltar e reenviar código
                        </button>
                    </form>
                )}

                {message.text && (
                    <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}