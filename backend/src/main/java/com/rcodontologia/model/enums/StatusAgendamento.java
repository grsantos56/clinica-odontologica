package com.rcodontologia.model.enums;

public enum StatusAgendamento {
    PENDENTE("Pendente"),

    CONFIRMADO("Confirmado"),
    AGUARDANDO_RETORNO("Aguardando (Retorno)"),

    REAGENDADO("Reagendado"),
    CANCELADO("Cancelado"),
    CONCLUIDO("Concluído"),

    // 🔑 NOVO: Status do Agendamento que foi encerrado, mas gerou a necessidade de um Retorno
    CONCLUIDO_RETORNO("Concluído p/ Retorno");

    // O RETORNO antigo pode ser removido ou mantido para compatibilidade,
    // mas o ideal é que seja substituído pelo AGUARDANDO_RETORNO no fluxo de agendamento.
    // Se o status RETORNO antigo for usado em outro lugar, mantenha-o ou use o novo.
    // Vamos manter o RETORNO antigo para não quebrar fluxos legados, mas use AGUARDANDO_RETORNO no front-end para novos agendamentos de retorno.
    // Status legado (mantido para compatibilidade):
    // RETORNO("Retorno Legado"),

    private final String descricao;

    private StatusAgendamento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}