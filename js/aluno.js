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

    // Busca solicitação sem join direto para evitar o erro 404 de FK
    const { data: solicitacao, error } = await _supabase
        .from('solicitacao')
        .select('*')
        .eq('aluno_id', session.user.id)
        .in('status', ['Pendente', 'pendente', 'Aprovada', 'aprovada'])
        .maybeSingle();

    if (error) {
        console.error('Erro ao buscar status:', error);
        return;
    }

    if (solicitacao) {
        // Busca o nome do laboratório separadamente
        let labNome = 'N/A';
        if (solicitacao.chave_id) {
            const { data: chaveData } = await _supabase
                .from('chave')
                .select('nome')
                .eq('id', solicitacao.chave_id)
                .single();
            if (chaveData) labNome = chaveData.nome;
        }

        const statusFormatado = solicitacao.status.toLowerCase();
        let badgeClass = 'badge-pendente';
        let mensagem = `Você possui uma solicitação <strong>${solicitacao.status}</strong> para a chave do <strong>${labNome}</strong>.`;

        if (statusFormatado === 'aprovada') {
            badgeClass = 'badge-emprestado';
            mensagem = `Você está em posse da chave do <strong>${labNome}</strong>.`;
        }

        cardStatus.innerHTML = `
            <p>${mensagem}</p>
            <span class="badge-status ${badgeClass}">${solicitacao.status}</span>
        `;

        // Trava o formulário (apenas 1 solicitação por vez)
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

    tbodyStatus.innerHTML = '';
    selectLab.innerHTML = '<option value="">Selecione um laboratório...</option>';

    if (!chaves || chaves.length === 0) {
        tbodyStatus.innerHTML = '<tr><td colspan="2">Nenhum laboratório encontrado.</td></tr>';
        return;
    }

    chaves.forEach(item => {
        const disponivel = item.disponibilidade ? item.disponibilidade.toLowerCase() === 'disponivel' : false;
        const badgeClass = disponivel ? 'badge-disponivel' : 'badge-emprestado';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td><span class="badge-status ${badgeClass}">${item.disponibilidade}</span></td>
        `;
        tbodyStatus.appendChild(tr);

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
        
        await carregarStatusAluno();
        await carregarLaboratorios();
    }
}

// 4. Carrega o histórico do aluno
async function carregarHistoricoAluno() {
    const tbodyHistorico = document.getElementById('tabela-historico-aluno');
    if (!tbodyHistorico) return;

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    // Busca também as chaves para relacionar manualmente no JS
    const [{ data: historico, error }, { data: chaves }] = await Promise.all([
        _supabase
            .from('solicitacao')
            .select('*')
            .eq('aluno_id', session.user.id)
            .in('status', ['Aprovada', 'aprovada', 'Devolvida', 'devolvida'])
            .order('id', { ascending: false }),
        _supabase.from('chave').select('id, nome')
    ]);

    if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
    }

    tbodyHistorico.innerHTML = '';

    if (!historico || historico.length === 0) {
        tbodyHistorico.innerHTML = '<tr><td colspan="3">Nenhum histórico encontrado.</td></tr>';
        return;
    }

    const chavesMap = (chaves || []).reduce((acc, c) => {
        acc[c.id] = c.nome;
        return acc;
    }, {});

    historico.forEach(item => {
        const dataFormatada = new Date(item.retirada_em || item.devolvida_em || Date.now()).toLocaleString('pt-BR');
        const badgeClass = item.status.toLowerCase() === 'devolvida' ? 'badge-devolvida' : 'badge-disponivel';
        const labNome = chavesMap[item.chave_id] || 'N/A';

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