package com.rcodontologia.repository;

import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.enums.AreaAtendimento;
import com.rcodontologia.model.enums.TipoProfissional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfissionalRepository extends JpaRepository<Profissional, Long> {

    // --- Métodos Existentes ---

    /**
     * Busca profissionais pelo Tipo (ex: DENTISTA, ATENDENTE).
     */
    List<Profissional> findByTipoProfissional(TipoProfissional tipoProfissional);

    /**
     * Busca profissionais que atuam em uma determinada Área (ex: ODONTOLOGIA).
     */
    List<Profissional> findByAreaAtendimento(AreaAtendimento areaAtendimento);

    /**
     * Busca por nome ou registro/CRM (útil para pesquisa rápida).
     */
    List<Profissional> findByNomeContainingIgnoreCaseOrCrmOuRegistroContainingIgnoreCase(String nome, String registro);

    // --- Métodos de Segurança e Autenticação (Novos) ---

    /**
     * Busca um profissional pelo E-mail. Essencial para o UserDetailsService.
     */
    Optional<Profissional> findByEmail(String email);

    /**
     * Verifica se já existe um Administrador no sistema (Regra de Negócio).
     */
    boolean existsByTipoProfissional(TipoProfissional tipoProfissional);

    /**
     * Busca um profissional pelo Código de Confirmação.
     */
    Optional<Profissional> findByConfirmationCode(String confirmationCode);

    /**
     * Busca um profissional pelo email e código de confirmação.
     */
    Optional<Profissional> findByEmailAndConfirmationCode(String email, String confirmationCode);
}