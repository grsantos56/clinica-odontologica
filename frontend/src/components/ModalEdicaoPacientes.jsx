// components/ModalEdicaoPaciente.jsx
import React, { useState } from 'react';
import { FaTimes, FaSave, FaUser, FaPhone, FaEnvelope, FaBirthdayCake, FaIdCard, FaMapMarkerAlt, FaDollarSign, FaCamera, FaBriefcaseMedical } from 'react-icons/fa'; 

// Opções de Área (Deve refletir o Enum Java em UPPERCASE)
const areasAtendimento = ["ODONTOLOGIA", "FISIOTERAPIA", "NUTRICIONISTA", "PSICOLOGIA", "CLINICA_GERAL"];

// Componente Auxiliar de Input
const InputField = ({ name, type = 'text', placeholder, icon: Icon, disabled = false, value, onChange }) => (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
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
            className={`flex-1 p-3 focus:ring-indigo-500 focus:border-indigo-500 ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
    </div>
);

// Componente Auxiliar de Select
const SelectField = ({ name, placeholder, icon: Icon, options, required = false, value, onChange, disabled = false }) => (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className={`p-3 text-gray-500 ${disabled ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <Icon />
        </div>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`flex-1 p-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </div>
);


export default function ModalEdicaoPaciente({ paciente, onClose, onSave }) { 
    
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
        statusFinanceiro: paciente.statusFinanceiro || 'SEM_DEBITOS', // Assumindo valor ENUM
        areaAtendimento: paciente.areaAtendimento || areasAtendimento[0], // ADICIONADO CAMPO
        fotoUrl: paciente.fotoUrl || null,
    });

    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [imagePreview, setImagePreview] = useState(paciente.fotoUrl || null);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError(null);
        
        try {
            // Prepara os dados para o backend (Limpando CPF, garantindo ID)
            const dadosParaEnviar = {
                ...formData,
                cpf: formData.cpf ? formData.cpf.replace(/[^\d]/g, '') : null,
                // Garantimos que o Status Financeiro seja enviado em UPPERCASE (ENUM)
                // O valor pode precisar ser convertido se vier do BD como 'Com Débitos em Aberto'
                statusFinanceiro: formData.statusFinanceiro.toUpperCase().replace(/\s/g, '_'),
            };
            
            await onSave(dadosParaEnviar); 
            onClose(); 
        } catch (err) {
            setModalError(err.message || 'Falha ao salvar as alterações. Verifique o console.');
        } finally {
            setModalLoading(false);
        }
    };
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full">
                
                {/* Cabeçalho */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Editar Paciente: {paciente.nome}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes />
                    </button>
                </div>
                
                {modalError && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-3 text-sm">{modalError}</div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="overflow-y-auto max-h-[70vh] pr-2 space-y-4">
                        
                        {/* Status Financeiro (BLOQUEADO) */}
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <label className="block text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                                <FaDollarSign /> Status Financeiro (Somente Leitura)
                            </label>
                            {/* NOTE: Enviamos o valor bruto do ENUM no campo statusFinanceiro para o backend */}
                            <InputField name="statusFinanceiro" type="text" value={formData.statusFinanceiro} icon={FaDollarSign} disabled={true} onChange={handleChange} />
                            <p className="text-xs text-red-600 mt-1">Este dado só pode ser alterado pelo setor Financeiro.</p>
                        </div>

                        {/* Dados Cadastrais Editáveis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <InputField name="nome" placeholder="Nome Completo" icon={FaUser} required value={formData.nome} onChange={handleChange} />
                            <InputField name="cpf" placeholder="CPF" icon={FaIdCard} value={formData.cpf || ''} onChange={handleChange} />
                            <InputField name="telefone" placeholder="Telefone" icon={FaPhone} value={formData.telefone} onChange={handleChange} />
                            <InputField name="email" placeholder="E-mail" icon={FaEnvelope} value={formData.email} onChange={handleChange} />
                            <InputField name="nascimento" type="date" placeholder="Nascimento (AAAA-MM-DD)" icon={FaBirthdayCake} value={formData.nascimento} onChange={handleChange} />
                            <InputField name="endereco" placeholder="Endereço Completo" icon={FaMapMarkerAlt} value={formData.endereco} onChange={handleChange} />
                            
                            {/* CAMPO OBRIGATÓRIO: AREA DE ATENDIMENTO */}
                            <SelectField 
                                name="areaAtendimento" 
                                placeholder="Área de Atendimento *" 
                                icon={FaBriefcaseMedical} 
                                options={areasAtendimento}
                                required={true}
                                value={formData.areaAtendimento}
                                onChange={handleChange}
                            />
                            
                        </div>
                    </div>
                    
                    {/* Rodapé e Ações */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button type="submit" disabled={modalLoading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400">
                            {modalLoading ? 'Salvando...' : (<><FaSave className="inline mr-1" /> Salvar Alterações</>)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}