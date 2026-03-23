// src/components/CardInfo.jsx
import React from "react";

export default function CardInfo({ title, value, icon, color }) {
  return (
    // Ajuste de padding p-4 em mobile, p-6 em desktop
    <div className={`bg-white shadow-md rounded-2xl p-4 md:p-6 flex items-center gap-4 border-l-4 ${color}`}>
      <div className="text-3xl md:text-4xl">{icon}</div>
      <div>
        <h2 className="text-gray-600 font-semibold text-xs md:text-sm">{title}</h2>
        <p className="text-xl md:text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}