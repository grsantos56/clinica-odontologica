import api from './api'; 

const BASE_URL = '/financeiro';

const FinanceiroService = {

    // Lista histórico completo (Entradas e Saídas)
    listarTransacoes: async () => {
        try {
            const response = await api.get(`${BASE_URL}/transacoes`);
            return response.data;
        } catch (error) {
            console.error("Erro ao listar transações:", error);
            return [];
        }
    },

    // Salva nova Entrada ou Saída manualmente
    salvarTransacao: async (transacao) => {
        try {
            // transacao = { descricao, valor, tipo: 'ENTRADA' | 'SAIDA', data }
            const response = await api.post(`${BASE_URL}/transacoes`, transacao);
            return response.data;
        } catch (error) {
            throw new Error("Erro ao salvar transação.", error);
        }
    },

    // Retorna resumo consolidado (opcional, pois calculamos no front também)
    obterResumoCaixa: async () => {
        try {
            const response = await api.get(`${BASE_URL}/resumo`);
            return response.data;
        } catch (error) {
            console.error("Erro ao obter resumo:", error);
            return { entradas: 0, saidas: 0, saldo: 0 };
        }
    },

    // Realiza repasse específico (mantido)
    realizarRepasse: async (profissionalId, valor, observacao) => {
        try {
            const response = await api.post(`${BASE_URL}/repasse`, {
                profissionalId,
                valor,
                observacao
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || "Erro ao processar repasse.");
        }
    },
    
    listarPagamentos: async () => {
        return await FinanceiroService.listarTransacoes();
    },

    listarPorPaciente: async (idPaciente) => {
        try {
            const response = await api.get(`${BASE_URL}/paciente/${idPaciente}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao listar pagamentos do paciente:", error);
            return [];
        }
    },

    estornarTransacao: async (id, senha, valor) => {
        try {
            const response = await api.post(`${BASE_URL}/transacoes/${id}/estorno`, { senha, valor });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || "Erro ao estornar transação.");
        }
    },
};


export default FinanceiroService;