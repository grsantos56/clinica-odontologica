package com.rcodontologia.dto;

import com.rcodontologia.model.enums.AreaAtendimento;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Dados para registro de um novo administrador ou profissional")
public class RegisterAdminRequest {

    @NotBlank
    @Schema(description = "Nome completo do profissional", example = "Dr. João Silva")
    private String nome;

    @NotBlank
    @Schema(description = "Registro profissional (CRM, CRO, etc)", example = "CRO-SP 12345")
    private String crmOuRegistro;

    @NotBlank
    @Email
    @Schema(description = "Email para login e contato", example = "joao.silva@clinica.com")
    private String email;

    @NotBlank
    @Size(min = 6)
    @Schema(description = "Senha de acesso (mínimo 6 caracteres)", example = "senhaForte123")
    private String password;

    @NotNull(message = "A área de atendimento (Role) é obrigatória.")
    @Schema(description = "Especialidade/Área de atuação", example = "ODONTOLOGIA")
    private AreaAtendimento areaAtendimento;

    // Getters e Setters
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCrmOuRegistro() { return crmOuRegistro; }
    public void setCrmOuRegistro(String crmOuRegistro) { this.crmOuRegistro = crmOuRegistro; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public AreaAtendimento getAreaAtendimento() { return areaAtendimento; }
    public void setAreaAtendimento(AreaAtendimento areaAtendimento) { this.areaAtendimento = areaAtendimento; }
}