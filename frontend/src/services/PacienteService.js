import api from './api';

const BASE_URL = '/pacientes';

const PacienteService = {

    // =================================================================
    // --- BUSCAS ---
    // =================================================================

    listarTodos: async () => {
        try {
            const response = await api.get(BASE_URL);
            return response.data;
        } catch (error) {
            console.error("Erro ao listar pacientes:", error);
            throw new Error("Não foi possível carregar a lista de pacientes.");
        }
    },

    buscarPorId: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}/${id}`); 
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar paciente ${id}:`, error);
            throw new Error("Paciente não encontrado.");
        }
    },

    buscarPorNome: async (nome) => {
        try {
            const response = await api.get(`${BASE_URL}/buscar/nome?q=${nome}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar por nome:", error);
            throw new Error("Falha na busca.");
        }
    },

    buscarPorArea: async (area) => {
        try {
            const response = await api.get(`${BASE_URL}/buscar/area?area=${area}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar por área:", error);
            throw error;
        }
    },

    // =================================================================
    // --- SALVAR / ATUALIZAR ---
    // =================================================================

    salvarPaciente: async (paciente) => {
        try {
            const response = await api.post(BASE_URL, paciente);
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            throw new Error(msg);
        }
    },

    // 🌟 MÉTODO ATUALIZADO COM TRATAMENTO DE ERROS (409, 403, 500) 🌟
    salvarPacienteComFoto: async (formData) => {
        try {
            console.log("[Service] Iniciando envio de paciente com foto...");
            
            const response = await api.post(`${BASE_URL}/com-foto`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log(`[Service] Paciente cadastrado com sucesso. ID: ${response.data.id}`);
            return response.data;
        } catch (error) {
            console.error("[Service] Erro detalhado ao cadastrar:", error);

            // 1. Garante que serverMessage seja uma string para busca
            let serverMessage = error.response?.data?.message || error.response?.data || "";
            if (typeof serverMessage === 'object') {
                serverMessage = JSON.stringify(serverMessage);
            }

            // 2. Análise de Status HTTP e Mensagens
            if (error.response) {
                const status = error.response.status;

                if (status === 409) {
                    throw new Error("Este CPF já está cadastrado no sistema.");
                }

                if (status === 403) {
                    throw new Error("Acesso negado: Sem permissão para cadastrar.");
                }

                // Tratamento do erro 500 baseado no seu LOG
                if (status === 500) {
                    if (serverMessage && (
                        serverMessage.includes("Duplicate entry") || // Frase exata do seu log
                        serverMessage.includes("UK_") ||             // Unique Key (paciente.UK_...)
                        serverMessage.includes("constraint")
                    )) {
                        throw new Error("Erro: Este CPF já possui cadastro no sistema (Duplicidade).");
                    }
                    
                    throw new Error("Erro! Verifique os dados e tente novamente.");
                }
            }
            
            // Fallback
            throw new Error("Erro de conexão ao tentar salvar.");
        }
    },

    // =================================================================
    // --- FINANCEIRO ---
    // =================================================================

    // 🌟 LÓGICA DE ROTAS INTELIGENTE 🌟
    ajustarSaldoDevedor: async (id, valorAjuste, formaPagamento, taxa = 0, descricao = "") => {
        // Cenario 1: Dentista (apenas lança débito)
        if (formaPagamento === 'DEBITO_SESSAO') {
            try {
                // Rota liberada para Dentista (apenas soma dívida)
                const response = await api.put(`${BASE_URL}/${id}/lancar-debito?valor=${valorAjuste}`);
                return response.data;
            } catch (error) {
                console.error("Erro ao lançar débito (Dentista):", error);
                throw error;
            }
        } 
        // Cenario 2: Pagamento Financeiro
        else {
            try {
                const taxaFormatada = parseFloat(taxa || 0);
                
                // Encode para aceitar acentos/espaços
                const descParam = descricao ? `&descricao=${encodeURIComponent(descricao)}` : '';
                
                const response = await api.put(
                    `${BASE_URL}/${id}/saldo?valorAjuste=${valorAjuste}&formaPagamento=${formaPagamento}&taxa=${taxaFormatada}${descParam}`
                );
                return response.data;
            } catch (error) {
                console.error("Erro ao processar pagamento (Financeiro):", error);
                throw error;
            }
        }
    },

    verificarSaldoDevedor: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}/${id}/saldo-devedor`);
            // Verifica se retorna um objeto { saldo: X } ou o valor direto
            return response.data?.saldo !== undefined ? response.data.saldo : response.data;
        } catch (error) {
            console.error(`Falha ao verificar saldo do paciente ${id}:`, error);
            return 0;
        }
    },

    // Alias para compatibilidade
    verificarDebitos: async (id) => {
        return await PacienteService.verificarSaldoDevedor(id);
    },

    // =================================================================
    // --- RETORNOS E AGENDA ---
    // =================================================================

    marcarParaRetorno: async (idPaciente, recorrenciaDias = null) => {
        try {
            // Monta a URL. Se recorrenciaDias for > 0, envia como query param
            let url = `${BASE_URL}/${idPaciente}/marcar-retorno`;
            
            if (recorrenciaDias !== null && recorrenciaDias !== undefined && recorrenciaDias > 0) {
                url += `?dias=${recorrenciaDias}`;
            }
            
            const response = await api.put(url); 
            return response.data;
        } catch (error) {
            console.error(`Falha ao marcar paciente ${idPaciente} para retorno:`, error);
            throw error;
        }
    },

    // Alias para compatibilidade
    marcarRetorno: async (id) => {
        return await PacienteService.marcarParaRetorno(id);
    },

    limparMarcacaoRetorno: async (idPaciente) => {
        try {
            const response = await api.put(`${BASE_URL}/${idPaciente}/limpar-retorno`); 
            return response.data;
        } catch (error) {
            console.error(`Falha ao limpar flag de retorno do paciente ${idPaciente}:`, error);
            throw error;
        }
    },

    // Alias para compatibilidade
    limparRetorno: async (id) => {
        return await PacienteService.limparMarcacaoRetorno(id);
    },

    // =================================================================
    // --- REMOÇÃO ---
    // =================================================================

    deletarPaciente: async (id) => {
        try {
            await api.delete(`${BASE_URL}/${id}`);
            return true;
        } catch (error) {
            console.error(`Erro ao deletar paciente ${id}:`, error);
            throw new Error("Não foi possível deletar o paciente.");
        }
    }
};

export default PacienteService;