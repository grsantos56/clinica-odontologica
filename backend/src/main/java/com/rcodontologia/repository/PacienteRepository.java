package com.rcodontologia.repository;

import com.rcodontologia.model.Paciente;
import com.rcodontologia.model.enums.AreaAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    List<Paciente> findByNomeContainingIgnoreCase(String nome);

    List<Paciente> findByAreaAtendimento(AreaAtendimento areaAtendimento);

    /**
     * 🌟 NOVO: Método simples para listar pacientes com a flag 'retornoSolicitado' ativa.
     */
    List<Paciente> findByRetornoSolicitadoTrue();

    /**
     * Busca pacientes que foram marcados para retorno, mas que ainda não
     * possuem um agendamento futuro (PENDENTE/CONFIRMADO).
     */
    @Query(value = "SELECT p.* FROM Paciente p WHERE p.retorno_solicitado = TRUE AND NOT EXISTS (SELECT 1 FROM Agendamento a WHERE a.paciente_id = p.id AND a.data_hora > CURRENT_TIMESTAMP AND a.status IN ('PENDENTE', 'CONFIRMADO'))", nativeQuery = true)
    List<Paciente> findPacientesComRetornoPendente();
}