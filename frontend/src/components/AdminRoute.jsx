// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

const AdminRoute = ({ children }) => {
    const user = AuthService.getCurrentUser();
    const isAuthorized = user && user.role === 'ADMINISTRADOR';

    if (!isAuthorized) {
        // Redireciona para a home ou exibe uma mensagem de acesso negado
        return <Navigate to="/home" replace />;
    }

    return children;
};
export default AdminRoute;