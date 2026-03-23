package com.rcodontologia.service;

import com.rcodontologia.model.ItemPrescricao;
import com.rcodontologia.model.Receita;
import com.rcodontologia.repository.ReceitaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReceitaService {

    private final ReceitaRepository receitaRepository;

    @Autowired
    public ReceitaService(ReceitaRepository receitaRepository) {
        this.receitaRepository = receitaRepository;
    }

    /**
     * Salva uma nova receita no banco de dados.
     * Deve garantir que o Paciente e o Profissional estejam preenchidos.
     */
    @Transactional
    public Receita salvarReceita(Receita receita) {
        if (receita.getPaciente() == null || receita.getPaciente().getId() == null) {
            throw new IllegalArgumentException("A Receita deve estar associada a um Paciente.");
        }
        if (receita.getProfissional() == null || receita.getProfissional().getId() == null) {
            throw new IllegalArgumentException("A Receita deve estar associada a um Profissional (Dentista).");
        }

        // Garante a bidirecionalidade dos itens (necessário para persistência)
        if (receita.getItens() != null) {
            for (ItemPrescricao item : receita.getItens()) {
                item.setReceita(receita);
            }
        }

        return receitaRepository.save(receita);
    }

    // Busca uma receita pelo ID
    @Transactional(readOnly = true)
    public Optional<Receita> buscarPorId(Long id) {
        return receitaRepository.findById(id);
    }

    // Lista o histórico de receitas de um paciente, ordenadas da mais recente para a mais antiga
    @Transactional(readOnly = true)
    public List<Receita> listarPorPaciente(Long pacienteId) {
        return receitaRepository.findByPacienteIdOrderByDataEmissaoDesc(pacienteId);
    }

    // Deleta uma receita
    @Transactional
    public void deletarReceita(Long id) {
        if (!receitaRepository.existsById(id)) {
            throw new IllegalArgumentException("Receita com ID " + id + " não encontrada.");
        }
        receitaRepository.deleteById(id);
    }
}