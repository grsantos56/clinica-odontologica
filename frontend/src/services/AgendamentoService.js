// src/services/agendamentoService.js

import api from './api'; 

const AgendamentoService = {
    
    // --- MÉTODOS CRUD E INSERÇÃO ---
    salvarAgendamento: async (agendamentoData) => {
        try {
            const response = await api.post('/agendamentos', agendamentoData);
            return response.data;
        } catch (error) {
            const msg = error.response?.data || error.message;
            throw new Error(`Erro ao agendar: ${msg}`);
        }
    },

    deletarAgendamento: async (id) => {
        try {
            await api.delete(`/agendamentos/${id}`);
            return true;
        } catch (error) {
            console.error(`Erro ao deletar agendamento ${id}:`, error);
            throw new Error("Falha ao deletar o agendamento.");
        }
    },

    // --- BUSCA DE PACIENTES PARA RETORNO ---
    listarPacientesComRetornoPendente: async () => {
        try {
            const response = await api.get('/agendamentos/retornos-pendentes'); 
            return response.data;

        } catch (error){
            console.error("Falha ao buscar retornos pendentes:", error);
            return []; 
        }
    },
    
    // 🌟 ÚLTIMO AGENDAMENTO CONCLUÍDO 🌟
    buscarUltimoAgendamentoConcluidoPorPaciente: async (idPaciente) => {
        try {
            const response = await api.get(`/agendamentos/paciente/${idPaciente}/ultimo-concluido`);
            return response.data; 
        } catch (error) {
            if (error.response && (error.response.status === 404 || error.response.status === 204)) {
                return null;
            }
            console.error(`Falha ao buscar último agendamento para o paciente ${idPaciente}:`, error);
            throw new Error(`Falha ao buscar último agendamento: ${error.message}`);
        }
    },

    // --- DISPONIBILIDADE (CORREÇÃO DO ERRO 400) ---
    buscarDisponibilidade: async (data, profissionalId) => {
        try {
            const response = await api.get('/agendamentos/disponibilidade', {
                params: {
                    data: data,
                    profissionalId: profissionalId   // ← Agora envia o ID correto!
                }
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar disponibilidade:", error);
            throw error;
        }
    },

    // --- MÉTODOS DE BUSCA E FILTRO ---
    listarFuturos: async () => {
        try {
            const response = await api.get('/agendamentos/futuros');
            return response.data;
        } catch (error) {
            console.error("Falha ao buscar agendamentos futuros:", error);
            throw new Error("Falha ao buscar agendamentos futuros.");
        }
    },
    
    atualizarStatus: async (id, novoStatusEnum) => {
        try {
            const response = await api.put(`/agendamentos/${id}/status?status=${novoStatusEnum}`);
            return response.data;
        } catch (error) {
            console.error("Falha ao atualizar status:", error);
            throw new Error("Não foi possível atualizar o status do agendamento.");
        }
    },

    // --- PROFISSIONAIS POR ÁREA ---
    buscarProfissionaisPorArea: async (areaEnum) => {
        try {
            const response = await api.get(`/profissionais/area?area=${areaEnum}`);
            return response.data; 
        } catch (error) {
            console.error(`Falha ao buscar profissionais na área ${areaEnum}:`, error);
            return [];
        }
    },

    listarAgendamentosDeHoje: async () => {
        try {
            const response = await api.get('/agendamentos/hoje'); 
            return response.data;
        } catch (error) {
            console.error("Falha ao buscar agendamentos de hoje:", error);
            throw new Error("Não foi possível carregar a agenda do dia.");
        }
    },

    atualizarAgendamentoCompleto: async (id, dadosAtualizados) => {
        try {
            const response = await api.put(`/agendamentos/${id}`, dadosAtualizados);
            return response.data;
        } catch (error) {
            const msg = error.response?.data || error.message;
            throw new Error(`Erro ao atualizar agendamento ${id}: ${msg}`);
        }
    },

    listarPorData: async (data) => {
        try {
            const response = await api.get(`/agendamentos`, {
                params: { data: data } 
            });
            return response.data;
        } catch (error) {
            console.error(`Falha ao buscar agendamentos para ${data}:`, error);
            throw new Error(`Não foi possível carregar agendamentos para a data ${data}.`);
        }
    },

    buscarPorId: async (id) => {
        try {
            const response = await api.get(`/agendamentos/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Falha ao buscar agendamento ${id}:`, error);
            throw new Error(`Não foi possível carregar o agendamento ${id}.`);
        }
    },
};

export default AgendamentoService;
