package com.rcodontologia.model.enums;

public enum AreaAtendimento {
    ODONTOLOGIA("Odontologia"),
    FISIOTERAPIA("Fisioterapia"),
    NUTRICIONISTA("Nutricionista"),
    PSICOLOGIA("Psicologia"),

    ATENDIMENTO_GERAL("Atendimento/Recepção");

    private final String descricao;

    AreaAtendimento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}