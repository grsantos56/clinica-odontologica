package com.rcodontologia.service;

import com.rcodontologia.model.Servico;
import com.rcodontologia.repository.ServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ServicoService {

    private final ServicoRepository servicoRepository;

    @Autowired
    public ServicoService(ServicoRepository servicoRepository) {
        this.servicoRepository = servicoRepository;
    }

    @Transactional
    public Servico salvar(Servico servico) {
        // Validação: Nome é obrigatório
        if (servico.getNome() == null || servico.getNome().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome do serviço é obrigatório.");
        }

        // Validação: Preço deve ser positivo
        if (servico.getPreco() == null || servico.getPreco() <= 0) {
            throw new IllegalArgumentException("O preço do serviço deve ser maior que zero.");
        }

        // 🌟 VALIDAÇÃO: Comissão do Dentista
        // Define 0 como padrão se vier nulo, ou valida se está entre 0 e 100
        if (servico.getComissaoPercentual() == null) {
            servico.setComissaoPercentual(0.0);
        }

        if (servico.getComissaoPercentual() < 0 || servico.getComissaoPercentual() > 100) {
            throw new IllegalArgumentException("A comissão deve ser um valor percentual entre 0 e 100.");
        }

        // 🌟 NOVO: Validação do Tipo de Aplicação (Requer Dente)
        // Se vier nulo, define como TRUE (padrão antigo/seguro)
        if (servico.getRequerDente() == null) {
            servico.setRequerDente(true);
        }

        // Validação: A área de especialidade é obrigatória
        if (servico.getAreaEspecialidade() == null) {
            throw new IllegalArgumentException("A área de especialidade do serviço é obrigatória.");
        }

        // Validação: Recomendações pós-procedimento
        if (servico.getRecomendacoesPosProcedimento() != null && servico.getRecomendacoesPosProcedimento().length() > 4000) {
            throw new IllegalArgumentException("As recomendações pós-procedimento não podem exceder 4000 caracteres.");
        }

        // Verifica a unicidade do nome do serviço.
        Optional<Servico> servicoExistente = servicoRepository.findByNome(servico.getNome());

        if (servicoExistente.isPresent() && !servicoExistente.get().getId().equals(servico.getId())) {
            throw new IllegalArgumentException("Já existe um serviço cadastrado com este nome.");
        }

        return servicoRepository.save(servico);
    }

    @Transactional(readOnly = true)
    public List<Servico> listarTodos() {
        return servicoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Servico> buscarPorId(Long id) {
        return servicoRepository.findById(id);
    }

    @Transactional
    public void deletar(Long id) {
        if (!servicoRepository.existsById(id)) {
            throw new IllegalArgumentException("Serviço com ID " + id + " não encontrado.");
        }
        servicoRepository.deleteById(id);
    }
}