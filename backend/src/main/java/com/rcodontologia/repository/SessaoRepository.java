package com.rcodontologia.repository;

import com.rcodontologia.model.Sessao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SessaoRepository extends JpaRepository<Sessao, Long> {
    List<Sessao> findByProfissionalId(Long profissionalId);
    Optional<Sessao> findByToken(String token);
    void deleteByToken(String token);
}