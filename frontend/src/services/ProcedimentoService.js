import api from './api'; 

const BASE_URL_REGISTRO = '/procedimentos'; 

const ProcedimentoService = {
    
    // 🌟 LISTAR POR DATA (PAINEL)
    listarPorData: async (date) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/por-data?data=${date}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao listar procedimentos por data:", error);
            return []; 
        }
    },

    buscarPorAgendamentoId: async (idAgendamento) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/agendamento/${idAgendamento}`);
            return response.data;
        } catch (error) {
            if (error.response && (error.response.status === 404 || error.response.status === 204)) {
                return null; 
            }
            console.error(`Falha ao buscar procedimento por Agendamento ID ${idAgendamento}:`, error);
            throw new Error("Falha ao carregar rascunho do procedimento.");
        }
    },

    salvarProcedimento: async (procedimentoData) => {
        if (procedimentoData.id) {
            const response = await api.put(`${BASE_URL_REGISTRO}/${procedimentoData.id}`, procedimentoData);
            return response.data;
        } else {
            const response = await api.post(BASE_URL_REGISTRO, procedimentoData);
            return response.data;
        }
    },
    
    salvarRegistroComFotos: async (formData) => {
        try {
            const response = await api.post(`${BASE_URL_REGISTRO}/salvar-registro`, formData);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Falha ao salvar o registro completo (400 Bad Request).';
            console.error("Erro ao salvar registro com fotos:", error);
            throw new Error(errorMessage);
        }
    },

    listarHistoricoPorPacienteId: async (idPaciente) => {
        const response = await api.get(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/historico`);
        return response.data; 
    },

    buscarProcedimentoPendente: async (idPaciente) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/pendente`); 
            if (response.status === 204) return null;
            return response.data;
        } catch (error) {
            if (error.response && (error.response.status === 404 || error.response.status === 204)) return null;
            console.error(`Falha ao buscar procedimento pendente para o paciente ${idPaciente}:`, error);
            throw new Error("Falha ao verificar serviço pendente.");
        }
    },

    buscarUltimoConcluido: async (idPaciente) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/ultimo-concluido`);
            if (response.status === 204) return null;
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar último concluído para paciente ${idPaciente}:`, error);
            return null;
        }
    },

    buscarUltimoSalvo: async (idPaciente) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/ultimo-salvo`);
            if (response.status === 204) return null;
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar último salvo para paciente ${idPaciente}:`, error);
            return null;
        }
    },

    // 🌟 NOVO MÉTODO CRÍTICO: Busca o pai correto para o retorno
    buscarUltimoGeradorRetorno: async (idPaciente) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/ultimo-gerador-retorno`);
            if (response.status === 204) return null;
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar gerador de retorno para paciente ${idPaciente}:`, error);
            return null;
        }
    },

    // 🌟 NOVOS MÉTODOS PARA ORÇAMENTOS 🌟
    
    // Lista todos os orçamentos pendentes (Para a tela de OrçamentosPage)
    listarOrcamentos: async () => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/orcamentos`);
            return response.data;
        } catch (error) {
            console.error("Erro ao listar orçamentos:", error);
            return [];
        }
    },

    // Busca o último orçamento de um paciente específico (Para recuperar no registro)
    buscarUltimoOrcamento: async (idPaciente) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/ultimo-orcamento`);
            if (response.status === 204) return null;
            return response.data;
        } catch (error) {
            if (error.response && (error.response.status === 404 || error.response.status === 204)) return null;
            console.error(`Erro ao buscar orçamento do paciente ${idPaciente}:`, error);
            return null;
        }
    },

    // 🌟 ATUALIZADO: Aceita valorPago
    atualizarStatusPagamento: async (idProcedimento, novoStatus, valorPago, valorLiquido) => {
        try {
            const params = { status: novoStatus };
            
            if (valorPago !== undefined && valorPago !== null) {
                params.valorPago = valorPago;
            }

            // 🌟 NOVO: Envia o líquido se informado
            if (valorLiquido !== undefined && valorLiquido !== null) {
                params.valorLiquido = valorLiquido;
            }

            const response = await api.put(`${BASE_URL_REGISTRO}/${idProcedimento}/status-pagamento`, null, {
                params: params
            });
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar status de pagamento do procedimento ${idProcedimento}:`, error);
            throw new Error("Falha ao atualizar status do pagamento.");
        }
    },

    // 🌟 NOVO: RELATÓRIO FINANCEIRO
    listarRelatorio: async (inicio, fim) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/relatorio?inicio=${inicio}&fim=${fim}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            return [];
        }
    },

    marcarOrcamentoComoAgendado: async (idProcedimento) => {
        try {
            await api.put(`${BASE_URL_REGISTRO}/${idProcedimento}/marcar-agendado`);
        } catch (error) {
            console.error("Erro ao marcar orçamento como agendado:", error);
        }
    },

    reabrirUltimoOrcamento: async (idPaciente) => {
        try {
            await api.put(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/reabrir-orcamento`);
            return true;
        } catch (error) {
            console.error("Erro ao reabrir orçamento:", error);
            return false;
        }
    },

    buscarOrcamentoParaExecucao: async (idPaciente) => {
        try {
            const response = await api.get(`${BASE_URL_REGISTRO}/paciente/${idPaciente}/orcamento-execucao`);
            if (response.status === 204) return null;
            return response.data;
        } catch (error) {
            // Ignora 404 (Não encontrado) e retorna null sem erro no console
            if (error.response && (error.response.status === 404 || error.response.status === 204)) {
                return null;
            }
            console.error(`Erro ao buscar orçamento para execução do paciente ${idPaciente}:`, error);
            return null;
        }
    },

    excluir: async (idProcedimento) => {
        try {
            // O endpoint deve ser implementado no backend também.
            // Se o backend usar DELETE /api/procedimentos/{id}, fica assim:
            await api.delete(`${BASE_URL_REGISTRO}/${idProcedimento}`);
            return true;
        } catch (error) {
            console.error(`Erro ao excluir procedimento ${idProcedimento}:`, error);
            throw new Error("Falha ao excluir o registro.");
        }
    }
    
};

export default ProcedimentoService;