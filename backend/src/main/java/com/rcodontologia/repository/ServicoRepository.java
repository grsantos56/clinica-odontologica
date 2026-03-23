package com.rcodontologia.repository;

import com.rcodontologia.model.Servico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServicoRepository extends JpaRepository<Servico, Long> {
    Optional<Servico> findByNome(String nome);
}
