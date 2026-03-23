package com.rcodontologia.repository;

import com.rcodontologia.model.Agendamento;
import com.rcodontologia.model.Paciente;
import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.enums.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    /**
     * Busca todos os agendamentos de um paciente específico, ordenados por data.
     */
    List<Agendamento> findByPacienteOrderByDataHoraAsc(Paciente paciente);

    /**
     * Busca agendamentos dentro de um período de tempo.
     */
    List<Agendamento> findByDataHoraBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Busca agendamentos em um determinado período de tempo, filtrados por status.
     */
    List<Agendamento> findByDataHoraBetweenAndStatus(
            LocalDateTime start,
            LocalDateTime end,
            StatusAgendamento status
    );

    /**
     * Busca agendamentos futuros para um profissional específico.
     */
    List<Agendamento> findByProfissionalAndDataHoraAfterOrderByDataHoraAsc(
            Profissional profissional,
            LocalDateTime dataAtual
    );

    // -------------------------------------------------------------------------
    // --- MÉTODOS DE VALIDAÇÃO DE DISPONIBILIDADE (CORRIGIDOS) ---
    // -------------------------------------------------------------------------

    /**
     * Verifica se existe um agendamento para aquele Profissional E horário,
     * EXCLUINDO aqueles com o status especificado (geralmente CANCELADO).
     * Usado na criação de agendamentos.
     */
    boolean existsByProfissionalAndDataHoraAndStatusNot(
            Profissional profissional,
            LocalDateTime dataHora,
            StatusAgendamento statusIgnorado
    );

    /**
     * Verifica se há conflito de horário, excluindo o próprio agendamento (IdNot)
     * e também excluindo aqueles com o status especificado (geralmente CANCELADO).
     * Usado na atualização de agendamentos.
     */
    boolean existsByProfissionalAndDataHoraAndIdNotAndStatusNot(
            Profissional profissional,
            LocalDateTime dataHora,
            Long id,
            StatusAgendamento statusIgnorado
    );

    // -------------------------------------------------------------------------
    // --- LÓGICA DE RETORNO PENDENTE ---
    // -------------------------------------------------------------------------

    /**
     * Verifica a existência de agendamentos futuros para um paciente com um status específico.
     */
    boolean existsByPacienteAndDataHoraAfterAndStatusIn(
            Paciente paciente,
            LocalDateTime dataAtual,
            List<StatusAgendamento> status
    );

    // -------------------------------------------------------------------------
    // 🌟 ÚLTIMO AGENDAMENTO CONCLUÍDO 🌟
    // -------------------------------------------------------------------------

    /**
     * Busca o agendamento mais recente (Topo) para um paciente e com um status específico (CONCLUIDO).
     */
    Optional<Agendamento> findTopByPacienteIdAndStatusOrderByDataHoraDesc(Long pacienteId, StatusAgendamento status);

    /**
     * Busca agendamentos por intervalo de tempo e profissional (usado para montar a grade de horários).
     */
    List<Agendamento> findByDataHoraBetweenAndProfissionalId(LocalDateTime inicio, LocalDateTime fim, Long profissionalId);
}