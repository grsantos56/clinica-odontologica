export const gerarConteudoAtestado = (paciente, profissional) => {
    const dataHoje = new Date();
    const dataAtualStr = dataHoje.toLocaleDateString('pt-BR');
    const horaAtualStr = dataHoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // --- 1. DADOS ---
    const nomePaciente = paciente?.nome || '__________________________________________';
    const cpfPaciente = paciente?.cpf || '__________________________';
    
    const nomeProfissional = profissional?.nome || '__________________________________________';
    const registroProfissional = profissional?.crmOuRegistro || profissional?.cro || '__________________________';
    
    const localRealizacao = "Av Jose dos Reis Colinas-MA";

    // --- 2. ESTILOS ---
    const styleTitle = "font-weight: bold; margin-top: 30px; margin-bottom: 20px; text-transform: uppercase; text-align: center; font-size: 16px;";
    const styleP = "margin-bottom: 15px; text-align: justify; line-height: 2.0; font-size: 14px;";
    const styleField = "font-weight: bold;"; 

    // --- 3. CONTEÚDO HTML ---
    const conteudoHtml = `
        <div style="font-family: 'Arial', sans-serif; font-size: 12px; color: #000; padding: 20px;">
            
            <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="${styleTitle}">ATESTADO ODONTOLÓGICO</h2>
            </div>

            <p style="${styleP}">
                Atesto, para os devidos fins, que o(a) Sr(a) <span style="${styleField}">${nomePaciente}</span>, 
                inscrito(a) no CPF nº <span style="${styleField}">${cpfPaciente}</span>, 
                foi atendido(a) sob meus cuidados profissionais nesta data, 
                das <span style="${styleField}">${horaAtualStr}</span> horas em diante.
            </p>

            <p style="${styleP}">
                Por este motivo, necessita de <span style="${styleField}">________ (______)</span> dias de repouso, 
                a partir desta data, para sua recuperação.
            </p>

            <p style="${styleP}">
                CID: <span style="${styleField}">____________________</span>
            </p>

            <br/><br/><br/>
            
            <div style="text-align: right; margin-top: 40px; margin-bottom: 60px;">
                Local: ${localRealizacao} <br/>
                Data: ${dataAtualStr}
            </div>

            <div style="text-align: center; margin-top: 80px;">
                __________________________________________<br/>
                <strong style="text-transform: uppercase;">${nomeProfissional}</strong><br/>
                CRO: ${registroProfissional}
            </div>
        </div>
    `;

    // Texto para edição rápida
    const conteudoTexto = `ATESTADO ODONTOLÓGICO

Atesto, para os devidos fins, que o(a) Sr(a) ${nomePaciente}, CPF ${cpfPaciente}, foi atendido(a) sob meus cuidados profissionais nesta data (${dataAtualStr}).

Por este motivo, necessita de ____ dias de repouso.

CID: _______

Local: ${localRealizacao}
Data: ${dataAtualStr}

${nomeProfissional} - CRO: ${registroProfissional}`;

    return {
        title: "ATESTADO MÉDICO / ODONTOLÓGICO",
        headerHtml: "", 
        contentHtml: conteudoHtml,
        contentText: conteudoTexto
    };
};