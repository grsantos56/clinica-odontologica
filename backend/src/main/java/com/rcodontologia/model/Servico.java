package com.rcodontologia.model;

import com.rcodontologia.model.enums.AreaAtendimento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "servico")
public class Servico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = true, length = 500)
    private String descricao;

    @Column(nullable = false)
    private Double preco;

    @Column(nullable = false)
    private Double comissaoPercentual;

    // 🌟 NOVO CAMPO: Define se o serviço é por dente ou geral
    @Column(name = "requer_dente", nullable = false)
    private Boolean requerDente = true;

    @Column(nullable = true, length = 4000)
    private String recomendacoesPosProcedimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AreaAtendimento areaEspecialidade;
}