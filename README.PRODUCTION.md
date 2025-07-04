# 🚀 OneWay Rent A Car - Deploy de Produção

## 🎯 Estrutura Completa para Produção com Traefik

Este projeto agora inclui uma **estrutura completa de produção** que funciona automaticamente em **todos os dispositivos da rede** usando Docker + Traefik + DNS local.

## 📋 O que foi Criado

### 📁 **Arquivos de Produção:**
- `docker-compose.production.yml` - Orquestração completa com Traefik
- `Dockerfile.production` - Container otimizado para produção
- `nginx.production.conf` - Nginx otimizado com rate limiting e cache
- `.env.production` - Variáveis de ambiente de produção
- `dnsmasq.conf` - Configuração DNS para rede local

### 🛠️ **Scripts de Deploy:**
- `scripts/deploy-production.sh` - Deploy automatizado (Linux/macOS)
- `scripts/deploy-production.ps1` - Deploy automatizado (Windows)
- `scripts/setup-network.sh` - Configuração de rede local

## 🚀 Como Fazer Deploy

### **Opção 1: Deploy Automático (RECOMENDADO)**

#### Windows (PowerShell):
```powershell
# Execute no PowerShell como Administrador
.\scripts\deploy-production.ps1
```

#### Linux/macOS (Bash):
```bash
# Dar permissão de execução
chmod +x scripts/*.sh

# Executar deploy
./scripts/deploy-production.sh
```

### **Opção 2: Deploy Manual**

```bash
# 1. Criar rede do Traefik
docker network create traefik

# 2. Build da aplicação
npm run build

# 3. Deploy com Docker Compose
docker-compose -f docker-compose.production.yml up -d --build
```

## 📱 Como Acessar de Qualquer Dispositivo

### **1. Acesso Local:**
- **Desktop:** `http://localhost`
- **Traefik Dashboard:** `http://localhost:8080`

### **2. Acesso pela Rede Local:**
```
# Descobrir o IP da máquina
Windows: ipconfig
Linux/Mac: hostname -I

# Acessar pelo IP
http://192.168.1.100  (substitua pelo seu IP)
```

### **3. Acesso por Domínio Local:**
```
# Configure o arquivo hosts ou DNS
http://oneway.local
http://app.oneway.local
```

### **4. Acesso Móvel Automático:**
- **URL Traefik:** `oneway-onewayrentacar-*.traefik.me`
- **IP Direto:** `http://SEU_IP_LOCAL`
- **DNS Local:** `http://oneway.local` (se configurado)

## 🌐 Configuração de Rede para Móveis

### **Método 1: IP Direto (Mais Simples)**
1. Descubra o IP da máquina: `ipconfig` (Windows) ou `hostname -I` (Linux)
2. No celular, acesse: `http://SEU_IP:80`

### **Método 2: DNS Local (Mais Elegante)**
1. Execute: `./scripts/setup-network.sh`
2. Configure DNS do móvel para o IP da máquina
3. Acesse: `http://oneway.local`

### **Método 3: Traefik Tunneling**
- A configuração já inclui suporte para Traefik.me
- URLs automáticas do tipo: `oneway-xyz.traefik.me`

## 🔧 Características da Produção

### **🛡️ Segurança:**
- Usuário não-root no container
- Rate limiting para API e login
- Headers de segurança completos
- Bloqueio de arquivos sensíveis

### **⚡ Performance:**
- Nginx otimizado com cache
- Compressão Gzip automática
- Code splitting inteligente
- Health checks automáticos

### **🌍 Rede:**
- Traefik reverse proxy
- SSL/TLS automático
- CORS configurado para mobile
- DNS local para rede

### **📊 Monitoramento:**
- Health checks em `/health`
- Logs estruturados
- Traefik dashboard
- Métricas de performance

## 🔍 Troubleshooting

### **Problema: 502 Bad Gateway**
```bash
# Verificar status dos containers
docker-compose -f docker-compose.production.yml ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f

# Restart se necessário
docker-compose -f docker-compose.production.yml restart
```

### **Problema: Não Acessa no Mobile**
```bash
# 1. Verificar IP da máquina
hostname -I  # Linux/Mac
ipconfig     # Windows

# 2. Testar conectividade
ping SEU_IP

# 3. Verificar porta no firewall
# Windows: Permitir porta 80 no Windows Firewall
# Linux: sudo ufw allow 80
```

### **Problema: DNS Não Resolve**
```bash
# Configurar manualmente no mobile:
# Android: Wi-Fi > Modificar rede > DNS
# iOS: Wi-Fi > (i) > DNS
# Usar o IP da máquina como DNS
```

## 📋 Comandos Úteis

### **Gerenciamento:**
```bash
# Ver status
docker-compose -f docker-compose.production.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.production.yml logs -f oneway-app

# Restart da aplicação
docker-compose -f docker-compose.production.yml restart oneway-app

# Parar tudo
docker-compose -f docker-compose.production.yml down

# Update da aplicação
npm run build
docker-compose -f docker-compose.production.yml up -d --build oneway-app
```

### **Debug:**
```bash
# Entrar no container
docker exec -it oneway-rent-car sh

# Verificar arquivos
docker exec oneway-rent-car ls -la /usr/share/nginx/html

# Testar nginx
docker exec oneway-rent-car nginx -t

# Health check manual
curl http://localhost/health
```

## 🎉 Resultado Final

Após o deploy, você terá:

✅ **Aplicação rodando em produção**  
✅ **Acesso automático de qualquer dispositivo na rede**  
✅ **SSL/TLS automático via Traefik**  
✅ **DNS local configurado**  
✅ **Performance otimizada**  
✅ **Monitoramento e health checks**  
✅ **Logs estruturados**  

**A aplicação será acessível de qualquer celular, tablet ou computador na mesma rede Wi-Fi automaticamente!** 📱💻🎯 