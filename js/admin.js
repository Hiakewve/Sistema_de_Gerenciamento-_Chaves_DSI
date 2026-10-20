// js/admin.js

document.addEventListener('DOMContentLoaded', async () => {
    // Configura o botão de logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (typeof realizarLogout === 'function') {
                await realizarLogout();
            } else {
                await _supabase.auth.signOut();
                window.location.href = '../index.html';
            }
        });
    }

    // Configura o Modal de Cadastro de Aluno
    configurarModalCadastro();

    // Configura a Busca de Alunos
    configurarBuscaAlunos();

    // Carrega todas as seções administrativas
    await carregarSolicitacoesPendentes();
    await carregarChavesEmprestadas();
    await carregarHistoricoGeral();
    await carregarAlunosCadastrados();
});

// 1. Carrega as solicitações aguardando aprovação
async function carregarSolicitacoesPendentes() {
    const tbody = document.getElementById('tabela-solicitacoes-pendentes');
    if (!tbody) return;

    const { data: pendentes, error } = await _supabase
        .from('solicitacao')
        .select('*, chave(nome), perfil!solicitacao_aluno_id_fkey(nome, email)')
        .in('status', ['Pendente', 'pendente'])
        .order('id', { ascending: true });

    if (error) {
        console.error('Erro ao buscar solicitações pendentes:', error);
        return;
    }

    tbody.innerHTML = '';

    if (!pendentes || pendentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Nenhuma solicitação pendente no momento.</td></tr>';
        return;
    }

    pendentes.forEach(item => {
        const alunoNome = item.perfil ? item.perfil.nome : 'Aluno';
        const labNome = item.chave ? item.chave.nome : 'N/A';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${alunoNome}</td>
            <td>${labNome}</td>
            <td>${new Date().toLocaleDateString('pt-BR')}</td>
            <td>
                <button type="button" class="btn-acao-aprovar" onclick="aprovarSolicitacao(${item.id})">Aprovar</button>
                <button type="button" class="btn-acao-recusar" onclick="recusarSolicitacao(${item.id})">Recusar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Action: Aprovar solicitação
async function aprovarSolicitacao(idSolicitacao) {
    const { data: { session } } = await _supabase.auth.getSession();

    const { error } = await _supabase
        .from('solicitacao')
        .update({
            status: 'Aprovada',
            autorizado_por_id: session ? session.user.id : null
        })
        .eq('id', idSolicitacao);

    if (error) {
        alert('Erro ao aprovar solicitação: ' + error.message);
    } else {
        await recarregarTudo();
    }
}

// Action: Recusar solicitação
async function recusarSolicitacao(idSolicitacao) {
    const { error } = await _supabase
        .from('solicitacao')
        .update({ status: 'Recusada' })
        .eq('id', idSolicitacao);

    if (error) {
        alert('Erro ao recusar solicitação: ' + error.message);
    } else {
        await recarregarTudo();
    }
}

// 2. Carrega as chaves que estão emprestadas no momento
async function carregarChavesEmprestadas() {
    const tbody = document.getElementById('tabela-chaves-emprestadas');
    if (!tbody) return;

    const { data: emprestadas, error } = await _supabase
        .from('solicitacao')
        .select('*, chave(nome), perfil!solicitacao_aluno_id_fkey(nome)')
        .in('status', ['Aprovada', 'aprovada'])
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar chaves emprestadas:', error);
        return;
    }

    tbody.innerHTML = '';

    if (!emprestadas || emprestadas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Nenhuma chave emprestada atualmente.</td></tr>';
        return;
    }

    emprestadas.forEach(item => {
        const labNome = item.chave ? item.chave.nome : 'N/A';
        const alunoNome = item.perfil ? item.perfil.nome : 'Aluno';
        const dataRetirada = item.retirada_em ? new Date(item.retirada_em).toLocaleString('pt-BR') : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${labNome}</td>
            <td>${alunoNome}</td>
            <td>${dataRetirada}</td>
            <td>
                <button type="button" class="btn-acao-aprovar" onclick="devolverChave(${item.id})">Registrar Devolução</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Action: Registrar Devolução de Chave
async function devolverChave(idSolicitacao) {
    const { error } = await _supabase
        .from('solicitacao')
        .update({ status: 'Devolvida' })
        .eq('id', idSolicitacao);

    if (error) {
        alert('Erro ao registrar devolução: ' + error.message);
    } else {
        await recarregarTudo();
    }
}

// 3. Histórico Geral da Administração
async function carregarHistoricoGeral() {
    const tbody = document.getElementById('tabela-historico-admin');
    if (!tbody) return;

    const { data: historico, error } = await _supabase
        .from('solicitacao')
        .select('*, chave(nome), perfil!solicitacao_aluno_id_fkey(nome)')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar histórico geral:', error);
        return;
    }

    tbody.innerHTML = '';

    if (!historico || historico.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum registro encontrado.</td></tr>';
        return;
    }

    historico.forEach(item => {
        const labNome = item.chave ? item.chave.nome : 'N/A';
        const alunoNome = item.perfil ? item.perfil.nome : 'Aluno';
        const retirada = item.retirada_em ? new Date(item.retirada_em).toLocaleString('pt-BR') : '-';
        const devolucao = item.devolvida_em ? new Date(item.devolvida_em).toLocaleString('pt-BR') : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${labNome}</td>
            <td>${retirada}</td>
            <td>${devolucao}</td>
            <td>${alunoNome}</td>
            <td><span class="badge-status">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. Gerenciamento e Busca de usuarios_permitidos
async function carregarAlunosCadastrados(termoBusca = '') {
    const tbody = document.getElementById('tabela-alunos-cadastrados');
    const msgBusca = document.getElementById('resultado-busca-alunos');
    if (!tbody) return;

    let query = _supabase.from('usuarios_permitidos').select('*');

    if (termoBusca.trim() !== '') {
        query = query.or(`nome.ilike.%${termoBusca}%,email.ilike.%${termoBusca}%`);
    }

    const { data: usuarios, error } = await query.order('nome');

    if (error) {
        console.error('Erro ao buscar usuários permitidos:', error);
        return;
    }

    tbody.innerHTML = '';

    if (msgBusca) {
        msgBusca.textContent = termoBusca ? `Resultados encontrados: ${usuarios.length}` : '';
    }

    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Nenhum usuário cadastrado.</td></tr>';
        return;
    }

    usuarios.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.nome || user.Nome || 'N/A'}</td>
            <td>${user.email}</td>
            <td>
                <button type="button" class="btn-acao-recusar" onclick="removerUsuarioPermitido('${user.email}')">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Action: Remover usuário de usuarios_permitidos
async function removerUsuarioPermitido(email) {
    if (confirm(`Deseja remover a permissão do e-mail ${email}?`)) {
        const { error } = await _supabase
            .from('usuarios_permitidos')
            .delete()
            .eq('email', email);

        if (error) {
            alert('Erro ao remover usuário: ' + error.message);
        } else {
            await carregarAlunosCadastrados();
        }
    }
}

// Configuração do formulário de busca
function configurarBuscaAlunos() {
    const formBusca = document.getElementById('form-busca-alunos');
    if (formBusca) {
        formBusca.addEventListener('submit', (e) => {
            e.preventDefault();
            const termo = document.getElementById('busca-aluno').value;
            carregarAlunosCadastrados(termo);
        });
    }
}

// Modal de Cadastro de Usuário Permitido
function configurarModalCadastro() {
    const dialog = document.getElementById('dialog-cadastro');
    const btnAbrir = document.getElementById('abrir-dialog-cadastro');
    const btnCancelar = document.getElementById('cancelar-dialog-cadastro');
    const form = document.getElementById('form-cadastro-aluno');
    const msg = document.getElementById('mensagem-cadastro');

    if (btnAbrir && dialog) {
        btnAbrir.addEventListener('click', () => dialog.showModal());
    }

    if (btnCancelar && dialog) {
        btnCancelar.addEventListener('click', () => {
            dialog.close();
            form.reset();
            if (msg) msg.textContent = '';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome-aluno').value;
            const email = document.getElementById('email-aluno').value;

            if (msg) {
                msg.textContent = 'Cadastrando...';
                msg.style.color = '#1769d2';
            }

            const { error } = await _supabase
                .from('usuarios_permitidos')
                .insert([{ nome: nome, email: email, papel: 'aluno' }]);

            if (error) {
                if (msg) {
                    msg.textContent = 'Erro ao cadastrar: ' + error.message;
                    msg.style.color = '#dc3545';
                }
            } else {
                if (msg) {
                    msg.textContent = 'Usuário cadastrado com sucesso!';
                    msg.style.color = '#28a745';
                }
                form.reset();
                await carregarAlunosCadastrados();
                setTimeout(() => {
                    dialog.close();
                    if (msg) msg.textContent = '';
                }, 1200);
            }
        });
    }
}

// Atualização de todas as tabelas
async function recarregarTudo() {
    await carregarSolicitacoesPendentes();
    await carregarChavesEmprestadas();
    await carregarHistoricoGeral();
}