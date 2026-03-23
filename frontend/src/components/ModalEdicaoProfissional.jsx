import React, { useState } from 'react';
import { FaTimes, FaSave, FaUser, FaPhone, FaEnvelope, FaIdCard, FaBriefcaseMedical, FaUserTie, FaKey, FaCamera, FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaPaperPlane } from 'react-icons/fa'; 
import AuthService from '../services/AuthService'; // 🌟 Importe o AuthService

const BASE_URL_SERVER = "http://localhost:8080/"; 

const AREAS = ["ODONTOLOGIA", "FISIOTERAPIA", "NUTRICIONISTA", "PSICOLOGIA", "ATENDIMENTO_GERAL"];
const TIPOS = ["DENTISTA", "FISIOTERAPEUTA", "NUTRICIONISTA", "PSICOLOGO", "ATENDENTE", "ADMINISTRADOR"];

const getDisplayValue = (value) => {
    if (!value) return '';
    return value.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// 🌟 INPUT ATUALIZADO: Suporta ícone clicável na direita (Olho)
const InputField = ({ name, type = 'text', placeholder, icon: Icon, disabled = false, value, onChange, required = false, rightIcon: RightIcon, onRightIconClick }) => (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white relative">
        <div className={`p-3 text-gray-500 ${disabled ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <Icon />
        </div>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`flex-1 p-3 pr-10 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
        {RightIcon && (
            <div 
                onClick={onRightIconClick} 
                className="absolute right-3 text-gray-400 hover:text-indigo-600 cursor-pointer transition"
            >
                <RightIcon />
            </div>
        )}
    </div>
);

const SelectField = ({ name, placeholder, icon: Icon, options, required = false, value, onChange }) => (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="p-3 bg-gray-100 text-gray-500"><Icon /></div>
        <select name={name} value={value} onChange={onChange} required={required} className="flex-1 p-3 focus:ring-0 focus:outline-none bg-white appearance-none">
            <option value="" disabled>{placeholder}</option>
            {options.map(option => <option key={option} value={option}>{getDisplayValue(option)}</option>)}
        </select>
    </div>
);

export default function ModalEdicaoProfissional({ profissional, onClose, onSave }) {
    
    const isAdmin = profissional.tipoProfissional === 'ADMINISTRADOR';

    // ESTADOS DE DADOS
    const [formData, setFormData] = useState({
        id: profissional.id,
        nome: profissional.nome || '',
        crmOuRegistro: profissional.crmOuRegistro || '',
        areaAtendimento: profissional.areaAtendimento || AREAS[0],
        tipoProfissional: profissional.tipoProfissional || TIPOS[0],
        telefone: profissional.telefone || '',
        email: profissional.email || '',
        password: '', 
        confirmPassword: '' // 🌟 Novo campo
    });

    // ESTADOS VISUAIS
    const [photoFile, setPhotoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(profissional.foto ? `${BASE_URL_SERVER}${profissional.foto}` : null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [showPassword, setShowPassword] = useState(false); // Toggle Olho

    // 🌟 ESTADOS ESPECÍFICOS PARA FLUXO DE ADMIN
    const [adminPassStep, setAdminPassStep] = useState('IDLE'); // IDLE, CODE_SENT, VERIFIED
    const [resetCode, setResetCode] = useState('');
    const [adminNewPass, setAdminNewPass] = useState('');
    const [adminConfirmPass, setAdminConfirmPass] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setPhotoFile(file);
        if (file) setPreviewUrl(URL.createObjectURL(file));
        else if (!profissional.foto) setPreviewUrl(null);
    };

    // --- LÓGICA DE ADMIN: ENVIAR CÓDIGO ---
    const handleSendAdminCode = async () => {
        setModalLoading(true);
        setModalError(null);
        try {
            await AuthService.sendResetCode(formData.email);
            setAdminPassStep('CODE_SENT');
            alert(`Código de verificação enviado para ${formData.email}`);
        } catch (err) {
            setModalError("Erro ao enviar e-mail. Verifique se o e-mail está correto.");
        } finally {
            setModalLoading(false);
        }
    };

    // --- LÓGICA DE ADMIN: REDEFINIR SENHA ---
    const handleAdminResetPassword = async () => {
        if (adminNewPass !== adminConfirmPass) {
            setModalError("As senhas não coincidem.");
            return;
        }
        if (adminNewPass.length < 6) {
            setModalError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }
        setModalLoading(true);
        try {
            // Usa o serviço existente para resetar
            await AuthService.resetPassword(formData.email, resetCode, adminNewPass);
            alert("Senha do administrador alterada com sucesso!");
            setAdminPassStep('IDLE'); // Reseta o fluxo
            setAdminNewPass('');
            setAdminConfirmPass('');
            setResetCode('');
        } catch (err) {
            setModalError("Código inválido ou expirado.");
        } finally {
            setModalLoading(false);
        }
    };

    // --- SUBMIT GERAL (DADOS BÁSICOS) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError(null);
        
        // Validação de Senha (Apenas para NÃO ADMINS neste fluxo)
        let senhaFinal = null;
        if (!isAdmin) {
            if (formData.password) {
                if (formData.password !== formData.confirmPassword) {
                    setModalError("A confirmação da senha não confere.");
                    setModalLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setModalError("A nova senha deve ter pelo menos 6 caracteres.");
                    setModalLoading(false);
                    return;
                }
                senhaFinal = formData.password;
            }
        }

        let registroFinal = formData.crmOuRegistro ? formData.crmOuRegistro.trim() : '';
        if ((formData.tipoProfissional === 'ATENDENTE' || formData.tipoProfissional === 'ADMINISTRADOR') && !registroFinal) {
             registroFinal = `${formData.tipoProfissional}_${Date.now()}_EDIT`;
        } else if ((formData.tipoProfissional !== 'ATENDENTE' && formData.tipoProfissional !== 'ADMINISTRADOR') && !registroFinal) {
             setModalError("O campo CRM/Registro é obrigatório.");
             setModalLoading(false);
             return;
        }

        try {
            const profissionalDataJson = {
                id: formData.id, 
                nome: formData.nome,
                telefone: formData.telefone,
                email: formData.email,
                areaAtendimento: formData.areaAtendimento,
                tipoProfissional: formData.tipoProfissional,
                crmOuRegistro: registroFinal, 
                password: senhaFinal, // Envia null se for Admin (pois ele muda por outro fluxo) ou se não alterou
                foto: photoFile ? null : profissional.foto, 
            };
            
            const data = new FormData();
            data.append('profissional', JSON.stringify(profissionalDataJson));
            if (photoFile) data.append('foto', photoFile);
            
            await onSave(data); 
            onClose(); 
            
        } catch (err) {
            setModalError(err.message || 'Falha ao salvar.');
        } finally {
            setModalLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {isAdmin && <FaUserTie className="text-indigo-600"/>}
                        Editar {isAdmin ? 'Administrador' : 'Profissional'}: {profissional.nome}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                </div>
                
                {modalError && <div className="bg-red-100 text-red-700 p-3 rounded mb-3 text-sm border-l-4 border-red-500">{modalError}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* FOTO */}
                    <div className='flex flex-col items-center'>
                        <div className='relative w-32 h-32 mb-2 group'>
                            <img 
                                src={previewUrl || `https://placehold.co/112x112/f3f4f6/4b5563?text=Foto`}
                                alt="Perfil"
                                className="w-full h-full object-cover rounded-full border-4 border-indigo-50 shadow-lg"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/112x112/f3f4f6/4b5563?text=Foto`; }}
                            />
                            <label htmlFor={`photo-upload-${profissional.id}`} className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition shadow-md">
                                <FaCamera size={14}/>
                                <input id={`photo-upload-${profissional.id}`} type="file" name="foto" onChange={handleFileChange} accept="image/*" className="hidden" />
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">{photoFile ? 'Foto selecionada' : 'Alterar foto'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField name="nome" placeholder="Nome Completo *" icon={FaUser} required value={formData.nome} onChange={handleChange} />
                        <SelectField name="tipoProfissional" placeholder="Tipo *" icon={FaUserTie} options={TIPOS} required value={formData.tipoProfissional} onChange={handleChange}/>
                        <SelectField name="areaAtendimento" placeholder="Área *" icon={FaBriefcaseMedical} options={AREAS} required value={formData.areaAtendimento} onChange={handleChange}/>
                        <InputField name="crmOuRegistro" placeholder="CRM / Registro" icon={FaIdCard} value={formData.crmOuRegistro} onChange={handleChange}/>
                        <InputField name="telefone" placeholder="Telefone" icon={FaPhone} value={formData.telefone} onChange={handleChange} />
                        <InputField name="email" type="email" placeholder="E-mail" icon={FaEnvelope} value={formData.email} onChange={handleChange} disabled={true} />
                    </div>

                    {/* 🌟 ÁREA DE SEGURANÇA (SENHA) 🌟 */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><FaLock/> Segurança</h4>
                        
                        {isAdmin ? (
                            // --- FLUXO ESPECIAL PARA ADMIN ---
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <p className="text-xs text-orange-800 mb-3 font-medium">
                                    <FaUserTie className="inline mr-1"/>
                                    Por segurança, a alteração de senha de administradores requer verificação de e-mail.
                                </p>

                                {adminPassStep === 'IDLE' && (
                                    <button type="button" onClick={handleSendAdminCode} disabled={modalLoading} className="text-sm bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition flex items-center gap-2">
                                        <FaPaperPlane /> Enviar Código para {formData.email}
                                    </button>
                                )}

                                {adminPassStep === 'CODE_SENT' && (
                                    <div className="space-y-3 animate-fade-in">
                                        <InputField 
                                            name="resetCode" placeholder="Digite o código recebido no e-mail" icon={FaKey} 
                                            value={resetCode} onChange={(e) => setResetCode(e.target.value)} 
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField 
                                                name="adminNewPass" type={showPassword ? "text" : "password"} placeholder="Nova Senha" icon={FaKey} 
                                                value={adminNewPass} onChange={(e) => setAdminNewPass(e.target.value)} 
                                                rightIcon={showPassword ? FaEyeSlash : FaEye} onRightIconClick={() => setShowPassword(!showPassword)}
                                            />
                                            <InputField 
                                                name="adminConfirmPass" type={showPassword ? "text" : "password"} placeholder="Confirmar Senha" icon={FaCheckCircle} 
                                                value={adminConfirmPass} onChange={(e) => setAdminConfirmPass(e.target.value)} 
                                            />
                                        </div>
                                        <button type="button" onClick={handleAdminResetPassword} disabled={modalLoading} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition">
                                            {modalLoading ? 'Validando...' : 'Redefinir Senha Agora'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // --- FLUXO PADRÃO PARA OUTROS ---
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <InputField 
                                    name="password" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Nova Senha (opcional)" 
                                    icon={FaKey} 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    rightIcon={showPassword ? FaEyeSlash : FaEye}
                                    onRightIconClick={() => setShowPassword(!showPassword)}
                                />
                                <InputField 
                                    name="confirmPassword" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Confirme a Senha" 
                                    icon={FaCheckCircle} 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    disabled={!formData.password} // Só habilita se digitar senha
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700">Cancelar</button>
                        <button type="submit" disabled={modalLoading} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 shadow-sm">
                            {modalLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}