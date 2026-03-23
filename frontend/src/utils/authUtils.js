// src/utils/authUtils.js

/**
 * Recupera o perfil/role do usuário logado no localStorage.
 * Retorna 'DENTISTA' como padrão caso não encontre, por segurança.
 */
export const getUserRole = () => {
    try {
        const userStr = localStorage.getItem('user'); // Ajuste a chave se você usa outro nome (ex: 'usuario', 'session')
        
        if (!userStr) return 'DENTISTA'; 

        const user = JSON.parse(userStr);
        
        // Tenta encontrar a role em diferentes estruturas comuns de JSON
        // Ajuste conforme o seu login salva os dados
        if (user.role) return user.role;
        if (user.perfil) return user.perfil;
        
        // Se for estrutura do Spring Security (authorities: [{ authority: 'ADMINISTRADOR' }])
        if (user.authorities && Array.isArray(user.authorities)) {
            // Retorna a primeira authority encontrada ou mapeia
            const auth = user.authorities.find(a => a.authority === 'ADMINISTRADOR');
            return auth ? 'ADMINISTRADOR' : 'DENTISTA';
        }

        return 'DENTISTA';
    } catch (error) {
        console.error("Erro ao ler permissões do usuário:", error);
        return 'DENTISTA'; // Fallback seguro
    }
};

/**
 * Helper rápido para verificar se é admin
 */
export const isUserAdmin = () => {
    return getUserRole() === 'ADMINISTRADOR';
};