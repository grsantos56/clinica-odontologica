// src/utils/registroUtils.js

export const extractDateFromISO = (dataHoraStr) => dataHoraStr ? dataHoraStr.substring(0, 10) : '';

export const extractHorarioFromISO = (dataHoraStr) => dataHoraStr ? dataHoraStr.substring(11, 16) : 'N/A';

export const getNomePaciente = (agendamento) => agendamento?.paciente?.nome || 'Paciente N/A';

export const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export const deepClone = (obj) => {
    if (!obj) return {};
    return JSON.parse(JSON.stringify(obj));
};

// Movi esta função complexa para cá. Note que ela usa normalizarTexto internamente.
export const aggregateProceduresFromMap = (mapa, listaServicosRef = []) => {
    const aggregated = [];
    let idCounter = 0;
    for (const fdiCode in mapa) {
        const statusObj = mapa[fdiCode];
        if (typeof statusObj === 'object' && statusObj.procedimentos) {
            statusObj.procedimentos.forEach(proc => {
                let recTexto = proc.recomendacoesPosProcedimento || proc.recomendacoes_pos_procedimento || '';
                let comissao = proc.comissaoPercentual || 0;

                if (listaServicosRef.length > 0) {
                    const nomeLimpo = (proc.servico || proc.descricao).split(' (')[0];
                    const servicoOriginal = listaServicosRef.find(s => normalizarTexto(s.nome) === normalizarTexto(nomeLimpo));
                    if (servicoOriginal) {
                        if (!recTexto) recTexto = servicoOriginal.recomendacoesPosProcedimento || '';
                        comissao = servicoOriginal.comissaoPercentual || 0;
                    }
                }

                aggregated.push({
                    id: ++idCounter, 
                    fdi: fdiCode,
                    status: statusObj.status,
                    acrescimo: proc.acrescimo || 0,
                    descricao: `${proc.servico} (Dente ${fdiCode})`,
                    valor: proc.valorBase, 
                    valorCobrado: (proc.valorBase || 0) + (proc.acrescimo || 0), 
                    notas: proc.observacao,
                    concluido: proc.concluido || false,
                    recomendacoes_pos_procedimento: recTexto,
                    comissaoPercentual: comissao
                });
            });
        }
    }
    return aggregated;
};