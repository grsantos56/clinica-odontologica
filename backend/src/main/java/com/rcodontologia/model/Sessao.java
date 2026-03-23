package com.rcodontologia.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessoes")
@Data
public class Sessao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String token; // Token completo ou Hash

    private String ip;
    private String dispositivo;
    private LocalDateTime dataLogin;
    private LocalDateTime ultimaAtividade;

    @ManyToOne
    @JoinColumn(name = "profissional_id", nullable = false)
    private Profissional profissional; //
}