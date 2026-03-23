// src/components/ModalEdicaoAgendamento.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaSave, FaUser, FaCalendarDay, FaClock, FaBriefcaseMedical, FaTooth, FaSpinner } from 'react-icons/fa';
import ProfissionalService from '../services/ProfissionalService'; 

// --- FUNÇÕES AUXILIARES ---
const extractDateFromDataHora = (dataHoraStr) => {
    if (!dataHoraStr || typeof dataHoraStr !== 'string' || dataHoraStr.length < 10) return '';
    return dataHoraStr.substring(0, 10);
};

const extractHorarioFromDataHora = (dataHoraStr) => {
    if (!dataHoraStr || typeof dataHoraStr !== 'string' || dataHoraStr.length < 16) return '';
    return dataHoraStr.substring(11, 16);
};

const mapToValidString = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
        return String(obj.nome || ''); 
    }
    return String(obj || '');
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

/**
 * Gera uma lista de horários de 10 em 10 minutos, das 06:00 às 20:00.
 */
const generateTimeSlots = () => {
    const slots = [];
    const startHour = 6; 
    const endHour = 20; 
    const intervalMinutes = 10;

    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += intervalMinutes) {
            const hour = String(h).padStart(2, '0');
            const minute = String(m).padStart(2, '0');
            slots.push(`${hour}:${minute}`);
        }
    }
    return slots;
};

// --- COMPONENTE DE INPUT ---
const InputField = ({ name, type = 'text', icon: Icon, disabled = false, options = null, value: customValue, onChange, formData, min = null }) => {
    const isSelect = options && Array.isArray(options);
    const isProfissionalSelect = name === 'profissionalNome' && isSelect && options.length > 0 && typeof options[0] === 'object';
    
    return (
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
            <div className={`p-3 text-gray-500 ${disabled ? 'bg-gray-200' : 'bg-gray-100'}`}><Icon /></div>
            
            {isSelect ? (
                <select
                    name={name} value={formData[name]} onChange={onChange} disabled={disabled}
                    className={`flex-1 p-3 focus:ring-indigo-500 focus:border-indigo-500 ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
                    {!formData[name] && <option value="" disabled>Selecione</option>}
                    {options.map(opt => {
                        const val = isProfissionalSelect ? opt.nome : opt;
                        const key = isProfissionalSelect ? opt.id : opt;
                        return <option key={key} value={val}>{val}</option>;
                    })}
                </select>
            ) : (
                <input
                    type={type} name={name} value={customValue || formData[name]} onChange={onChange} disabled={disabled}
                    min={min}
                    className={`flex-1 p-3 focus:ring-indigo-500 focus:border-indigo-500 ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            )}
        </div>
    );
};

const ModalEdicaoAgendamento = ({ agendamento, onClose, onSave }) => {
    const [loadingProfissionais, setLoadingProfissionais] = useState(false);
    const [profissionaisDisponiveis, setProfissionaisDisponiveis] = useState([]);

    const areas = ["ODONTOLOGIA", "FISIOTERAPIA", "NUTRICIONISTA", "PSICOLOGIA"];
    const tiposAgendamento = ["Consulta Inicial Odontológica", "Retorno", "Revisão", "Avaliação"];
    
    const timeSlots = useMemo(() => generateTimeSlots(), []);

    const [formData, setFormData] = useState({
        data: extractDateFromDataHora(agendamento.dataHora),
        horario: extractHorarioFromDataHora(agendamento.dataHora),
        tipo: agendamento.procedimento || '', 
        profissionalNome: mapToValidString(agendamento.profissional),
        profissionalId: agendamento.profissional?.id || null,
        area: agendamento.area || '',
        notas: agendamento.notas || '',
    });

    useEffect(() => {
        const fetchProfs = async () => {
            if (!formData.area) return;
            setLoadingProfissionais(true);
            try {
                const data = await ProfissionalService.buscarPorArea(formData.area);
                setProfissionaisDisponiveis(data);
            } catch (error) {
                console.error("Erro ao carregar profissionais:", error);
                setProfissionaisDisponiveis([]);
            } finally {
                setLoadingProfissionais(false);
            }
        };
        fetchProfs();
    }, [formData.area]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let newState = { ...prev, [name]: value };
            if (name === 'area') {
                newState.profissionalNome = '';
                newState.profissionalId = null;
            }
            if (name === 'profissionalNome') {
                const selectedProfissional = profissionaisDisponiveis.find(p => p.nome === value);
                newState.profissionalId = selectedProfissional ? selectedProfissional.id : null;
            }
            return newState;
        });
    };

    const handleSaveSubmit = (e) => {
        e.preventDefault();
        if (!formData.profissionalId || !formData.horario || !formData.data) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        
        const dataHoraCombinada = `${formData.data}T${formData.horario}:00`; 

        const payload = {
            id: agendamento.id,
            paciente: { id: agendamento.paciente?.id },
            dataHora: dataHoraCombinada, 
            status: agendamento.status, // 🌟 Mantém o status original sem alteração
            area: formData.area,
            procedimento: formData.tipo, 
            notas: formData.notas,
            profissional: { id: formData.profissionalId },
        };

        onSave(payload);
    };
    
    const profissionalOptions = profissionaisDisponiveis.map(p => ({ id: p.id, nome: p.nome }));
    
    const filteredTimeSlots = formData.data === getTodayDateString() 
        ? timeSlots.filter(slot => {
            const now = new Date();
            const slotDateTime = new Date(`${formData.data}T${slot}:00`);
            return slotDateTime > now; 
        })
        : timeSlots;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Editar Agendamento</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                </div>
                <form onSubmit={handleSaveSubmit} className="space-y-4">
                    <InputField 
                        name="paciente" 
                        icon={FaUser} 
                        disabled 
                        value={mapToValidString(agendamento.paciente)} 
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <InputField 
                            name="data" 
                            type="date" 
                            icon={FaCalendarDay} 
                            formData={formData} 
                            onChange={handleChange}
                            min={getTodayDateString()}
                        />
                        <InputField 
                            name="horario" 
                            icon={FaClock} 
                            options={filteredTimeSlots} 
                            formData={formData} 
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <InputField name="area" icon={FaBriefcaseMedical} options={areas} formData={formData} onChange={handleChange} />
                        {loadingProfissionais ? (
                             <div className="flex items-center gap-2 p-3 text-gray-500 border border-gray-300 rounded-lg bg-white">
                                <FaSpinner className='animate-spin' /> Carregando...
                             </div>
                        ) : (
                             <InputField 
                                 name="profissionalNome" 
                                 icon={FaUser} 
                                 options={profissionalOptions} 
                                 formData={formData} 
                                 onChange={handleChange} 
                             />
                        )}
                    </div>
                    
                    <InputField name="tipo" icon={FaTooth} options={tiposAgendamento} formData={formData} onChange={handleChange} />
                    
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas/Observações</label>
                        <textarea
                            name="notas"
                            rows="2"
                            value={formData.notas}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Notas da consulta..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancelar</button>
                        <button 
                             type="submit" 
                             className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                             disabled={loadingProfissionais || !formData.profissionalId || !formData.horario}
                        >
                            <FaSave className="inline mr-1" /> Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEdicaoAgendamento;