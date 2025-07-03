# 🚀 GUIA DE DEPLOY - NETLIFY

## ✅ ARQUIVOS CRIADOS PARA DEPLOY

Os seguintes arquivos foram criados/atualizados para garantir o deploy correto:

### 1. **netlify.toml** - Configuração principal do Netlify
- Define comando de build e diretório de publicação
- Configura redirects para SPA
- Otimizações de build

### 2. **public/_redirects** - Redirects para React Router
- Garante que todas as rotas funcionem corretamente
- Necessário para Single Page Applications

### 3. **vite.config.ts** - Otimizado para produção
- Code splitting para melhor performance
- Chunks manuais para otimização
- Configurações de build otimizadas

### 4. **env.example** - Exemplo de variáveis de ambiente
- Template para configurar as variáveis necessárias

## 🔧 PASSOS PARA DEPLOY

### **Passo 1: Preparar Repositório Git**

```bash
# Adicionar todos os arquivos
git add .

# Commit das mudanças
git commit -m "feat: configuração para deploy no Netlify"

# Push para o repositório
git push origin main
```

### **Passo 2: Configurar no Netlify**

1. **Acesse**: https://app.netlify.com
2. **Clique em**: "New site from Git"
3. **Conecte**: Seu repositório GitHub/GitLab/Bitbucket
4. **Configure**:
   - **Branch**: `main` (ou sua branch principal)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### **Passo 3: Configurar Variáveis de Ambiente**

No painel do Netlify:

1. **Vá para**: Site settings → Environment variables
2. **Adicione** as seguintes variáveis:

```
VITE_SUPABASE_URL = sua_url_do_supabase
VITE_SUPABASE_ANON_KEY = sua_chave_anonima_do_supabase
```

### **Passo 4: Deploy Manual (Alternativo)**

Se preferir deploy manual:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login no Netlify
netlify login

# Build do projeto
npm run build

# Deploy inicial
netlify deploy --dir=dist

# Deploy para produção
netlify deploy --prod --dir=dist
```

## 🔍 VERIFICAÇÕES PRÉ-DEPLOY

### **1. Build Local**
```bash
npm run build
```
✅ Deve completar sem erros

### **2. Preview Local**
```bash
npm run preview
```
✅ Aplicação deve funcionar corretamente

### **3. Variáveis de Ambiente**
- ✅ VITE_SUPABASE_URL configurada
- ✅ VITE_SUPABASE_ANON_KEY configurada

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **Problema 1: Página em branco após deploy**
**Causa**: Variáveis de ambiente não configuradas
**Solução**: 
- Verificar se as variáveis estão no painel do Netlify
- Fazer novo deploy após configurar

### **Problema 2: Erro 404 em rotas**
**Causa**: Redirects não configurados
**Solução**: 
- Verificar se `public/_redirects` existe
- Verificar se `netlify.toml` está correto

### **Problema 3: Build falha**
**Causa**: Dependências ou configuração
**Solução**:
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Problema 4: Chunks muito grandes**
**Causa**: Bundle muito grande
**Solução**: 
- Já otimizado no `vite.config.ts`
- Code splitting automático implementado

## 🎯 CONFIGURAÇÕES ESPECÍFICAS DO PROJETO

### **Build Settings no Netlify:**
```
Build command: npm run build
Publish directory: dist
Node version: 18
```

### **Environment Variables necessárias:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### **Headers de Segurança (Opcional):**
Adicionar ao `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 📊 MONITORAMENTO PÓS-DEPLOY

### **1. Verificar Logs**
- Acessar: Site → Functions → View logs
- Verificar se não há erros

### **2. Testar Funcionalidades**
- ✅ Login/Logout
- ✅ Navegação entre páginas
- ✅ Conexão com Supabase
- ✅ Responsividade

### **3. Performance**
- Usar Google PageSpeed Insights
- Verificar Core Web Vitals

## 🔄 DEPLOY AUTOMÁTICO

### **Configurar Deploy Automático:**
1. **No Netlify**: Site settings → Build & deploy
2. **Branch deploys**: Configurar branch principal
3. **Deploy contexts**: Production branch = main

### **Deploy Previews:**
- Pull Requests automaticamente geram previews
- Útil para testar mudanças antes do merge

## 🏆 CHECKLIST FINAL

Antes de considerar o deploy completo:

- [ ] Build local funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Redirects configurados
- [ ] Deploy realizado com sucesso
- [ ] Login funcionando
- [ ] Todas as páginas carregando
- [ ] Conexão com Supabase OK
- [ ] Responsividade OK
- [ ] Performance satisfatória

## 🆘 SUPORTE

### **Se ainda houver problemas:**

1. **Verificar logs do Netlify**:
   - Site → Deploys → [Deploy específico] → Deploy log

2. **Verificar console do navegador**:
   - F12 → Console → Procurar erros

3. **Testar localmente**:
   ```bash
   npm run build
   npm run preview
   ```

4. **Contato**: Netlify Support ou documentação oficial

---

## 🎉 **DEPLOY PRONTO!**

Seguindo este guia, sua aplicação OneWay Rent A Car deve estar funcionando perfeitamente no Netlify!

**URL de exemplo**: `https://seu-site.netlify.app`

---

**Criado por**: Assistente IA Claude Sonnet 3.5  
**Data**: 30 de Junho de 2025  
**Versão**: 1.0.0 