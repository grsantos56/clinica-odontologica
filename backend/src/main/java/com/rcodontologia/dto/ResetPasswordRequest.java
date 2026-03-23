package com.rcodontologia.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dados para redefinição de senha após validação do código")
public class ResetPasswordRequest {

    @Schema(description = "Email do usuário", example = "admin@email.com")
    private String email;

    @Schema(description = "Código de verificação recebido", example = "123456")
    private String code;

    @Schema(description = "Nova senha desejada", example = "novasenha123")
    private String newPassword;

    // Getters e Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}