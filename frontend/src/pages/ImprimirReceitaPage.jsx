import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2, Edit3 } from 'lucide-react';
import api from '../services/api'; 
import logo from '../assets/logo.png'; 

export default function ImprimirReceitaPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [receita, setReceita] = useState(null);
    const [loading, setLoading] = useState(true);

    const [dadosClinica, setDadosClinica] = useState({
        rua: "AV Jose dos Reis",
        fone: "(99) 98826-3955",
        cidade: "Colinas",
        uf: "MA"
    });

    const [editando, setEditando] = useState(false);

    useEffect(() => {
        async function loadReceita() {
            try {
                const response = await api.get(`/receitas/${id}`);
                setReceita(response.data);
            } catch (error) {
                console.error("Erro ao carregar receita:", error);
                navigate(-1);
            } finally {
                setLoading(false);
            }
        }
        loadReceita();
    }, [id, navigate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-4xl text-indigo-600" />
                <span className="ml-3 text-lg text-indigo-600">Gerando documento...</span>
            </div>
        );
    }

    if (!receita) return null;

    const dataEmissao = receita.dataEmissao ? new Date(receita.dataEmissao) : new Date();
    const dataFormatada = dataEmissao.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const profissional = receita.profissional || {};
    const croProfissional = profissional.crmOuRegistro || profissional.cro || "_______";

    return (
        <div className="min-h-screen bg-gray-200 p-4 md:p-8 flex flex-col items-center print:p-0 print:bg-white print:block print:h-screen print:overflow-hidden">
            
            <style>
                {`
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-container {
                            width: 210mm !important;
                            height: 297mm !important;
                            position: absolute;
                            top: 0;
                            left: 0;
                            padding: 15mm 20mm;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            background-color: white;
                            box-shadow: none !important;
                        }
                    }
                `}
            </style>

            {/* --- BARRA DE FERRAMENTAS (NÃO IMPRIME) --- */}
            <div className="w-full max-w-[210mm] mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-medium transition self-start md:self-auto"
                >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </button>
                
                <div className="flex gap-3 items-center w-full md:w-auto justify-end">
                    <button
                        onClick={() => setEditando(!editando)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition ${editando ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <Edit3 className="w-4 h-4" /> {editando ? 'Finalizar' : 'Editar'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded shadow hover:bg-indigo-700 transition"
                    >
                        <Printer className="w-5 h-5" /> IMPRIMIR
                    </button>
                </div>
            </div>

            {/* --- CAMPOS DE EDIÇÃO --- */}
            {editando && (
                <div className="w-full max-w-[210mm] mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded no-print grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500">RUA</label>
                        <input type="text" value={dadosClinica.rua} onChange={e => setDadosClinica({...dadosClinica, rua: e.target.value})} className="w-full p-1 border rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">TELEFONE</label>
                        <input type="text" value={dadosClinica.fone} onChange={e => setDadosClinica({...dadosClinica, fone: e.target.value})} className="w-full p-1 border rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">CIDADE</label>
                        <input type="text" value={dadosClinica.cidade} onChange={e => setDadosClinica({...dadosClinica, cidade: e.target.value})} className="w-full p-1 border rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">UF</label>
                        <input type="text" value={dadosClinica.uf} onChange={e => setDadosClinica({...dadosClinica, uf: e.target.value})} className="w-full p-1 border rounded" />
                    </div>
                </div>
            )}

            {/* --- FOLHA A4 (VISUALIZAÇÃO / IMPRESSÃO) --- */}
            {/* Alterado: w-full para mobile, md:w-[210mm] para desktop */}
            <div className="bg-white shadow-2xl print:shadow-none print-container relative w-full md:w-[210mm] min-h-[297mm] flex flex-col"
                 style={{ padding: '15mm 20mm' }}>

                {/* 1. LOGO E CABEÇALHO */}
                <header className="flex flex-col items-center justify-center mb-6">
                    <img src={logo} alt="clinica" className="w-32 mb-4 object-contain" />
                    
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-[0.2em] uppercase mb-2 text-center">clinica</h1>
                    
                    <div className="text-xs md:text-sm text-gray-600 font-semibold text-center uppercase space-y-1 w-full">
                        <div className="border-b border-dotted border-gray-400 pb-1 mb-1 mx-auto w-3/4">
                            {dadosClinica.rua}
                        </div>
                        <div>
                            FONE: {dadosClinica.fone}
                        </div>
                    </div>
                </header>

                <div className="w-full text-center mb-4">
                     <span className="text-xs text-gray-400 uppercase border border-gray-300 px-2 py-0.5 rounded">Uso Interno</span>
                </div>

                {/* 2. IDENTIFICAÇÃO DO PACIENTE */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-baseline text-lg">
                        <span className="font-bold text-gray-800 mr-2">Paciente:</span>
                        <div className="flex-grow border-b border-gray-400 text-gray-900 font-medium pl-2">
                            {receita.paciente?.nome}
                        </div>
                    </div>
                </div>

                {/* 3. LISTA DE MEDICAMENTOS */}
                <main className="flex-grow space-y-6">
                    {receita.itens.map((item, index) => (
                        <div key={index} className="pl-2">
                            <p className="text-lg font-bold text-gray-900 mb-1">
                                {index + 1}º {item.nomeMedicamento} <span className="font-normal text-base text-gray-600">- {item.viaAdministracao}</span>
                            </p>
                            <p className="text-gray-800 pl-6 text-lg leading-relaxed">
                                Tomar <strong>{item.quantidade || '1 dose'}</strong> de {item.frequencia} durante {item.duracao}.
                            </p>
                        </div>
                    ))}
                </main>

                {/* 4. RODAPÉ E ASSINATURA */}
                <footer className="mt-auto pt-10 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-2/3 border-b-2 border-black mb-2"></div>
                        
                        <p className="font-bold text-gray-900 text-lg uppercase mb-1">
                            {profissional.nome}
                        </p>
                        
                        <p className="text-md text-gray-800">
                             Cirurgião-Dentista - CRO: <span className="font-bold">{croProfissional}</span>
                        </p>

                        <div className="mt-8 w-full text-center font-medium text-gray-800 text-lg flex flex-col items-center gap-1">
                            <p>{dadosClinica.cidade}/{dadosClinica.uf}</p>
                            <p>{dataFormatada}</p>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
}