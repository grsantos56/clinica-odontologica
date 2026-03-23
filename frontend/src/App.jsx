import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 

import Dashboard from "./pages/HomePage";
import PacientesPage from "./pages/Pacientes"; 
import Financeiro from "./pages/Financeiro";
import NovaConsulta from "./pages/NovoAgendamentoPage";
import CadastroPacientePage from "./pages/CadastroPacientePage";
import Agenda from "./pages/AgendaPage";
import Procedimentos from "./pages/ProcedimentosPage";
import RegistroSessaoFinanceiroPage from "./pages/RegistroSessaoFinanceiroPage"; 
import OdontogramaPage from "./pages/OdontogramaPage"; 
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import ProfissionaisPage from "./pages/ProfissionaisPage";
import CadastroProfissionalPage from "./pages/CadastroProfissionalPage";
import ServicosPage from "./pages/ServicosPage";
import RetornoAgendamentoPage from "./pages/RetornoAgendamentoPage";
import PacienteDetalhesPage from "./pages/PacienteDetalhesPage";
import RelatorioFinanceiroPage from "./pages/RelatorioFinanceiroPage";
import SessoesAtivasPage from "./pages/SessoesAtivasPage";
import OrcamentosAgendamentoPage from "./pages/OrcamentosAgendamentoPage";
import LandingPage from "./pages/LandingPage";
import ReceituarioPage from "./pages/ReceituarioPage";
import ImprimirReceitaPage from "./pages/ImprimirReceitaPage"; 
import TermosPage from "./pages/TermosPage"; 
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthService from "./services/AuthService"; 

const PrivateRoute = ({ children }) => {
    const isAuthenticated = !!AuthService.getCurrentUser();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const user = AuthService.getCurrentUser();
    if (!user) return <Navigate to="/login" replace />;
    return user.role === 'ADMINISTRADOR' ? children : <Navigate to="/home" replace />;
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ROTAS PÚBLICAS */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* DASHBOARD */}
                <Route path="/home" element={<PrivateRoute><Dashboard /></PrivateRoute>} /> 

                {/* PACIENTES */}
                <Route path="/pacientes" element={<PrivateRoute><PacientesPage /></PrivateRoute>} /> 
                <Route path="/pacientes/novo" element={<PrivateRoute><CadastroPacientePage /></PrivateRoute>} />
                <Route path="/pacientes/:id" element={<PrivateRoute><PacienteDetalhesPage /></PrivateRoute>} />
            
                {/* AGENDA E CONSULTAS */}
                <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
                <Route path="/agenda/nova" element={<PrivateRoute><NovaConsulta /></PrivateRoute>} />
                <Route path="/retorno-agendamento" element={<PrivateRoute><RetornoAgendamentoPage /></PrivateRoute>} />
                <Route path="/orcamentos/agendar" element={<PrivateRoute><OrcamentosAgendamentoPage /></PrivateRoute>} />

                {/* PROCEDIMENTOS E ODONTOGRAMA */}
                <Route path="/procedimentos" element={<PrivateRoute><Procedimentos /></PrivateRoute>} />
                <Route path="/procedimentos/relatorio" element={<PrivateRoute><RelatorioFinanceiroPage /></PrivateRoute>} />
                <Route path="/procedimentos/registro/:idAgendamento" element={<PrivateRoute><RegistroSessaoFinanceiroPage /></PrivateRoute>} />
                <Route path="/procedimentos/odontograma/:idAgendamento" element={<PrivateRoute><OdontogramaPage /></PrivateRoute>} />

                {/* RECEITAS E DOCUMENTOS */}
                <Route path="/receitas/criar/:id" element={<PrivateRoute><ReceituarioPage /></PrivateRoute>} />
                <Route path="/receitas/imprimir/:id" element={<PrivateRoute><ImprimirReceitaPage /></PrivateRoute>} />
                <Route path="/termos" element={<PrivateRoute><TermosPage /></PrivateRoute>} />

                {/* SEGURANÇA (Sessões) */}
                <Route path="/configuracoes/sessoes" element={<PrivateRoute><SessoesAtivasPage /></PrivateRoute>} />

                {/* CONFIGURAÇÕES E ADMINISTRAÇÃO */}
                <Route path="/configuracoes" element={<AdminRoute><ConfiguracoesPage /></AdminRoute>} />
                <Route path="/configuracoes/profissionais" element={<AdminRoute><ProfissionaisPage /></AdminRoute>} />
                <Route path="/configuracoes/profissionais/novo" element={<AdminRoute><CadastroProfissionalPage /></AdminRoute>} />
                <Route path="/configuracoes/servicos" element={<AdminRoute><ServicosPage /></AdminRoute>} />
                <Route path="/financeiro" element={<AdminRoute><Financeiro /></AdminRoute>} />

                {/* REDIRECIONAMENTO PADRÃO */}
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
        </BrowserRouter>
    );
}