package com.rcodontologia.controller;

import com.rcodontologia.model.Agendamento;
import com.rcodontologia.model.Paciente;
import com.rcodontologia.model.enums.StatusAgendamento;
import com.rcodontologia.service.AgendamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/agendamentos")
@Tag(name = "Agendamentos", description = "Endpoints para gerenciamento de consultas, horários e disponibilidade")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    @Autowired
    public AgendamentoController(AgendamentoService agendamentoService) {
        this.agendamentoService = agendamentoService;
    }

    private static final String PERMIT_WRITE = "hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE', 'DENTISTA')";
    private static final String PERMIT_READ = "hasAnyAuthority('ADMINISTRADOR', 'DENTISTA', 'ATENDENTE')";

    // --- CRIAÇÃO ---

    @Operation(summary = "Criar novo agendamento", description = "Registra um novo agendamento no sistema. Requer permissão de escrita.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Agendamento criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou conflito de horário")
    })
    @PreAuthorize(PERMIT_WRITE)
    @PostMapping
    public ResponseEntity<Agendamento> salvarAgendamento(@RequestBody Agendamento agendamento) {
        try {
            Agendamento novoAgendamento = agendamentoService.salvarAgendamento(agendamento);
            return new ResponseEntity<>(novoAgendamento, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            System.err.println("Erro no agendamento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // --- BUSCAS ---

    @Operation(summary = "Listar agendamentos por data", description = "Retorna a agenda completa de um dia específico.")
    @GetMapping
    @PreAuthorize(PERMIT_READ)
    public ResponseEntity<List<Agendamento>> listarPorData(
            @Parameter(description = "Data no formato AAAA-MM-DD", required = true)
            @RequestParam(name = "data")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {
        List<Agendamento> agendamentos = agendamentoService.buscarPorData(data);
        return ResponseEntity.ok(agendamentos);
    }

    @Operation(summary = "Listar agendamentos de hoje", description = "Atalho para buscar a agenda do dia atual.")
    @GetMapping("/hoje")
    @PreAuthorize(PERMIT_READ)
    public ResponseEntity<List<Agendamento>> listarAgendamentosDeHoje() {
        List<Agendamento> agendamentos = agendamentoService.listarAgendamentosDeHoje();
        return ResponseEntity.ok(agendamentos);
    }

    @Operation(summary = "Listar agendamentos futuros", description = "Retorna os agendamentos dos próximos 30 dias.")
    @GetMapping("/futuros")
    @PreAuthorize(PERMIT_READ)
    public ResponseEntity<List<Agendamento>> listarAgendamentosFuturos() {
        List<Agendamento> agendamentos = agendamentoService.listarAgendamentosFuturos();
        return ResponseEntity.ok(agendamentos);
    }

    @Operation(summary = "Listar retornos pendentes", description = "Lista pacientes que precisam marcar um retorno.")
    @GetMapping("/retornos-pendentes")
    @PreAuthorize(PERMIT_WRITE)
    public ResponseEntity<List<Paciente>> listarPacientesComRetornoPendente() {
        List<Paciente> pacientes = agendamentoService.listarPacientesComRetornoPendente();
        return ResponseEntity.ok(pacientes);
    }

    @Operation(summary = "Buscar agendamento por ID", description = "Retorna os detalhes de um agendamento específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Agendamento encontrado"),
            @ApiResponse(responseCode = "404", description = "Agendamento não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize(PERMIT_READ)
    public ResponseEntity<Agendamento> buscarAgendamentoPorId(@PathVariable Long id) {
        Optional<Agendamento> agendamento = agendamentoService.buscarPorId(id);
        return agendamento.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "Buscar último agendamento concluído", description = "Busca o histórico mais recente de atendimento concluído de um paciente.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Agendamento encontrado"),
            @ApiResponse(responseCode = "204", description = "Paciente existe mas não tem agendamentos concluídos")
    })
    @GetMapping("/paciente/{idPaciente}/ultimo-concluido")
    @PreAuthorize(PERMIT_READ)
    public ResponseEntity<Agendamento> buscarUltimoAgendamentoConcluidoPorPaciente(@PathVariable Long idPaciente) {
        Optional<Agendamento> agendamento = agendamentoService.buscarUltimoAgendamentoConcluidoPorPaciente(idPaciente);
        return agendamento.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // --- ATUALIZAÇÃO E DELEÇÃO ---

    @Operation(summary = "Atualizar agendamento completo", description = "Atualiza todos os dados de um agendamento existente.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "ID não encontrado")
    })
    @PutMapping("/{id}")
    @PreAuthorize(PERMIT_WRITE)
    public ResponseEntity<Agendamento> atualizarAgendamentoCompleto(
            @PathVariable Long id,
            @RequestBody Agendamento agendamento) {
        try {
            Agendamento atualizado = agendamentoService.atualizarAgendamentoCompleto(id, agendamento);
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Atualizar status do agendamento", description = "Muda apenas o status (ex: DE PENDENTE para CONCLUIDO).")
    @PutMapping("/{id}/status")
    @PreAuthorize(PERMIT_WRITE)
    public ResponseEntity<Agendamento> atualizarStatus(
            @PathVariable Long id,
            @Parameter(description = "Novo status", required = true)
            @RequestParam StatusAgendamento status) {
        try {
            Agendamento agendamentoAtualizado = agendamentoService.atualizarStatus(id, status);
            return ResponseEntity.ok(agendamentoAtualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Deletar agendamento", description = "Remove um agendamento do sistema.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "ID não encontrado")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize(PERMIT_WRITE)
    public ResponseEntity<Void> deletarAgendamento(@PathVariable Long id) {
        try {
            agendamentoService.deletarAgendamento(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- UTILITÁRIOS ---

    @Operation(summary = "Verificar disponibilidade", description = "Lista agendamentos já existentes para checar conflitos de horário.")
    @GetMapping("/disponibilidade")
    @PreAuthorize(PERMIT_READ)
    public ResponseEntity<List<Agendamento>> buscarDisponibilidade(
            @Parameter(description = "Data para verificação", required = true)
            @RequestParam(name = "data") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @Parameter(description = "ID do profissional", required = true)
            @RequestParam(name = "profissionalId") Long profissionalId) {

        List<Agendamento> agendamentos = agendamentoService.buscarDisponibilidade(data, profissionalId);
        return ResponseEntity.ok(agendamentos);
    }
}