package com.rcodontologia.repository;

import com.rcodontologia.model.Procedimento;
import com.rcodontologia.model.enums.StatusAgendamento;
import com.rcodontologia.model.enums.StatusPagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProcedimentoRepository extends JpaRepository<Procedimento, Long> {

    Optional<Procedimento> findByAgendamento_Id(Long idAgendamento);

    List<Procedimento> findByAgendamento_Paciente_Id(Long idPaciente);

    Optional<Procedimento> findByAgendamento_Paciente_IdAndAgendamento_Status(Long idPaciente, StatusAgendamento status);

    // Busca o ÚLTIMO procedimento de um agendamento CONCLUÍDO (Histórico Consolidado)
    Optional<Procedimento> findFirstByAgendamento_Paciente_IdAndAgendamento_StatusOrderByDataRegistroDesc(Long idPaciente, StatusAgendamento status);

    // Busca o procedimento salvo mais recente (Concluido ou Rascunho)
    Optional<Procedimento> findFirstByAgendamento_Paciente_IdOrderByDataRegistroDesc(Long idPaciente);

    // Busca procedimentos onde a DataHora do agendamento está entre inicio e fim
    // (Usado tanto para listarPorData quanto para listarPorIntervalo)
    List<Procedimento> findByAgendamento_DataHoraBetween(LocalDateTime inicio, LocalDateTime fim);

    // Busca todos os procedimentos de um mesmo tratamento (Pai + Retornos)
    List<Procedimento> findByCodigoTratamento(String codigoTratamento);

    // ----------------------------------------------------------------------
    // 🌟 NOVOS MÉTODOS PARA LÓGICA DE ORÇAMENTO 🌟
    // ----------------------------------------------------------------------

    // 1. Listar orçamentos pendentes QUE AINDA NÃO FORAM AGENDADOS
    // (A flag 'OrcamentoAgendadoFalse' é crucial para ele sumir da lista depois de agendar)
    List<Procedimento> findByStatusPagamentoAndOrcamentoAgendadoFalseOrderByDataRegistroDesc(StatusPagamento status);

    // 2. Buscar o último orçamento de um paciente específico
    // (Usado para recuperar os dados e jogar na tela de registro quando for executar)
    Optional<Procedimento> findFirstByAgendamento_Paciente_IdAndStatusPagamentoOrderByDataRegistroDesc(Long idPaciente, StatusPagamento status);

    // 3. Buscar o último orçamento aprovado de um paciente específico
    // (Usado para garantir que só orçamentos aprovados sejam agendados)
    Optional<Procedimento> findFirstByAgendamento_Paciente_IdAndStatusPagamentoAndOrcamentoAgendadoTrueOrderByDataRegistroDesc(
        Long idPaciente, 
        StatusPagamento status
    );

}