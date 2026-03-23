package com.rcodontologia.model.enums;

public enum StatusFinanceiro {

    COM_DEBITOS_EM_ABERTO("Com Débitos em Aberto"),
    SEM_DEBITOS("Sem Débitos"),
    PENDENTE("Pendente");

    private final String descricao;
    private StatusFinanceiro(String descricao) {
        this.descricao = descricao;
    }
    public String getDescricao() {
        return descricao;
    }
}