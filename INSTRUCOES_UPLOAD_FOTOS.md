# 📸 Instruções de Configuração do Upload de Fotos

## 🛠 Configuração Inicial (Execute UMA vez)

### Passo 1: Executar o SQL de Configuração
1. Abra o **SQL Editor** do Supabase
2. Copie e cole o conteúdo do arquivo `storage_setup_complete.sql`
3. Execute o script completo
4. Verifique se não há erros

### Passo 2: Verificar a Configuração
O script irá mostrar no final:
- ✅ `Bucket photos criado: SIM`
- ✅ `Políticas de storage criadas: [número]`
- ✅ `Tabela inspection_damages criada: SIM`

## 📋 Como Usar o Upload de Fotos

### Na Interface de Inspeção:
1. **Abrir o Modal de Danos**
   - Clique em "Registrar Danos" na página de inspeções
   - Verifique se aparece "✅ Pronto" no status do storage

2. **Adicionar Fotos aos Danos**
   - Preencha a localização e descrição do dano
   - Clique no botão "Foto" na coluna "Foto do Dano"
   - Selecione uma imagem (JPEG, PNG, WebP, GIF)
   - Aguarde o upload (aparecerá "Enviando...")
   - A miniatura da foto aparecerá quando concluído

3. **Gerenciar Fotos**
   - **Visualizar**: Clique na miniatura para ver a foto
   - **Remover**: Clique no "X" vermelho na miniatura
   - **Substituir**: Clique em "Foto" novamente para nova imagem

## 🔧 Resolução de Problemas

### ❌ Status "Erro" no Storage
**Causa**: O SQL de configuração não foi executado
**Solução**: Execute o arquivo `storage_setup_complete.sql`

### 🔄 Status "Testando..." Permanente
**Causa**: Problemas de conexão com o Supabase
**Solução**: 
- Verifique a conexão com internet
- Confirme as credenciais do Supabase no arquivo `.env`

### 📤 Upload Falha
**Possíveis causas**:
- Arquivo muito grande (máximo 10MB)
- Formato não suportado
- Problemas de permissão

**Verificar no console do browser**:
1. Abra F12 (Developer Tools)
2. Vá na aba "Console"
3. Procure por mensagens de erro em vermelho

## 📊 Limites e Especificações

### Arquivos Aceitos:
- **Formatos**: JPEG, JPG, PNG, WebP, GIF
- **Tamanho máximo**: 10MB por foto
- **Resolução**: Qualquer (recomendado: máximo 1920x1080)

### Armazenamento:
- **Bucket**: `photos`
- **Pasta**: `inspection-photos/`
- **Nomenclatura**: `damage-{id}-{timestamp}.{ext}`
- **Acesso**: Público para leitura, restrito para escrita

## 🧹 Manutenção

### Limpar Fotos Órfãs
Para remover fotos que não estão mais referenciadas:
```sql
SELECT cleanup_orphaned_photos();
```

### Verificar Espaço Usado
```sql
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects 
WHERE bucket_id = 'photos'
GROUP BY bucket_id;
```

## 📝 Notas Importantes

1. **Backup**: As fotos são armazenadas no Supabase Storage
2. **Segurança**: Apenas usuários autenticados podem fazer upload
3. **Performance**: Fotos grandes podem demorar para carregar
4. **Custos**: Cada foto conta para o limite de storage do Supabase
5. **URLs**: As URLs das fotos são públicas mas não facilmente descobríveis

## 🆘 Suporte

Se ainda tiver problemas:
1. Verifique o console do browser (F12)
2. Confirme que o SQL foi executado sem erros
3. Teste com uma imagem pequena primeiro
4. Verifique a conexão com o Supabase 