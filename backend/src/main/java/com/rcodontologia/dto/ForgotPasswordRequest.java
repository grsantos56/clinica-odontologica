package com.rcodontologia.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Objeto para iniciar o processo de recuperação de senha")
public class ForgotPasswordRequest {

    @Schema(description = "Email cadastrado no sistema", example = "admin@email.com")
    private String email;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}