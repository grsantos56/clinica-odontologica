package com.rcodontologia.controller;

import com.rcodontologia.model.Receita;
import com.rcodontologia.service.ReceitaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Import necessário
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/receitas")
@Tag(name = "Receitas e Prescrições", description = "Gestão de receitas médicas/odontológicas e itens de prescrição.")
public class ReceitaController {

    private final ReceitaService receitaService;

    // Papéis permitidos para criar e gerenciar receitas.
    // DENTISTA é essencial, ADMINISTRADOR também. ATENDENTE geralmente só visualiza, mas liberamos no SecurityConfig.
    private static final String PERMIT_WRITE_READ = "hasAnyAuthority('ADMINISTRADOR', 'DENTISTA', 'ATENDENTE')";

    @Autowired
    public ReceitaController(ReceitaService receitaService) {
        this.receitaService = receitaService;
    }

    @Operation(summary = "Criar nova receita", description = "Registra uma nova receita médica com seus itens de prescrição. Requer permissão de leitura/escrita.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Receita criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos na receita")
    })
    @PreAuthorize(PERMIT_WRITE_READ)
    @PostMapping
    public ResponseEntity<Receita> criarReceita(@RequestBody Receita receita) {
        System.out.println("📥 [CONTROLLER] Chegou no endpoint POST /api/receitas");
        System.out.println("📥 [CONTROLLER] Receita recebida: " + receita);
        try {
            Receita novaReceita = receitaService.salvarReceita(receita);
            return new ResponseEntity<>(novaReceita, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            System.err.println("Erro validação Receita: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Buscar receita por ID", description = "Busca uma receita específica pelo seu ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Receita encontrada"),
            @ApiResponse(responseCode = "404", description = "Receita não encontrada")
    })
    @PreAuthorize(PERMIT_WRITE_READ)
    @GetMapping("/{id}")
    public ResponseEntity<Receita> buscarPorId(@PathVariable Long id) {
        return receitaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Listar histórico de receitas do paciente", description = "Retorna todas as receitas emitidas para um paciente específico.")
    @PreAuthorize(PERMIT_WRITE_READ)
    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<List<Receita>> listarPorPaciente(@PathVariable Long pacienteId) {
        List<Receita> historico = receitaService.listarPorPaciente(pacienteId);
        return ResponseEntity.ok(historico);
    }

    @Operation(summary = "Deletar receita", description = "Remove uma receita do sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "ID não encontrado")
    })
    @PreAuthorize(PERMIT_WRITE_READ)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarReceita(@PathVariable Long id) {
        try {
            receitaService.deletarReceita(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}