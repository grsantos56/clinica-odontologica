// src/services/RegistroService.js
import api from './api'; 

const RegistroService = {
    // GET /api/registros/{idAgendamento}
    buscarPorAgendamentoId: async (idAgendamento) => {
        const response = await api.get(`/registros/agendamento/${idAgendamento}`);
        return response.data;
    },
    // POST/PUT /api/registros
    salvarRegistro: async (registroData) => {
        // Se já tem ID, faz PUT (atualiza); senão, faz POST (cria)
        if (registroData.id) {
            const response = await api.put(`/registros/${registroData.id}`, registroData);
            return response.data;
        } else {
            const response = await api.post('/registros', registroData);
            return response.data;
        }
    },
    // PUT /api/agendamentos/{id}/status?status=CONCLUIDO
    encerrarAtendimento: async (idAgendamento) => {
        return AgendamentoService.atualizarStatus(idAgendamento, 'CONCLUIDO');
    },
    
};

export default RegistroService;