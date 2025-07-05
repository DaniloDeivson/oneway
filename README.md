# OneWay Rent A Car

Sistema completo de gestão para locadoras de veículos.

## Funcionalidades

- ✅ Gestão de contratos e clientes
- ✅ Controle de frota e veículos
- ✅ Inspeções e manutenção
- ✅ Gestão financeira e custos
- ✅ Sistema de multas
- ✅ Inventário e estoque
- ✅ Ordens de compra
- ✅ Dashboard administrativo
- ✅ Autenticação e permissões

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + APIs)
- **UI**: Tailwind CSS + Headless UI
- **Autenticação**: Supabase Auth
- **Deploy**: Docker + Nginx

## Instalação

### Desenvolvimento

```bash
# Clone o repositório
git clone <repository-url>
cd oneway-rent-a-car

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase

# Execute em modo de desenvolvimento
npm run dev
```

### Produção

#### Docker

```bash
# Build da imagem
docker build -t oneway-rent-car .

# Execute o container
docker run -p 80:80 oneway-rent-car
```

#### Deploy Manual

```bash
# Build de produção
npm run build

# Os arquivos ficam na pasta dist/
# Configure seu servidor web para servir os arquivos estáticos
```

## Configuração

### Variáveis de Ambiente

Copie `.env.production.example` para `.env.production` e configure:

- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

### Base de Dados

Execute as migrações do Supabase na pasta `supabase/migrations/` em ordem cronológica.

## Scripts Disponíveis

- `npm run dev` - Executa em modo de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## Estrutura do Projeto

```
src/
├── components/     # Componentes React
├── hooks/         # Custom hooks
├── pages/         # Páginas da aplicação
├── types/         # Definições de tipos TypeScript
├── lib/           # Configurações e utilitários
└── config/        # Configurações da aplicação
```

## Licença

Proprietary - Todos os direitos reservados - Desenvolvido por Danilo Deivson Alcantara dos Santos

# Deploy em Produção

## 1. Build e Deploy
- O Dockerfile e nginx.conf já estão prontos para build e deploy em qualquer serviço que aceite Docker (Railway, Render, etc).
- O build final é servido via Nginx, com fallback para SPA (React/Vite).

## 2. Configuração de Rede
- **DNS**: Aponte seu domínio para o IP ou CNAME fornecido pelo serviço de deploy.
- **HTTPS**: Ative SSL no painel do serviço (a maioria já oferece SSL grátis via Let's Encrypt).
- **CORS**: Se consumir APIs externas, garanta que as URLs estejam corretas nas variáveis de ambiente.

## 3. Variáveis de Ambiente
- Configure as URLs de API e outros endpoints no painel do serviço de deploy.
- Exemplos:
  - `VITE_API_URL=https://sua-api.com`
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`

## 4. Teste em Dispositivos
- Após deploy, acesse pelo domínio em diferentes dispositivos e redes para garantir funcionamento.
- Se necessário, limpe cache do navegador e use aba anônima.

## 5. Dúvidas Frequentes
- **Erro 404 em rotas**: O nginx.conf e _redirects já garantem fallback para SPA.
- **Problemas de CORS**: Verifique as variáveis de ambiente e configurações da API.

---

Qualquer dúvida, consulte o painel do seu serviço de deploy ou abra um issue!

## Antes de rodar
Se ainda não existir, crie a network do Traefik:

```sh
docker network create traefik
```

Depois rode normalmente:
```sh
docker-compose up -d
```
