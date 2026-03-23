// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import AuthService from '../services/AuthService';
import ConfirmCodeModal from '../components/ConfirmCodeModal';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCamera, FaUserCircle } from 'react-icons/fa';

export default function RegisterPage() {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        password: '',
        confirmPassword: '', 
        crmOuRegistro: '',
        areaAtendimento: 'ODONTOLOGIA'
    });
    
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setMessage('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        const payloadToSend = {
            nome: formData.nome,
            email: formData.email,
            password: formData.password,
            crmOuRegistro: formData.crmOuRegistro,
            areaAtendimento: formData.areaAtendimento
        };

        const data = new FormData();
        data.append('profissional', JSON.stringify(payloadToSend)); 

        if (photoFile) {
            data.append('foto', photoFile); 
        }

        try {
            await AuthService.registerAdminWithPhoto(data); 
            setMessage('Registro iniciado! Verifique seu e-mail para o código.');
            setShowModal(true); 
        } catch (error) {
            const resMessage = error.response?.data || error.message || 'Erro ao registrar.';
            setMessage(resMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        /* Ajuste: px-4 no container para evitar que o card toque as bordas no mobile */
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            
            <div className="w-full max-w-md p-6 md:p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-indigo-600">Registro (Admin)</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* UPLOAD DE FOTO */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <label htmlFor="photo-upload" className="cursor-pointer group">
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md group-hover:border-indigo-100 transition">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <FaUserCircle className="text-6xl text-gray-400" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white shadow-sm border-2 border-white hover:bg-indigo-700 transition">
                                    <FaCamera size={14} />
                                </div>
                            </label>
                            <input 
                                id="photo-upload" 
                                type="file" 
                                name="foto" 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden"
                            />
                        </div>
                    </div>

                    <input type="text" name="nome" placeholder="Nome Completo" value={formData.nome} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    
                    <input type="email" name="email" placeholder="E-mail (Login)" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    
                    <input type="text" name="crmOuRegistro" placeholder="CRM/Registro" value={formData.crmOuRegistro} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />

                    {/* SENHA */}
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            placeholder="Senha (Mín. 6 caracteres)" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none pr-10" 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    {/* CONFIRMAÇÃO DE SENHA */}
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="confirmPassword" 
                            placeholder="Confirme sua Senha" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 outline-none pr-10 ${
                                formData.confirmPassword && formData.password !== formData.confirmPassword 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-indigo-500'
                            }`} 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className={`w-full py-3 font-bold text-white rounded-lg shadow transition duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
                    >
                        {loading ? <div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Enviando...</div> : 'Registrar'} 
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 text-sm text-center p-3 rounded ${message.includes('iniciado') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {message}
                    </div>
                )}
                
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">Já tem uma conta? <span onClick={() => navigate('/login')} className="text-indigo-600 font-bold cursor-pointer hover:underline">Fazer Login</span></p>
                </div>
            </div>

            <ConfirmCodeModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                email={formData.email}
                onSuccess={() => navigate('/login')} 
            />
        </div>
    );
}