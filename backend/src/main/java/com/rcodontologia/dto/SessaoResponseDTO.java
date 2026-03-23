package com.rcodontologia.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessaoResponseDTO {
    private Long id;
    private String ip;
    private String dispositivo;
    private LocalDateTime dataLogin;
    private boolean sessaoAtual;
    private String nomeProfissional; // 🌟 Novo
    private String tipoProfissional;
}