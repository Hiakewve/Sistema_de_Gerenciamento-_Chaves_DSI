// js/auth.js

document.addEventListener('DOMContentLoaded', async () => {
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const msgLogin = document.getElementById('mensagem-login');

    // 1. Ação do Botão de Login com Google
    if (btnLoginGoogle) {
        btnLoginGoogle.addEventListener('click', async () => {
            const { error } = await _supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname
                }
            });

            if (error) {
                msgLogin.textContent = 'Erro ao conectar com o Google: ' + error.message;
            }
        });
    }

    // 2. Verificação de Sessão Ativa ao carregar a página
    const { data: { session } } = await _supabase.auth.getSession();

    if (session) {
        const userEmail = session.user.email;

        // Valida se o e-mail logado está na tabela de permissões
        const { data: usuarioPermitido, error } = await _supabase
            .from('usuarios_permitidos')
            .select('*')
            .eq('email', userEmail)
            .single();

        if (error || !usuarioPermitido) {
            // E-mail não autorizado -> Faz logout e bloqueia o acesso
            if (msgLogin) {
                msgLogin.textContent = 'Acesso Negado: Seu e-mail (' + userEmail + ') não está cadastrado na lista de usuários permitidos.';
            }
            await _supabase.auth.signOut();
            return;
        }

        // Se estiver em index.html e autenticado, redireciona pelo papel
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            if (usuarioPermitido.papel === 'admin') {
                window.location.href = 'html/admin.html';
            } else {
                window.location.href = 'html/aluno.html';
            }
        }
    } else {
        // Se tentar acessar as páginas internas sem estar logado, redireciona para o login
        const ePaginaProtegida = window.location.pathname.includes('aluno.html') || window.location.pathname.includes('admin.html');
        if (ePaginaProtegida) {
            window.location.href = '../index.html';
        }
    }
});

// Função Utilitária para Logout (Usada nos botões de Sair das páginas aluno.html e admin.html)
async function realizarLogout() {
    await _supabase.auth.signOut();
    window.location.href = '../index.html';
}