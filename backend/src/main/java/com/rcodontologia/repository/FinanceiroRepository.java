package com.rcodontologia.repository;

import com.rcodontologia.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FinanceiroRepository extends JpaRepository<Transacao, Long> {

    /**
     * Método de busca para listar todas as transações (entradas/pagamentos) ordenadas por data.
     * @return Lista de Transacoes ordenadas.
     */
    List<Transacao> findAllByOrderByDataDesc();

    // Futuramente, você pode adicionar métodos para filtrar por data, tipo ou paciente.
    List<Transacao> findByDataBetween(LocalDateTime dataInicio, LocalDateTime dataFim);

    List<Transacao> findByPaciente_IdOrderByDataDesc(Long idPaciente);
}