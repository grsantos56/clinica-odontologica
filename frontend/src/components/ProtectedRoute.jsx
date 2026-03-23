import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Verifica se existe o token salvo no login
    const token = localStorage.getItem('accessToken');

    if (!token) {
        // Redireciona para login se estiver deslogado
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;