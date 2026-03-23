package com.rcodontologia.config.security.user;

import com.rcodontologia.model.Profissional;
import com.rcodontologia.repository.ProfissionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final ProfissionalRepository profissionalRepository;

    @Autowired
    public CustomUserDetailsService(ProfissionalRepository profissionalRepository) {
        this.profissionalRepository = profissionalRepository;
    }

    /**
     * Carrega o usuário (Profissional) pelo nome de usuário (e-mail) para autenticação.
     * Retorna a entidade Profissional diretamente, pois ela implementa UserDetails.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // 1. Busca o Profissional pelo email.
        Profissional profissional = profissionalRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com e-mail: " + email));

        // 2. Retorna a instância de Profissional, que o Spring Security reconhece como UserDetails.
        // A lógica de roles (getAuthorities) e status (isEnabled) agora está dentro da entidade Profissional.
        return profissional;
    }
}