import api from './api'; 

const BASE_URL = '/servicos';

const ServicoService = {

    /**
     * GET /api/servicos
     * Lista todos os serviços cadastrados.
     */
    listarTodos: async () => {
        try {
            const response = await api.get(BASE_URL);
            return response.data;
        } catch (error) {
            console.error("Erro ao listar todos os serviços:", error);
            throw new Error("Não foi possível carregar a lista de serviços.");
        }
    },

    /**
     * GET /api/servicos/{id}
     * Busca um serviço por ID.
     */
    buscarPorId: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar serviço ${id}:`, error);
            throw new Error(`Serviço ${id} não encontrado.`);
        }
    },

    /**
     * POST /api/servicos ou PUT /api/servicos/{id}
     * Salva (cria) ou atualiza um serviço.
     */
    salvar: async (servico) => {
        try {
            let response;
            if (servico.id) {
                // PUT: Atualiza um serviço existente
                response = await api.put(`${BASE_URL}/${servico.id}`, servico);
            } else {
                // POST: Cria um novo serviço
                response = await api.post(BASE_URL, servico);
            }
            return response.data;
        } catch (error) {
            console.error("Erro ao salvar serviço:", error.response?.data || error.message);
            const msg = error.response?.data?.message || "Falha ao salvar o serviço.";
            throw new Error(msg);
        }
    },

    /**
     * DELETE /api/servicos/{id}
     * Deleta um serviço.
     */
    deletar: async (id) => {
        try {
            await api.delete(`${BASE_URL}/${id}`);
            return true;
        } catch (error) {
            console.error(`Erro ao deletar serviço ${id}:`, error);
            const msg = error.response?.data?.message || "Falha ao deletar o serviço.";
            throw new Error(msg);
        }
    }
};

export default ServicoService;