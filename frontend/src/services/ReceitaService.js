import api from './api';

const ReceitaService = {
  // Salva uma nova receita
  salvar: async (receitaData) => {
    try {
      const response = await api.post('/receitas', receitaData);
      return response.data;
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      throw error;
    }
  },

  // Busca receita por ID
  buscarPorId: async (id) => {
    try {
      const response = await api.get(`/receitas/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar receita:", error);
      throw error;
    }
  },

  // Lista histórico de receitas do paciente
  listarPorPaciente: async (pacienteId) => {
    try {
      const response = await api.get(`/receitas/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao listar receitas do paciente:", error);
      throw error;
    }
  },

  // Busca lista de profissionais aptos a prescrever (Dentistas)
  // Útil para preencher o select do receituário
  listarPrescritores: async () => {
    try {
      const response = await api.get('/profissionais');
      // Filtra no front apenas para garantir, caso a API retorne todos
      // Adapte 'DENTISTA' conforme o retorno exato do seu enum no backend
      return response.data.filter(p => p.role === 'DENTISTA' || p.role === 'ADMINISTRADOR');
    } catch (error) {
      console.error("Erro ao listar prescritores:", error);
      throw error;
    }
  }
};

export default ReceitaService;