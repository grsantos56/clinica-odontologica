package com.rcodontologia.config.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest; // IMPORTAÇÃO NECESSÁRIA

import java.security.Key;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    // Chave secreta definida em application.properties (ou similar)
    @Value("${app.jwt-secret}")
    private String jwtSecret;

    // Tempo de expiração do token (em milissegundos), definido em properties
    @Value("${app.jwt-expiration-milliseconds}")
    private long jwtExpirationDate;

    /**
     * Gera o JWT para um usuário autenticado.
     */
    public String generateToken(Authentication authentication) {

        // Obtém o nome de usuário (email)
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        String username = userPrincipal.getUsername();

        // Obtém as autoridades (papéis/roles) como uma string separada por vírgula
        String roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDate);

        // Constrói o token JWT
        String token = Jwts.builder()
                .setSubject(username) // O usuário autenticado (email)
                .claim("roles", roles) // Inclui as roles nos claims
                .setIssuedAt(new Date())
                .setExpiration(expireDate)
                .signWith(key(), SignatureAlgorithm.HS512) // Assina com a chave secreta
                .compact();

        return token;
    }

    /**
     * Converte a chave secreta (String Base64) em um objeto Key seguro.
     */
    private Key key() {
        // Decodifica a string base64 da chave secreta
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    /**
     * Obtém o nome de usuário (Subject/Email) a partir do JWT.
     */
    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * Valida o JWT.
     */
    public boolean validateToken(String token) {
        try {
            // Tenta analisar o token. Se falhar (expiração, assinatura inválida, etc.), lança exceção.
            Jwts.parserBuilder().setSigningKey(key()).build().parse(token);
            return true;
        } catch (JwtException e) {
            // Aqui você pode logar o erro detalhado (MalformedJwtException, ExpiredJwtException, etc.)
            System.out.println("JWT inválido: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.out.println("JWT fornecido está vazio: " + e.getMessage());
        }
        return false;
    }

    /**
     * NOVO MÉTODO: Extrai o JWT da requisição HTTP (do cabeçalho "Authorization").
     */
    public String getJwtFromRequest(HttpServletRequest request) {
        // Obtém o valor do cabeçalho "Authorization" (esperado: "Bearer <token>")
        String bearerToken = request.getHeader("Authorization");

        // Verifica se o valor não é nulo e se começa com "Bearer "
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            // Retorna a substring do token, removendo o prefixo "Bearer " (7 caracteres)
            return bearerToken.substring(7);
        }
        return null;
    }
}