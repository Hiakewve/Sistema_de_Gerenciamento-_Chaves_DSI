const botaoAbrirCadastro = document.getElementById("abrir-dialog-cadastro");
const botaoCancelarCadastro = document.getElementById("cancelar-dialog-cadastro");
const dialogCadastro = document.getElementById("dialog-cadastro");
const formularioCadastro = document.getElementById("form-cadastro-aluno");
const mensagemCadastro = document.getElementById("mensagem-cadastro");
const formularioBuscaAlunos = document.getElementById("form-busca-alunos");
const campoBuscaAlunos = document.getElementById("busca-aluno");
const resultadoBuscaAlunos = document.getElementById("resultado-busca-alunos");

botaoAbrirCadastro.addEventListener("click", function () {
    mensagemCadastro.textContent = "";
    formularioCadastro.reset();
    dialogCadastro.showModal();
});

botaoCancelarCadastro.addEventListener("click", function () {
    dialogCadastro.close();
});

dialogCadastro.addEventListener("click", function (event) {
    if (event.target === dialogCadastro) {
        dialogCadastro.close();
    }
});

formularioCadastro.addEventListener("submit", function (event) {
    event.preventDefault();
    mensagemCadastro.textContent = "O cadastro será habilitado após a integração com o Supabase.";
});

formularioBuscaAlunos.addEventListener("submit", function (event) {
    event.preventDefault();

    const termoBusca = campoBuscaAlunos.value.trim().toLocaleLowerCase("pt-BR");
    const linhasAlunos = document.querySelectorAll("#alunos tbody tr");
    let quantidadeEncontrada = 0;

    linhasAlunos.forEach(function (linha) {
        const corresponde = linha.textContent.toLocaleLowerCase("pt-BR").includes(termoBusca);
        linha.hidden = !corresponde;
        quantidadeEncontrada += corresponde ? 1 : 0;
    });

    if (linhasAlunos.length === 0) {
        resultadoBuscaAlunos.textContent = "Nenhum aluno cadastrado.";
    } else if (quantidadeEncontrada === 0) {
        resultadoBuscaAlunos.textContent = "Nenhum aluno encontrado.";
    } else if (quantidadeEncontrada === 1) {
        resultadoBuscaAlunos.textContent = "1 aluno encontrado.";
    } else {
        resultadoBuscaAlunos.textContent = `${quantidadeEncontrada} alunos encontrados.`;
    }
});