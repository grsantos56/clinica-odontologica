package com.rcodontologia.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rcodontologia.model.Paciente;
import com.rcodontologia.model.enums.AreaAtendimento;
import com.rcodontologia.service.PacienteService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pacientes")
@Tag(name = "Pacientes", description = "Gestão de cadastro, histórico e financeiro dos pacientes")
public class PacienteController {

    private final PacienteService pacienteService;
    private final ObjectMapper objectMapper;

    // 1. Permissão de Escrita CADASTRO/DELEÇÃO (APENAS ADMIN/ATENDENTE)
    private static final String PERMIT_WRITE_CADASTRO = "hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE')";

    // 2. Permissão de PAGAMENTOS (Baixa de Débitos) - APENAS ADMIN E ATENDENTE
    // O Dentista NÃO pode acessar isso.
    private static final String PERMIT_FINANCEIRO_COBRANCA = "hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE')";

    // 3. Lançar Débito (Procedimentos) - INCLUI DENTISTA
    private static final String PERMIT_LANCAR_DEBITO = "hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE', 'DENTISTA')";

    // 4. Permissão de Gerenciamento de Retorno (Marcação/Limpeza) - Todos
    private static final String PERMIT_RETURN_MANAGEMENT = "hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE', 'DENTISTA')";

    // 5. Permissão de Leitura (Todos)
    private static final String PERMIT_READ = "hasAnyAuthority('ADMINISTRADOR', 'DENTISTA', 'ATENDENTE')";

    @Autowired
    public PacienteController(PacienteService pacienteService, ObjectMapper objectMapper) {
        this.pacienteService = pacienteService;
        this.objectMapper = objectMapper;
    }

