import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaUser, FaPhone, FaEnvelope, FaBirthdayCake, FaMapMarkerAlt, 
    FaIdCard, FaSave, FaCamera, FaWhatsapp, FaBriefcaseMedical, FaTrash 
} from 'react-icons/fa';
// CORREÇÃO AQUI: Adicionado mais um "../" para navegar da pasta 'tabs' para 'src'
import PacienteService from '../../services/PacienteService';


// Componente visual de Input reutilizável localmente
const InputField = ({ name, type = 'text', placeholder, icon: Icon, disabled = false, value, onChange, label }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm">
            <div className={`p-3 text-gray-500 ${disabled ? 'bg-gray-200' : 'bg-gray-50'}`}>
                <Icon />
            </div>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`flex-1 p-3 outline-none w-full min-w-0 ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
        </div>
    </div>
);

export default function PacienteCadastroTab({ paciente, onUpdate }) {
    const navigate = useNavigate();
    const dataFormatada = paciente.nascimento && paciente.nascimento.includes('/') 
        ? paciente.nascimento.split('/').reverse().join('-') 
        : paciente.nascimento || '';

    const [formData, setFormData] = useState({
        id: paciente.id, 
        nome: paciente.nome || '',
        cpf: paciente.cpf || '',
        nascimento: dataFormatada, 
        telefone: paciente.telefone || '',
        email: paciente.email || '',
        endereco: paciente.endereco || '',
        observacoes: paciente.observacoes || '',
        areaAtendimento: paciente.areaAtendimento || 'ATENDIMENTO_GERAL',
        statusFinanceiro: paciente.statusFinanceiro, 
        saldoDevedor: paciente.saldoDevedor,
        foto: paciente.foto || null, 
    });

    const [novaFotoFile, setNovaFotoFile] = useState(null);
    const [novaFotoPreview, setNovaFotoPreview] = useState(paciente.foto ? paciente.foto : null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'foto' && files && files[0]) {
            const file = files[0];
            setNovaFotoFile(file);
            setNovaFotoPreview(URL.createObjectURL(file));
            return;
        } 
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveCadastro = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const dadosParaEnviar = { 
                ...formData, 
                cpf: formData.cpf ? formData.cpf.replace(/[^\d]/g, '') : null,
                foto: novaFotoFile ? null : paciente.foto, 
            };

            const formDataParaApi = new FormData();
            if (novaFotoFile) {
                formDataParaApi.append('foto', novaFotoFile); 
            }
            formDataParaApi.append('paciente', JSON.stringify(dadosParaEnviar));
            
            await PacienteService.salvarPacienteComFoto(formDataParaApi); 
            
            if (novaFotoFile && novaFotoPreview) {
                 URL.revokeObjectURL(novaFotoPreview);
            }
            
            alert("Cadastro atualizado com sucesso!");
            onUpdate(); // Atualiza a página pai
        } catch (err) {
            alert(err.message || 'Falha ao salvar o cadastro.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendWhatsapp = () => {
        const telefoneLimpo = formData.telefone.replace(/[^\d]/g, '');
        if (telefoneLimpo) {
            window.open(`https://wa.me/55${telefoneLimpo}`, '_blank');
        } else {
            alert('Número inválido.');
        }
    };

    const handleDeletePaciente = async () => {
        if (window.confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR o paciente ${formData.nome}? Essa ação não pode ser desfeita.`)) {
            try {
                setLoading(true);
                await PacienteService.deletarPaciente(paciente.id);
                alert("Paciente excluído com sucesso.");
                navigate('/pacientes'); // Redireciona para a lista
            } catch (err) {
                alert("Erro ao excluir: " + err.message);
                setLoading(false);
            }
        }
    };

    return (
        <form onSubmit={handleSaveCadastro} className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in w-full">
            {/* Seção da Foto */}
            <div className="flex justify-center">
                <label className="cursor-pointer relative group w-32 h-32 sm:w-40 sm:h-40">
                    <div className="w-full h-full rounded-full border-4 border-gray-200 overflow-hidden shadow-md group-hover:border-indigo-500 transition">
                        {novaFotoPreview ? (
                            <img src={novaFotoPreview} alt="Foto" className="w-full h-full object-cover"/>
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                                <FaUser size={40} />
                            </div>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition">
                        <FaCamera className="text-white opacity-0 group-hover:opacity-100 text-2xl" />
                    </div>
                    <input type="file" name="foto" accept="image/*" onChange={handleChange} className="hidden"/>
                </label>
            </div>

            {/* Grid de Campos - Responsivo: 1 coluna no mobile, 2 no tablet/desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <InputField name="nome" placeholder="Nome Completo" label="Nome" icon={FaUser} value={formData.nome} onChange={handleChange} />
                <InputField name="cpf" placeholder="CPF" label="CPF" icon={FaIdCard} value={formData.cpf} onChange={handleChange} />
                <InputField name="telefone" placeholder="Telefone" label="Telefone" icon={FaPhone} value={formData.telefone} onChange={handleChange} />
                <InputField name="email" placeholder="E-mail" label="E-mail" icon={FaEnvelope} value={formData.email} onChange={handleChange} />
                <InputField name="nascimento" type="date" label="Data de Nascimento" icon={FaBirthdayCake} value={formData.nascimento} onChange={handleChange} />
                <InputField name="endereco" placeholder="Endereço" label="Endereço" icon={FaMapMarkerAlt} value={formData.endereco} onChange={handleChange} />
                <InputField name="areaAtendimento" label="Área de Atendimento" icon={FaBriefcaseMedical} disabled value={formData.areaAtendimento} onChange={handleChange} />
            </div>

            {/* Observações */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações Clínicas</label>
                <textarea 
                    name="observacoes" 
                    rows="4" 
                    value={formData.observacoes} 
                    onChange={handleChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
            </div>

            {/* Botões de Ação - Responsivo: Coluna reversa no mobile (Excluir embaixo), Linha no Tablet */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-6 border-t">
                {/* Botão Deletar 
                <button 
                    type="button" 
                    onClick={handleDeletePaciente} 
                    className="w-full sm:w-auto px-6 py-3 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
                >
                    <FaTrash /> Excluir Paciente
                </button> */}

                {/* Botões Principais (WhatsApp e Salvar) */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button 
                        type="button" 
                        onClick={handleSendWhatsapp} 
                        className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                        <FaWhatsapp size={20} /> WhatsApp
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                        <FaSave size={20} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </form>
    );
}