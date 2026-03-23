import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Edit3, Save } from 'lucide-react';

// 🌟 Adicione onSaveContent nas props
const DocModal = ({ docData, onClose, onSaveContent }) => {
    const [isEditable, setIsEditable] = useState(false);
    const contentRef = useRef(null); 

    useEffect(() => {
        setIsEditable(false);
    }, [docData]);

    if (!docData) return null;

    // 🌟 NOVA FUNÇÃO: Salva ao clicar em "Finalizar Edição"
    const handleSaveAndToggle = () => {
        if (isEditable) {
            // Se estava editando e vai fechar, SALVA O CONTEÚDO
            if (contentRef.current && onSaveContent) {
                const novoHtml = contentRef.current.innerHTML;
                // Envia para o TermosPage salvar no estado
                onSaveContent(docData.id, novoHtml);
            }
        }
        // Alterna o modo de edição
        setIsEditable(!isEditable);
    };

    const handlePrint = () => {
        // Pega o conteúdo HTML atual (incluindo suas edições)
        const conteudoAtual = contentRef.current ? contentRef.current.innerHTML : docData.contentHtml;

        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${docData.title}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; line-height: 1.4; font-size: 12px; }
                        h1 { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
                        pre { white-space: pre-wrap; font-family: 'Arial', sans-serif; font-size: 12px; border: none; background: transparent; }
                    </style>
                </head>
                <body>
                    <h1>${docData.title}</h1>
                    ${docData.headerHtml || ''}
                    <div style="margin-top: 20px;">
                        ${conteudoAtual}
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
                
                {/* Cabeçalho */}
                <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">{docData.title}</h3>
                        {isEditable && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200 animate-pulse">Modo Edição Ativo</span>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
                </div>
                
                {/* Corpo */}
                <div className="p-8 overflow-y-auto bg-gray-100 flex-1">
                    <div className="bg-white p-10 shadow-sm border border-gray-200 min-h-[500px] mx-auto max-w-[210mm]">
                        
                        <div dangerouslySetInnerHTML={{ __html: docData.headerHtml }} />
                        
                        <div 
                            ref={contentRef}
                            contentEditable={isEditable}
                            suppressContentEditableWarning={true}
                            className={`mt-6 outline-none transition-all duration-200 ${
                                isEditable 
                                    ? 'border-2 border-dashed border-indigo-300 p-4 rounded-lg bg-indigo-50/30' 
                                    : 'border border-transparent p-1'
                            }`}
                            // 🌟 IMPORTANTE: Se não estiver editando, atualiza com o que vem do pai.
                            // Se estiver editando, o React não deve re-renderizar isso para não perder o foco do cursor.
                            dangerouslySetInnerHTML={{ __html: docData.contentHtml }}
                        />
                    </div>
                </div>

                {/* Rodapé */}
                <div className="p-4 border-t bg-white flex justify-between items-center rounded-b-xl">
                    <button 
                        // 🌟 USA A NOVA FUNÇÃO AQUI
                        onClick={handleSaveAndToggle}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            isEditable 
                                ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        {isEditable ? <><Save size={18}/> Salvar e Finalizar</> : <><Edit3 size={18}/> Editar Texto</>}
                    </button>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                            Fechar
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-md transition-transform active:scale-95"
                        >
                            <Printer size={18} /> Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocModal;