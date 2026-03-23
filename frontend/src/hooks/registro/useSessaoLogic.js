import { useState } from 'react';

export const useSessaoLogic = () => {
    const [observacoes, setObservacoes] = useState('');
    const [acoesDaSessao, setAcoesDaSessao] = useState([]);
    const [fotos, setFotos] = useState([]);
    const [historico, setHistorico] = useState([]);

    const handleAddFoto = (fotoObjeto) => { 
        if (fotos.length < 5) setFotos(prev => [...prev, fotoObjeto]); 
    };

    const handleRemoveFoto = (fotoId, fotoUrl) => {
        if (fotoUrl && fotoUrl.startsWith('blob:')) URL.revokeObjectURL(fotoUrl);
        setFotos(prev => prev.filter(foto => foto.id !== fotoId));
    };

    const handleAddAcaoDaSessao = (acao, agendamento) => {
        let nomeTexto = "Profissional";
        if (agendamento && agendamento.profissional) {
            nomeTexto = typeof agendamento.profissional === 'object' 
                ? agendamento.profissional.nome 
                : agendamento.profissional;
        }

        const profissionalObjeto = { nome: nomeTexto || "Profissional" };
        let acaoObj = {};

        if (typeof acao === 'string') {
            acaoObj = {
                descricao: acao,
                profissional: profissionalObjeto,
                dataCriacao: new Date().toISOString()
            };
        } else {
            acaoObj = { ...acao, profissional: acao.profissional || profissionalObjeto };
        }

        const novaAcao = { ...acaoObj, id: acaoObj.id || (Date.now() + Math.random()) };
        setAcoesDaSessao(prev => [...prev, novaAcao]);
    };

    const handleRemoveAcaoDaSessao = (acaoId) => {
        setAcoesDaSessao(prev => prev.filter(a => a.id !== acaoId));
    };

    return {
        observacoes, setObservacoes,
        acoesDaSessao, setAcoesDaSessao,
        fotos, setFotos,
        historico, setHistorico,
        handleAddFoto, handleRemoveFoto,
        handleAddAcaoDaSessao, handleRemoveAcaoDaSessao
    };
};