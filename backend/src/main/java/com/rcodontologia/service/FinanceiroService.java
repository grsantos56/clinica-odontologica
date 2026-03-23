package com.rcodontologia.service;

import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.Transacao;
import com.rcodontologia.model.enums.FormaPagamento;
import com.rcodontologia.model.enums.TipoTransacao;
import com.rcodontologia.repository.FinanceiroRepository;
import com.rcodontologia.repository.ProfissionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinanceiroService {

    private final FinanceiroRepository financeiroRepository;
    private final ProfissionalRepository profissionalRepository;
    private final PasswordEncoder passwordEncoder; // 🌟 NOVO: Para validar a senha

    // 🌟 DTO ATUALIZADO: Agora reflete o fluxo de caixa real
    public record ResumoFinanceiroDTO(
            BigDecimal entradas,
            BigDecimal saidas,
            BigDecimal saldo
    ) {}

    // 🌟 DTO DE TRANSAÇÃO ATUALIZADO: Inclui tipo, descrição e liquido
    public record TransacaoDTO(
            Long id,
            BigDecimal valor,
            BigDecimal valorLiquido, // Valor real que entrou/saiu
            FormaPagamento forma,
            TipoTransacao tipo,      // ENTRADA ou SAIDA
            LocalDateTime data,
            String pacienteNome,     // Se for Entrada
            String profissionalNome, // Se for Saída (Repasse)
            String descricao
    ) {}

    @Autowired
    public FinanceiroService(FinanceiroRepository financeiroRepository, 
                             ProfissionalRepository profissionalRepository,
                             PasswordEncoder passwordEncoder) { // 🌟 Injetado no construtor
        this.financeiroRepository = financeiroRepository;
        this.profissionalRepository = profissionalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Busca todas as transações e converte para DTO.
     */
    @Transactional(readOnly = true)
    public List<TransacaoDTO> listarPagamentos() {
        List<Transacao> transacoes = financeiroRepository.findAllByOrderByDataDesc();

        return transacoes.stream()
                .map(this::mapToTransacaoDTO)
                .collect(Collectors.toList());
    }

    /**
     * 🌟 NOVO MÉTODO: Calcula Entradas, Saídas e Saldo Líquido.
     * Considera o 'valorLiquido' para entradas (já descontada a taxa).
     */
    @Transactional(readOnly = true)
    public ResumoFinanceiroDTO obterResumoCaixa() {
        List<Transacao> todas = financeiroRepository.findAll();

        // 1. Soma ENTRADAS (Usa valorLiquido se existir, senão usa valor bruto)
        BigDecimal totalEntradas = todas.stream()
                .filter(t -> t.getTipoTransacao() == TipoTransacao.ENTRADA)
                .map(Transacao::getValorLiquido)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Soma SAÍDAS (Repasses e Despesas)
        BigDecimal totalSaidas = todas.stream()
                .filter(t -> t.getTipoTransacao() == TipoTransacao.SAIDA)
                .map(Transacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Saldo
        BigDecimal saldoFinal = totalEntradas.subtract(totalSaidas);

        return new ResumoFinanceiroDTO(totalEntradas, totalSaidas, saldoFinal);
    }

    /**
     * 🌟 NOVO MÉTODO: Registra o pagamento (Repasse) a um profissional.
     * Isso gera uma SAÍDA no caixa.
     */
    @Transactional
    public Transacao registrarPagamentoProfissional(Long idProfissional, BigDecimal valor, String observacao) {
        Profissional prof = profissionalRepository.findById(idProfissional)
                .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado"));

        Transacao saida = new Transacao();
        saida.setTipoTransacao(TipoTransacao.SAIDA); // 🔴 Marca como Saída
        saida.setValor(valor);
        saida.setValorLiquido(valor); // Saída não costuma ter taxa de máquina, líquido = bruto

        saida.setProfissionalDestino(prof);
        saida.setDescricao("Repasse: " + (observacao != null ? observacao : "Comissão"));
        saida.setData(LocalDateTime.now());

        // Forma de pagamento padrão para repasse interno (pode ser parametrizável)
        saida.setTipo(FormaPagamento.PIX);

        return financeiroRepository.save(saida);
    }

    /**
     * Salva uma transação de ENTRADA (Pagamento de Paciente).
     * Chamado pelo PacienteService.
     */
    @Transactional
    public Transacao registrarPagamento(Transacao transacao) {
        if (transacao.getData() == null) {
            transacao.setData(LocalDateTime.now());
        }
        // Garante que padrão é ENTRADA se não vier especificado
        if (transacao.getTipoTransacao() == null) {
            transacao.setTipoTransacao(TipoTransacao.ENTRADA);
        }
        return financeiroRepository.save(transacao);
    }

    /**
     * 🌟 NOVO MÉTODO: Estorna uma transação mediante validação de senha.
     */
   @Transactional
    public void estornarTransacao(Long idTransacao, String senhaFornecida, BigDecimal valorEstorno) {
        String emailAdmin = SecurityContextHolder.getContext().getAuthentication().getName();
        
        Profissional admin = profissionalRepository.findByEmail(emailAdmin)
                .orElseThrow(() -> new IllegalArgumentException("Administrador não encontrado."));

        if (!passwordEncoder.matches(senhaFornecida, admin.getPassword())) {
            throw new IllegalArgumentException("Senha incorreta.");
        }

        Transacao transacao = financeiroRepository.findById(idTransacao)
                .orElseThrow(() -> new IllegalArgumentException("Transação não encontrada."));
        
        // Se o valor a estornar for igual ou maior que a transação, deleta tudo
        if (valorEstorno.compareTo(transacao.getValorLiquido()) >= 0) {
            financeiroRepository.delete(transacao);
        } else {
            // Estorno Parcial: Apenas diminui o valor da transação original
            transacao.setValor(transacao.getValor().subtract(valorEstorno));
            transacao.setValorLiquido(transacao.getValorLiquido().subtract(valorEstorno));
            transacao.setDescricao(transacao.getDescricao() + " (Estorno Parcial: R$ " + valorEstorno + ")");
            financeiroRepository.save(transacao);
        }
    }
    // --- AUXILIAR DE MAPEAMENTO ---
    private TransacaoDTO mapToTransacaoDTO(Transacao t) {
        String nomePaciente = (t.getPaciente() != null) ? t.getPaciente().getNome() : "-";
        String nomeProfissional = (t.getProfissionalDestino() != null) ? t.getProfissionalDestino().getNome() : "-";

        return new TransacaoDTO(
                t.getId(),
                t.getValor(),
                t.getValorLiquido(),
                t.getTipo(),
                t.getTipoTransacao(),
                t.getData(),
                nomePaciente,
                nomeProfissional,
                t.getDescricao()
        );
    }

    @Transactional(readOnly = true)
    public List<TransacaoDTO> listarPorPaciente(Long idPaciente) {
        List<Transacao> lista = financeiroRepository.findByPaciente_IdOrderByDataDesc(idPaciente);
        return lista.stream().map(this::mapToTransacaoDTO).collect(Collectors.toList());
    }
}