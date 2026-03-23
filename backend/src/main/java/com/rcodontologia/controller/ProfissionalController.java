package com.rcodontologia.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rcodontologia.model.Profissional;
import com.rcodontologia.model.enums.AreaAtendimento;
import com.rcodontologia.service.ProfissionalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/profissionais")
@Tag(name = "Profissionais", description = "Gestão de cadastro e busca de profissionais (Dentistas, Atendentes, etc.)")
public class ProfissionalController {

    private final ProfissionalService profissionalService;
    private final ObjectMapper objectMapper;

    @Autowired
    public ProfissionalController(ProfissionalService profissionalService, ObjectMapper objectMapper) {
        this.profissionalService = profissionalService;
        this.objectMapper = objectMapper;
    }

    /**
     * POST /api/profissionais
     * Cria ou atualiza um profissional (sem foto).
     */
    @Operation(summary = "Cadastrar/Atualizar profissional (sem foto)", description = "Salva os dados básicos de um profissional via JSON. Requer privilégio de ADMINISTRADOR.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Profissional salvo com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PreAuthorize("hasAuthority('ADMINISTRADOR')") // 🔑 Apenas ADMINISTRADOR pode gerenciar cadastros.
    @PostMapping
    public ResponseEntity<Profissional> salvarProfissional(@RequestBody Profissional profissional) {
        try {
            Profissional novoProfissional = profissionalService.salvarProfissional(profissional);
            return new ResponseEntity<>(novoProfissional, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // ----------------------------------------------------------------------
    // 🌟 ENDPOINT: SALVAR PROFISSIONAL COM FOTO (MULTIPART) 🌟
    // ----------------------------------------------------------------------

    /**
     * POST /api/profissionais/com-foto
     * Cria ou atualiza um profissional, processando os dados JSON e o arquivo de foto.
     */
    @Operation(summary = "Cadastrar/Atualizar com foto", description = "Salva profissional com upload de foto de perfil.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Salvo com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro ao processar imagem")
    })
    @PreAuthorize("hasAuthority('ADMINISTRADOR')") // 🔑 Apenas ADMINISTRADOR pode gerenciar cadastros.
    @PostMapping(value = "/com-foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Profissional> salvarProfissionalComFoto(
            @Parameter(description = "JSON do objeto Profissional", schema = @Schema(type = "string", format = "json"))
            @RequestPart("profissional") String profissionalJson,
            @Parameter(description = "Arquivo de foto (imagem)")
            @RequestPart(value = "foto", required = false) MultipartFile foto) {
        try {
            // 1. Desserializa o JSON para o objeto Profissional
            Profissional profissional = objectMapper.readValue(profissionalJson, Profissional.class);

            // 2. Chama o serviço que gerencia o upload e persistência
            Profissional salvo = profissionalService.salvarProfissionalComFoto(profissional, foto);

            return new ResponseEntity<>(salvo, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            System.err.println("Erro ao processar arquivo/salvar profissional: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    // ----------------------------------------------------------------------


    /**
     * GET /api/profissionais
     * Lista todos os profissionais.
     */
    @Operation(summary = "Listar todos", description = "Retorna a lista completa de profissionais ativos.")
    @PreAuthorize("hasAnyAuthority('ADMINISTRADOR', 'DENTISTA', 'ATENDENTE')")
    @GetMapping
    public ResponseEntity<List<Profissional>> listarTodos() {
        List<Profissional> profissionais = profissionalService.listarTodos();
        return ResponseEntity.ok(profissionais);
    }

    /**
     * GET /api/profissionais/area?area={area}
     * Busca profissionais por área. (Usado no Agendamento)
     */
    @Operation(summary = "Buscar por área", description = "Filtra profissionais por especialidade (ex: ODONTOLOGIA).")
    @PreAuthorize("hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE', 'DENTISTA')") // 🔑 Permite o ATENDENTE para a busca de agendamento.
    @GetMapping("/area")
    public ResponseEntity<List<Profissional>> buscarPorArea(
            @Parameter(description = "Área de atendimento (Enum)", required = true)
            @RequestParam AreaAtendimento area) {
        List<Profissional> profissionais = profissionalService.buscarPorArea(area);
        return ResponseEntity.ok(profissionais);
    }

    /**
     * DELETE /api/profissionais/{id}
     * Deleta um profissional.
     */
    @Operation(summary = "Deletar profissional", description = "Remove um profissional do sistema. Requer privilégio de ADMINISTRADOR.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "ID não encontrado")
    })
    @PreAuthorize("hasAuthority('ADMINISTRADOR')") // 🔑 Apenas ADMINISTRADOR pode deletar.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarProfissional(@PathVariable Long id) {
        try {
            profissionalService.deletarProfissional(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}