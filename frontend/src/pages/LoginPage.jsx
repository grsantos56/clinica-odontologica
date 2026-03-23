import React, { useState } from 'react';
import AuthService from '../services/AuthService';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from '../components/ForgotPasswordModal'; 

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showForgotModal, setShowForgotModal] = useState(false); 
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const data = await AuthService.login(email, password);
            
            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                // Salva dados cruciais para o funcionamento dos filtros e permissões
                localStorage.setItem('user_id', data.userId); 
                localStorage.setItem('user_role', data.role); 
            }

            navigate('/home'); 
            window.location.reload(); 

        } catch (error) {
            const resMessage = error.response?.data || error.message || 'Falha no login.';
            setMessage(resMessage);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-indigo-700">Acesso ao Sistema</h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="seu@email.com" 
                            required 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Sua senha" 
                            required 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                        />
                        
                        {/* Link Esqueci Minha Senha */}
                        <div className="flex justify-end mt-1">
                            <button 
                                type="button" 
                                onClick={() => setShowForgotModal(true)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
                            >
                                Esqueci minha senha
                            </button>
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-md">
                        Entrar
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    Primeiro acesso? <a href="/register" className="text-indigo-600 font-bold hover:underline">Registre-se aqui</a>.
                </p>

                {message && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm text-center rounded-lg border border-red-200">
                        {message}
                    </div>
                )}
            </div>

            {/* Modal de Recuperação de Senha */}
            <ForgotPasswordModal 
                show={showForgotModal} 
                onClose={() => setShowForgotModal(false)} 
            />
        </div>
    );
}