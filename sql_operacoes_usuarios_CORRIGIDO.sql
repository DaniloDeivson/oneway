-- =====================================================
-- SQL PARA OPERAÇÕES DE USUÁRIOS - ONEWAY RENT A CAR
-- VERSÃO CORRIGIDA COM EXEMPLOS PRÁTICOS
-- =====================================================

-- ==============================
-- PASSO 0: ENCONTRAR O ID DO USUÁRIO
-- ==============================

-- 🔍 PRIMEIRA ETAPA: Encontre o ID do usuário que você quer excluir/atualizar
SELECT 
    id,
    name,
    role,
    contact_info->>'email' as email,
    active
FROM employees 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY name;

-- 📋 Copie o ID (UUID) do usuário que aparece no resultado acima
-- Exemplo de ID: 550e8400-e29b-41d4-a716-446655440000

-- ==============================
-- 1. EXCLUSÃO COMPLETA DE USUÁRIO
-- ==============================

-- ⚠️ SUBSTITUA 'COLE_O_ID_AQUI' pelo ID real copiado acima
-- Exemplo: WHERE id = '550e8400-e29b-41d4-a716-446655440000'

-- STEP 1: Verificar se não é o último admin
SELECT 
    COUNT(*) as total_admins_ativos,
    CASE 
        WHEN COUNT(*) <= 1 THEN 'ATENÇÃO: Este é o último admin! Crie outro admin antes de excluir.'
        ELSE 'OK: Pode prosseguir com a exclusão.'
    END as status
FROM employees 
WHERE role = 'Admin' 
AND active = true 
AND tenant_id = '00000000-0000-0000-0000-000000000001';

-- STEP 2: Buscar dados do usuário (para confirmar e auditoria)
SELECT 
    id,
    name,
    role,
    contact_info->>'email' as email,
    active,
    created_at
FROM employees 
WHERE id = 'COLE_O_ID_AQUI';

-- ⚠️ SE O RESULTADO ACIMA ESTIVER VAZIO, O ID ESTÁ INCORRETO!

-- STEP 3: Limpar registros relacionados
UPDATE service_notes 
SET employee_id = NULL 
WHERE employee_id = 'COLE_O_ID_AQUI';

UPDATE inspections 
SET employee_id = NULL 
WHERE employee_id = 'COLE_O_ID_AQUI';

UPDATE contracts 
SET salesperson_id = NULL 
WHERE salesperson_id = 'COLE_O_ID_AQUI';

UPDATE fines 
SET employee_id = NULL, driver_id = NULL 
WHERE employee_id = 'COLE_O_ID_AQUI' OR driver_id = 'COLE_O_ID_AQUI';

UPDATE costs 
SET created_by_employee_id = NULL 
WHERE created_by_employee_id = 'COLE_O_ID_AQUI';

-- STEP 4: Registrar usuário removido
INSERT INTO removed_users (id, email, removed_at)
SELECT 
    id, 
    contact_info->>'email',
    NOW()
FROM employees 
WHERE id = 'COLE_O_ID_AQUI'
ON CONFLICT (email) DO NOTHING;

-- STEP 5: Excluir da tabela employees
DELETE FROM employees 
WHERE id = 'COLE_O_ID_AQUI';

-- STEP 6: Verificar exclusão
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM employees WHERE id = 'COLE_O_ID_AQUI') 
        THEN 'ERRO: Usuário ainda existe!'
        ELSE 'SUCESSO: Usuário excluído com êxito!'
    END as resultado;

-- ==============================
-- 2. ATUALIZAÇÃO DE USUÁRIO
-- ==============================

-- 🔄 Template para atualização - SUBSTITUA os valores
UPDATE employees 
SET 
    name = 'NOVO_NOME_AQUI',
    contact_info = jsonb_build_object(
        'email', 'novo.email@exemplo.com',
        'phone', '(11) 99999-9999'
    ),
    role = 'NOVO_ROLE_AQUI',  -- Admin, Manager, Mechanic, PatioInspector, Sales, Driver, FineAdmin
    active = true,            -- true ou false
    updated_at = NOW()
WHERE id = 'COLE_O_ID_AQUI';

-- Verificar se a atualização funcionou
SELECT 
    id,
    name,
    contact_info->>'email' as email,
    contact_info->>'phone' as phone,
    role,
    active,
    updated_at
FROM employees 
WHERE id = 'COLE_O_ID_AQUI';

-- ==============================
-- 3. EXEMPLOS PRÁTICOS COMPLETOS
-- ==============================

