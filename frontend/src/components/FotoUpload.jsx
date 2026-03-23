import React, { useRef, useState } from 'react';
import { FaCamera, FaTrash, FaPlus, FaImage, FaUser } from 'react-icons/fa';
import PhotoViewerModal from './PhotoViewerModal'; // Assumindo que este arquivo existe

const MAX_FOTOS = 30;

// Estrutura esperada de 'fotos': [{ id: number, file: File, url: string (preview local) }]
export default function FotoUpload({ fotos, onAddFoto, onRemoveFoto }) {
    const fileInputRef = useRef(null);
    const [imageViewerUrl, setImageViewerUrl] = useState(null);

    /**
     * Lida com a seleção de arquivos e chama onAddFoto com o objeto File e a URL temporária.
     */
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            
            // 🌟 Delega o objeto File e a URL de preview para o componente pai 🌟
            onAddFoto({ 
                id: Date.now(), 
                file: file, 
                url: tempUrl 
            });

            // Limpa o input para permitir selecionar o mesmo arquivo novamente
            event.target.value = null; 
        }
    };
    
    const handleRemove = (fotoId, url) => {
        // Limpa a URL temporária para evitar vazamento de memória (se for uma URL local)
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
        onRemoveFoto(fotoId);
    }
    
    const handleOpenViewer = (url) => {
        setImageViewerUrl(url);
    }

    // Remoção da função handleSimulatedUpload, pois agora usamos o fluxo de arquivos.

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
                <FaImage className="text-yellow-600" /> Fotos do Procedimento ({fotos.length}/{MAX_FOTOS})
            </h3>

            {/* Galeria de Fotos */}
            <div className="flex flex-wrap gap-4 mb-4 justify-start">
                {fotos.map((fotoItem) => (
                    <div 
                        key={fotoItem.id} 
                        className="relative w-24 h-24 rounded-lg overflow-hidden shadow-md cursor-pointer group"
                        onClick={() => handleOpenViewer(fotoItem.url)} // 🌟 CLIQUE ABRE O MODAL 🌟
                    >
                        <img 
                            src={fotoItem.url} 
                            alt={`Procedimento ${fotoItem.id}`} 
                            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-70" 
                        />
                        <button
                            onClick={(e) => { 
                                e.stopPropagation(); // Previne o clique na imagem de abrir o viewer
                                handleRemove(fotoItem.id, fotoItem.url); 
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-700 transition"
                            title="Remover foto"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}

                {/* Botão de Adicionar Foto */}
                {fotos.length < MAX_FOTOS && (
                    <label 
                        htmlFor="file-upload" 
                        className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-600"
                    >
                        <FaPlus className="text-lg" />
                        <span className="text-xs mt-1 text-center">Adicionar Imagem</span>
                        {/* Input real (escondido) */}
                        <input
                            id="file-upload"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                )}
            </div>
            
            {fotos.length === MAX_FOTOS && (
                <p className="text-sm text-red-500 mt-2">Máximo de 30 fotos atingido.</p>
            )}

            {/* Modal de Visualização (Aparece quando imageViewerUrl não é nula) */}
            <PhotoViewerModal
                imageUrl={imageViewerUrl}
                onClose={() => setImageViewerUrl(null)}
            />
        </div>
    );
}

