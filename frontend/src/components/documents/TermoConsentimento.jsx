export const gerarConteudoConsentimento = (paciente, procedimentos, profissional) => {
    const dataAtual = new Date().toLocaleDateString();

    // --- 1. EXTRAÇÃO DE DADOS DO BANCO ---
    // Usa os dados se existirem, senão usa a linha para preencher à mão
    const nomePaciente = paciente?.nome || '__________________________________________';
    const cpfPaciente = paciente?.cpf || '__________________________';
    const enderecoPaciente = paciente?.endereco || '__________________________________________';

    // Dados do Profissional (Verifique se no seu banco é 'cro' ou 'registroProfissional')
    const nomeProfissional = profissional?.nome || '__________________________________________';
    const registroProfissional = profissional?.crmOuRegistro || profissional?.cro || '__________________________';

    // Local Fixo solicitado
    const localRealizacao = "Av Jose dos Reis Colinas-MA";

    // --- 2. LISTA DE PROCEDIMENTOS (DENTE A DENTE) ---
    let listaProcedimentos = "";
    if (procedimentos && procedimentos.length > 0) {
        listaProcedimentos = procedimentos.map(p => {
            // Ex: "EXTRAÇÃO (DENTE 17)"
            return p.descricao || `${p.servico} ${p.fdi ? `(Dente ${p.fdi})` : ''}`;
        }).join(', ');
    } else {
        listaProcedimentos = "__________________________________________";
    }

    // --- 3. ESTILOS (Para visual igual à imagem) ---
    const styleTitle = "font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;";
    const styleP = "margin-bottom: 10px; text-align: justify; line-height: 1.5;";
    // Destaque para os dados vindos do banco (Negrito e Sublinhado)
    const styleField = "font-weight: bold; text-decoration: underline;"; 

    // --- 4. CONTEÚDO HTML (Impressão) ---
    const conteudoHtml = `
        <div style="font-family: 'Arial', sans-serif; font-size: 12px; color: #000;">
            <h2 style="text-align: center; margin-bottom: 20px; font-size: 14px;">TERMO DE CONSENTIMENTO INFORMADO</h2>

            <p style="${styleP}">
                Eu, <span style="${styleField}">${nomePaciente}</span>, 
                portador(a) do CPF nº <span style="${styleField}">${cpfPaciente}</span>, 
                residente em <span style="${styleField}">${enderecoPaciente}</span>,
                declaro ter recebido explicações claras, objetivas e compreensíveis sobre o(s) procedimento(s) a que serei submetido(a),
                incluindo os objetivos, etapas, benefícios esperados, riscos e possíveis efeitos colaterais.
            </p>

            <div style="${styleTitle}">1. IDENTIFICAÇÃO DO PROCEDIMENTO</div>
            <div style="margin-bottom: 10px; line-height: 1.6;">
                <strong>Nome do procedimento:</strong> 
                <span style="${procedimentos?.length > 0 ? 'font-weight:bold;' : ''}">${listaProcedimentos}</span><br/>
                
                <strong>Profissional responsável:</strong> 
                <span style="${styleField}">${nomeProfissional}</span><br/>
                
                <strong>Registro profissional (CRO/CRM/CREFITO ou equivalente):</strong> 
                <span style="${styleField}">${registroProfissional}</span><br/>
                
                <strong>Local de realização:</strong> 
                <span style="${styleField}">${localRealizacao}</span>
            </div>

            <div style="${styleTitle}">2. INFORMAÇÕES FORNECIDAS</div>
            <p style="${styleP}">Fui informado(a) sobre:</p>
            <ul style="margin-bottom: 10px; padding-left: 20px; line-height: 1.4;">
                <li>A natureza e a finalidade do procedimento proposto;</li>
                <li>As etapas envolvidas no tratamento;</li>
                <li>As alternativas terapêuticas disponíveis;</li>
                <li>Os riscos e possíveis complicações, mesmo que raras;</li>
                <li>A possibilidade de resultados diferentes dos esperados;</li>
                <li>A importância do meu comprometimento com os cuidados recomendados.</li>
            </ul>

            <div style="${styleTitle}">3. RISCOS E POSSÍVEIS EFEITOS</div>
            <p style="${styleP}">
                Estou ciente de que todo procedimento envolve riscos, inclusive intercorrências imprevisíveis.
                Fui informado(a) de que os resultados podem variar conforme características individuais e que não há garantia de resultados específicos.
            </p>

            <div style="${styleTitle}">4. DIREITO DE RECUSA</div>
            <p style="${styleP}">
                Fui informado(a) de que tenho o direito de recusar ou interromper o procedimento a qualquer momento, sem que isso implique em qualquer forma de constrangimento.
                Caso a desistência ocorra após o início do tratamento, estou ciente das condições contratuais aplicáveis.
            </p>

            <div style="${styleTitle}">5. CONSENTIMENTO LIVRE E ESCLARECIDO</div>
            <p style="${styleP}">
                Declaro ter recebido todas as informações necessárias de forma clara, ter tido oportunidade de fazer perguntas e ter compreendido as explicações fornecidas.
                Autorizo, de forma livre e esclarecida, a realização do(s) procedimento(s) indicado(s).
            </p>

            <div style="${styleTitle}">6. AUTORIZAÇÃO PARA REGISTRO CLÍNICO</div>
            <p style="${styleP}">
                Autorizo a realização de registros fotográficos, vídeos ou outros meios de documentação clínica, de uso exclusivo no prontuário e para fins científicos ou legais,
                preservando minha identidade, salvo autorização expressa para divulgação.
            </p>

            <div style="${styleTitle}">7. DECLARAÇÃO FINAL</div>
            <p style="${styleP}">
                Declaro estar ciente de todas as informações prestadas e de minha responsabilidade no cumprimento das orientações fornecidas pelo profissional.
            </p>

            <br/>
            <div style="margin-bottom: 30px;">
                Local: <span style="${styleField}">${localRealizacao}</span> &nbsp;&nbsp;&nbsp;&nbsp; Data: ${dataAtual}
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="width: 50%; padding-right: 20px; vertical-align: top;">
                        __________________________________________<br/>
                        <strong>PACIENTE / RESPONSÁVEL LEGAL</strong><br/><br/>
                        <div style="margin-top: 5px;">CPF: <span style="${styleField}">${cpfPaciente}</span></div>
                    </td>
                    <td style="width: 50%; padding-left: 20px; vertical-align: top;">
                        __________________________________________<br/>
                        <strong>PROFISSIONAL RESPONSÁVEL</strong><br/>
                        <span style="${styleField}">${nomeProfissional}</span><br/><br/>
                        <div style="margin-top: 5px;">Registro Profissional: <span style="${styleField}">${registroProfissional}</span></div>
                    </td>
                </tr>
            </table>

            <div style="font-weight: bold; margin-bottom: 10px;">TESTEMUNHAS:</div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 50%; padding-right: 20px; vertical-align: top;">
                        __________________________________________<br/>
                        Nome: __________________________<br/>
                        CPF: __________________________
                    </td>
                    <td style="width: 50%; padding-left: 20px; vertical-align: top;">
                        __________________________________________<br/>
                        Nome: __________________________<br/>
                        CPF: __________________________
                    </td>
                </tr>
            </table>
        </div>
    `;

    // Texto simples para o modo de edição rápida
    const conteudoTexto = `TERMO DE CONSENTIMENTO INFORMADO

Eu, ${nomePaciente}, portador do CPF ${cpfPaciente}, residente em ${enderecoPaciente}, declaro ter recebido explicações claras...

1. IDENTIFICAÇÃO DO PROCEDIMENTO
Nome do procedimento: ${listaProcedimentos}
Profissional responsável: ${nomeProfissional} (CRO: ${registroProfissional})
Local: ${localRealizacao}

(Visualize a versão de impressão para ver o documento completo formatado)
    `;

    return {
        title: "TERMO DE CONSENTIMENTO INFORMADO",
        headerHtml: "", 
        contentHtml: conteudoHtml,
        contentText: conteudoTexto
    };
};