import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; 
import { FaHome, FaUsers, FaCalendarAlt, FaUserCircle, FaBars, FaTimes } from "react-icons/fa"; // Adicionados FaBars e FaTimes
import { GiTooth } from "react-icons/gi"; 
import { BiMoney } from "react-icons/bi";
import { GoGear } from "react-icons/go";
import { ImAidKit } from "react-icons/im";

import AuthService from "../services/AuthService"; 
import ProfissionalService from "../services/ProfissionalService"; 

import logoImg from '../assets/logo.png'; 


const formatarNomeCurto = (nomeCompleto) => {
    if (!nomeCompleto) return 'Visitante';
    const partes = nomeCompleto.trim().split(/\s+/); 
    if (partes.length <= 1) return partes[0]; 
    return `${partes[0]} ${partes[partes.length - 1]}`; 
};

const Logo = () => (
  <div className="flex items-center gap-3 p-2">
    <div className="w-10 h-10 flex items-center justify-center shrink-0"> 
        <img 
            src={logoImg} 
            alt="Logo clinica" 
            className="w-full h-full object-contain" 
        />
    </div>
    <span className="text-xl font-extrabold text-gray-800 tracking-tight whitespace-nowrap">
        clinica
    </span>
   </div>
);

const NavItem = ({ icon: Icon, text, to, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`
      flex items-center gap-3 p-3 rounded-lg 
      transition duration-150 ease-in-out
      ${active 
        ? 'bg-indigo-100 text-indigo-700 font-semibold' 
        : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
      }
    `}
  >
  <Icon className="w-5 h-5" /> 
  <span>{text}</span>
  </Link>
);

export default function Sidebar() {
    const location = useLocation(); 
    const isActive = (path) => location.pathname === path;

    // --- NOVO STATE PARA MOBILE ---
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    
    const userToken = AuthService.getCurrentUser();
    const emailToken = userToken ? (userToken.sub || userToken.email || userToken.username) : '';
    
    const [userData, setUserData] = useState({
        name: emailToken ? emailToken.split('@')[0] : 'Visitante',
        role: userToken?.role || '',
        foto: null
    });

    useEffect(() => {
        const carregarDadosCompletos = async () => {
            if (!emailToken) return;
            try {
                const todosProfissionais = await ProfissionalService.listarTodos();
                const eu = todosProfissionais.find(p => 
                    p.email && p.email.toLowerCase() === emailToken.toLowerCase()
                );
                if (eu) {
                    setUserData({
                        name: eu.nome || emailToken.split('@')[0], 
                        foto: eu.foto, 
                        role: eu.cargo || userToken.role
                    });
                }
            } catch (error) {
                console.error("Erro ao atualizar perfil sidebar:", error);
            }
        };
        carregarDadosCompletos();
    }, [emailToken]); 
    
    const displayName = formatarNomeCurto(userData.name);
    const photoUrl = userData.foto;

    return (
        <>
            {/* --- BOTÃO MOBILE (Apenas visível em telas pequenas) --- */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button 
                    onClick={() => setIsMobileOpen(!isMobileOpen)} 
                    className="p-2 bg-indigo-600 text-white rounded-md shadow-lg"
                >
                    {isMobileOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* --- OVERLAY ESCURO (Para fechar ao clicar fora no mobile) --- */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* --- SIDEBAR PRINCIPAL --- 
                Classes alteradas para responsividade:
                - fixed inset-y-0 left-0: Fixa na esquerda em mobile
                - transform transition-transform: Animação de deslizar
                - -translate-x-full: Esconde por padrão no mobile se !isMobileOpen
                - lg:translate-x-0 lg:static: Sempre visível e estático em Desktop
            */}
            <aside className={`
                bg-white w-64 h-screen p-5 shadow-2xl flex flex-col justify-between
                fixed inset-y-0 left-0 z-50 overflow-y-auto
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:h-auto lg:shadow-none
            `}>
                
                <div>
                    <div className="flex justify-between items-center">
                        <Logo />
                        {/* Botão fechar dentro do menu (opcional para mobile) */}
                        <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-gray-500">
                            <FaTimes />
                        </button>
                    </div>
                    
                    <nav className="mt-8 space-y-2">
                        <NavItem onClick={() => setIsMobileOpen(false)} icon={FaHome} text="Inicio" to="/home" active={isActive("/home") || isActive("/")} />
                        <NavItem onClick={() => setIsMobileOpen(false)} icon={FaUsers} text="Pacientes" to="/pacientes" active={isActive("/pacientes")} />
                        <NavItem onClick={() => setIsMobileOpen(false)} icon={FaCalendarAlt} text="Agenda" to="/agenda" active={isActive("/agenda")} />
                        <NavItem onClick={() => setIsMobileOpen(false)} icon={ImAidKit} text="Procedimentos" to="/procedimentos" active={isActive("/procedimentos")} />
                        <NavItem onClick={() => setIsMobileOpen(false)} icon={BiMoney} text="Financeiro" to="/financeiro" active={isActive("/financeiro")} />
                        <NavItem onClick={() => setIsMobileOpen(false)} icon={GoGear} text="Configurações" to="/configuracoes" active={location.pathname.startsWith("/configuracoes")} />
                    </nav>
                </div>

                <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-3 text-gray-700 p-2">
                        {photoUrl ? (
                            <img 
                                src={photoUrl} 
                                alt="Foto" 
                                className="w-10 h-10 object-cover rounded-full border-2 border-indigo-100 shadow-sm"
                                onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.style.display = 'none'; 
                                    if(e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                }}
                            />
                        ) : null}
                        
                        <FaUserCircle 
                            className="w-10 h-10 text-indigo-300" 
                            style={{ display: photoUrl ? 'none' : 'block' }} 
                        />
                        
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-sm text-gray-800 truncate capitalize" title={userData.name}> 
                                {displayName}
                            </span>
                            <span className="text-xs text-indigo-600 font-semibold truncate uppercase">
                                {userData.role}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}