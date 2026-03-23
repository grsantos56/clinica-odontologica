package com.rcodontologia.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rcodontologia.model.Procedimento;
import com.rcodontologia.model.enums.StatusPagamento;
import com.rcodontologia.service.ProcedimentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/procedimentos")
@PreAuthorize("hasAnyAuthority('ADMINISTRADOR', 'DENTISTA', 'ATENDENTE')")
@Tag(name = "Procedimentos", description = "Gestão de procedimentos clínicos, histórico e evolução do tratamento")
public class ProcedimentoController {

    private final ProcedimentoService procedimentoService;
    private final ObjectMapper objectMapper;

    // Permissão de Escrita (Admin e Dentista)
    private static final String PERMIT_WRITE_PROCEDIMENTO = "hasAnyAuthority('ADMINISTRADOR', 'DENTISTA')";

    @Autowired
    public ProcedimentoController(ProcedimentoService procedimentoService, ObjectMapper objectMapper) {
        this.procedimentoService = procedimentoService;
        this.objectMapper = objectMapper;
    }

    // ----------------------------------------------------------------------
    // 🌟 ENDPOINT: SALVAR REGISTRO COMPLETO (COM FOTOS E ITENS DETALHADOS) 🌟
    // ----------------------------------------------------------------------
    @Operation(summary = "Salvar procedimento com fotos", description = "Registra a evolução clínica, itens financeiros e upload de fotos.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Salvo com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro no processamento")
    })
    @PreAuthorize(PERMIT_WRITE_PROCEDIMENTO)
    @PostMapping(value = "/salvar-registro", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Procedimento> salvarRegistroComFotos(
            @Parameter(description = "JSON do objeto Procedimento (incluindo array 'itens')", schema = @Schema(type = "string", format = "json"))
            @RequestPart("procedimento") String procedimentoJson,
            @Parameter(description = "Array de fotos do procedimento")
            @RequestPart(value = "fotos", required = false) MultipartFile[] fotos) {
        try {
            // O ObjectMapper agora converte o JSON contendo a lista "itens"
            // para a List<ProcedimentoItem> automaticamente
            Procedimento procedimento = objectMapper.readValue(procedimentoJson, Procedimento.class);

            Procedimento registroSalvo = procedimentoService.salvarComFotos(procedimento, fotos);
            return new ResponseEntity<>(registroSalvo, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            System.err.println("Erro de IO: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ----------------------------------------------------------------------
    // --- MÉTODOS DE BUSCA (LEITURA) ---
    // ----------------------------------------------------------------------

    @Operation(summary = "Buscar por agendamento")
    @GetMapping("/agendamento/{idAgendamento}")
    public ResponseEntity<Procedimento> buscarProcedimentoPorAgendamento(@PathVariable Long idAgendamento) {
        Optional<Procedimento> procedimento = procedimentoService.buscarPorAgendamentoId(idAgendamento);
        return procedimento.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }

    @Operation(summary = "Buscar pendente por paciente")
    @GetMapping("/paciente/{idPaciente}/pendente")
    public ResponseEntity<Procedimento> buscarProcedimentoPendente(@PathVariable Long idPaciente) {
        Optional<Procedimento> procedimento = procedimentoService.buscarProcedimentoPendentePorPaciente(idPaciente);
        return procedimento.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }

    @Operation(summary = "Histórico do paciente")
    @GetMapping("/paciente/{idPaciente}/historico")
    public ResponseEntity<List<Procedimento>> listarHistoricoPorPaciente(@PathVariable Long idPaciente) {
        List<Procedimento> historico = procedimentoService.listarHistoricoPorPacienteId(idPaciente);
        return ResponseEntity.ok(historico);
    }

    @Operation(summary = "Último procedimento concluído")
    @GetMapping("/paciente/{idPaciente}/ultimo-concluido")
    public ResponseEntity<Procedimento> buscarUltimoConcluido(@PathVariable Long idPaciente) {
        return procedimentoService.buscarUltimoProcedimentoConcluido(idPaciente)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @Operation(summary = "Último procedimento salvo")
    @GetMapping("/paciente/{idPaciente}/ultimo-salvo")
    public ResponseEntity<Procedimento> buscarUltimoSalvo(@PathVariable Long idPaciente) {
        return procedimentoService.buscarUltimoProcedimentoSalvo(idPaciente)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @Operation(summary = "Último gerador de retorno")
    @GetMapping("/paciente/{idPaciente}/ultimo-gerador-retorno")
    public ResponseEntity<Procedimento> buscarUltimoGeradorRetorno(@PathVariable Long idPaciente) {
        return procedimentoService.buscarUltimoGeradorDeRetorno(idPaciente)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @Operation(summary = "Listar por data")
    @GetMapping("/por-data")
    public ResponseEntity<List<Procedimento>> listarPorData(
            @RequestParam("data") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        List<Procedimento> lista = procedimentoService.listarPorData(data);
        return ResponseEntity.ok(lista);
    }

    // ----------------------------------------------------------------------
    // --- MÉTODOS DE ESCRITA SIMPLES ---
    // ----------------------------------------------------------------------

    @Operation(summary = "Criar procedimento (JSON puro)")
    @PreAuthorize(PERMIT_WRITE_PROCEDIMENTO)
    @PostMapping
    public ResponseEntity<Procedimento> criarProcedimento(@RequestBody Procedimento procedimento) {
        procedimento.setId(null);
        try {
            Procedimento novoProcedimento = procedimentoService.salvarComFotos(procedimento, null);
            return new ResponseEntity<>(novoProcedimento, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Atualizar procedimento")
    @PreAuthorize(PERMIT_WRITE_PROCEDIMENTO)
    @PutMapping("/{id}")
    public ResponseEntity<Procedimento> atualizarProcedimento(@PathVariable Long id, @RequestBody Procedimento procedimento) {
        procedimento.setId(id);
        try {
            Procedimento salvo = procedimentoService.salvarComFotos(procedimento, null);
            return new ResponseEntity<>(salvo, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 🌟 ATUALIZAÇÃO DO ENDPOINT FINANCEIRO (ACEITA VALOR LÍQUIDO) 🌟
    @Operation(summary = "Atualizar status financeiro", description = "Atualiza o status de pagamento e valores (pago/líquido) do procedimento.")
    @PreAuthorize(PERMIT_WRITE_PROCEDIMENTO)
    @PutMapping("/{id}/status-pagamento")
    public ResponseEntity<Procedimento> atualizarStatusPagamento(
            @PathVariable Long id,
            @Parameter(description = "Novo status (PAGO, PARCIALMENTE_PAGO, NAO_PAGO)")
            @RequestParam("status") StatusPagamento status,
            @Parameter(description = "Valor efetivamente pago")
            @RequestParam(value = "valorPago", required = false) Double valorPago,
            @Parameter(description = "Valor líquido (após taxas)")
            @RequestParam(value = "valorLiquido", required = false) Double valorLiquido) {
        try {
            // Passa o valorPago e valorLiquido para o service
            Procedimento atualizado = procedimentoService.atualizarStatusPagamentoEmCascata(id, status, valorPago, valorLiquido);
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 🌟 RELATÓRIO FINANCEIRO 🌟
    @Operation(summary = "Relatório financeiro", description = "Lista procedimentos dentro de um intervalo de datas para fins financeiros.")
    @GetMapping("/relatorio")
    public ResponseEntity<List<Procedimento>> listarRelatorioFinanceiro(
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {

        List<Procedimento> lista = procedimentoService.listarPorIntervalo(inicio, fim);
        return ResponseEntity.ok(lista);
    }

    // 🌟 NOVOS ENDPOINTS DE ORÇAMENTO 🌟

    @Operation(summary = "Listar orçamentos pendentes")
    @GetMapping("/orcamentos")
    public ResponseEntity<List<Procedimento>> listarOrcamentos() {
        List<Procedimento> lista = procedimentoService.listarOrcamentosPendentes();
        return ResponseEntity.ok(lista);
    }

    @Operation(summary = "Buscar último orçamento do paciente")
    @GetMapping("/paciente/{idPaciente}/ultimo-orcamento")
    public ResponseEntity<Procedimento> buscarUltimoOrcamento(@PathVariable Long idPaciente) {
        return procedimentoService.buscarUltimoOrcamentoDoPaciente(idPaciente)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @Operation(summary = "Marcar orçamento como agendado")
    @PreAuthorize(PERMIT_WRITE_PROCEDIMENTO)
    @PutMapping("/{id}/marcar-agendado")
    public ResponseEntity<Void> marcarOrcamentoAgendado(@PathVariable Long id) {
        try {
            procedimentoService.marcarOrcamentoComoAgendado(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Reabrir último orçamento agendado")
    @PreAuthorize(PERMIT_WRITE_PROCEDIMENTO)
    @PutMapping("/paciente/{idPaciente}/reabrir-orcamento")
    public ResponseEntity<String> reabrirUltimoOrcamento(@PathVariable Long idPaciente) {
        boolean sucesso = procedimentoService.reabrirUltimoOrcamento(idPaciente);
        if (sucesso) {
            return ResponseEntity.ok("Orçamento reaberto com sucesso.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Nenhum orçamento agendado encontrado para reabrir.");
        }
    }

    @Operation(summary = "Buscar orçamento agendado para execução")
    @GetMapping("/paciente/{idPaciente}/orcamento-execucao")
    public ResponseEntity<Procedimento> buscarOrcamentoParaExecucao(@PathVariable Long idPaciente) {
        return procedimentoService.buscarOrcamentoParaExecucao(idPaciente)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @Operation(summary = "Excluir procedimento/orçamento")
    @PreAuthorize(PERMIT_WRITE_PROCEDIMENTO)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirProcedimento(@PathVariable Long id) {
        try {
            // Verifica se existe antes de tentar deletar
            if (procedimentoService.buscarPorId(id).isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Chama o serviço para deletar (você precisará criar esse método no service também)
            procedimentoService.excluir(id); 
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}