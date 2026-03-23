package com.rcodontologia.service;

import com.rcodontologia.model.Agendamento;
import com.rcodontologia.model.Procedimento;
import com.rcodontologia.model.ProcedimentoItem;
import com.rcodontologia.model.enums.StatusAgendamento;
import com.rcodontologia.model.enums.StatusPagamento;
import com.rcodontologia.repository.AgendamentoRepository;
import com.rcodontologia.repository.ProcedimentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProcedimentoService {

    private final ProcedimentoRepository procedimentoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final FileStorageService fileStorageService;
    private final PacienteService pacienteService; 

    @Autowired
    public ProcedimentoService(
            ProcedimentoRepository procedimentoRepository,
            AgendamentoRepository agendamentoRepository,
            FileStorageService fileStorageService,
            PacienteService pacienteService) {
        this.procedimentoRepository = procedimentoRepository;
        this.agendamentoRepository = agendamentoRepository;
        this.fileStorageService = fileStorageService;
        this.pacienteService = pacienteService;
    }

    // ----------------------------------------------------------------------
    // --- MÉTODOS DE BUSCA GERAIS ---
    // ----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarPorId(Long id) {
        return procedimentoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarPorAgendamentoId(Long idAgendamento) {
        return procedimentoRepository.findByAgendamento_Id(idAgendamento);
    }

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarProcedimentoPendentePorPaciente(Long idPaciente) {
        // 🌟 CORREÇÃO DO ERRO 500 (NonUniqueResultException)
        // Antes usava "findBy..." que quebra se tiver 2+ registros.
        // Agora usa "findFirstBy...OrderByDataRegistroDesc" para pegar o mais recente e ignorar duplicatas antigas.
        return procedimentoRepository.findFirstByAgendamento_Paciente_IdAndAgendamento_StatusOrderByDataRegistroDesc(
                idPaciente, 
                StatusAgendamento.PENDENTE
        );
    }

    @Transactional(readOnly = true)
    public List<Procedimento> listarHistoricoPorPacienteId(Long idPaciente) {
        return procedimentoRepository.findByAgendamento_Paciente_Id(idPaciente);
    }

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarUltimoProcedimentoConcluido(Long idPaciente) {
        return procedimentoRepository.findFirstByAgendamento_Paciente_IdAndAgendamento_StatusOrderByDataRegistroDesc(
                idPaciente,
                StatusAgendamento.CONCLUIDO
        );
    }

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarUltimoProcedimentoSalvo(Long idPaciente) {
        return procedimentoRepository.findFirstByAgendamento_Paciente_IdOrderByDataRegistroDesc(idPaciente);
    }

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarUltimoGeradorDeRetorno(Long idPaciente) {
        return procedimentoRepository.findFirstByAgendamento_Paciente_IdAndAgendamento_StatusOrderByDataRegistroDesc(
                idPaciente,
                StatusAgendamento.CONCLUIDO_RETORNO
        );
    }

    @Transactional(readOnly = true)
    public List<Procedimento> listarPorData(LocalDate data) {
        LocalDateTime inicio = data.atStartOfDay();
        LocalDateTime fim = data.atTime(23, 59, 59);
        return procedimentoRepository.findByAgendamento_DataHoraBetween(inicio, fim);
    }

    @Transactional(readOnly = true)
    public List<Procedimento> listarPorIntervalo(LocalDate dataInicio, LocalDate dataFim) {
        LocalDateTime inicio = dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim.atTime(23, 59, 59);
        return procedimentoRepository.findByAgendamento_DataHoraBetween(inicio, fim);
    }

    // ----------------------------------------------------------------------
    // 🌟 MÉTODOS ESPECÍFICOS DE ORÇAMENTO 🌟
    // ----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Procedimento> listarOrcamentosPendentes() {
        return procedimentoRepository.findByStatusPagamentoAndOrcamentoAgendadoFalseOrderByDataRegistroDesc(StatusPagamento.ORCAMENTO);
    }

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarUltimoOrcamentoDoPaciente(Long idPaciente) {
        return procedimentoRepository.findFirstByAgendamento_Paciente_IdAndStatusPagamentoOrderByDataRegistroDesc(
                idPaciente, 
                StatusPagamento.ORCAMENTO
        );
    }

    @Transactional
    public void marcarOrcamentoComoAgendado(Long idProcedimento) {
        Procedimento proc = procedimentoRepository.findById(idProcedimento)
                .orElseThrow(() -> new IllegalArgumentException("Orçamento não encontrado"));
        
        proc.setOrcamentoAgendado(true);
        procedimentoRepository.save(proc);
    }

    // ----------------------------------------------------------------------
    // --- MÉTODOS DE SALVAMENTO E ATUALIZAÇÃO ---
    // ----------------------------------------------------------------------

    @Transactional
    public Procedimento atualizarStatusPagamentoEmCascata(
            Long idProcedimento,
            StatusPagamento novoStatus,
            Double valorPagoInformado,
            Double valorLiquidoInformado
    ) {
        Procedimento procedimentoAlvo = procedimentoRepository.findById(idProcedimento)
                .orElseThrow(() -> new IllegalArgumentException("Procedimento não encontrado"));

        String codigo = procedimentoAlvo.getCodigoTratamento();

        if (codigo != null && !codigo.isEmpty()) {
            List<Procedimento> familia = procedimentoRepository.findByCodigoTratamento(codigo);
            for (Procedimento p : familia) {
                p.setStatusPagamento(novoStatus);
                if (valorPagoInformado != null) p.setValorPago(valorPagoInformado);
                if (valorLiquidoInformado != null) p.setValorLiquido(valorLiquidoInformado);
            }
            procedimentoRepository.saveAll(familia);
        } else {
            procedimentoAlvo.setStatusPagamento(novoStatus);
            if (valorPagoInformado != null) procedimentoAlvo.setValorPago(valorPagoInformado);
            if (valorLiquidoInformado != null) procedimentoAlvo.setValorLiquido(valorLiquidoInformado);
            procedimentoRepository.save(procedimentoAlvo);
        }

        return procedimentoAlvo;
    }

    @Transactional
    public Procedimento atualizarStatusPagamentoEmCascata(Long idProcedimento, StatusPagamento novoStatus, Double valorPagoInformado) {
        return atualizarStatusPagamentoEmCascata(idProcedimento, novoStatus, valorPagoInformado, valorPagoInformado);
    }

    @Transactional
    public Procedimento salvarComFotos(Procedimento procedimento, MultipartFile[] fotos) throws IOException {
        List<String> fotosUrlsFinais = (procedimento.getFotos() != null) ?
                new ArrayList<>(procedimento.getFotos()) : new ArrayList<>();

        if (fotos != null && fotos.length > 0) {
            for (MultipartFile foto : fotos) {
                if (!foto.isEmpty()) {
                    String fotoUrl = fileStorageService.salvarFotoProcedimento(foto);
                    fotosUrlsFinais.add(fotoUrl);
                }
            }
        }
        procedimento.setFotos(fotosUrlsFinais);

        return salvarRegistroProcedimento(procedimento);
    }

    private Procedimento salvarRegistroProcedimento(Procedimento procedimento) {
        if (procedimento.getAgendamento() == null || procedimento.getAgendamento().getId() == null) {
            throw new IllegalArgumentException("O Procedimento deve estar associado a um Agendamento válido.");
        }

        Optional<Agendamento> agendamentoOpt = agendamentoRepository.findById(procedimento.getAgendamento().getId());
        if (agendamentoOpt.isEmpty()) {
            throw new IllegalArgumentException("Agendamento não encontrado.");
        }
        Agendamento agendamento = agendamentoOpt.get();
        procedimento.setAgendamento(agendamento);

        // 🌟 LÓGICA DE DIVISÃO AUTOMÁTICA (MISTO -> DOIS REGISTROS)
        processarDivisaoDeOrcamento(procedimento, agendamento);

        // 🌟 CÁLCULO DE VALORES COM BASE NA SELEÇÃO
        double valorTotalItens = 0.0;

        if (procedimento.getItens() != null) {
            for (ProcedimentoItem item : procedimento.getItens()) {
                item.setProcedimento(procedimento);
                boolean isFaturado = item.getFaturado() == null || item.getFaturado();

                if (isFaturado) {
                    double valorBase = item.getValorBase() != null ? item.getValorBase() : 0.0;
                    double acrescimo = item.getAcrescimo() != null ? item.getAcrescimo() : 0.0;
                    double desconto = item.getDesconto() != null ? item.getDesconto() : 0.0;
                    
                    double liquidoItem = valorBase + acrescimo - desconto;
                    item.setValorLiquido(liquidoItem);
                    valorTotalItens += liquidoItem;
                } else {
                    item.setValorLiquido(0.0);
                }
            }
        }

        procedimento.setValorLiquido(valorTotalItens);
        validarLimiteDesconto(procedimento);

        // DEFINIÇÃO AUTOMÁTICA DE STATUS
        if (procedimento.getStatusPagamento() == null || procedimento.getStatusPagamento() == StatusPagamento.ORCAMENTO) {
            if (valorTotalItens > 0) {
                procedimento.setStatusPagamento(StatusPagamento.AGUARDANDO);
            } else {
                procedimento.setStatusPagamento(StatusPagamento.ORCAMENTO);
            }
        }

        // Lógica de vínculo de tratamento (Herança)
        if (procedimento.getCodigoTratamento() == null || procedimento.getCodigoTratamento().isEmpty()) {
            boolean isContinuacao = agendamento.getStatus() == StatusAgendamento.AGUARDANDO_RETORNO
                    || agendamento.getStatus() == StatusAgendamento.CONCLUIDO_RETORNO;

            if (isContinuacao) {
                Long idPaciente = agendamento.getPaciente().getId();
                Optional<Procedimento> ultimo = procedimentoRepository.findFirstByAgendamento_Paciente_IdAndAgendamento_StatusOrderByDataRegistroDesc(
                        idPaciente, StatusAgendamento.CONCLUIDO_RETORNO);

                if (ultimo.isEmpty()) {
                    ultimo = procedimentoRepository.findFirstByAgendamento_Paciente_IdOrderByDataRegistroDesc(idPaciente);
                }

                if (ultimo.isPresent() && ultimo.get().getCodigoTratamento() != null) {
                    procedimento.setCodigoTratamento(ultimo.get().getCodigoTratamento());
                    
                    if (procedimento.getStatusPagamento() == null) {
                        procedimento.setStatusPagamento(ultimo.get().getStatusPagamento());
                    }
                    if (procedimento.getMapaOdontogramaJson() == null || procedimento.getMapaOdontogramaJson().isEmpty()) {
                         procedimento.setMapaOdontogramaJson(ultimo.get().getMapaOdontogramaJson());
                    }
                    // Herda também o inicial se não tiver
                    if (procedimento.getMapaOdontogramaInicialJson() == null || procedimento.getMapaOdontogramaInicialJson().isEmpty()) {
                        procedimento.setMapaOdontogramaInicialJson(ultimo.get().getMapaOdontogramaInicialJson());
                    }

                } else {
                    procedimento.setCodigoTratamento(UUID.randomUUID().toString());
                    if (procedimento.getStatusPagamento() == null) {
                        procedimento.setStatusPagamento(valorTotalItens > 0 ? StatusPagamento.AGUARDANDO : StatusPagamento.ORCAMENTO);
                    }
                }
            } else {
                procedimento.setCodigoTratamento(UUID.randomUUID().toString());
                if (procedimento.getStatusPagamento() == null) {
                    procedimento.setStatusPagamento(valorTotalItens > 0 ? StatusPagamento.AGUARDANDO : StatusPagamento.ORCAMENTO);
                }
            }
        }

        // Preservação de dados no Update
        if (procedimento.getId() != null) {
            Optional<Procedimento> existingOpt = procedimentoRepository.findById(procedimento.getId());
            if (existingOpt.isPresent()) {
                Procedimento existing = existingOpt.get();

                if (existing.getCodigoTratamento() != null) procedimento.setCodigoTratamento(existing.getCodigoTratamento());
                
                if (existing.getMapaOdontogramaInicialJson() != null && !existing.getMapaOdontogramaInicialJson().isEmpty()) {
                    procedimento.setMapaOdontogramaInicialJson(existing.getMapaOdontogramaInicialJson());
                }

                if (procedimento.getMapaOdontogramaJson() == null || procedimento.getMapaOdontogramaJson().isEmpty()) {
                    if (existing.getMapaOdontogramaJson() != null && !existing.getMapaOdontogramaJson().isEmpty()) {
                        procedimento.setMapaOdontogramaJson(existing.getMapaOdontogramaJson());
                    }
                }

                if (procedimento.getFotos() == null || procedimento.getFotos().isEmpty()) {
                    if (existing.getFotos() != null && !existing.getFotos().isEmpty()) {
                        procedimento.setFotos(existing.getFotos());
                    }
                }
                
                if (procedimento.getValorPago() == 0.0 && existing.getValorPago() != null) {
                    procedimento.setValorPago(existing.getValorPago());
                }
                
                if (procedimento.getValorTotalLancado() == null || procedimento.getValorTotalLancado() == 0.0) {
                    if (existing.getValorTotalLancado() != null && existing.getValorTotalLancado() > 0) {
                        procedimento.setValorTotalLancado(existing.getValorTotalLancado());
                    }
                }
                
                if (procedimento.getOrcamentoAgendado() == null && existing.getOrcamentoAgendado() != null) {
                    procedimento.setOrcamentoAgendado(existing.getOrcamentoAgendado());
                }
            }
        }

        String jsonAtual = procedimento.getMapaOdontogramaJson();
        if (jsonAtual == null || jsonAtual.trim().isEmpty() || jsonAtual.equals("{}")) {
            procedimento.setMapaOdontogramaJson("{\"GERAL\":{\"procedimentos\":[]}}");
        } 
        else if (!jsonAtual.contains("GERAL")) {
            if (jsonAtual.trim().endsWith("}")) {
                String jsonSemFim = jsonAtual.trim().substring(0, jsonAtual.trim().length() - 1);
                String prefixo = jsonSemFim.length() > 1 ? "," : ""; 
                procedimento.setMapaOdontogramaJson(jsonSemFim + prefixo + "\"GERAL\":{\"procedimentos\":[]}}");
            }
        }

        if (procedimento.getOrcamentoAgendado() == null) {
            procedimento.setOrcamentoAgendado(false);
        }

        Procedimento salvo = procedimentoRepository.save(procedimento);

        // Lógica CRM
        try {
            Long idPaciente = salvo.getAgendamento().getPaciente().getId();
            if (salvo.getStatusPagamento() == StatusPagamento.ORCAMENTO) {
                pacienteService.atualizarDataInteracao(idPaciente, "ORCAMENTO");
            }
            else if (salvo.getAgendamento().getStatus() == StatusAgendamento.CONCLUIDO ||
                    salvo.getAgendamento().getStatus() == StatusAgendamento.CONCLUIDO_RETORNO) {
                pacienteService.atualizarDataInteracao(idPaciente, "VISITA");
            }
        } catch (Exception e) {
            System.err.println("Erro ao atualizar data de interação CRM: " + e.getMessage());
        }

        return salvo;
    }

    /**
     * 🌟 LÓGICA DE DIVISÃO (SPLIT) - COM CÓPIA DE ODONTOGRAMA E PREÇOS 🌟
     */
    private void processarDivisaoDeOrcamento(Procedimento procedimentoAtual, Agendamento agendamentoOriginal) {
        if (procedimentoAtual.getItens() == null || procedimentoAtual.getItens().isEmpty()) return;

        List<ProcedimentoItem> itensRealizados = new ArrayList<>();
        List<ProcedimentoItem> itensOrcamento = new ArrayList<>();

        for (ProcedimentoItem item : procedimentoAtual.getItens()) {
            boolean isFaturado = item.getFaturado() == null || item.getFaturado();
            if (isFaturado) {
                itensRealizados.add(item);
            } else {
                itensOrcamento.add(item);
            }
        }

        // Só executa a divisão se existirem AMBOS os tipos
        if (!itensRealizados.isEmpty() && !itensOrcamento.isEmpty()) {
            
            // 1. O procedimento atual fica APENAS com os realizados (Financeiro)
            procedimentoAtual.getItens().clear();
            procedimentoAtual.getItens().addAll(itensRealizados);

            // 2. Cria Agendamento de Orçamento
            Agendamento agendamentoOrcamento = new Agendamento();
            agendamentoOrcamento.setPaciente(agendamentoOriginal.getPaciente());
            agendamentoOrcamento.setProfissional(agendamentoOriginal.getProfissional());
            agendamentoOrcamento.setDataHora(LocalDateTime.now()); 
            agendamentoOrcamento.setProcedimento("Orçamento Pendente (Restante)");
            
            // 🌟 CÓPIA CORRETA DOS CAMPOS OBRIGATÓRIOS DO MODELO
            agendamentoOrcamento.setArea(agendamentoOriginal.getArea()); 
            agendamentoOrcamento.setStatus(StatusAgendamento.PENDENTE); 
            agendamentoOrcamento.setNotas("Orçamento gerado automaticamente a partir do atendimento #" + agendamentoOriginal.getId());
            
            agendamentoRepository.save(agendamentoOrcamento);

            // 3. Cria o NOVO Procedimento de Orçamento
            Procedimento procOrcamento = new Procedimento();
            procOrcamento.setAgendamento(agendamentoOrcamento);
            procOrcamento.setStatusPagamento(StatusPagamento.ORCAMENTO);
            procOrcamento.setDataRegistro(LocalDateTime.now());
            procOrcamento.setCodigoTratamento(UUID.randomUUID().toString());
            procOrcamento.setOrcamentoAgendado(false);
            
            // 🌟 CÓPIA COMPLETA DE DADOS (Odontograma e Observações)
            procOrcamento.setObservacoesClinicas(procedimentoAtual.getObservacoesClinicas());
            procOrcamento.setMapaOdontogramaJson(procedimentoAtual.getMapaOdontogramaJson());
            procOrcamento.setMapaOdontogramaInicialJson(procedimentoAtual.getMapaOdontogramaInicialJson());
            
            // Adiciona os itens de orçamento ao novo procedimento com preços originais
            List<ProcedimentoItem> novosItens = new ArrayList<>();
            for (ProcedimentoItem itemOld : itensOrcamento) {
                ProcedimentoItem newItem = new ProcedimentoItem();
                String nomeLimpo = itemOld.getDescricao().replace("[ORÇAMENTO]", "").trim();
                
                newItem.setDescricao(nomeLimpo);
                // 🌟 COPIA PREÇOS ORIGINAIS
                newItem.setValorBase(itemOld.getValorBase());
                newItem.setAcrescimo(itemOld.getAcrescimo());
                newItem.setDesconto(0.0); 
                
                // Calcula total bruto para o item
                double val = (itemOld.getValorBase() != null ? itemOld.getValorBase() : 0) + 
                             (itemOld.getAcrescimo() != null ? itemOld.getAcrescimo() : 0);
                newItem.setValorLiquido(val);
                
                newItem.setFaturado(false); 
                newItem.setProcedimento(procOrcamento);
                novosItens.add(newItem);
            }
            procOrcamento.setItens(novosItens);

            procedimentoRepository.save(procOrcamento);
        }
    }

    private void validarLimiteDesconto(Procedimento proc) {
        if (proc.getItens() == null || proc.getItens().isEmpty()) return;

        double valorBrutoTotal = proc.getItens().stream()
                .filter(item -> item.getFaturado() == null || item.getFaturado())
                .mapToDouble(item -> (item.getValorBase() != null ? item.getValorBase() : 0.0) +
                        (item.getAcrescimo() != null ? item.getAcrescimo() : 0.0))
                .sum();

        double valorLiquidoTotal = proc.getItens().stream()
                .filter(item -> item.getFaturado() == null || item.getFaturado())
                .mapToDouble(item -> item.getValorLiquido() != null ? item.getValorLiquido() : 0.0)
                .sum();

        if (valorBrutoTotal <= 0) return;

        double descontoTotal = valorBrutoTotal - valorLiquidoTotal;

        if (descontoTotal <= 0.01) return;

        double porcentagemAplicada = (descontoTotal / valorBrutoTotal) * 100.0;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null) return;

        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMINISTRADOR"));

        boolean isDentista = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("DENTISTA"));

        if (isDentista && !isAdmin) {
            if (porcentagemAplicada > 5.01) {
                throw new IllegalArgumentException(
                        String.format("Permissão negada: Dentistas podem conceder no máximo 5%% de desconto. Tentativa: %.2f%%", porcentagemAplicada)
                );
            }
        }
    }

    @Transactional
    public boolean reabrirUltimoOrcamento(Long idPaciente) {
        Optional<Procedimento> orcamentoOpt = procedimentoRepository
            .findFirstByAgendamento_Paciente_IdAndStatusPagamentoAndOrcamentoAgendadoTrueOrderByDataRegistroDesc(
                idPaciente, 
                StatusPagamento.ORCAMENTO
            );

        if (orcamentoOpt.isPresent()) {
            Procedimento orcamento = orcamentoOpt.get();
            orcamento.setOrcamentoAgendado(false); 
            procedimentoRepository.save(orcamento);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Optional<Procedimento> buscarOrcamentoParaExecucao(Long idPaciente) {
        return procedimentoRepository.findFirstByAgendamento_Paciente_IdAndStatusPagamentoAndOrcamentoAgendadoTrueOrderByDataRegistroDesc(
                idPaciente, 
                StatusPagamento.ORCAMENTO
        );
    }

    @Transactional
    public void excluir(Long id) {
        // Regra de negócio: Talvez impedir excluir se já tiver pagamento vinculado?
        // Por enquanto, exclusão simples:
        procedimentoRepository.deleteById(id);
    }
}