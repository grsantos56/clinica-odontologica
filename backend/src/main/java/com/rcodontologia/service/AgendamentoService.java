package com.rcodontologia.service;

import com.rcodontologia.model.Agendamento;
import com.rcodontologia.model.Paciente;
import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.enums.StatusAgendamento;
import com.rcodontologia.repository.AgendamentoRepository;
import com.rcodontologia.repository.PacienteRepository;
import com.rcodontologia.repository.ProfissionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final PacienteRepository pacienteRepository;
    private final ProfissionalRepository profissionalRepository;

    @Autowired
    public AgendamentoService(AgendamentoRepository agendamentoRepository,
                              PacienteRepository pacienteRepository,
                              ProfissionalRepository profissionalRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.pacienteRepository = pacienteRepository;
        this.profissionalRepository = profissionalRepository;
    }

    /**
     * Cria um novo agendamento, validando a existência do paciente, profissional,
     * e a disponibilidade de horário.
     */
    @Transactional
    public Agendamento salvarAgendamento(Agendamento agendamento) {

        // 1. REGRA: Validação e Busca do Paciente
        if (agendamento.getPaciente() == null || agendamento.getPaciente().getId() == null) {
            throw new IllegalArgumentException("O agendamento deve estar associado a um paciente válido.");
        }
        Paciente paciente = pacienteRepository.findById(agendamento.getPaciente().getId())
                .orElseThrow(() -> new IllegalArgumentException("Paciente não encontrado com o ID fornecido."));
        agendamento.setPaciente(paciente);

        // 2. REGRA: Validação e Busca do Profissional
        if (agendamento.getProfissional() == null || agendamento.getProfissional().getId() == null) {
            throw new IllegalArgumentException("O agendamento deve estar associado a um profissional válido.");
        }
        Profissional profissional = profissionalRepository.findById(agendamento.getProfissional().getId())
                .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado com o ID fornecido."));
        agendamento.setProfissional(profissional);

        // 3. Valida se a área foi preenchida
        if (agendamento.getArea() == null) {
            throw new IllegalArgumentException("A área de agendamento é obrigatória.");
        }

        // 4. REGRA: Não permitir agendamento em data/hora passada ou nula
        if (agendamento.getDataHora() == null || agendamento.getDataHora().isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new IllegalArgumentException("Não é permitido agendar em uma data/hora que já passou ou é nula.");
        }

        // 5. REGRA: Verificar disponibilidade do profissional (IGNORANDO CANCELADOS)
        boolean indisponivel = agendamentoRepository.existsByProfissionalAndDataHoraAndStatusNot(
                agendamento.getProfissional(),
                agendamento.getDataHora(),
                StatusAgendamento.CANCELADO // 👈 Correção aqui
        );

        if (indisponivel) {
            throw new IllegalArgumentException("O profissional " + profissional.getNome() +
                    " já possui um agendamento para o horário: " + agendamento.getDataHora().toLocalTime());
        }

        // 6. REGRA: Definir o status inicial se não for especificado (PENDENTE)
        if (agendamento.getStatus() == null) {
            agendamento.setStatus(StatusAgendamento.PENDENTE);
        }

        return agendamentoRepository.save(agendamento);
    }

    /**
     * Busca um agendamento por ID.
     */
    @Transactional(readOnly = true)
    public Optional<Agendamento> buscarPorId(Long id) {
        return agendamentoRepository.findById(id);
    }

    /**
     * Busca agendamentos para exibição na agenda principal (ex: próximos 30 dias).
     */
    @Transactional(readOnly = true)
    public List<Agendamento> listarAgendamentosFuturos() {
        return agendamentoRepository.findAll();
    }

    /**
     * Busca pacientes que foram marcados para retorno.
     */
    @Transactional(readOnly = true)
    public List<Paciente> listarPacientesComRetornoPendente() {
        return pacienteRepository.findByRetornoSolicitadoTrue();
    }

    /**
     * Busca o último agendamento CONCLUÍDO de um paciente.
     */
    @Transactional(readOnly = true)
    public Optional<Agendamento> buscarUltimoAgendamentoConcluidoPorPaciente(Long pacienteId) {
        return agendamentoRepository.findTopByPacienteIdAndStatusOrderByDataHoraDesc(pacienteId, StatusAgendamento.CONCLUIDO);
    }

    /**
     * Atualiza o status de um agendamento.
     */
    @Transactional
    public Agendamento atualizarStatus(Long id, StatusAgendamento novoStatus) {
        Agendamento agendamento = agendamentoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado."));

        agendamento.setStatus(novoStatus);
        return agendamentoRepository.save(agendamento);
    }

    /**
     * Deleta um agendamento por ID.
     */
    @Transactional
    public void deletarAgendamento(Long id) {
        if (!agendamentoRepository.existsById(id)) {
            throw new IllegalArgumentException("Agendamento com ID " + id + " não encontrado para exclusão.");
        }
        agendamentoRepository.deleteById(id);
    }

    /**
     * Lista agendamentos para o dia atual.
     */
    @Transactional(readOnly = true)
    public List<Agendamento> listarAgendamentosDeHoje() {
        LocalDateTime inicioDoDia = LocalDate.now().atStartOfDay();
        LocalDateTime fimDoDia = inicioDoDia.plusDays(1).minusNanos(1);
        return agendamentoRepository.findByDataHoraBetween(inicioDoDia, fimDoDia);
    }

    /**
     * Lista agendamentos para uma data específica.
     */
    @Transactional(readOnly = true)
    public List<Agendamento> buscarPorData(LocalDate data) {
        LocalDateTime inicioDoDia = data.atStartOfDay();
        LocalDateTime fimDoDia = inicioDoDia.plusDays(1).minusNanos(1);
        return agendamentoRepository.findByDataHoraBetween(inicioDoDia, fimDoDia);
    }

    /**
     * Atualiza o objeto Agendamento completo.
     */
    @Transactional
    public Agendamento atualizarAgendamentoCompleto(Long id, Agendamento agendamento) {
        Agendamento agendamentoExistente = agendamentoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado."));

        // 1. ATUALIZAÇÃO DO PACIENTE
        if (agendamento.getPaciente() != null && agendamento.getPaciente().getId() != null) {
            Paciente paciente = pacienteRepository.findById(agendamento.getPaciente().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Paciente não encontrado com o ID fornecido."));
            agendamentoExistente.setPaciente(paciente);
        }

        // 2. ATUALIZAÇÃO DO PROFISSIONAL E VALIDAÇÃO DE DISPONIBILIDADE
        if (agendamento.getProfissional() != null && agendamento.getProfissional().getId() != null) {
            Profissional novoProfissional = profissionalRepository.findById(agendamento.getProfissional().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado com o ID fornecido."));

            LocalDateTime novaDataHora = agendamento.getDataHora() != null ? agendamento.getDataHora() : agendamentoExistente.getDataHora();

            if (novaDataHora.isBefore(LocalDateTime.now().minusMinutes(1))) {
                throw new IllegalArgumentException("Não é permitido reagendar em uma data/hora que já passou.");
            }

            // 2b. Regra: Verificar disponibilidade IGNORANDO o próprio ID e os CANCELADOS
            boolean indisponivel = agendamentoRepository.existsByProfissionalAndDataHoraAndIdNotAndStatusNot(
                    novoProfissional,
                    novaDataHora,
                    id,
                    StatusAgendamento.CANCELADO // 👈 Correção aqui
            );

            if (indisponivel) {
                throw new IllegalArgumentException("O profissional " + novoProfissional.getNome() +
                        " já possui outro agendamento para o horário: " + novaDataHora.toLocalTime());
            }

            agendamentoExistente.setProfissional(novoProfissional);
        }

        // 🌟 ATUALIZA O NOVO CAMPO 'AREA'
        if (agendamento.getArea() != null) {
            agendamentoExistente.setArea(agendamento.getArea());
        }

        // Atualiza os campos primitivos e enums
        if (agendamento.getDataHora() != null) {
            agendamentoExistente.setDataHora(agendamento.getDataHora());
        }
        if (agendamento.getStatus() != null) {
            agendamentoExistente.setStatus(agendamento.getStatus());
        }
        if (agendamento.getProcedimento() != null) {
            agendamentoExistente.setProcedimento(agendamento.getProcedimento());
        }
        if (agendamento.getNotas() != null) {
            agendamentoExistente.setNotas(agendamento.getNotas());
        }

        return agendamentoRepository.save(agendamentoExistente);
    }

    /**
     * Busca agendamentos de um profissional em uma data específica.
     */
    public List<Agendamento> buscarDisponibilidade(LocalDate data, Long profissionalId) {
        LocalDateTime inicioDia = data.atStartOfDay();
        LocalDateTime fimDia = data.atTime(23, 59, 59);
        return agendamentoRepository.findByDataHoraBetweenAndProfissionalId(inicioDia, fimDia, profissionalId);
    }
}