-- 📝 EXEMPLO 1: Excluir usuário "João Silva"
/*
-- 1. Encontre o ID:
SELECT id, name FROM employees WHERE name ILIKE '%joão%silva%';
-- Resultado: 550e8400-e29b-41d4-a716-446655440000

-- 2. Execute a exclusão (substitua o ID):
UPDATE service_notes SET employee_id = NULL WHERE employee_id = '550e8400-e29b-41d4-a716-446655440000';
UPDATE inspections SET employee_id = NULL WHERE employee_id = '550e8400-e29b-41d4-a716-446655440000';
UPDATE contracts SET salesperson_id = NULL WHERE salesperson_id = '550e8400-e29b-41d4-a716-446655440000';
UPDATE fines SET employee_id = NULL, driver_id = NULL WHERE employee_id = '550e8400-e29b-41d4-a716-446655440000' OR driver_id = '550e8400-e29b-41d4-a716-446655440000';
UPDATE costs SET created_by_employee_id = NULL WHERE created_by_employee_id = '550e8400-e29b-41d4-a716-446655440000';
INSERT INTO removed_users (id, email, removed_at) SELECT id, contact_info->>'email', NOW() FROM employees WHERE id = '550e8400-e29b-41d4-a716-446655440000' ON CONFLICT (email) DO NOTHING;
DELETE FROM employees WHERE id = '550e8400-e29b-41d4-a716-446655440000';
*/

-- 📝 EXEMPLO 2: Atualizar papel de usuário para Admin
/*
-- 1. Encontre o ID:
SELECT id, name, role FROM employees WHERE contact_info->>'email' = 'usuario@exemplo.com';
-- Resultado: 123e4567-e89b-12d3-a456-426614174000

-- 2. Execute a atualização:
UPDATE employees 
SET 
    role = 'Admin',
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
*/

-- ==============================
-- 4. SCRIPTS DE BUSCA ÚTEIS
-- ==============================

-- Buscar usuário por email
SELECT id, name, role, active 
FROM employees 
WHERE contact_info->>'email' = 'email@procurado.com';

-- Buscar usuário por nome (parcial)
SELECT id, name, role, contact_info->>'email' as email 
FROM employees 
WHERE name ILIKE '%PARTE_DO_NOME%';

-- Listar todos os administradores
SELECT id, name, contact_info->>'email' as email, active 
FROM employees 
WHERE role = 'Admin' 
ORDER BY name;

-- Listar usuários inativos
SELECT id, name, contact_info->>'email' as email, role 
FROM employees 
WHERE active = false 
ORDER BY name;

-- ==============================
-- 5. VERIFICAÇÕES DE SEGURANÇA
-- ==============================

-- Quantos registros serão afetados antes da exclusão?
SELECT 
    'service_notes' as tabela, 
    COUNT(*) as registros_afetados
FROM service_notes 
WHERE employee_id = 'COLE_O_ID_AQUI'

UNION ALL

SELECT 
    'inspections' as tabela, 
    COUNT(*) as registros_afetados
FROM inspections 
WHERE employee_id = 'COLE_O_ID_AQUI'

UNION ALL

SELECT 
    'contracts' as tabela, 
    COUNT(*) as registros_afetados
FROM contracts 
WHERE salesperson_id = 'COLE_O_ID_AQUI'

UNION ALL

SELECT 
    'fines' as tabela, 
    COUNT(*) as registros_afetados
FROM fines 
WHERE employee_id = 'COLE_O_ID_AQUI' OR driver_id = 'COLE_O_ID_AQUI'

UNION ALL

SELECT 
    'costs' as tabela, 
    COUNT(*) as registros_afetados
FROM costs 
WHERE created_by_employee_id = 'COLE_O_ID_AQUI';

-- ==============================
-- INSTRUÇÕES PASSO A PASSO:
-- ==============================

/*
🔧 COMO USAR ESTE SQL:

1. NUNCA execute com 'COLE_O_ID_AQUI' literal!

2. SEMPRE siga esta ordem:
   a) Execute o PASSO 0 para encontrar o ID
   b) COPIE o ID (UUID completo)
   c) SUBSTITUA 'COLE_O_ID_AQUI' pelo ID real
   d) Execute os comandos um por vez

3. EXEMPLO DO ID CORRETO:
   ❌ ERRADO: 'USER_ID' ou 'COLE_O_ID_AQUI'
   ✅ CORRETO: '550e8400-e29b-41d4-a716-446655440000'

4. TESTE PRIMEIRO:
   - Execute apenas o SELECT para confirmar o usuário
   - Verifique se não é o último admin
   - Só então execute os UPDATEs e DELETE

5. EM CASO DE ERRO:
   - Verifique se o ID é um UUID válido
   - Confirme que o usuário existe
   - Execute comandos individualmente
*/ 