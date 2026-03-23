// src/services/ProfissionalService.js

// 🌟 Importe a instância configurada do Axios (que contém o Interceptor JWT) 🌟
import api from './api'; 

const API_BASE_ROUTE = '/profissionais';

/**
 * Serviço de comunicação com a API de Profissionais.
 */
const ProfissionalService = {

    /**
     * Envia os dados textuais de um profissional para o backend.
     * Método: POST /api/profissionais (Usado para criação/atualização S/ FOTO)
     */
    salvarProfissional: async (profissionalData) => {
        try {
            // Se houver ID, faz PUT (atualização). Se não, faz POST (criação).
            const isUpdate = profissionalData.id;
            const url = isUpdate ? `${API_BASE_ROUTE}/${profissionalData.id}` : API_BASE_ROUTE;
            const method = isUpdate ? 'put' : 'post';

            const response = await api({
                method: method,
                url: url,
                data: profissionalData
            });

            return response.data;

        } catch (error) {
            const status = error.response ? error.response.status : 'Network Error';
            console.error("Erro no serviço de salvar profissional (texto):", error);
            throw new Error(`Falha ao salvar profissional (Status: ${status}).`); 
        }
    },
    
    /**
     * 🌟 NOVO MÉTODO: Envia dados e foto no formato multipart/form-data. 🌟
     * Método: POST /api/profissionais/com-foto (Usado para criação/atualização C/ FOTO)
     */
    salvarProfissionalComFoto: async (formData) => {
        try {
            // O Axios detecta que o 'data' é FormData e define o Content-Type como multipart/form-data.
            // O backend espera esta requisição no endpoint '/com-foto'
            const response = await api.post(`${API_BASE_ROUTE}/com-foto`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data' 
                }
            });
            return response.data;

        } catch (error) {
            const status = error.response ? error.response.status : 'Network Error';
            console.error("Erro no serviço de salvar profissional (multipart):", error);
            throw new Error(`Falha ao salvar profissional (Status: ${status}).`); 
        }
    },

    /**
     * Busca a lista completa de profissionais.
     * Método: GET /api/profissionais
     */
    listarTodos: async () => {
        try {
            const response = await api.get(API_BASE_ROUTE);
            return response.data;

        } catch (error) {
            const status = error.response ? error.response.status : 'Network Error';
            console.error("Erro no serviço de listar profissionais:", error);
            throw new Error(`Falha ao buscar lista de profissionais (Status: ${status})`);
        }
    },

    /**
     * Deleta um profissional.
     */
    deletarProfissional: async (id) => {
        try {
            await api.delete(`${API_BASE_ROUTE}/${id}`);
            return; 

        } catch (error) {
            const status = error.response ? error.response.status : 'Network Error';
            console.error("Erro no serviço de deletar profissional:", error);
            throw new Error(`Falha ao deletar profissional (Status: ${status}).`); 
        }
    },
    
    /**
     * Busca profissionais por área.
     */
    buscarPorArea: async (area) => {
        try {
            const response = await api.get(`${API_BASE_ROUTE}/area?area=${encodeURIComponent(area)}`);
            return response.data;

        } catch (error) {
            const status = error.response ? error.response.status : 'Network Error';
            console.error("Erro no serviço de buscar profissionais por área:", error);
            throw new Error(`Falha ao buscar profissionais por área (Status: ${status})`);
        }
    },
};

export default ProfissionalService;