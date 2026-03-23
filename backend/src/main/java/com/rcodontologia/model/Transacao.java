package com.rcodontologia.model;

import com.rcodontologia.model.enums.FormaPagamento;
import com.rcodontologia.model.enums.TipoTransacao; // 🌟 Importe o novo Enum
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transacao")
public class Transacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Valor da transação (Sempre positivo no banco, a lógica de soma/subtração é feita no Service)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(name="tipo", length = 50)
    private FormaPagamento tipo; // PIX, DINHEIRO, ETC.

    @Column(nullable = false)
    private LocalDateTime data;

    // 🌟 CAMPO NOVO: Define se é ENTRADA (dinheiro entrando) ou SAIDA (pagamento/despesa)
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_transacao", length = 20)
    private TipoTransacao tipoTransacao = TipoTransacao.ENTRADA; // Padrão é Entrada para compatibilidade

    // 🌟 CAMPO NOVO: Descrição opcional (Ex: "Repasse Dr. João", "Pagamento Mensalidade")
    @Column(length = 255)
    private String descricao;

    // Relacionamentos
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente; // Preenchido se for ENTRADA de paciente

    // 🌟 CAMPO NOVO: Profissional que recebeu o pagamento (se for SAÍDA de repasse)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profissional_id")
    private Profissional profissionalDestino;

    // --- CAMPOS DE TAXA (JÁ EXISTENTES) ---
    @Column(name = "taxa_porcentagem", precision = 5, scale = 2)
    private BigDecimal taxaPorcentagem = BigDecimal.ZERO;

    @Column(name = "valor_taxa", precision = 10, scale = 2)
    private BigDecimal valorTaxa = BigDecimal.ZERO;

    @Column(name = "valor_liquido", precision = 10, scale = 2)
    private BigDecimal valorLiquido;


    // --- GETTERS E SETTERS DE TAXA ---

    public BigDecimal getValorLiquido() {
        // Se for Nulo (antigo) ou SAÍDA (despesa não tem taxa de maquininha geralmente), retorna o valor total
        if (valorLiquido == null) {
            return valor;
        }
        return valorLiquido;
    }
}