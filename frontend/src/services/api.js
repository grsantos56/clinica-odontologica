// src/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: BASE_URL, 
});

// 1. INTERCEPTOR DE REQUISIÇÃO (Já existente)
api.interceptors.request.use(config => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

// 🌟 2. NOVO: INTERCEPTOR DE RESPOSTA PARA LOGOUT AUTOMÁTICO 🌟
api.interceptors.response.use(
    (response) => response, // Se a resposta for sucesso, não faz nada
    (error) => {
        // Se o erro for 401, significa que o Token expirou ou a sessão foi encerrada
        if (error.response && error.response.status === 401) {
            console.warn("Sessão expirada ou inválida. Redirecionando para login...");
            
            // Remove os dados do usuário do navegador
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            
            // Redireciona para a tela de login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;