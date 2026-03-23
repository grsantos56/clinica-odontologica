// src/components/ProcedimentoDetalhes.jsx
import React from 'react';
import { FaHistory, FaTag, FaTooth } from 'react-icons/fa';
// CORREÇÃO APLICADA AQUI
import Odontograma from './Odontograma'; 

// --- FUNÇÕES DE UTILIDADE (Recriadas ou Importadas se estiverem em arquivo separado) ---
const extractDateFromISO = (dataHoraStr) => dataHoraStr ? dataHoraStr.substring(0, 10) : '';

export default function ProcedimentoDetalhes({
    agendamentoNotas,
    pacienteObs,
    procedimentoAgendado,
    historico,
    odontogramaDisplayMap,
    odontogramaInicialMap,
    currentOdontogramaView,
    isInitialMapSaved,
    observacoes,
    handleUpdateOdontogramaMap,
    handleUpdateOdontogramaInicialMap,
    handleAddProcedureToBill,
    handleSaveOdontogramaInicial,
    handleSaveRegistro,
    setCurrentOdontogramaView,
    setObservacoes,
}) {
    
    // Concatenação das observações iniciais (Mantida a lógica)
    let observacoesParaExibir = '';
    if (agendamentoNotas) {
        observacoesParaExibir += `NOTAS DO AGENDAMENTO: ${agendamentoNotas}\n`;
    }
    if (pacienteObs) {
        observacoesParaExibir += `OBS. DO PACIENTE: ${pacienteObs}`;
    }
    if (!observacoesParaExibir) {
        observacoesParaExibir = 'Nenhuma observação ou nota registrada.';
    }

    return (
        <div className="lg:col-span-2 space-y-6">
            
            {/* Bloco de Observações Iniciais */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><FaTag /> Observações Iniciais</h3>
                <p className="text-sm italic text-gray-500">Agendado como: {procedimentoAgendado}</p>
                <pre className="mt-1 font-medium whitespace-pre-wrap text-sm">{observacoesParaExibir}</pre>
            </div>

            {/* Odontograma */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2">🦷 Odontograma e Mapa de Tratamento</h3>
                <div className="grid grid-cols-2 gap-4">
                    
                    {/* Botões de Visualização (Tabs) */}
                    <div className='flex space-x-4 col-span-2 mb-4'>
                        <button 
                            type="button" 
                            onClick={() => setCurrentOdontogramaView('INICIAL')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                currentOdontogramaView === 'INICIAL' 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Odontograma Inicial (Base)
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setCurrentOdontogramaView('ATUAL')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                currentOdontogramaView === 'ATUAL' 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                        >
                            Odontograma Atual (Edição)
                        </button>
                    </div>
                    
                    {/* Renderiza Odontograma INICIAL */}
                    {currentOdontogramaView === 'INICIAL' && (
                        <div className='col-span-2 border p-2 bg-gray-100 rounded'>
                            <p className='text-sm text-gray-500 mb-2'>
                                {isInitialMapSaved 
                                    ? 'Visualização fixa, baseada no primeiro registro salvo.'
                                    : 'PRIMEIRO ACESSO: Preencha o status inicial e SALVE para bloquear.'}
                            </p>
                            <Odontograma 
                                odontogramaMap={odontogramaInicialMap} 
                                onUpdateOdontogramaMap={isInitialMapSaved ? () => {} : handleUpdateOdontogramaInicialMap} 
                                isReadOnly={isInitialMapSaved} 
                                onAddProcedureToBill={handleAddProcedureToBill} 
                                onSaveOdontograma={handleSaveOdontogramaInicial}
                            />
                        </div>
                    )}
                    
                    {/* Renderiza Odontograma ATUAL (USA O MAPA COM PENDÊNCIAS) */}
                    {currentOdontogramaView === 'ATUAL' && (
                        <div className='col-span-2 border p-2 bg-white rounded'>
                            <p className='text-sm text-indigo-600 mb-2'>Este mapa pode ser modificado. Clique para adicionar ou alterar o status dos dentes.</p>
                            <Odontograma 
                                odontogramaMap={odontogramaDisplayMap} 
                                onUpdateOdontogramaMap={handleUpdateOdontogramaMap} 
                                onAddProcedureToBill={handleAddProcedureToBill} 
                                onSaveOdontograma={handleSaveRegistro}
                                isReadOnly={false}
                            />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Histórico do Paciente (INTEGRADO) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                    <FaHistory /> Histórico de Procedimentos
                </h3>
                <ul className="space-y-2">
                    {historico && historico.length > 0 ? (
                        historico.map((proc, index) => (
                            <li key={index} className="text-sm border-l-4 border-gray-200 pl-3">
                                <span className="font-semibold text-gray-800">
                                    {extractDateFromISO(proc.dataRegistro).split('-').reverse().join('/')}
                                </span>: {proc.observacoesClinicas || 'Nenhuma nota clínica.'} ({proc.statusPagamento})
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500 italic">Nenhum procedimento anterior encontrado.</li>
                    )}
                </ul>
            </div>
            
            {/* Campo de Observações Clínicas (Texto Livre) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                    <FaTooth /> Observações da Sessão
                </h3>
                <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    rows="5"
                    placeholder="Detalhes dos procedimentos realizados, diagnóstico, etc."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                ></textarea>
            </div>
        </div>
    );
}