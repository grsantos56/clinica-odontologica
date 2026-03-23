package com.rcodontologia.controller;

import com.rcodontologia.model.Servico;
import com.rcodontologia.service.ServicoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicos")
@Tag(name = "Serviços e Procedimentos", description = "Gestão de serviços oferecidos pela clínica e seus respectivos preços.")
public class ServicoController {

    private final ServicoService servicoService;

    // Permissões
    private static final String PERMIT_READ_SERVICE = "hasAnyAuthority('ADMINISTRADOR', 'DENTISTA')";
    private static final String PERMIT_WRITE_SERVICE = "hasAuthority('ADMINISTRADOR')";

    @Autowired
    public ServicoController(ServicoService servicoService) {
        this.servicoService = servicoService;
    }

    /**
     * GET /api/servicos
     * Lista todos os serviços.
     */
    @Operation(summary = "Listar todos", description = "Retorna todos os serviços disponíveis (incluindo flag 'requerDente').")
    @PreAuthorize(PERMIT_READ_SERVICE)
    @GetMapping
    public ResponseEntity<List<Servico>> listarTodos() {
        List<Servico> servicos = servicoService.listarTodos();
        return ResponseEntity.ok(servicos);
    }

    /**
     * GET /api/servicos/{id}
     * Busca um serviço pelo ID.
     */
    @Operation(summary = "Buscar por ID", description = "Busca um serviço específico pelo seu identificador.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Serviço encontrado"),
            @ApiResponse(responseCode = "404", description = "Serviço não encontrado")
    })
    @PreAuthorize(PERMIT_READ_SERVICE)
    @GetMapping("/{id}")
    public ResponseEntity<Servico> buscarPorId(@PathVariable Long id) {
        return servicoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * POST /api/servicos
     * Cria um novo serviço.
     */
    @Operation(summary = "Criar novo serviço", description = "Cria um novo serviço. O campo 'requerDente' define se é um procedimento específico ou geral.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Serviço criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PreAuthorize(PERMIT_WRITE_SERVICE)
    @PostMapping
    public ResponseEntity<Servico> criarServico(@RequestBody Servico servico) {
        try {
            // O mapeamento do JSON para o objeto Servico (incluindo requerDente) é automático aqui
            Servico novoServico = servicoService.salvar(servico);
            return new ResponseEntity<>(novoServico, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * PUT /api/servicos/{id}
     * Atualiza um serviço existente.
     */
    @Operation(summary = "Atualizar serviço", description = "Atualiza dados de um serviço existente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Serviço atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "ID ou dados inválidos")
    })
    @PreAuthorize(PERMIT_WRITE_SERVICE)
    @PutMapping("/{id}")
    public ResponseEntity<Servico> atualizarServico(@PathVariable Long id, @RequestBody Servico servico) {
        try {
            servico.setId(id);
            Servico atualizado = servicoService.salvar(servico);
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * DELETE /api/servicos/{id}
     * Deleta um serviço.
     */
    @Operation(summary = "Deletar serviço", description = "Remove um serviço do sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "ID não encontrado")
    })
    @PreAuthorize(PERMIT_WRITE_SERVICE)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarServico(@PathVariable Long id) {
        try {
            servicoService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}