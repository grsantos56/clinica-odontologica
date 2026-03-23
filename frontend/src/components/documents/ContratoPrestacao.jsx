export const gerarConteudoContrato = (paciente, procedimentos, valorTotal, parcelas = 1) => {
    const dataAtual = new Date().toLocaleDateString();
    
    // --- 1. DADOS DO CONTRATANTE (PACIENTE) ---
    const nomePaciente = paciente?.nome || '__________________________________________';
    const cpfPaciente = paciente?.cpf || '__________________________';
    const enderecoPaciente = paciente?.endereco || '__________________________________________';
    const taxaRemarcacao = 80.00; 

    // --- 2. DADOS DA CONTRATADA (CLÍNICA/PROFISSIONAL) ---
    // Você pode ajustar estes dados fixos da sua clínica
    const nomeClinica = "clinica";
    const cnpjClinica = "00.000.000/0000-00"; // Coloque o CNPJ real se tiver
    const enderecoClinica = "local";

    // --- 3. DADOS DO SERVIÇO E PAGAMENTO ---
    // Formata lista de procedimentos (ex: "EXTRAÇÃO (DENTE 18), IMPLANTE")
    const listaServicos = procedimentos && procedimentos.length > 0
        ? procedimentos.map(p => p.descricao || `${p.servico}`).join(', ')
        : '__________________________________________________________';

    const valorTotalFormatado = valorTotal ? valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : "0,00";
    
    // Cálculo das parcelas
    const valorParcela = valorTotal ? (valorTotal / (parcelas > 0 ? parcelas : 1)) : 0;
    const valorParcelaFormatado = valorParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    
    // Dia de vencimento sugerido (dia atual)
    const diaVencimento = new Date().getDate();

    // --- 4. ESTILOS CSS (Para impressão) ---
    const styleTitle = "font-weight: bold; text-align: center; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;";
    const styleClause = "font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;";
    const styleP = "margin-bottom: 10px; text-align: justify; line-height: 1.5;";
    const styleField = "font-weight: bold; text-decoration: underline;";

    // --- 5. CONTEÚDO HTML (Cópia fiel do DOCX) ---
    const conteudoHtml = `
        <div style="font-family: 'Arial', sans-serif; font-size: 12px; color: #000;">
            
            <h2 style="${styleTitle}">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS</h2>

            <p style="${styleP}">
                Pelo presente instrumento particular de contrato de prestação de serviços odontológicos, de um lado, como <strong>CONTRATANTE</strong>: 
                <span style="${styleField}">${nomePaciente}</span>, portador(a) do CPF nº <span style="${styleField}">${cpfPaciente}</span>, residente e domiciliado(a) à <span style="${styleField}">${enderecoPaciente}</span>, 
                e de outro lado, como <strong>CONTRATADA</strong>: <span style="${styleField}">${nomeClinica}</span>, 
                inscrita no CNPJ nº <span style="${styleField}">${cnpjClinica}</span>, com sede à <span style="${styleField}">${enderecoClinica}</span>, 
                têm entre si justo e contratado o que segue:
            </p>

            <div style="${styleClause}">CLÁUSULA PRIMEIRA – OBJETO</div>
            <p style="${styleP}">
                O presente contrato tem por objeto a prestação de serviços odontológicos ao CONTRATANTE, conforme plano de tratamento previamente apresentado e aprovado, 
                pelo valor total de <strong>R$ ${valorTotalFormatado}</strong>.
            </p>
            <p style="${styleP}">
                Os serviços compreenderão: <span style="${styleField}">${listaServicos}</span>.
            </p>

            <div style="${styleClause}">CLÁUSULA SEGUNDA – PAGAMENTO</div>
            <p style="${styleP}">
                O valor dos serviços será pago pelo CONTRATANTE em <span style="${styleField}">${parcelas}</span> parcelas de 
                <strong>R$ ${valorParcelaFormatado}</strong> cada, com vencimento no dia <span style="${styleField}">${diaVencimento}</span> de cada mês, 
                ou conforme forma de pagamento acordada entre as partes.
            </p>

            <div style="${styleClause}">CLÁUSULA TERCEIRA – ATRASO E INADIMPLEMENTO</div>
            <p style="${styleP}">
                Em caso de atraso no pagamento de qualquer parcela, será cobrada multa de 2% (dois por cento) sobre o valor da parcela em atraso, 
                acrescida de juros de 1% (um por cento) ao mês e correção monetária.
            </p>
            <p style="${styleP}">
                O não pagamento por mais de 30 (trinta) dias poderá acarretar a suspensão imediata do tratamento.
            </p>

            <div style="${styleClause}">CLÁUSULA QUARTA – DESISTÊNCIA E ARREPENDIMENTO</div>
            <p style="${styleP}">
                Em caso de desistência do tratamento pelo CONTRATANTE, será devida multa compensatória equivalente a 20% (vinte por cento) do valor total contratado, 
                além dos valores proporcionais aos procedimentos já executados.
            </p>
            <p style="${styleP}">
                Caso o arrependimento ocorra em até 7 (sete) dias da assinatura deste contrato e não tenha havido início do tratamento, será possível a rescisão sem cobrança de multa.
            </p>

            <div style="${styleClause}">CLÁUSULA QUINTA – OBRIGAÇÕES DAS PARTES</div>
            <p style="${styleP}">
                O CONTRATANTE se obriga a comparecer aos atendimentos nos dias e horários agendados e a seguir corretamente as orientações clínicas fornecidas.
            </p>
            <p style="${styleP}">
                A CONTRATADA compromete-se a executar os serviços com diligência, ética e profissionalismo, conforme as normas técnicas aplicáveis.
            </p>

            <div style="${styleClause}">CLÁUSULA SEXTA – CANCELAMENTO E REMARCAÇÃO</div>
            <p style="${styleP}">
                O não comparecimento a consultas sem aviso prévio de, no mínimo, 24 (vinte e quatro) horas de antecedência poderá acarretar cobrança de taxa de remarcação no valor de R$ <span style="${styleField}">${taxaRemarcacao.toFixed(2)}</span>
            </p>
            <p style="${styleP}">
                A remarcação de consultas estará sujeita à disponibilidade de agenda.
            </p>

            <div style="${styleClause}">CLÁUSULA SÉTIMA – ABANDONO DE TRATAMENTO</div>
            <p style="${styleP}">
                Caso o CONTRATANTE deixe de comparecer aos atendimentos ou não retorne ao consultório por um período superior a 30 (trinta) dias, 
                sem comunicação prévia, tal conduta será considerada abandono de tratamento.
            </p>
            <p style="${styleP}">
                Nesse caso, a CONTRATADA ficará desobrigada de dar continuidade ao plano de tratamento, podendo encerrar o contrato unilateralmente, 
                sem devolução de valores já pagos, além de cobrar eventuais parcelas em aberto e valores proporcionais aos serviços realizados.
            </p>

            <div style="${styleClause}">CLÁUSULA OITAVA – RESPONSABILIDADE DO PACIENTE</div>
            <p style="${styleP}">
                O CONTRATANTE declara estar ciente de que os resultados do tratamento dependem, além da atuação da CONTRATADA, de sua colaboração, 
                comparecendo aos atendimentos agendados e seguindo corretamente as orientações clínicas fornecidas.
            </p>

            <div style="${styleClause}">CLÁUSULA NONA – RESULTADOS E EXPECTATIVAS</div>
            <p style="${styleP}">
                A CONTRATADA compromete-se a empregar as melhores técnicas e materiais disponíveis, porém não garante resultados específicos, 
                visto que estes dependem de fatores biológicos individuais do paciente.
            </p>

            <div style="${styleClause}">CLÁUSULA DÉCIMA – INFORMAÇÕES E CONSENTIMENTO</div>
            <p style="${styleP}">
                O CONTRATANTE declara ter sido devidamente esclarecido(a) sobre a natureza, riscos e alternativas do tratamento proposto, 
                manifestando seu consentimento livre e esclarecido.
            </p>

            <div style="${styleClause}">CLÁUSULA DÉCIMA PRIMEIRA – REAJUSTE OU ALTERAÇÃO DE PLANO DE TRATAMENTO</div>
            <p style="${styleP}">
                Caso haja necessidade de alteração do plano de tratamento ou atualização dos valores em razão de mudanças clínicas ou reajustes de custos, 
                as partes firmarão termo aditivo, com ciência e anuência de ambas as partes.
            </p>

            <div style="${styleClause}">CLÁUSULA DÉCIMA SEGUNDA – VIGÊNCIA E RESCISÃO</div>
            <p style="${styleP}">
                O presente contrato entra em vigor na data de sua assinatura e permanecerá válido até a conclusão dos serviços contratados.
            </p>
            <p style="${styleP}">
                A rescisão poderá ocorrer por descumprimento contratual de qualquer das partes, mediante notificação por escrito.
            </p>

            <div style="${styleClause}">CLÁUSULA DÉCIMA TERCEIRA – FORO</div>
            <p style="${styleP}">
                Fica eleito o foro da Comarca de <span style="${styleField}">Colinas-MA</span>, com renúncia de qualquer outro, 
                por mais privilegiado que seja, para dirimir quaisquer controvérsias oriundas deste contrato.
            </p>

            <p style="${styleP}">
                E, por estarem justas e contratadas, firmam o presente instrumento em duas vias de igual teor e forma.
            </p>

            <br/>
            <div style="margin-bottom: 30px;">
                Local: <span style="${styleField}">${enderecoClinica}</span> &nbsp;&nbsp;&nbsp;&nbsp; 
                Data: <span style="${styleField}">${dataAtual}</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="width: 50%; padding-right: 20px; vertical-align: top;">
                        __________________________________________<br/>
                        <strong>CONTRATANTE</strong><br/>
                        ${nomePaciente}<br/>
                        CPF: ${cpfPaciente}
                    </td>
                    <td style="width: 50%; padding-left: 20px; vertical-align: top;">
                        __________________________________________<br/>
                        <strong>CONTRATADA</strong><br/>
                        ${nomeClinica}<br/>
                        CNPJ: ${cnpjClinica}
                    </td>
                </tr>
            </table>
        </div>
    `;

    // Versão Texto Simples (Opcional)
    const conteudoTexto = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS

CONTRATANTE: ${nomePaciente}, CPF: ${cpfPaciente}
CONTRATADA: ${nomeClinica}

CLÁUSULA PRIMEIRA – OBJETO
Serviços: ${listaServicos}
Valor Total: R$ ${valorTotalFormatado}

CLÁUSULA SEGUNDA – PAGAMENTO
${parcelas} parcelas de R$ ${valorParcelaFormatado} vencendo dia ${diaVencimento}.

(Visualize a versão de impressão para ver todas as cláusulas contratuais)
    `;

    return {
        title: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
        headerHtml: "", 
        contentHtml: conteudoHtml,
        contentText: conteudoTexto
    };
};