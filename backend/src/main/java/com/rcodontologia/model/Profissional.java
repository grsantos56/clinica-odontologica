package com.rcodontologia.model;

import com.rcodontologia.model.enums.AreaAtendimento;
import com.rcodontologia.model.enums.TipoProfissional;
import com.rcodontologia.model.enums.UserStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
// List importado, mas não usado. Pode ser removido se não for usado em outro lugar.
// import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "profissional")
// 🌟 IMPLEMENTAÇÃO OBRIGATÓRIA PARA O SPRING SECURITY 🌟
public class Profissional implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ----------------------------------------------------------------
    // 🌟 GETTER EXPLÍCITO ADICIONADO PARA COMPATIBILIDADE (getId()) 🌟
    // ----------------------------------------------------------------
    public Long getId() {
        return id;
    }
    // ----------------------------------------------------------------

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 100)
    private String crmOuRegistro;

    @Column(nullable = true, length = 20)
    private String telefone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AreaAtendimento areaAtendimento;

    // CAMPO DE LOGIN: EMAIL
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // CAMPO DE SEGURANÇA: SENHA
    @Column(nullable = true, length = 100)
    private String password;

    @Column(nullable = true, length = 255)
    private String foto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoProfissional tipoProfissional;

    // CAMPO DE STATUS PARA CONFIRMAÇÃO DO PRIMEIRO ADMIN
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserStatus status = UserStatus.PENDENTE_CONFIRMACAO;

    // CAMPOS PARA CONFIRMAÇÃO POR E-MAIL
    @Column(length = 6)
    private String confirmationCode;

    private LocalDateTime codeExpiryDate;

    // ----------------------------------------------------------------
    // 🌟 IMPLEMENTAÇÃO DOS MÉTODOS DE USERDETAILS 🌟
    // ----------------------------------------------------------------

    /**
     * Mapeia o TipoProfissional para a autoridade (Role) do Spring Security.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Retorna a lista de papéis (apenas um, neste caso)
        return Collections.singletonList(new SimpleGrantedAuthority(tipoProfissional.name()));
    }

    /**
     * Retorna a senha.
     */
    @Override
    public String getPassword() {
        return this.password;
    }

    /**
     * Retorna o nome de usuário (será o email, no nosso caso).
     */
    @Override
    public String getUsername() {
        return this.email;
    }

    /**
     * Retorna se o usuário está ativo.
     */
    @Override
    public boolean isEnabled() {
        return this.status == UserStatus.ATIVA;
    }

    // Métodos de bloqueio padrão:

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }


}