package com.rcodontologia.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.rcodontologia.model.Paciente;
import com.rcodontologia.model.Transacao;
import com.rcodontologia.model.enums.AreaAtendimento;
import com.rcodontologia.model.enums.StatusFinanceiro;
import com.rcodontologia.model.enums.FormaPagamento;
import com.rcodontologia.repository.PacienteRepository;
import com.rcodontologia.util.ValidadorUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final ValidadorUtil validadorUtil;
    private final FinanceiroService financeiroService;
    private final Cloudinary cloudinary;

    @Autowired
    public PacienteService(PacienteRepository pacienteRepository,
                           ValidadorUtil validadorUtil,
                           FinanceiroService financeiroService,
                           Cloudinary cloudinary) {
        this.pacienteRepository = pacienteRepository;
        this.validadorUtil = validadorUtil;
        this.financeiroService = financeiroService;
        this.cloudinary = cloudinary;
    }

    /**
     * Lógica central de regra de negócio para determinar o status financeiro
     * com base no saldo devedor.
     */
    private StatusFinanceiro determinarStatusFinanceiro(BigDecimal saldo) {
        if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
            return StatusFinanceiro.SEM_DEBITOS;
        }
        return StatusFinanceiro.COM_DEBITOS_EM_ABERTO;
    }

    /**
     * Método para criar ou atualizar um paciente, incluindo validação de dados.
     */
    @Transactional
    public Paciente salvarPaciente(Paciente paciente) {
        if (paciente.getCpf() == null || paciente.getCpf().trim().isEmpty()) {
            throw new IllegalArgumentException("O CPF é obrigatório para cadastro.");
        }

        if (!validadorUtil.isCpfValido(paciente.getCpf())) {
            throw new IllegalArgumentException("O CPF informado não é um número válido.");
        }

        if (paciente.getSaldoDevedor() == null) {
            paciente.setSaldoDevedor(BigDecimal.ZERO);
        }

        // Garante que a flag de retorno seja inicializada como false para novos pacientes
        if (paciente.getRetornoSolicitado() == null) {
            paciente.setRetornoSolicitado(false);
        }

        paciente.setStatusFinanceiro(determinarStatusFinanceiro(paciente.getSaldoDevedor()));

        return pacienteRepository.save(paciente);
    }

    // ----------------------------------------------------------------------
    // SALVAR FOTO NO CLOUDINARY
    // ----------------------------------------------------------------------

    /**
     * Envia o arquivo para o Cloudinary e retorna a URL segura (HTTPS).
     */
    public String salvarFoto(MultipartFile foto) {
        if (foto.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de foto não pode ser vazio.");
        }

        try {
            // Envia para o Cloudinary, organizando na pasta "paciente_fotos"
            Map uploadResult = cloudinary.uploader().upload(foto.getBytes(),
                    ObjectUtils.asMap("folder", "paciente_fotos"));

            // Retorna a URL pública da imagem hospedada
            return uploadResult.get("secure_url").toString();

        } catch (IOException e) {
            System.err.println("Erro ao enviar foto para Cloudinary: " + e.getMessage());
            throw new RuntimeException("Falha ao processar e salvar o arquivo de foto na nuvem.", e);
        }
    }

    // ----------------------------------------------------------------------
    // --- MÉTODO PARA MARCAR RETORNO ---
    // ----------------------------------------------------------------------

    @Transactional
public Paciente marcarParaRetorno(Long idPaciente, Integer diasRecorrencia) {
    Paciente paciente = pacienteRepository.findById(idPaciente)
            .orElseThrow(() -> new IllegalArgumentException("Paciente com ID " + idPaciente + " não encontrado."));

    paciente.setRetornoSolicitado(true);

    // 🌟 LÓGICA DE RECORRÊNCIA E CÁLCULO DE DATA
    if (diasRecorrencia != null && diasRecorrencia > 0) {
        paciente.setRecorrente(true);
        paciente.setDiasRecorrencia(diasRecorrencia);
        
        // 🌟 CRÍTICO: Calcula a data prevista somando os dias à data atual
        // Exemplo: Hoje (17/12) + 7 dias = 24/12
        paciente.setDataPrevisao(LocalDateTime.now().plusDays(diasRecorrencia)); 
    } else {
        // Se for retorno simples, limpa dados de ciclo
        paciente.setRecorrente(false);
        paciente.setDiasRecorrencia(0);
        paciente.setDataPrevisao(null);
    }

    return pacienteRepository.save(paciente);
}

