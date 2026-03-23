package com.rcodontologia.dto;

import com.rcodontologia.model.enums.TipoProfissional;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Objeto de resposta contendo o token de acesso")
public class TokenResponse {

    @Schema(description = "Token JWT gerado", example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTYy...")
    private String accessToken;

    @Schema(description = "Tipo do token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "ID do usuário autenticado", example = "1")
    private Long userId;

    @Schema(description = "Email do usuário", example = "admin@email.com")
    private String email;

    @Schema(description = "Permissão/Cargo do usuário", example = "ADMINISTRADOR")
    private TipoProfissional role;

    // Getters e Setters
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public TipoProfissional getRole() { return role; }
    public void setRole(TipoProfissional role) { this.role = role; }
}