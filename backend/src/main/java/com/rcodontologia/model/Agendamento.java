package com.rcodontologia.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rcodontologia.model.enums.StatusAgendamento;
import com.rcodontologia.model.enums.AreaAtendimento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "agendamento")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relacionamento com Paciente
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    // Relacionamento com Profissional
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profissional_id", nullable = false)
    private Profissional profissional;

    @Column(nullable = false, length = 100)
    private String procedimento;

    // Área específica do Agendamento
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AreaAtendimento area;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusAgendamento status;

    @Column(nullable = true, length = 500)
    private String notas;

    // -----------------------------------------------------------
    // 🌟 GETTERS/SETTERS EXPLÍCITOS PARA COMPATIBILIDADE DE COMPILAÇÃO 🌟
    // -----------------------------------------------------------


}