    /**
     * POST /api/pacientes (Cadastro/Atualização S/ Foto)
     */
    @Operation(summary = "Cadastrar/Atualizar paciente (sem foto)", description = "Salva os dados básicos de um paciente. Requer permissão administrativa ou de atendente.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Paciente salvo com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PreAuthorize(PERMIT_WRITE_CADASTRO)
    @PostMapping
    public ResponseEntity<Paciente> salvarPaciente(@RequestBody Paciente paciente) {
        try {
            Paciente novoPaciente = pacienteService.salvarPaciente(paciente);
            return new ResponseEntity<>(novoPaciente, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            System.err.println("Erro de validação: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * POST /api/pacientes/com-foto (Cadastro/Atualização C/ Foto)
     */
    @Operation(summary = "Cadastrar/Atualizar com foto", description = "Salva paciente com upload de foto de perfil.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Salvo com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro ao processar imagem")
    })
    @PreAuthorize(PERMIT_WRITE_CADASTRO)
    @PostMapping(value = "/com-foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Paciente> salvarPacienteComFoto(
            @Parameter(description = "JSON do objeto Paciente", schema = @Schema(type = "string", format = "json"))
            @RequestPart("paciente") String pacienteJson,
            @Parameter(description = "Arquivo de foto (imagem)")
            @RequestPart(value = "foto", required = false) MultipartFile foto) {
        try {
            Paciente paciente = objectMapper.readValue(pacienteJson, Paciente.class);

            if (foto != null && !foto.isEmpty()) {
                String fotoUrl = pacienteService.salvarFoto(foto);
                paciente.setFoto(fotoUrl);
            }

            Paciente novoPaciente = pacienteService.salvarPaciente(paciente);

            return new ResponseEntity<>(novoPaciente, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            System.err.println("Erro de validação: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("Erro interno ao salvar paciente com foto: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/pacientes/{id}/marcar-retorno
     */
    @Operation(summary = "Marcar retorno", description = "Sinaliza que o paciente precisa de um retorno futuro.")
    @PreAuthorize(PERMIT_RETURN_MANAGEMENT)
    @PutMapping("/{id}/marcar-retorno")
    public ResponseEntity<Paciente> marcarPacienteParaRetorno(
            @PathVariable Long id,
            @RequestParam(required = false) Integer dias // 🌟 Recebe dias opcionalmente
    ) {
        try {
            Paciente pacienteAtualizado = pacienteService.marcarParaRetorno(id, dias);
            return ResponseEntity.ok(pacienteAtualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Erro ao marcar retorno: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/pacientes/{id}/limpar-retorno
     */
    @Operation(summary = "Limpar retorno", description = "Remove a sinalização de retorno pendente (usado após agendar).")
    @PreAuthorize(PERMIT_RETURN_MANAGEMENT)
    @PutMapping("/{id}/limpar-retorno")
    public ResponseEntity<Paciente> limparMarcacaoRetorno(@PathVariable Long id) {
        try {
            Paciente pacienteAtualizado = pacienteService.limparMarcacaoRetorno(id);
            return ResponseEntity.ok(pacienteAtualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Erro ao limpar flag de retorno: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/pacientes/{id}/saldo
     * ⚠️ ATENÇÃO: Apenas ADMIN e ATENDENTE podem registrar pagamentos.
     */
    @Operation(summary = "Atualizar saldo (Pagamento)", description = "Registra pagamentos e baixas no saldo. Restrito a Admins e Atendentes.")
    @PreAuthorize(PERMIT_FINANCEIRO_COBRANCA) // 🔒 Bloqueado para Dentista
    @PutMapping("/{id}/saldo")
    public ResponseEntity<Paciente> actualizarSaldoDevedor(
            @PathVariable Long id,
            @Parameter(description = "Valor pago ou ajustado (ex: -50.00 para abater)", required = true)
            @RequestParam BigDecimal valorAjuste,
            @Parameter(description = "Forma de pagamento (DINHEIRO, PIX, etc)", required = true)
            @RequestParam String formaPagamento,
            @Parameter(description = "Taxa da maquininha a ser descontada do líquido", example = "2.50")
            @RequestParam(required = false, defaultValue = "0") BigDecimal taxa,
            @Parameter(description = "Descrição personalizada do pagamento (ex: Restauração, Limpeza)")
            @RequestParam(required = false) String descricao // 🌟 NOVO PARÂMETRO
    ) {
        try {
            if (valorAjuste == null) {
                return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            }
            // 🌟 Passando a descrição para o service
            Paciente pacienteAtualizado = pacienteService.atualizarSaldoDevedor(id, valorAjuste, formaPagamento, taxa, descricao);
            return ResponseEntity.ok(pacienteAtualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Erro ao atualizar saldo: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/pacientes/{id}/lancar-debito
     * 🌟 NOVO ENDPOINT: Permite Dentista adicionar valor (cobrança) ao saldo.
     */
    @Operation(summary = "Lançar débito de procedimento", description = "Adiciona valor ao saldo devedor. Uso exclusivo para registrar custos de procedimentos (Dentistas).")
    @PreAuthorize(PERMIT_LANCAR_DEBITO) // ✅ Liberado para Dentista
    @PutMapping("/{id}/lancar-debito")
    public ResponseEntity<Paciente> lancarDebito(
            @PathVariable Long id,
            @Parameter(description = "Valor a ser cobrado do paciente")
            @RequestParam BigDecimal valor) {
        try {
            // Define internamente como "DEBITO_SESSAO" e taxa 0, pois é apenas um lançamento de dívida
            return ResponseEntity.ok(pacienteService.atualizarSaldoDevedor(id, valor, "DEBITO_SESSAO", BigDecimal.ZERO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Erro ao lançar débito: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/pacientes
     */
    @Operation(summary = "Listar todos", description = "Retorna a lista completa de pacientes cadastrados.")
    @PreAuthorize(PERMIT_READ)
    @GetMapping
    public ResponseEntity<List<Paciente>> listarTodos() {
        List<Paciente> pacientes = pacienteService.listarTodos();
        return ResponseEntity.ok(pacientes);
    }

    /**
     * GET /api/pacientes/{id}
     */
    @Operation(summary = "Buscar por ID", description = "Retorna os detalhes de um único paciente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Encontrado"),
            @ApiResponse(responseCode = "404", description = "Não encontrado")
    })
    @PreAuthorize(PERMIT_READ)
    @GetMapping("/{id}")
    public ResponseEntity<Paciente> buscarPorId(@PathVariable Long id) {
        Optional<Paciente> paciente = pacienteService.buscarPorId(id);
        return paciente.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * GET /api/pacientes/buscar/nome?q={nome}
     */
    @Operation(summary = "Buscar por nome", description = "Filtra pacientes pelo nome (busca parcial).")
    @PreAuthorize(PERMIT_READ)
    @GetMapping("/buscar/nome")
    public ResponseEntity<List<Paciente>> buscarPorNome(
            @Parameter(description = "Parte do nome para busca", required = true)
            @RequestParam("q") String nome) {
        List<Paciente> pacientes = pacienteService.buscarPorNome(nome);
        return ResponseEntity.ok(pacientes);
    }

    /**
     * GET /api/pacientes/buscar/area?area={areaAtendimento}
     */
    @Operation(summary = "Buscar por área", description = "Filtra pacientes por especialidade de atendimento.")
    @PreAuthorize(PERMIT_READ)
    @GetMapping("/buscar/area")
    public ResponseEntity<List<Paciente>> buscarPorArea(
            @Parameter(description = "Área de atendimento (Enum)", required = true)
            @RequestParam AreaAtendimento area) {
        List<Paciente> pacientes = pacienteService.buscarPorArea(area);
        return ResponseEntity.ok(pacientes);
    }

    /**
     * DELETE /api/pacientes/{id}
     */
    @Operation(summary = "Deletar paciente", description = "Remove um paciente do sistema. Requer permissão administrativa.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "ID não encontrado")
    })
    @PreAuthorize(PERMIT_WRITE_CADASTRO)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPaciente(@PathVariable Long id) {
        try {
            pacienteService.deletarPaciente(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/pacientes/{id}/saldo-devedor
     */
    @Operation(summary = "Consultar saldo devedor", description = "Retorna apenas o valor do débito atual do paciente.")
    @PreAuthorize(PERMIT_READ)
    @GetMapping("/{id}/saldo-devedor")
    public ResponseEntity<BigDecimal> verificarSaldoDevedor(@PathVariable Long id) {
        try {
            BigDecimal saldo = pacienteService.verificarSaldoDevedor(id);
            return ResponseEntity.ok(saldo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Erro ao buscar saldo devedor: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}