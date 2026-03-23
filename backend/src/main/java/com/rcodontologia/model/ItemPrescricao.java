package com.rcodontologia.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data; // Importante para gerar setReceita() automaticamente

@Entity
@Data // Gera Getters e Setters (incluindo setReceita)
public class ItemPrescricao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receita_id", nullable = false)
    @JsonIgnore // Evita loop infinito no JSON
    private Receita receita;

    // 1. Nome do Medicamento (Ex: Paracetamol 750mg)
    private String nomeMedicamento;

    // 2. Via de Administração (Ex: comprimido via oral)
    private String viaAdministracao;

    // 3. Frequência (Ex: 8 em 8 horas)
    private String frequencia;

    // 4. Duração (Ex: por 4 dias)
    private String duracao;

    // Opcional: Quantidade total prescrita (Ex: 10 comprimidos)
    private String quantidade;


}