@Transactional
public Paciente limparMarcacaoRetorno(Long idPaciente) {
    Paciente paciente = pacienteRepository.findById(idPaciente)
            .orElseThrow(() -> new IllegalArgumentException("Paciente com ID " + idPaciente + " não encontrado."));

    paciente.setRetornoSolicitado(false);
    // Ao limpar o retorno (agendar), mantém-se a configuração de dias, 
    // mas a dataPrevisao é resetada até o próximo encerramento.
    paciente.setDataPrevisao(null); 
    
    return pacienteRepository.save(paciente);
}

    // ----------------------------------------------------------------------
    // 🌟 NOVA FUNCIONALIDADE: ATUALIZAR DATAS DE INTERAÇÃO (CRM) 🌟
    // ----------------------------------------------------------------------

    /**
     * Atualiza as datas de rastreio do paciente para identificar "sumiços".
     * Chamado por ProcedimentoService e pelo próprio PacienteService (no pagamento).
     */
    @Transactional
    public void atualizarDataInteracao(Long idPaciente, String tipoInteracao) {
        Paciente paciente = pacienteRepository.findById(idPaciente).orElse(null);
        if (paciente == null) return;

        LocalDateTime agora = LocalDateTime.now();

        switch (tipoInteracao) {
            case "VISITA": // Procedimento Concluído
                paciente.setDataUltimaVisita(agora);
                break;
            case "ORCAMENTO": // Procedimento criado como Orçamento
                paciente.setDataUltimoOrcamento(agora);
                break;
            case "PAGAMENTO": // Pagamento realizado
                paciente.setDataUltimoPagamento(agora);
                break;
        }
        pacienteRepository.save(paciente);
    }

    // ----------------------------------------------------------------------
    // VERIFICAR SALDO DEVEDOR
    // ----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public BigDecimal verificarSaldoDevedor(Long idPaciente) {
        Paciente paciente = pacienteRepository.findById(idPaciente)
                .orElseThrow(() -> new IllegalArgumentException("Paciente com ID " + idPaciente + " não encontrado."));

        return paciente.getSaldoDevedor() != null ? paciente.getSaldoDevedor() : BigDecimal.ZERO;
    }

    // ----------------------------------------------------------------------

    /**
     * ATUALIZADO: Método Principal que recebe a descrição personalizada.
     */
    @Transactional
    public Paciente atualizarSaldoDevedor(
            Long idPaciente, 
            BigDecimal valorAjuste, 
            String formaPagamento, 
            BigDecimal taxaPorcentagem,
            String descricaoPersonalizada // 🌟 NOVO ARGUMENTO
    ) {

        Paciente paciente = pacienteRepository.findById(idPaciente)
                .orElseThrow(() -> new IllegalArgumentException("Paciente com ID " + idPaciente + " não encontrado."));

        BigDecimal saldoAtual = paciente.getSaldoDevedor() != null ? paciente.getSaldoDevedor() : BigDecimal.ZERO;
        BigDecimal novoSaldo = saldoAtual.add(valorAjuste);

        // REGISTRA A TRANSAÇÃO SE HOUVE UM PAGAMENTO/CRÉDITO (valorAjuste negativo)
        if (valorAjuste.compareTo(BigDecimal.ZERO) < 0) {

            Transacao pagamento = new Transacao();
            pagamento.setPaciente(paciente);
            pagamento.setData(LocalDateTime.now());
            
            // 🌟 LÓGICA DA DESCRIÇÃO
            if (descricaoPersonalizada != null && !descricaoPersonalizada.trim().isEmpty()) {
                pagamento.setDescricao(descricaoPersonalizada);
            } else {
                pagamento.setDescricao("Pagamento / Abatimento"); // Padrão se vier vazio
            }

            BigDecimal valorBruto = valorAjuste.abs();
            pagamento.setValor(valorBruto);

            // CÁLCULO DA TAXA E LÍQUIDO
            if (taxaPorcentagem != null && taxaPorcentagem.compareTo(BigDecimal.ZERO) > 0) {
                pagamento.setTaxaPorcentagem(taxaPorcentagem);
                BigDecimal valorTaxa = valorBruto.multiply(taxaPorcentagem).divide(new BigDecimal(100));
                pagamento.setValorTaxa(valorTaxa);
                BigDecimal valorLiquido = valorBruto.subtract(valorTaxa);
                pagamento.setValorLiquido(valorLiquido);
            } else {
                pagamento.setTaxaPorcentagem(BigDecimal.ZERO);
                pagamento.setValorTaxa(BigDecimal.ZERO);
                pagamento.setValorLiquido(valorBruto);
            }

            try {
                pagamento.setTipo(FormaPagamento.valueOf(formaPagamento));
            } catch (IllegalArgumentException e) {
                System.err.println("Forma de pagamento inválida: " + formaPagamento);
            }

            financeiroService.registrarPagamento(pagamento);

            // ATUALIZAÇÃO AUTOMÁTICA DA DATA DE PAGAMENTO PARA O CRM
            this.atualizarDataInteracao(idPaciente, "PAGAMENTO");
        }

        // Atualiza o Saldo e o Status Financeiro do Paciente
        paciente.setSaldoDevedor(novoSaldo);
        paciente.setStatusFinanceiro(determinarStatusFinanceiro(novoSaldo));

        return pacienteRepository.save(paciente);
    }

    /**
     * MANTIDO POR COMPATIBILIDADE: Chama o método principal passando descrição nula.
     * (Usado pelo "Lançar Débito" do Dentista ou outras chamadas antigas)
     */
    @Transactional
    public Paciente atualizarSaldoDevedor(Long idPaciente, BigDecimal valorAjuste, String formaPagamento, BigDecimal taxaPorcentagem) {
        return atualizarSaldoDevedor(idPaciente, valorAjuste, formaPagamento, taxaPorcentagem, null);
    }

    // Método para buscar um paciente por ID
    @Transactional(readOnly = true)
    public Optional<Paciente> buscarPorId(Long id) {
        return pacienteRepository.findById(id);
    }

    // Método para listar todos os pacientes
    @Transactional(readOnly = true)
    public List<Paciente> listarTodos() {
        return pacienteRepository.findAll();
    }

    // Método para deletar um paciente
    @Transactional
    public void deletarPaciente(Long id) {
        if (!pacienteRepository.existsById(id)) {
            System.out.println("Paciente com ID " + id + " não encontrado.");
            return;
        }
        pacienteRepository.deleteById(id);
    }

    /**
     * Busca pacientes cujo nome contenha o termo de busca (case insensitive).
     */
    @Transactional(readOnly = true)
    public List<Paciente> buscarPorNome(String nome) {
        return pacienteRepository.findByNomeContainingIgnoreCase(nome);
    }

    /**
     * Busca pacientes por área de atendimento específica.
     */
    @Transactional(readOnly = true)
    public List<Paciente> buscarPorArea(AreaAtendimento area) {
        return pacienteRepository.findByAreaAtendimento(area);
    }
}