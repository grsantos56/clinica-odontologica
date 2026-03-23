import React, { useState } from 'react';
import Sidebar from '../components/SideBar';
import ProfissionalService from '../services/ProfissionalService'; 
import { FaSave, FaUser, FaPhone, FaEnvelope, FaBriefcaseMedical, FaIdCard, FaArrowLeft, FaUserTie, FaKey, FaCamera } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Opções ENUM do Backend
const AREAS = ["ODONTOLOGIA", "FISIOTERAPIA", "NUTRICIONISTA", "PSICOLOGIA", "ATENDIMENTO_GERAL"];
const TIPOS = ["DENTISTA", "FISIOTERAPEUTA", "NUTRICIONISTA", "PSICOLOGO", "ATENDENTE"];

// ====================================================================
// COMPONENTES AUXILIARES
// ====================================================================

// Componente Input Field reutilizável
const InputField = ({ name, type = 'text', placeholder, icon: Icon, required = false, value, onChange }) => (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white w-full">
        <div className="p-3 bg-gray-100 text-gray-500">
            <Icon />
        </div>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className="flex-1 p-3 w-full focus:ring-0 focus:outline-none min-w-0"
        />
    </div>
);

// Componente Select Field
const SelectField = ({ name, placeholder, icon: Icon, options, required = false, value, onChange }) => (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white w-full">
        <div className="p-3 bg-gray-100 text-gray-500">
            <Icon />
        </div>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="flex-1 p-3 w-full focus:ring-0 focus:outline-none bg-white appearance-none min-w-0"
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </div>
);
// ====================================================================


export default function CadastroProfissionalPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nome: '',
        crmOuRegistro: '',
        password: '', // Campo de senha
        areaAtendimento: AREAS[0], 
        tipoProfissional: TIPOS[0],
        telefone: '',
        email: '',
    });
    
    const [photoFile, setPhotoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // HANDLER DE FOTO
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setPhotoFile(file);
        
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        const { nome, tipoProfissional, crmOuRegistro, password } = formData;
        
        // Validação básica da senha
        if (!password || password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            setLoading(false);
            return;
        }

        // --- 1. Lógica de tratamento para tipos sem registro (Backend exige UNIQUE) ---
        let registroFinal = crmOuRegistro ? crmOuRegistro.trim() : '';

        if ((tipoProfissional === 'ATENDENTE' || tipoProfissional === 'ADMINISTRADOR')) {
            if (!registroFinal) {
                registroFinal = `${tipoProfissional}_${Date.now()}`; 
            }
        } else if (!registroFinal) {
             setError("O campo CRM/Registro é obrigatório para profissionais de saúde.");
             setLoading(false);
             return;
        }

        // --- 2. PREPARAÇÃO DO MULTIPART FORM DATA ---
        const dadosParaApi = {
            ...formData,
            crmOuRegistro: registroFinal, 
        };
        
        const data = new FormData();
        // Anexa o JSON dos dados do profissional
        data.append('profissional', JSON.stringify(dadosParaApi));

        // Anexa a foto (MultipartFile)
        if (photoFile) {
            data.append('foto', photoFile);
        }
        
        try {
            // CHAMA O ENDPOINT MULTIPART
            const novoProfissional = await ProfissionalService.salvarProfissionalComFoto(data);
            
            alert(`Profissional ${novoProfissional.nome} cadastrado!`);
            
            // Redirecionar para a lista
            navigate('/configuracoes/profissionais'); 
            
        } catch (err) {
            const msg = err.message || "Erro desconhecido ao salvar.";
            if (msg.includes("Status: 400")) {
                setError("Falha na validação ou e-mail/registro já cadastrado.");
            } else {
                setError(`Falha ao cadastrar: ${msg}`);
            }
        } finally {
            // Limpa a URL de pré-visualização
            if(previewUrl) URL.revokeObjectURL(previewUrl);
            setLoading(false);
        }
    };

    return (
        // Alterado: flex-col para mobile, md:flex-row para tablet+ e min-h-screen
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            <Sidebar />

            {/* Alterado: padding responsivo (p-4 mobile, p-8 tablet+) */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <button
                    onClick={() => navigate('/configuracoes/profissionais')}
                    className="mt-14 md:mt-0 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
                >
                    <FaArrowLeft /> Voltar para Lista
                </button>
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                    Cadastro de Novo Profissional
                </h2>
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center">
                        {/* Alterado: padding interno do card responsivo */}
                        <div className="w-full max-w-2xl space-y-4 bg-white p-4 md:p-8 rounded-xl shadow-lg">
                            
                            {/* 🌟 Seção Foto de Perfil 🌟 */}
                            <div className='flex flex-col items-center pb-4 border-b border-gray-200'>
                                <div className='relative w-28 h-28 mb-3'>
                                    <img 
                                        src={previewUrl || `https://placehold.co/112x112/f3f4f6/4b5563?text=Foto`}
                                        alt="Pré-visualização"
                                        className="w-full h-full object-cover rounded-full border-4 border-indigo-200 shadow-md"
                                    />
                                    {/* Ícone de Câmera sobreposto */}
                                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition">
                                        <FaCamera />
                                        <input 
                                            id="photo-upload" 
                                            type="file" 
                                            name="foto" 
                                            onChange={handleFileChange} 
                                            accept="image/*" 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>
                                <p className="text-sm text-gray-500">{photoFile ? photoFile.name : 'Escolher foto de perfil'}</p>
                            </div>

                            <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                                <FaUser /> Detalhes do Profissional
                            </h3>
                            
                            {/* Nome e Tipo - Grid Responsivo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField name="nome" placeholder="Nome Completo *" icon={FaUser} required value={formData.nome} onChange={handleChange} />
                                <SelectField 
                                    name="tipoProfissional" 
                                    placeholder="Tipo *" 
                                    icon={FaUserTie} 
                                    options={TIPOS}
                                    required
                                    value={formData.tipoProfissional} 
                                    onChange={handleChange}
                                />
                            </div>
                            
                            {/* Área e Registro - Grid Responsivo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField 
                                    name="areaAtendimento" 
                                    placeholder="Área de Atendimento *" 
                                    icon={FaBriefcaseMedical} 
                                    options={AREAS}
                                    required
                                    value={formData.areaAtendimento} 
                                    onChange={handleChange}
                                />
                                <InputField 
                                    name="crmOuRegistro" 
                                    placeholder="CRM / CREFITO / Registro" 
                                    icon={FaIdCard} 
                                    value={formData.crmOuRegistro} 
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Contatos e Senha - Grid Responsivo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField name="telefone" placeholder="Telefone" icon={FaPhone} value={formData.telefone} onChange={handleChange} />
                                <InputField name="email" type="email" placeholder="E-mail *" icon={FaEnvelope} required value={formData.email} onChange={handleChange} />
                                {/* CAMPO DE SENHA */}
                                <InputField name="password" type="password" placeholder="Senha (Mín. 6 caracteres) *" icon={FaKey} required value={formData.password} onChange={handleChange} />
                            </div>

                            {/* Botão de Salvar */}
                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    // Alterado: w-full mobile, w-auto desktop
                                    className="w-full md:w-auto justify-center flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
                                >
                                    {loading ? 'Salvando...' : (<><FaSave /> Cadastrar Profissional</>)}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}