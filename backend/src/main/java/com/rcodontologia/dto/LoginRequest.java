package com.rcodontologia.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Credenciais para autenticação no sistema")
public class LoginRequest {
    @NotBlank
    @Email
    @Schema(description = "Email do usuário", example = "admin@email.com")
    private String email;

    @NotBlank
    @Schema(description = "Senha do usuário", example = "senha123")
    private String password;


    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}