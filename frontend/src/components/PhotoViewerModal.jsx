//src/components/PhotoViewerModal.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

export default function PhotoViewerModal({ imageUrl, onClose }) {
    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4"
            onClick={onClose} 
        >
            <div 
                className="relative max-w-full max-h-full flex items-center justify-center"
                onClick={e => e.stopPropagation()} 
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-10"
                >
                    <FaTimes />
                </button>
                <img
                    src={imageUrl}
                    alt="Visualização do Procedimento"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-xl"
                />
            </div>
        </div>
    );
}
