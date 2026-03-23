package com.rcodontologia.config.security.jwt;

import com.rcodontologia.config.security.user.CustomUserDetailsService;
import com.rcodontologia.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final AuthService authService;

    @Autowired
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, 
                                 CustomUserDetailsService userDetailsService, 
                                 @Lazy AuthService authService) { 
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
        this.authService = authService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Obtém o JWT da requisição
        String token = getJwtFromRequest(request);

        // 2. Valida o token e define a autenticação no contexto do Spring Security
        if (StringUtils.hasText(token) && tokenProvider.validateToken(token) && authService.isTokenAtivo(token)) {

            // Obtém o nome de usuário (e-mail) do token
            String userEmail = tokenProvider.getUsernameFromJWT(token);

            // Carrega os detalhes do usuário (Profissional)
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

            // Cria o objeto de autenticação com o usuário e suas autoridades (Roles)
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Define o objeto de autenticação no contexto de segurança
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // Continua a cadeia de filtros
        filterChain.doFilter(request, response);
    }

    /**
     * Extrai o JWT do cabeçalho 'Authorization'.
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        // Verifica se o cabeçalho existe e se começa com "Bearer "
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Retorna o token sem o prefixo "Bearer "
        }
        return null;
    }
}