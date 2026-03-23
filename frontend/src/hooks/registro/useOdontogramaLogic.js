import { useState, useMemo } from 'react';
import { deepClone } from '../../utils/registroUtils';

export const useOdontogramaLogic = (procedimentosRealizados) => {
    const [odontogramaInicialMap, setOdontogramaInicialMap] = useState({});
    const [odontogramaAtualMap, setOdontogramaAtualMap] = useState({});
    const [currentOdontogramaView, setCurrentOdontogramaView] = useState('INICIAL');
    const [isInitialMapSaved, setIsInitialMapSaved] = useState(false);

    const handleUpdateOdontogramaMap = (newMap) => setOdontogramaAtualMap(newMap);

    const handleUpdateOdontogramaInicialMap = (newMap) => {
        if (isInitialMapSaved) return;
        setOdontogramaInicialMap(newMap);
        setOdontogramaAtualMap(deepClone(newMap));
    };

    const handleSaveOdontogramaInicial = (handleSalvarCallback) => {
        if (Object.keys(odontogramaInicialMap).length === 0) {
            alert("O odontograma inicial está vazio. Marque os itens antes de salvar.");
            return;
        }
        setIsInitialMapSaved(true);
        if (Object.keys(odontogramaAtualMap).length === 0) {
            setOdontogramaAtualMap(deepClone(odontogramaInicialMap));
        }
        
        // Chama o salvar passando null para não alterar status financeiro
        handleSalvarCallback(null).then(sucesso => {
            if (sucesso) {
                alert("Odontograma Inicial salvo e travado com sucesso!");
                setCurrentOdontogramaView('ATUAL');
            } else {
                setIsInitialMapSaved(false);
            }
        });
    };

    // Lógica de exibição (Mescla o mapa atual com status de "plano-pendente" baseado na lista financeira)
    const odontogramaDisplayMap = useMemo(() => {
        const displayMap = deepClone(odontogramaAtualMap);
        const dentesComPlanoPendente = new Set();
        procedimentosRealizados.forEach(proc => {
            if (proc.fdi && proc.status && proc.status.startsWith('plano-')) dentesComPlanoPendente.add(proc.fdi);
        });
        for (const fdiCode in displayMap) {
            const currentStatus = String(displayMap[fdiCode] || '');
            const baseStatus = currentStatus.split('-')[0];
            if (dentesComPlanoPendente.has(fdiCode)) {
                displayMap[fdiCode] = baseStatus === 'tratado' ? 'tratado-parcial' : 'plano-pendente';
            } else if (baseStatus === 'tratado') {
                displayMap[fdiCode] = 'tratado';
            }
        }
        return displayMap;
    }, [odontogramaAtualMap, procedimentosRealizados]);

    return {
        odontogramaInicialMap, setOdontogramaInicialMap,
        odontogramaAtualMap, setOdontogramaAtualMap,
        currentOdontogramaView, setCurrentOdontogramaView,
        isInitialMapSaved, setIsInitialMapSaved,
        odontogramaDisplayMap,
        handleUpdateOdontogramaMap,
        handleUpdateOdontogramaInicialMap,
        handleSaveOdontogramaInicial
    };
};