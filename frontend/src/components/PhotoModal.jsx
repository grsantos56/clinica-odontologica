// components/PhotoModal.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

export default function PhotoModal({ url, onClose }) {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="relative bg-white p-2 rounded-xl shadow-2xl max-w-lg w-full"
                onClick={e => e.stopPropagation()} 
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 z-10"
                >
                    <FaTimes />
                </button>
                <img 
                    src={url} 
                    alt="Foto do Paciente Ampliada" 
                    className="w-full h-auto max-h-[90vh] object-contain rounded-lg" 
                />
            </div>
        </div>
    );
}