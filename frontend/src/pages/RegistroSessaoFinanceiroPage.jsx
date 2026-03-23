import React, { useState } from 'react';
import { 
    FaArrowLeft, FaHandPointRight, FaTag, FaTooth, FaHistory, FaSpinner, 
    FaPrint, FaFileAlt, FaFileInvoiceDollar, FaCheckDouble, FaExclamationTriangle,
    FaMoneyBillWave, FaEdit, FaLockOpen
} from 'react-icons/fa'; 

import Sidebar from '../components/SideBar';
import RegistroCobranca from '../components/RegistroCobranca'; 
import RegistroDeAcoes from '../components/RegistroDeAcoes'; 
import { useRegistroProcedimento } from '../hooks/useRegistroProcedimento'; 

export default function RegistroSessaoFinanceiroPage() {
    // Estado para controlar o desbloqueio manual de edição
    const [modoEdicaoManual, setModoEdicaoManual] = useState(false);

    const { 
        handleLancarCobranca, userRole,
        agendamento, isLoading, isSaving, navigate,
        procedimentoAgendado, dataAgendamento, horarioAgendamento, pacienteNome, id,
        historico, observacoes, setObservacoes,
        procedimentosRealizados, setProcedimentosRealizados, // Adicionei o Setter aqui
        subtotal, statusPagamento, setStatusPagamento,
        handleAcrescimoChange, handleRemoveProcedureFromBill, handleAddProcedureToBill, 
        handleEncerrar, handleSalvar,
        handleMarcarRetorno, 
        acoesDaSessao, handleAddAcaoDaSessao, handleRemoveAcaoDaSessao,
        numeroParcelas, setNumeroParcelas,
        
        descontoValor, setDescontoValor, 
        descontoTipo, setDescontoTipo, 
        totalComDesconto 
    } = useRegistroProcedimento(); 

    const handleAddAvulso = () => {
        const novoItem = {
            id: Date.now(),
            descricao: "Procedimento Avulso",
            valorBase: 0,
            valorCobrado: 0,
            acrescimo: 0,
            status: "realizado",
            faturado: true, // Padrão faturado
            recomendacoes_pos_procedimento: "" 
        };
        handleAddProcedureToBill(novoItem);
    };

    const getStatusHistoricoConfig = (status) => {
        switch (status) {
            case 'ORCAMENTO':
                return { 
                    label: 'Orçamento / Planejamento', 
                    colorClass: 'bg-yellow-50 border-yellow-200', 
                    textClass: 'text-yellow-700',
                    badge: 'bg-yellow-100 text-yellow-800',
                    icon: FaFileInvoiceDollar,
                    labelItens: 'Itens Planejados:'
                };
            case 'PAGO':
            case 'PARCIALMENTE_PAGO':
            case 'NAO_PAGO': 
            case 'CONCLUIDO': 
                return { 
                    label: 'Sessão Realizada', 
                    colorClass: 'bg-green-50 border-green-200', 
                    textClass: 'text-green-700',
                    badge: 'bg-green-100 text-green-800',
                    icon: FaCheckDouble,
                    labelItens: 'Procedimentos Executados:'
                };
            default:
                return { 
                    label: 'Registro', 
                    colorClass: 'bg-gray-50 border-gray-200', 
                    textClass: 'text-gray-600',
                    badge: 'bg-gray-100 text-gray-800',
                    icon: FaExclamationTriangle,
                    labelItens: 'Itens:'
                };
        }
    };

    if (isLoading) {
         return (
             <div className="h-screen flex items-center justify-center bg-gray-50">
                 <FaSpinner className="animate-spin text-4xl text-indigo-600" />
                 <span className="ml-3 text-lg text-indigo-600">Carregando detalhes da sessão...</span>
             </div>
         );
    } 
    
    if (!agendamento) { 
        return <p className="p-8 text-red-600 font-bold">Erro Crítico: Agendamento não encontrado.</p>; 
    } 
    
    const isConcluido = agendamento.status === 'CONCLUIDO' || agendamento.status === 'CONCLUIDO_RETORNO';
    const isReadOnly = isConcluido && !modoEdicaoManual;
    
    const agendamentoNotas = agendamento.notas;
    const pacienteObs = agendamento.paciente?.observacoes;
    let observacoesParaExibir = '';
    if (agendamentoNotas) observacoesParaExibir += `NOTAS DO AGENDAMENTO: ${agendamentoNotas}\n`;
    if (pacienteObs) observacoesParaExibir += `OBS. DO PACIENTE: ${pacienteObs}`;
    if (!observacoesParaExibir) observacoesParaExibir = 'Nenhuma observação ou nota registrada.';

    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />
            
            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                <button
                    onClick={() => navigate('/procedimentos')}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
                >
                    <FaArrowLeft /> Voltar para o Painel
                </button>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            Registro de Atendimento: {pacienteNome}
                        </h2>
                        <div className="flex items-center flex-wrap gap-2 text-lg md:text-xl text-gray-600">
                            <span>Agendamento de {dataAgendamento} às {horarioAgendamento} (ID: {id})</span>
                            
                            {isConcluido && !modoEdicaoManual && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-sm rounded flex items-center gap-1">
                                    <FaCheckDouble /> Finalizado
                                </span>
                            )}
                            {modoEdicaoManual && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 font-bold text-sm rounded flex items-center gap-1 border border-yellow-300 animate-pulse">
                                    <FaLockOpen /> Modo de Edição Ativo
                                </span>
                            )}
                        </div>
                    </div>

                    {isConcluido && !modoEdicaoManual && (
                        <button 
                            type="button" 
                            onClick={() => {
                                if (window.confirm("Atenção: Este atendimento já foi finalizado. Alterações aqui podem impactar o financeiro e histórico.\n\nDeseja habilitar a edição mesmo assim?")) {
                                    setModoEdicaoManual(true);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition"
                        >
                            <FaEdit /> Habilitar Edição
                        </button>
                    )}
                </div>

                <form onSubmit={!isReadOnly ? handleSalvar : (e) => e.preventDefault()} className="space-y-6">
                    
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><FaTag /> Observações Iniciais</h3>
                        <p className="text-sm italic text-gray-500">Agendado como: {procedimentoAgendado}</p>
                        <pre className="mt-1 font-medium whitespace-pre-wrap text-sm text-gray-700">{observacoesParaExibir}</pre>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* COLUNA 1: OBSERVAÇÕES E HISTÓRICO */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            <RegistroDeAcoes
                                acoesDaSessao={acoesDaSessao}
                                handleAddAcao={handleAddAcaoDaSessao}
                                handleRemoveAcao={handleRemoveAcaoDaSessao}
                                isReadOnly={isReadOnly}
                            />
                            
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                                    <FaHistory /> Histórico de Procedimentos
                                </h3>
                                <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {historico && historico.length > 0 ? (
                                        historico.map((proc, index) => {
                                            const config = getStatusHistoricoConfig(proc.statusPagamento);
                                            const StatusIcon = config.icon;

                                            let listaItens = [];
                                            if (proc.itens && proc.itens.length > 0) {
                                                listaItens = proc.itens;
                                            } else if (proc.procedimentosRealizados && proc.procedimentosRealizados.length > 0) {
                                                listaItens = proc.procedimentosRealizados.map((s, idx) => ({
                                                    id: idx,
                                                    descricao: s.split(' - R$')[0]
                                                }));
                                            }

                                            const nomeProfissional = proc.agendamento?.profissional?.nome || 'Profissional N/A';

                                            return (
                                                <li key={index} className={`border rounded-lg p-3 ${config.colorClass}`}>
                                                    <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-2">
                                                        <div className="flex items-center gap-2">
                                                            <StatusIcon className={config.textClass} />
                                                            <div>
                                                                <span className="block font-bold text-gray-800 text-sm">
                                                                    {proc.dataRegistro ? new Date(proc.dataRegistro).toLocaleDateString() : 'Data N/A'}
                                                                </span>
                                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config.badge}`}>
                                                                    {config.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-500 bg-white border px-2 py-1 rounded">
                                                            {nomeProfissional}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="mt-2">
                                                        <p className={`text-xs font-bold mb-1 ${config.textClass}`}>{config.labelItens}</p>
                                                        {listaItens.length > 0 ? (
                                                            <ul className="list-disc list-inside space-y-1">
                                                                {listaItens.map((item, i) => (
                                                                    <li key={i} className="text-xs text-gray-700 font-medium ml-1">
                                                                        {item.descricao}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 italic">Nenhum item registrado.</p>
                                                        )}
                                                    </div>
                                                    
                                                    {proc.observacoesClinicas && (
                                                        <div className="mt-3 bg-white bg-opacity-60 p-2 rounded border border-gray-100">
                                                            <p className="text-gray-600 text-xs italic">
                                                                <span className="font-bold not-italic text-gray-700">Obs:</span> {proc.observacoesClinicas}
                                                            </p>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-gray-500 italic py-4 text-center">Nenhum procedimento anterior encontrado.</li>
                                    )}
                                </ul>
                            </div>
                            
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center gap-2">
                                    <FaTooth /> Observações da Sessão
                                </h3>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500"
                                    rows="5"
                                    placeholder="Detalhes dos procedimentos realizados, diagnóstico, etc."
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    disabled={isReadOnly}
                                ></textarea>
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/procedimentos/odontograma/${id}`)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                                >
                                    IR PARA ODONTOGRAMA <FaHandPointRight />
                                </button>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/pacientes/${agendamento.paciente?.id}`, { state: { activeTab: 'financeiro' } })}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition text-sm"
                                    >
                                        <FaMoneyBillWave /> FINANCEIRO DO PACIENTE
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/receitas/criar/${agendamento.paciente?.id}`)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition text-sm"
                                    >
                                        <FaPrint /> CRIAR RECEITA
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        // 🌟 FILTRO ADICIONADO AQUI:
                                        // Só envia para o termo o que for faturado (Realizado)
                                        const itensParaTermo = procedimentosRealizados.filter(p => p.faturado !== false);

                                        navigate('/termos', { 
                                            state: { 
                                                agendamentoId: id,
                                                paciente: agendamento.paciente, 
                                                profissional: agendamento.profissional,
                                                procedimentos: itensParaTermo, // <--- Enviando a lista filtrada
                                                numeroParcelas: numeroParcelas 
                                            } 
                                        });
                                    }} 
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition text-sm"
                                >
                                    <FaFileAlt /> VER TERMOS E ATESTADO
                                </button>
                            </div>
                        </div>
                        
                        {/* COLUNA 2: COBRANÇA */}
                        {/* Aqui passamos a função para atualizar os itens no componente filho */}
                        <RegistroCobranca 
                            setProcedimentosRealizados={setProcedimentosRealizados}
                            
                            agendamento={agendamento} 
                            procedimentosRealizados={procedimentosRealizados}
                            userRole={userRole}
                            subtotal={subtotal}
                            statusPagamento={statusPagamento}
                            isSaving={isSaving}
                            handleSalvar={handleSalvar}
                            handleAcrescimoChange={handleAcrescimoChange}
                            handleRemoveProcedureFromBill={handleRemoveProcedureFromBill}
                            handleAddAvulso={handleAddAvulso}
                            handleEncerrar={handleEncerrar}
                            setStatusPagamento={setStatusPagamento}
                            isReadOnly={isReadOnly}
                            numeroParcelas={numeroParcelas}
                            setNumeroParcelas={setNumeroParcelas}
                            handleMarcarRetorno={handleMarcarRetorno}
                            handleLancarCobranca={handleLancarCobranca}
                            
                            descontoValor={descontoValor}
                            setDescontoValor={setDescontoValor}
                            descontoTipo={descontoTipo}
                            setDescontoTipo={setDescontoTipo}
                            totalComDesconto={totalComDesconto || 0}
                        />
                    </div>
                </form>
            </main>
        </div>
    );
}