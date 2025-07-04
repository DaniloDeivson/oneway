-- ==========================================
-- SCRIPT COMPLETO PARA CONFIGURAR STORAGE
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. Criar buckets de storage (caso não existam)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('photos', 'photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to photos for anon" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update of photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete of photos" ON storage.objects;

-- 3. Criar políticas para o bucket 'photos'
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Anonymous users can upload photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos')
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Anonymous users can update photos"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'photos')
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');

CREATE POLICY "Anonymous users can delete photos"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'photos');

-- 4. Verificar se a tabela inspection_damages existe, se não, criar
CREATE TABLE IF NOT EXISTS inspection_damages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    damage_type TEXT NOT NULL DEFAULT 'Arranhão',
    severity TEXT NOT NULL DEFAULT 'Baixa',
    photo_url TEXT,
    requires_repair BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_inspection_damages_inspection_id ON inspection_damages(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_damages_tenant_id ON inspection_damages(tenant_id);

-- 6. Habilitar RLS na tabela inspection_damages
ALTER TABLE inspection_damages ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para inspection_damages
DROP POLICY IF EXISTS "Users can view inspection damages" ON inspection_damages;
DROP POLICY IF EXISTS "Users can insert inspection damages" ON inspection_damages;
DROP POLICY IF EXISTS "Users can update inspection damages" ON inspection_damages;
DROP POLICY IF EXISTS "Users can delete inspection damages" ON inspection_damages;

CREATE POLICY "Users can view inspection damages"
ON inspection_damages FOR SELECT
TO authenticated, anon
USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can insert inspection damages"
ON inspection_damages FOR INSERT
TO authenticated, anon
WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can update inspection damages"
ON inspection_damages FOR UPDATE
TO authenticated, anon
USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can delete inspection damages"
ON inspection_damages FOR DELETE
TO authenticated, anon
USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- 8. Criar função para limpar fotos órfãs
CREATE OR REPLACE FUNCTION cleanup_orphaned_photos()
RETURNS void AS $$
BEGIN
    -- Esta função pode ser usada para limpar fotos que não estão mais referenciadas
    DELETE FROM storage.objects 
    WHERE bucket_id = 'photos' 
    AND name NOT IN (
        SELECT SUBSTRING(photo_url FROM '.*/(.*)$') 
        FROM inspection_damages 
        WHERE photo_url IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Verificar se tudo foi criado corretamente
SELECT 
    'Bucket photos criado: ' || CASE WHEN COUNT(*) > 0 THEN 'SIM' ELSE 'NÃO' END as bucket_status
FROM storage.buckets 
WHERE id = 'photos';

SELECT 
    'Políticas de storage criadas: ' || COUNT(*) as policies_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

SELECT 
    'Tabela inspection_damages criada: ' || CASE WHEN COUNT(*) > 0 THEN 'SIM' ELSE 'NÃO' END as table_status
FROM information_schema.tables 
WHERE table_name = 'inspection_damages';

-- FIM DO SCRIPT
-- ==========================================
-- INSTRUÇÕES:
-- 1. Execute este script completo no SQL Editor do Supabase
-- 2. Verifique se não há erros
-- 3. Teste o upload de fotos na aplicação
-- ========================================== 