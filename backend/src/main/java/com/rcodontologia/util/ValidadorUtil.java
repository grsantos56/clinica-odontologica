package com.rcodontologia.util;

import org.springframework.stereotype.Service;

@Service
public class ValidadorUtil {

    /**
     * Verifica se o formato do telefone é válido.
     * @param telefone O número de telefone a ser verificado.
     * @return true se o formato for válido, false caso contrário.
     */
    public boolean isTelefoneValido(String telefone) {
        if (telefone == null || telefone.trim().isEmpty()) {
            return false;
        }
        // Exemplo: Simplesmente verifica se tem 10 a 15 dígitos após remover caracteres não numéricos
        String apenasDigitos = telefone.replaceAll("[^0-9]", "");
        return apenasDigitos.length() >= 10 && apenasDigitos.length() <= 15;
    }

    /**
     * Verifica se o CPF tem o formato correto (11 dígitos) E se é um número válido.
     *
     * @param cpf O CPF a ser verificado.
     * @return true se o CPF for válido e no formato correto, false caso contrário.
     */
    public boolean isCpfValido(String cpf) {
        if (cpf == null) {
            return false;
        }

        String cpfLimpo = cpf.replaceAll("[^0-9]", "");

        // 1. Verifica se tem 11 dígitos
        if (cpfLimpo.length() != 11) {
            return false;
        }

        // 2. Verifica sequências inválidas (CPFs inválidos por regra)
        if (cpfLimpo.matches("(\\d)\\1{10}")) {
            return false;
        }

        try {
            // 3. Verifica o primeiro dígito verificador (DV1)
            int dv1 = calcularDigito(cpfLimpo.substring(0, 9), 10);
            if (dv1 != Integer.parseInt(cpfLimpo.substring(9, 10))) {
                return false;
            }

            // 4. Verifica o segundo dígito verificador (DV2)
            int dv2 = calcularDigito(cpfLimpo.substring(0, 10), 11);
            if (dv2 != Integer.parseInt(cpfLimpo.substring(10, 11))) {
                return false;
            }

            return true;

        } catch (NumberFormatException e) {
            // Caso ocorra erro de conversão (não deve acontecer após o replaceAll, mas é uma proteção)
            return false;
        }
    }

    /**
     * Método auxiliar privado para calcular o dígito verificador.
     */
    private int calcularDigito(String str, int peso) {
        int soma = 0;
        for (int i = 0; i < str.length(); i++) {
            int digito = Integer.parseInt(str.substring(i, i + 1));
            soma += digito * peso--;
        }

        int resto = soma % 11;
        // O dígito é 0 se o resto for 0 ou 1; caso contrário é 11 - resto
        return (resto < 2) ? 0 : (11 - resto);
    }
}
