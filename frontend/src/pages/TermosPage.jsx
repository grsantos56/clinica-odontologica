import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/SideBar'; 
import DocModal from '../components/DocModal';
// 1. Ícone Stethoscope adicionado
import { ArrowLeft, FileText, BookOpen, Shield, CheckCircle, Eye, Stethoscope } from 'lucide-react';

import { gerarConteudoGuia } from '../components/documents/GuiaRecomendacoes';
import { gerarConteudoContrato } from '../components/documents/ContratoPrestacao';
import { gerarConteudoConsentimento } from '../components/documents/TermoConsentimento';
// 2. Importação do gerador de Atestado adicionada
import { gerarConteudoAtestado } from '../components/documents/AtestadoMedico';

export default function TermosPage() {
    const navigate = useNavigate(); 
    const location = useLocation();
    
    // Estado para o documento atual sendo visualizado
    const [docData, setDocData] = useState(null); 
    // Estado para armazenar as edições feitas (Cache de sessão)
    const [editedDocs, setEditedDocs] = useState({});

    const { procedimentos, paciente, profissional } = location.state || {};
    
    const pacienteNome = paciente?.nome || "Paciente não identificado";

    // Cálculos para o contrato
    const valorTotal = procedimentos ? procedimentos.reduce((acc, p) => acc + (p.valorCobrado || 0), 0) : 0;
    const parcelas = location.state?.numeroParcelas || 1;

    const CARDS = [
        // 3. NOVO CARD: Atestado Médico
        {
            id: 'atestado',
            title: "Atestado / Comparecimento",
            description: "Documento para justificar ausência ou solicitar repouso.",
            icon: <Stethoscope className="text-red-500" size={32} />,
            generator: () => gerarConteudoAtestado(paciente, profissional)
        },
        {
            id: 'guia',
            title: "Guia de Recomendações Pós-Procedimento",
            description: "Orientações personalizadas baseadas nos procedimentos realizados.",
            icon: <BookOpen className="text-blue-500" size={32} />,
            generator: () => gerarConteudoGuia(procedimentos, pacienteNome)
        },
        {
            id: 'contrato',
            title: "Contrato de Prestação de Serviços",
            description: "Minuta padrão de contrato para formalização [Cláusulas 1 a 13].",
            icon: <Shield className="text-indigo-500" size={32} />,
            generator: () => gerarConteudoContrato(paciente, procedimentos, valorTotal, parcelas)
        },
        {
            id: 'termo',
            title: "Termo de Consentimento",
            description: "Autorização formal para realização de procedimentos.",
            icon: <CheckCircle className="text-teal-500" size={32} />,
            generator: () => gerarConteudoConsentimento(paciente, procedimentos, profissional)
        }
    ];

    const handleOpenDoc = (card) => {
        // Verifica se já existe uma versão editada salva na memória
        if (editedDocs[card.id]) {
            // Se já editou, abre a versão editada
            setDocData({
                ...editedDocs[card.id],
                id: card.id // Garante que o ID vá junto
            });
        } else if (card && typeof card.generator === 'function') {
            // Se é a primeira vez, gera do zero
            const data = card.generator();
            setDocData({
                ...data,
                id: card.id // Adicionamos o ID para saber qual salvar depois
            });
        }
    };

    // Função para receber o conteúdo editado do Modal
    const handleSaveDocContent = (id, newContentHtml) => {
        setEditedDocs(prev => ({
            ...prev,
            [id]: {
                ...prev[id], // Mantém titulo, etc
                ...docData,  // Garante dados atuais
                contentHtml: newContentHtml // Atualiza só o HTML
            }
        }));
        // Atualiza também o modal atual para refletir a certeza do salvamento
        setDocData(prev => ({ ...prev, contentHtml: newContentHtml }));
        alert("Alterações salvas temporariamente na sessão!");
    };

    return (
        <div className="h-screen flex bg-gray-50 font-sans">
            <Sidebar />
            
            <main className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto w-full">
                <div className="mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
                        <ArrowLeft size={20} /> Voltar
                    </button>
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FileText className="text-indigo-600" size={32} />
                        Documentos do Paciente
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">
                        {pacienteNome !== "Paciente não identificado"
                            ? `Gerando documentos para: ${pacienteNome}` 
                            : "Selecione um modelo abaixo para visualizar e imprimir."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CARDS.map((card) => (
                        <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
                            <div className="mb-4 bg-gray-50 p-3 rounded-full w-fit">{card.icon}</div>
                            <h3 className="text-lg font-bold mb-2 text-gray-800">{card.title}</h3>
                            <p className="text-sm text-gray-500 mb-6 flex-1">{card.description}</p>
                            
                            {/* Indicador visual se já foi editado */}
                            {editedDocs[card.id] && (
                                <span className="text-xs text-orange-600 font-semibold mb-2 block">
                                    (Contém edições não salvas no banco)
                                </span>
                            )}

                            <button 
                                onClick={() => handleOpenDoc(card)}
                                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                            >
                                <Eye size={16} /> {editedDocs[card.id] ? "Ver Editado" : "Visualizar / Imprimir"}
                            </button>
                        </div>
                    ))}
                </div>
            </main>

            <DocModal 
                docData={docData} 
                onClose={() => setDocData(null)} 
                onSaveContent={handleSaveDocContent} 
            />
        </div>
    );
}