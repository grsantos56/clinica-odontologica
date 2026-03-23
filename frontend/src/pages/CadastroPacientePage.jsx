import React, { useState } from 'react';
import Sidebar from '../components/SideBar';
import PacienteService from '../services/PacienteService.js';
import { FaSave, FaUser, FaPhone, FaBirthdayCake, FaMapMarkerAlt, FaIdCard, FaArrowLeft, FaCamera, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// ====================================================================
// FUNÇÕES UTILITÁRIAS
// ====================================================================

const maskCpf = (value) => {
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value;
};

const validateCpfAuth = (strCPF) => {
    if (!strCPF) return false;
    let soma = 0, resto;
    const cpfLimpo = strCPF.replace(/[^\d]+/g, '');

    if (cpfLimpo === "00000000000") return false;
    if (cpfLimpo.length !== 11) return false;

    for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;

    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;

    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

    return true;
};

const gerarCpfAleatorio = () => {
    const aleatorio = (n) => Math.round(Math.random() * n);
    const mod = (dividendo, divisor) => Math.round(dividendo - (Math.floor(dividendo / divisor) * divisor));

    const n1 = aleatorio(9);
    const n2 = aleatorio(9);
    const n3 = aleatorio(9);
    const n4 = aleatorio(9);
    const n5 = aleatorio(9);
    const n6 = aleatorio(9);
    const n7 = aleatorio(9);
    const n8 = aleatorio(9);
    const n9 = aleatorio(9);

    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (mod(d1, 11));
    if (d1 >= 10) d1 = 0;

    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (mod(d2, 11));
    if (d2 >= 10) d2 = 0;

    return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
};

const maskPhone = (value) => {
    value = value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value;
};

export default function CadastroPacientePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Estados da FOTO
    const [fotoArquivo, setFotoArquivo] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

    // Estado do formulário
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        telefone: '',
        email: '',
        dataNascimento: '', 
        endereco: '',
        observacoes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name === 'cpf') finalValue = maskCpf(value);
        if (name === 'telefone') finalValue = maskPhone(value);
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    // 🌟 HANDLER ATUALIZADO PARA 10MB
    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Limite de 10MB (10 * 1024 * 1024 bytes)
            const maxSize = 10 * 1024 * 1024; 
            if (file.size > maxSize) {
                alert("A imagem selecionada é muito grande! Por favor, escolha uma imagem menor que 10MB.");
                e.target.value = null; // Limpa o input
                return;
            }

            setFotoArquivo(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoverFoto = () => {
        setFotoArquivo(null);
        setFotoPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let cpfParaSalvar = formData.cpf;
        if (!cpfParaSalvar) {
            cpfParaSalvar = gerarCpfAleatorio();
        }

        if (!validateCpfAuth(cpfParaSalvar)) {
            alert('O CPF é inválido.');
            return;
        }

        setLoading(true);
        try {
            const cpfLimpo = cpfParaSalvar.replace(/\D/g, ''); 

            const pacienteData = {
                ...formData,
                cpf: cpfLimpo,
                nascimento: formData.dataNascimento,
                areaAtendimento: 'ATENDIMENTO_GERAL' 
            };
            delete pacienteData.dataNascimento;

            if (fotoArquivo) {
                const formDataToSend = new FormData();
                formDataToSend.append("paciente", JSON.stringify(pacienteData));
                formDataToSend.append("foto", fotoArquivo);

                await PacienteService.salvarPacienteComFoto(formDataToSend);
            } else {
                await PacienteService.salvarPaciente(pacienteData);
            }
            
            alert('Paciente salvo com sucesso!');
            navigate('/pacientes');
        } catch (error) {
            console.error("Erro ao salvar:", error);
            
            if (error.message && (error.message.includes("413") || error.message.includes("Too Large"))) {
                alert("Erro: A imagem enviada é muito grande para o servidor. Verifique se o backend está configurado para 10MB.");
            } else if (error.message && error.message.includes("CPF")) {
                alert("Erro: Já existe um paciente com este CPF.");
            } else {
                alert(`Erro ao salvar paciente: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            <Sidebar />

            <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-y-auto w-full">
                <button 
                    onClick={() => navigate('/pacientes')} 
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium transition-colors"
                >
                    <FaArrowLeft /> Voltar para Lista
                </button>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaUser className="text-indigo-600" /> Novo Paciente
                </h2>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* COLUNA DA FOTO */}
                        <div className="w-full lg:w-1/3 flex flex-col items-center gap-4">
                            <div className="relative group">
                                <label htmlFor="fotoInput" className="cursor-pointer">
                                    {fotoPreview ? (
                                        <img 
                                            src={fotoPreview} 
                                            alt="Preview" 
                                            className="w-40 h-40 rounded-full object-cover border-4 border-indigo-100 hover:opacity-80 transition"
                                        />
                                    ) : (
                                        <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300 text-gray-400 hover:bg-gray-200 hover:border-indigo-300 hover:text-indigo-500 transition">
                                            <FaCamera className="text-4xl" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg">
                                        <FaCamera size={14} />
                                    </div>
                                </label>
                                <input 
                                    type="file" 
                                    id="fotoInput" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFotoChange} 
                                />
                            </div>

                            {fotoPreview && (
                                <button 
                                    type="button" 
                                    onClick={handleRemoverFoto}
                                    className="text-red-500 text-sm flex items-center gap-1 hover:text-red-700"
                                >
                                    <FaTrashAlt /> Remover foto
                                </button>
                            )}
                            <p className="text-sm text-gray-500 text-center">Clique para alterar (Máx 10MB)</p>
                        </div>

                        {/* COLUNA DOS DADOS */}
                        <div className="w-full lg:w-2/3 space-y-4">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                    <div className="p-3 bg-gray-50 text-gray-500"><FaUser /></div>
                                    <input 
                                        type="text" name="nome" required 
                                        value={formData.nome} onChange={handleChange}
                                        className="w-full p-3 outline-none" 
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF (Deixe vazio para gerar auto)</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                        <div className="p-3 bg-gray-50 text-gray-500"><FaIdCard /></div>
                                        <input 
                                            type="text" name="cpf" 
                                            value={formData.cpf} onChange={handleChange}
                                            className="w-full p-3 outline-none" 
                                            placeholder="000.000.000-00"
                                            maxLength="14"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">* Se não informado, um CPF válido será gerado.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento *</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                        <div className="p-3 bg-gray-50 text-gray-500"><FaBirthdayCake /></div>
                                        <input 
                                            type="date" name="dataNascimento" required
                                            value={formData.dataNascimento} onChange={handleChange}
                                            className="w-full p-3 outline-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                        <div className="p-3 bg-gray-50 text-gray-500"><FaPhone /></div>
                                        <input 
                                            type="text" name="telefone" required
                                            value={formData.telefone} onChange={handleChange}
                                            className="w-full p-3 outline-none" 
                                            placeholder="(00) 00000-0000"
                                            maxLength="15"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                        <div className="p-3 bg-gray-50 text-gray-500"><FaMapMarkerAlt /></div>
                                        <input 
                                            type="text" name="endereco"
                                            value={formData.endereco} onChange={handleChange}
                                            className="w-full p-3 outline-none" 
                                            placeholder="Rua, Número, Bairro..."
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    name="observacoes" rows="3"
                                    value={formData.observacoes} onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500"
                                    placeholder="Alergias, histórico..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Paciente'} <FaSave />
                                </button>
                            </div>

                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}