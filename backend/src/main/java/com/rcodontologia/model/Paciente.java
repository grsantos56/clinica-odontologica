package com.rcodontologia.model;

import com.rcodontologia.model.enums.AreaAtendimento;
import com.rcodontologia.model.enums.StatusFinanceiro;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.math.BigDecimal;
import java.util.List;

/**
 * Classe que representa um paciente.
 * Contém lógica de negócio virtual para identificar pacientes inativos/sumidos.
 *
 * @author Gabriel Rodrigues
 * @version 1.2
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "paciente")
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(nullable = true, unique = true, length = 11)
    private String cpf;

    @Temporal(TemporalType.DATE)
    @Column(nullable = false, length = 10)
    private Date nascimento;

    @Column(nullable = true, length = 150)
    private String endereco;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusFinanceiro statusFinanceiro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AreaAtendimento areaAtendimento;

    @Column(nullable = true, length = 255)
    private String foto;

    @Column(nullable = true, length = 100)
    private String email;

    @Column(nullable = true, length = 500)
    private String observacoes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal saldoDevedor = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean retornoSolicitado = false;

    @Column(nullable = true)
    private LocalDateTime dataUltimaVisita; // Data do último procedimento concluído

    @Column(nullable = true)
    private LocalDateTime dataUltimoOrcamento; // Data que fez um orçamento

    @Column(nullable = true)
    private LocalDateTime dataUltimoPagamento; // Data do último pagamento realizado

    // --- 🌟 CAMPO VIRTUAL (CALCULADO) ---
    // Não cria coluna no banco, apenas envia no JSON para o Front
    @Transient
    public List<String> getListaAlertas() {
        List<String> alertas = new ArrayList<>();
        LocalDateTime agora = LocalDateTime.now();

        // 1. Orçamento Parado (30 dias / 1 Mês)
        if (this.dataUltimoOrcamento != null) {
            long dias = ChronoUnit.DAYS.between(this.dataUltimoOrcamento, agora);
            // Se fez visita DEPOIS do orçamento, não está parado. Se não, conta o tempo.
            boolean naoVoltou = this.dataUltimaVisita == null || this.dataUltimaVisita.isBefore(this.dataUltimoOrcamento);
            if (dias > 30 && naoVoltou) {
                alertas.add("ORCAMENTO_PARADO");
            }
        }

        // 2. Inadimplente (60 dias / 2 Meses sem pagar)
        // Só verifica se tiver débito em aberto
        if (this.statusFinanceiro == StatusFinanceiro.COM_DEBITOS_EM_ABERTO) {
            
            // Define a data de referência para contar os dias da dívida
            LocalDateTime dataReferencia = null;

            if (this.dataUltimoPagamento != null) {
                // Se já pagou alguma vez, conta do último pagamento
                dataReferencia = this.dataUltimoPagamento;
            } else if (this.dataUltimaVisita != null) {
                // Se nunca pagou, conta da última visita (quando a dívida foi gerada)
                dataReferencia = this.dataUltimaVisita;
            }
            
            // Se tiver uma data de referência válida, calcula os dias
            if (dataReferencia != null) {
                long diasSemPagar = ChronoUnit.DAYS.between(dataReferencia, agora);
                if (diasSemPagar > 60) {
                    alertas.add("INADIMPLENTE");
                }
            } else {
                // CASO ESPECIAL: Tem débito, mas não tem registro de visita nem pagamento.
                // Isso pode acontecer em migração de dados ou cadastro manual de saldo.
                // Neste caso, NÃO marcamos como inadimplente "velho" automaticamente para evitar falsos positivos
                // em cadastros novos manuais.
            }
        }

        // 3. Retorno (Apenas se a flag estiver marcada)
        if (Boolean.TRUE.equals(this.retornoSolicitado)) {
             alertas.add("RETORNO_PENDENTE");
        }

        // 4. Inativo (90 dias sem visita, independente dos outros)
        if (this.dataUltimaVisita != null) {
            long diasSemVisita = ChronoUnit.DAYS.between(this.dataUltimaVisita, agora);
            if (diasSemVisita > 90) {
                alertas.add("INATIVO");
            }
        }

        // Se não tiver nada, está Ativo
        if (alertas.isEmpty()) {
            alertas.add("ATIVO");
        }

        return alertas;
    }

    @Column(nullable = false)
    private Boolean recorrente = false; // 🌟 NOVO

    @Column(name = "dias_recorrencia")
    private Integer diasRecorrencia = 0; 

    @Column(nullable = true)
    private LocalDateTime dataPrevisao;
}