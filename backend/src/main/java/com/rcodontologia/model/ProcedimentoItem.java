package com.rcodontologia.model;

import com.fasterxml.jackson.annotation.JsonIgnore; // 🌟 IMPORTANTE: Adicione este import
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "procedimento_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcedimentoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descricao;

    @Column(name = "valor_base")
    private Double valorBase = 0.0;

    private Double acrescimo = 0.0;

    private Double desconto = 0.0;

    @Column(name = "valor_liquido")
    private Double valorLiquido = 0.0;

    @Column(nullable = false)
    private Boolean faturado = true;

    // Relacionamento com o procedimento pai
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "procedimento_id", nullable = false)
    @JsonIgnore // 🌟 ADICIONE ISSO AQUI!
    private Procedimento procedimento;
}