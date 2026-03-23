import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const API_URL = `${BASE_URL}/auth`;
// Função auxiliar para obter o token JWT do armazenamento local
const authHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.accessToken) {
        return { 'Authorization': 'Bearer ' + user.accessToken };
    } else {
        return {};
    }
};

const login = (email, password) => {
    return axios.post(API_URL + '/login', { email, password })
        .then(response => {
            if (response.data.accessToken) {
                // Salva o JWT e dados do usuário no localStorage
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        });
};

const registerAdmin = (data) => {
    return axios.post(API_URL + '/register-admin', data);
};

// Método para registro com foto (Multipart)
const registerAdminWithPhoto = (formData) => {
    return axios.post(API_URL + '/register-admin-with-photo', formData, {
        headers: {
            'Content-Type': 'multipart/form-data' 
        }
    });
};

const confirmAccount = (email, code) => {
    return axios.post(API_URL + '/confirm-account', { email, code });
};

// 🌟 NOVO: Envia código de recuperação de senha para o e-mail
const sendResetCode = (email) => {
    return axios.post(API_URL + '/forgot-password', { email });
};

// 🌟 NOVO: Redefine a senha usando o código recebido
const resetPassword = (email, code, newPassword) => {
    return axios.post(API_URL + '/reset-password', {
        email: email,
        code: code,
        newPassword: newPassword // ⚠️ Deve bater com o DTO do Java
    });
};

const logout = async () => {
    const headers = authHeader();
    
    // 1. Tenta enviar a requisição de logout para o backend
    if (headers['Authorization']) {
        try {
            await axios.post(API_URL + '/logout', {}, { 
                headers: headers 
            });
        } catch (error) {
            console.error("Erro ao enviar logout para o backend, mas a sessão local será limpa.", error);
        }
    }
    
    // 2. Limpa a sessão local
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const AuthService = {
    login,
    registerAdmin,
    registerAdminWithPhoto,
    confirmAccount,
    logout,
    getCurrentUser,
    sendResetCode,  
    resetPassword   
};

export default AuthService;