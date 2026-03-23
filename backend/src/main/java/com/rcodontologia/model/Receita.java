package com.rcodontologia.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString()
public class Receita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relacionamento com Paciente
    // ⚠️ CORREÇÃO: Removemos @JsonIgnore para permitir salvar o ID enviado pelo front.
    // Adicionamos @JsonIgnoreProperties para evitar problemas caso o Paciente tenha listas preguiçosas.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ToString.Exclude
    private Paciente paciente;

    // Relacionamento com Profissional
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profissional_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "authorities", "tipoProfissional"})
    @ToString.Exclude
    private Profissional profissional;

    private LocalDateTime dataEmissao = LocalDateTime.now();

    @OneToMany(mappedBy = "receita", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<ItemPrescricao> itens = new ArrayList<>();

    @Lob
    private String observacoes;

    // Métodos auxiliares para manter a consistência da relação bidirecional
    public void addItem(ItemPrescricao item) {
        itens.add(item);
        item.setReceita(this);
    }

    public void setItens(List<ItemPrescricao> novosItens) {
        if (this.itens == null) {
            this.itens = new ArrayList<>();
        }
        this.itens.clear();
        if (novosItens != null) {
            novosItens.forEach(this::addItem);
        }
    }


}