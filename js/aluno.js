// js/aluno.js

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

    // Carrega os dados da tela
    await carregarStatusAluno();
    await carregarLaboratorios();
    await carregarHistoricoAluno();

    // Evento do formulário de solicitação
    const formSolicitar = document.getElementById('form-solicitar-chave');
    if (formSolicitar) {
        formSolicitar.addEventListener('submit', solicitarChave);
    }
});

// 1. Carrega o status da solicitação atual do aluno logado
async function carregarStatusAluno() {
    const cardStatus = document.getElementById('card-status-aluno');
    if (!cardStatus) return;

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    // Busca solicitações do aluno com status Pendente ou Aprovada (tabela e colunas em minúsculas)
    const { data: solicitacoes, error } = await _supabase
        .from('solicitacao')
        .select('*, chave(nome)')
        .eq('aluno_id', session.user.id)
        .in('status', ['Pendente', 'pendente', 'Aprovada', 'aprovada'])
        .maybeSingle();

    if (error) {
        console.error('Erro ao buscar status:', error);
        return;
    }

    if (solicitacoes) {
        const statusFormatado = solicitacoes.status.toLowerCase();
        let badgeClass = 'badge-pendente';
        const labNome = solicitacoes.chave ? solicitacoes.chave.nome : 'N/A';
        let mensagem = `Você possui uma solicitação <strong>${solicitacoes.status}</strong> para a chave do <strong>${labNome}</strong>.`;

        if (statusFormatado === 'aprovada') {
            badgeClass = 'badge-emprestado';
            mensagem = `Você está em posse da chave do <strong>${labNome}</strong>.`;
        }

        cardStatus.innerHTML = `
            <p>${mensagem}</p>
            <span class="badge-status ${badgeClass}">${solicitacoes.status}</span>
        `;

        // Desabilita o envio de nova solicitação (Regra: apenas 1 por vez)
        travarFormularioSolicitacao(true);
    } else {
        cardStatus.innerHTML = '<p>Você não possui nenhuma chave ou solicitação ativa no momento.</p>';
        travarFormularioSolicitacao(false);
    }
}

// 2. Preenche a tabela de laboratórios e o <select> de solicitação
async function carregarLaboratorios() {
    const tbodyStatus = document.getElementById('tabela-status-laboratorios');
    const selectLab = document.getElementById('laboratorio');

    if (!tbodyStatus || !selectLab) return;

    const { data: chaves, error } = await _supabase
        .from('chave')
        .select('*')
        .order('nome');

    if (error) {
        console.error('Erro ao buscar chaves:', error);
        return;
    }

    // Limpa os elementos
    tbodyStatus.innerHTML = '';
    selectLab.innerHTML = '<option value="">Selecione um laboratório...</option>';

    if (!chaves || chaves.length === 0) {
        tbodyStatus.innerHTML = '<tr><td colspan="2">Nenhum laboratório encontrado.</td></tr>';
        return;
    }

    chaves.forEach(item => {
        const disponivel = item.disponibilidade ? item.disponibilidade.toLowerCase() === 'disponivel' : false;
        const badgeClass = disponivel ? 'badge-disponivel' : 'badge-emprestado';

        // Linha da tabela
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td><span class="badge-status ${badgeClass}">${item.disponibilidade}</span></td>
        `;
        tbodyStatus.appendChild(tr);

        // Opção do Select (apenas chaves disponíveis)
        if (disponivel) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nome;
            selectLab.appendChild(option);
        }
    });
}

// 3. Registra a nova solicitação
async function solicitarChave(event) {
    event.preventDefault();
    const msgFeedback = document.getElementById('mensagem-solicitacao');
    const chaveId = document.getElementById('laboratorio').value;

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session || !chaveId) return;

    if (msgFeedback) {
        msgFeedback.textContent = 'Enviando solicitação...';
        msgFeedback.style.color = '#1769d2';
    }

    const { error } = await _supabase
        .from('solicitacao')
        .insert([
            {
                chave_id: parseInt(chaveId),
                aluno_id: session.user.id,
                status: 'Pendente'
            }
        ]);

    if (error) {
        if (msgFeedback) {
            msgFeedback.textContent = 'Erro ao solicitar chave: ' + error.message;
            msgFeedback.style.color = '#dc3545';
        }
    } else {
        if (msgFeedback) {
            msgFeedback.textContent = 'Solicitação enviada com sucesso!';
            msgFeedback.style.color = '#28a745';
        }
        
        // Atualiza os componentes da tela
        await carregarStatusAluno();
        await carregarLaboratorios();
    }
}

// 4. Carrega o histórico do aluno (somente Aprovadas e Devolvidas por causa do RLS)
async function carregarHistoricoAluno() {
    const tbodyHistorico = document.getElementById('tabela-historico-aluno');
    if (!tbodyHistorico) return;

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    const { data: historico, error } = await _supabase
        .from('solicitacao')
        .select('*, chave(nome)')
        .eq('aluno_id', session.user.id)
        .in('status', ['Aprovada', 'aprovada', 'Devolvida', 'devolvida'])
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
    }

    tbodyHistorico.innerHTML = '';

    if (!historico || historico.length === 0) {
        tbodyHistorico.innerHTML = '<tr><td colspan="3">Nenhum histórico encontrado.</td></tr>';
        return;
    }

    historico.forEach(item => {
        const dataFormatada = new Date(item.retirada_em || item.devolvida_em || Date.now()).toLocaleString('pt-BR');
        const badgeClass = item.status.toLowerCase() === 'devolvida' ? 'badge-devolvida' : 'badge-disponivel';
        const labNome = item.chave ? item.chave.nome : 'N/A';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${labNome}</td>
            <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
        `;
        tbodyHistorico.appendChild(tr);
    });
}

function travarFormularioSolicitacao(bloquear) {
    const select = document.getElementById('laboratorio');
    const btnSubmit = document.getElementById('btn-enviar-solicitacao');
    if (select && btnSubmit) {
        select.disabled = bloquear;
        btnSubmit.disabled = bloquear;
    }
}