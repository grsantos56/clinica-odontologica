package com.rcodontologia.repository;

import com.rcodontologia.model.Receita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceitaRepository extends JpaRepository<Receita, Long> {

    // Método de busca para listar o histórico de receitas de um paciente
    List<Receita> findByPacienteIdOrderByDataEmissaoDesc(Long pacienteId);
}