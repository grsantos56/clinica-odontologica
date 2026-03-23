package com.rcodontologia.model;

import com.rcodontologia.model.enums.StatusPagamento;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "procedimento")
public class Procedimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "agendamento_id", nullable = false, unique = true)
    private Agendamento agendamento;

    private String observacoesClinicas;

    // ✅ 1. LISTA NOVA (Tabela Detalhada)
    @OneToMany(mappedBy = "procedimento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedimentoItem> itens = new ArrayList<>();

    // ⚠️ 2. LISTA ANTIGA (Strings)
    @ElementCollection
    @CollectionTable(name = "procedimento_procedimentos_realizados", joinColumns = @JoinColumn(name = "procedimento_id"))
    @Column(name = "descricao_procedimento")
    private List<String> procedimentosRealizados;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", length = 50)
    private StatusPagamento statusPagamento;

    private Double valorPago = 0.0;
    private Double valorLiquido = 0.0;
    private LocalDateTime dataRegistro;

    @Column(columnDefinition = "TEXT")
    private String mapaOdontogramaJson;

    @Column(columnDefinition = "TEXT")
    private String mapaOdontogramaInicialJson;

    @ElementCollection
    @CollectionTable(name = "procedimento_fotos", joinColumns = @JoinColumn(name = "procedimento_id"))
    @Column(name = "foto_url", length = 500)
    private List<String> fotos;

    @Column(nullable = true)
    private Integer numeroParcelas;

    @Column(columnDefinition = "TEXT")
    private String acoesDiarioJson;

    @Column(length = 36)
    private String codigoTratamento;

    @Column(name = "valor_total_lancado")
    private Double valorTotalLancado = 0.0;

    @Column(nullable = false)
    private Boolean orcamentoAgendado = false;

    
}