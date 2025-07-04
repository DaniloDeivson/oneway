# ONEWAY RENT A CAR

Sistema de gestão para locadora de veículos, desenvolvido para facilitar o controle de contratos, frota, manutenção, finanças, fornecedores, multas, inspeções e muito mais.

## 🚗 Visão Geral

O ONEWAY RENT A CAR é uma solução completa para empresas de aluguel de veículos, oferecendo:
- Cadastro e gerenciamento de clientes, funcionários e fornecedores
- Controle de contratos e múltiplos veículos por contrato
- Gestão de custos, cobranças, multas e inspeções
- Controle de estoque, ordens de compra e manutenção
- Painel financeiro e relatórios estatísticos
- Controle de acesso por perfil de usuário

## 📦 Tecnologias Utilizadas
- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Functions)
- **Infraestrutura:** Docker, Nginx, Vite

## ⚡ Instalação e Execução Local

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repo>
   cd ONEWAY-RENT-A-CAR
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure as variáveis de ambiente:**
   - Crie um arquivo `.env` na raiz com as chaves do Supabase:
     ```env
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     ```
4. **Inicie o projeto:**
   ```bash
   npm run dev
   ```
   O sistema estará disponível em `http://localhost:5173`.

## 🐳 Execução com Docker

- Para rodar em ambiente de produção:
  ```bash
  docker-compose -f docker-compose.production.yml up --build
  ```
- Para rodar localmente (ajuste as variáveis de ambiente conforme necessário).

## 🗂️ Estrutura do Projeto

```
ONEWAY RENT A CAR/
├── src/
│   ├── components/         # Componentes React organizados por domínio
│   ├── pages/              # Páginas principais do sistema
│   ├── hooks/              # Hooks customizados
│   ├── lib/                # Integração com Supabase e libs auxiliares
│   ├── config/             # Configurações globais
│   ├── types/              # Tipos TypeScript
│   └── ...
├── public/                 # Arquivos estáticos
├── supabase/               # Funções, migrações e configurações do Supabase
├── scripts/                # Scripts de deploy e setup
├── Dockerfile*             # Dockerfiles para build
├── nginx*.conf             # Configurações do Nginx
└── ...
```

## 🔐 Autenticação e Perfis
- O sistema utiliza autenticação via Supabase.
- Perfis de acesso: usuário, gerente, administrador.
- Algumas rotas e funcionalidades são restritas por perfil.

## 🛠️ Funcionalidades Principais
- **Dashboard:** Visão geral da operação
- **Frota:** Cadastro e controle de veículos
- **Contratos:** Gestão de contratos e veículos vinculados
- **Custos & Cobranças:** Controle financeiro detalhado
- **Manutenção:** Check-in/out, ordens de serviço, peças
- **Inspeções:** Registro de vistorias e danos
- **Multas:** Controle e associação a contratos/veículos
- **Fornecedores & Compras:** Gestão de fornecedores e ordens
- **Funcionários:** Cadastro, permissões e controle de acesso
- **Relatórios:** Estatísticas e gráficos

## 🚀 Dicas para Produção
- Utilize o `Dockerfile.production` e `nginx.production.conf` para deploy seguro.
- Configure variáveis de ambiente sensíveis apenas no servidor.
- Utilize HTTPS em produção.
- Faça backup regular do banco de dados Supabase.

## 🤝 Suporte e Contribuição
- Dúvidas ou sugestões? Abra uma issue ou entre em contato com o responsável pelo projeto.
- Pull requests são bem-vindos!

---

ONEWAY RENT A CAR © Todos os direitos reservados. 