package com.rcodontologia.controller;

import com.rcodontologia.model.Profissional; // Import Model
import com.rcodontologia.model.Transacao;
import com.rcodontologia.model.enums.FormaPagamento;
import com.rcodontologia.model.enums.TipoTransacao;
import com.rcodontologia.repository.ProfissionalRepository; // 🌟 Necessário para buscar o dentista
import com.rcodontologia.service.FinanceiroService;
import com.rcodontologia.service.FinanceiroService.ResumoFinanceiroDTO;
import com.rcodontologia.service.FinanceiroService.TransacaoDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/financeiro")
@Tag(name = "Financeiro", description = "Gestão de transações, fluxo de caixa e repasses")
public class FinanceiroController {

    private final FinanceiroService financeiroService;
    private final ProfissionalRepository profissionalRepository; 

    @Autowired
    public FinanceiroController(FinanceiroService financeiroService, ProfissionalRepository profissionalRepository) {
        this.financeiroService = financeiroService;
        this.profissionalRepository = profissionalRepository;
    }

    // DTOs
    @Schema(description = "Dados para realizar um repasse financeiro a um profissional")
    public record RepasseRequest(
            @Schema(description = "ID do profissional que receberá o repasse", example = "1") Long profissionalId,
            @Schema(description = "Valor do repasse", example = "500.00") BigDecimal valor,
            @Schema(description = "Observação sobre o pagamento", example = "Pagamento referente a comissões de Maio") String observacao
    ) {}

    @Schema(description = "Dados para registro de uma nova transação manual")
    public record TransacaoInput(
            @Schema(description = "Descrição da transação", example = "Compra de materiais") String descricao,
            @Schema(description = "Valor monetário", example = "150.50") BigDecimal valor,
            @Schema(description = "Tipo da transação (ENTRADA ou SAIDA)", example = "SAIDA") String tipo,
            @Schema(description = "Forma de pagamento (DINHEIRO, PIX, etc)", example = "PIX") String forma,
            @Schema(description = "Data da transação (AAAA-MM-DD)", example = "2023-10-27") String data,
            @Schema(description = "Nome do profissional para vincular (opcional)", example = "Dra. Ana") String profissionalNome // Vem do frontend
    ) {}

    // --- ENDPOINTS ---

    @Operation(summary = "Listar transações", description = "Retorna o histórico completo de transações financeiras (Entradas e Saídas).")
    @PreAuthorize("hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE')")
    @GetMapping("/transacoes")
    public ResponseEntity<List<TransacaoDTO>> listarTransacoes() {
        return ResponseEntity.ok(financeiroService.listarPagamentos());
    }

    /**
     * POST /api/financeiro/transacoes
     * Salva transação e VINCULA ao profissional se o nome for enviado.
     */
    @Operation(summary = "Registrar transação", description = "Adiciona uma nova transação ao caixa. Permite vincular a um profissional pelo nome.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Transação registrada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Erro nos dados enviados")
    })
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    @PostMapping("/transacoes")
    public ResponseEntity<?> salvarTransacao(@RequestBody TransacaoInput input) {
        try {
            Transacao t = new Transacao();
            t.setDescricao(input.descricao());
            t.setValor(input.valor());
            t.setValorLiquido(input.valor());

            t.setTipoTransacao(TipoTransacao.valueOf(input.tipo()));
            t.setTipo(FormaPagamento.valueOf(input.forma()));

            // Tratamento de Data
            if (input.data() != null) {
                t.setData(LocalDate.parse(input.data()).atStartOfDay());
            } else {
                t.setData(LocalDateTime.now());
            }

            if (input.profissionalNome() != null && !input.profissionalNome().isEmpty()) {
                // Tenta buscar no banco um profissional com esse nome (ignora maiúsculas/minúsculas)
                // Usando stream para filtrar caso não tenha método específico 'findByNome' no repository
                Optional<Profissional> prof = profissionalRepository.findAll().stream()
                        .filter(p -> p.getNome().equalsIgnoreCase(input.profissionalNome()))
                        .findFirst();

                if (prof.isPresent()) {
                    t.setProfissionalDestino(prof.get());
                }
            }

            financeiroService.registrarPagamento(t);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao salvar transação: " + e.getMessage());
        }
    }

    @Operation(summary = "Resumo financeiro", description = "Retorna o balanço atual do caixa (Total Entradas, Total Saídas e Saldo).")
    @PreAuthorize("hasAnyAuthority('ADMINISTRADOR')")
    @GetMapping("/resumo")
    public ResponseEntity<ResumoFinanceiroDTO> obterResumoCaixa() {
        return ResponseEntity.ok(financeiroService.obterResumoCaixa());
    }

    @Operation(summary = "Realizar repasse", description = "Registra um pagamento (Saída) destinado a um profissional específico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Repasse realizado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno ao processar repasse")
    })
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    @PostMapping("/repasse")
    public ResponseEntity<?> realizarRepasse(@RequestBody RepasseRequest request) {
        try {
            financeiroService.registrarPagamentoProfissional(
                    request.profissionalId,
                    request.valor,
                    request.observacao
            );
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao registrar repasse.");
        }
    }

    @Operation(summary = "Listar pagamentos do paciente")
    @PreAuthorize("hasAnyAuthority('ADMINISTRADOR', 'ATENDENTE', 'DENTISTA')")
    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<TransacaoDTO>> listarPorPaciente(@PathVariable Long idPaciente) {
        return ResponseEntity.ok(financeiroService.listarPorPaciente(idPaciente));
    }

    @Schema(description = "Request de estorno contendo a senha e o valor")
    public record EstornoRequest(String senha, BigDecimal valor) {}

    @Operation(summary = "Estornar transação")
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    @PostMapping("/transacoes/{id}/estorno")
    public ResponseEntity<?> estornarTransacao(@PathVariable Long id, @RequestBody EstornoRequest request) {
        try {
            // Agora passa o valor para o service
            financeiroService.estornarTransacao(id, request.senha(), request.valor());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar estorno.");
        }
    }
}