// Textos fixos
const TEXTO_INTRODUCAO = `Este guia foi elaborado para orientar o(a) paciente quanto aos cuidados necessários após procedimentos odontológicos.
Seguir corretamente estas recomendações auxilia na cicatrização, previne complicações e reduz o risco de infecções. Em qualquer sinal de anormalidade — como dor intensa, febre ou sangramento excessivo — entre em contato imediatamente com a clínica.`;

const RECOMENDACOES_GERAIS = `
Recomendações Gerais (para todos os procedimentos)
• Tomar apenas os medicamentos prescritos e no horário correto.
• Evitar automedicação.
• Manter repouso conforme orientação do profissional.
• Higienizar a boca de forma adequada e cuidadosa.
• Evitar exposição solar nas primeiras 48 h em casos cirúrgicos.
• Evitar esforços físicos até liberação profissional.
• Evitar fumar e consumir álcool.
• Alimentar-se de forma leve e equilibrada.
• Comparecer às consultas de revisão e remoção de pontos conforme agendamento.
• Em caso de febre, sangramento excessivo, dor intensa ou mau odor, entrar em contato com a clínica imediatamente.`;

const TEXTO_DECLARACAO = `
Declaro que recebi as orientações acima e fui devidamente esclarecido(a) quanto aos cuidados pós-operatórios.

Local: __________________________________________   Data: ____/____/________

__________________________________________
PACIENTE / RESPONSÁVEL
RG: __________________________ CPF: __________________________

__________________________________________
PROFISSIONAL RESPONSÁVEL
CRO: __________________________
`;

// Função auxiliar para gerar o conteúdo
export const gerarConteudoGuia = (procedimentos, pacienteNome) => {
    const dataAtual = new Date().toLocaleDateString();
    
    // Cabeçalho com dados do paciente
    const headerHtml = `
        <div class="header-info" style="border: 1px solid #000; padding: 10px; margin-bottom: 20px;">
            <strong>PACIENTE:</strong> ${pacienteNome || '__________________________'}<br/>
            <strong>DATA:</strong> ${dataAtual}
        </div>
    `;

    // Inicia o conteúdo com o Texto Introdutório solicitado
    let conteudoHtml = `
        <div style="margin-bottom: 20px; font-family: 'Arial', sans-serif; font-size: 12px; text-align: justify; line-height: 1.5;">
            ${TEXTO_INTRODUCAO.replace(/\n/g, '<br/>')}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
    `;
    
    let conteudoTexto = TEXTO_INTRODUCAO + "\n\n-------------------------------------------------\n\n";
    
    const textosAdicionados = new Set();
    let contador = 1;
    let temRecomendacao = false;

    if (procedimentos && procedimentos.length > 0) {
        procedimentos.forEach(proc => {
            const textoBanco = proc.recomendacoes_pos_procedimento;
            // Limpa o nome (ex: "Extração (Dente 15)" -> "EXTRAÇÃO")
            const nomeProc = (proc.descricao || proc.servico || 'Procedimento').split(' (')[0].toUpperCase();

            if (textoBanco && textoBanco.trim() !== "") {
                if (!textosAdicionados.has(textoBanco)) {
                    // HTML para impressão
                    conteudoHtml += `
                        <div class="procedure-block" style="margin-bottom: 15px;">
                            <div class="procedure-title" style="font-weight: bold; text-transform: uppercase; margin-bottom: 5px; text-decoration: underline;">
                                ${contador}. ${nomeProc}
                            </div>
                            <pre style="white-space: pre-wrap; font-family: 'Arial', sans-serif; font-size: 12px;">${textoBanco}</pre>
                        </div>
                    `;
                    
                    // Texto simples para preview
                    conteudoTexto += `${contador}. ${nomeProc}\n${textoBanco}\n\n`;
                    
                    textosAdicionados.add(textoBanco);
                    contador++;
                    temRecomendacao = true;
                }
            }
        });
    }

    if (!temRecomendacao) {
        conteudoHtml += "<p>Não há recomendações específicas cadastradas para os procedimentos realizados.</p>";
        conteudoTexto += "Não há recomendações específicas cadastradas.\n\n";
    }

    // Rodapé (Gerais + Assinaturas)
    conteudoHtml += `
        <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
            <div style="font-weight: bold; margin-bottom: 5px;">RECOMENDAÇÕES GERAIS:</div>
            <pre style="white-space: pre-wrap; font-family: 'Arial', sans-serif; font-size: 12px;">${RECOMENDACOES_GERAIS.trim()}</pre>
        </div>
        <div style="margin-top: 40px;">
            <pre style="white-space: pre-wrap; font-family: 'Arial', sans-serif; font-size: 12px;">${TEXTO_DECLARACAO.trim()}</pre>
        </div>
    `;

    conteudoTexto += RECOMENDACOES_GERAIS + "\n" + TEXTO_DECLARACAO;

    return {
        title: "GUIA DE RECOMENDAÇÕES PÓS-PROCEDIMENTO ODONTOLÓGICO",
        headerHtml,
        contentHtml: conteudoHtml,
        contentText: conteudoTexto
    };
};