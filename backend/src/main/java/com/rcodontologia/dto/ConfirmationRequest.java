package com.rcodontologia.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Dados necessários para validar um código de confirmação")
public class ConfirmationRequest {

    @Schema(description = "Email do profissional ou paciente", example = "doutor@email.com")
    @NotBlank
    @Email
    private String email;

    @Schema(description = "Código de 6 dígitos enviado por email/SMS", example = "123456")
    @NotBlank
    @Size(min = 6, max = 6)
    private String code;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}