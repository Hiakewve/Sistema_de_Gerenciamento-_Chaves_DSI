# Sistema de Gerenciamento de Chaves - DSI

Sistema web desenvolvido para gerenciar o fluxo de empréstimo e devolução de chaves dos laboratórios do Departamento de Sistemas de Informação.

## 👥 Integrantes da Dupla
* **Hiakewve** - https://github.com/Hiakewve
* **Daiane Santos** - https://github.com/daianesnts

## 🚀 Tecnologias Utilizadas
* **Front-end:** HTML5, CSS3, JavaScript (ES6+)
* **Back-end & Banco de Dados:** [Supabase](https://supabase.com/) (Auth Google, RLS, Triggers e Functions)

## 📋 Regras de Negócio e Funcionalidades
- **Autenticação:** Login via Google restrito a usuários previamente cadastrados no sistema.
- **Solicitações:**
  - Alunos só podem realizar a solicitação de **uma única chave por vez**.
  - Laboratórios em uso não permitem novas solicitações.
  - Ao aprovar uma solicitação, as demais solicitações pendentes para aquela mesma chave são automaticamente removidas.
- **Histórico:** Exibição exclusiva de solicitações com status `Aprovada` ou `Devolvida`.

## 📁 Estrutura do Projeto
```text
/
├── css/
│   └── style.css
├── js/
│   ├── supabase.js
│   ├── auth.js
│   └── app.js
├── Protótipos Alta Fidelidade/
│   └── *.png
├── .gitignore
├── index.html
├── dashboard.html
└── README.md
