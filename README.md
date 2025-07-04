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
