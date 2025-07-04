-- =====================================================
-- SQL PARA OPERAÇÕES DE USUÁRIOS - ONEWAY RENT A CAR
-- =====================================================

-- ==============================
-- 1. EXCLUSÃO COMPLETA DE USUÁRIO
-- ==============================

-- IMPORTANTE: Execute na ordem exata para evitar erros de chave estrangeira
-- Substitua 'USER_ID_AQUI' pelo ID real do usuário

-- STEP 1: Verificar se não é o último admin (executar primeiro)
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

-- STEP 2: Buscar dados do usuário (para auditoria)
SELECT 
    id,
    name,
    role,
    contact_info->>'email' as email,
    active,
    created_at
FROM employees 
WHERE id = 'USER_ID_AQUI';

-- STEP 3: Limpar registros relacionados (SET NULL nas chaves estrangeiras)
UPDATE service_notes 
SET employee_id = NULL 
WHERE employee_id = 'USER_ID_AQUI';

UPDATE inspections 
SET employee_id = NULL 
WHERE employee_id = 'USER_ID_AQUI';

UPDATE contracts 
SET salesperson_id = NULL 
WHERE salesperson_id = 'USER_ID_AQUI';

UPDATE fines 
SET employee_id = NULL, driver_id = NULL 
WHERE employee_id = 'USER_ID_AQUI' OR driver_id = 'USER_ID_AQUI';

UPDATE costs 
SET created_by_employee_id = NULL 
WHERE created_by_employee_id = 'USER_ID_AQUI';

-- STEP 4: Registrar usuário removido (para auditoria)
INSERT INTO removed_users (id, email, removed_at)
SELECT 
    id, 
    contact_info->>'email',
    NOW()
FROM employees 
WHERE id = 'USER_ID_AQUI'
ON CONFLICT (email) DO NOTHING;

-- STEP 5: Excluir da tabela employees
DELETE FROM employees 
WHERE id = 'USER_ID_AQUI';

-- STEP 6: Verificar exclusão
SELECT 'Usuário excluído com sucesso' as resultado
WHERE NOT EXISTS (
    SELECT 1 FROM employees WHERE id = 'USER_ID_AQUI'
);

-- ==============================
-- 2. ATUALIZAÇÃO DE USUÁRIO
-- ==============================

-- Template para atualização (ajuste os valores)
UPDATE employees 
SET 
    name = 'NOVO_NOME',
    contact_info = jsonb_build_object(
        'email', 'novo@email.com',
        'phone', '(11) 99999-9999'
    ),
    role = 'NOVO_ROLE',  -- Admin, Manager, Mechanic, etc.
    active = true,       -- true ou false
    updated_at = NOW()
WHERE id = 'USER_ID_AQUI';

-- Verificar atualização
SELECT 
    id,
    name,
    contact_info->>'email' as email,
    contact_info->>'phone' as phone,
    role,
    active,
    updated_at
FROM employees 
WHERE id = 'USER_ID_AQUI';

-- ==============================
-- 3. CRIAR NOVO USUÁRIO (APENAS EMPLOYEES)
-- ==============================

-- Inserir novo funcionário (sem auth - só para casos especiais)
INSERT INTO employees (
    id,
    tenant_id,
    name,
    role,
    employee_code,
    contact_info,
    active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Nome do Funcionário',
    'Admin',  -- ou outro role válido
    'EMP001',
    jsonb_build_object(
        'email', 'funcionario@email.com',
        'phone', '(11) 99999-9999'
    ),
    true,
    NOW(),
    NOW()
);

-- ==============================
-- 4. SCRIPTS DE DIAGNÓSTICO
-- ==============================

-- Listar todos os usuários
SELECT 
    id,
    name,
    role,
    contact_info->>'email' as email,
    contact_info->>'phone' as phone,
    active,
    created_at
FROM employees 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY name;

-- Contar usuários por role
SELECT 
    role,
    COUNT(*) as total,
    COUNT(CASE WHEN active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN active = false THEN 1 END) as inativos
FROM employees 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
GROUP BY role
ORDER BY role;

-- Verificar registros órfãos (que referenciam usuários inexistentes)
SELECT 'service_notes' as tabela, COUNT(*) as registros_orfaos
FROM service_notes sn
LEFT JOIN employees e ON sn.employee_id = e.id
WHERE sn.employee_id IS NOT NULL AND e.id IS NULL

UNION ALL

SELECT 'inspections' as tabela, COUNT(*) as registros_orfaos
FROM inspections i
LEFT JOIN employees e ON i.employee_id = e.id
WHERE i.employee_id IS NOT NULL AND e.id IS NULL

UNION ALL

SELECT 'contracts' as tabela, COUNT(*) as registros_orfaos
FROM contracts c
LEFT JOIN employees e ON c.salesperson_id = e.id
WHERE c.salesperson_id IS NOT NULL AND e.id IS NULL

UNION ALL

SELECT 'fines (employee_id)' as tabela, COUNT(*) as registros_orfaos
FROM fines f
LEFT JOIN employees e ON f.employee_id = e.id
WHERE f.employee_id IS NOT NULL AND e.id IS NULL

UNION ALL

SELECT 'fines (driver_id)' as tabela, COUNT(*) as registros_orfaos
FROM fines f
LEFT JOIN employees e ON f.driver_id = e.id
WHERE f.driver_id IS NOT NULL AND e.id IS NULL

UNION ALL

SELECT 'costs' as tabela, COUNT(*) as registros_orfaos
FROM costs c
LEFT JOIN employees e ON c.created_by_employee_id = e.id
WHERE c.created_by_employee_id IS NOT NULL AND e.id IS NULL;

-- Verificar usuários removidos
SELECT 
    id,
    email,
    removed_at
FROM removed_users 
ORDER BY removed_at DESC;

-- ==============================
-- 5. LIMPEZA DE DADOS ÓRFÃOS
-- ==============================

-- Limpar registros órfãos (caso existam)
UPDATE service_notes 
SET employee_id = NULL 
WHERE employee_id NOT IN (SELECT id FROM employees);

UPDATE inspections 
SET employee_id = NULL 
WHERE employee_id NOT IN (SELECT id FROM employees);

UPDATE contracts 
SET salesperson_id = NULL 
WHERE salesperson_id NOT IN (SELECT id FROM employees);

UPDATE fines 
SET employee_id = NULL 
WHERE employee_id NOT IN (SELECT id FROM employees);

UPDATE fines 
SET driver_id = NULL 
WHERE driver_id NOT IN (SELECT id FROM employees);

UPDATE costs 
SET created_by_employee_id = NULL 
WHERE created_by_employee_id NOT IN (SELECT id FROM employees);

-- ==============================
-- 6. BACKUP DE SEGURANÇA
-- ==============================

-- Criar backup da tabela employees antes de operações críticas
CREATE TABLE employees_backup_$(date +%Y%m%d) AS 
SELECT * FROM employees;

-- Restaurar backup (em caso de emergência)
-- DELETE FROM employees;
-- INSERT INTO employees SELECT * FROM employees_backup_YYYYMMDD;

-- ==============================
-- INSTRUÇÕES DE USO:
-- ==============================

/*
1. PARA EXCLUIR UM USUÁRIO:
   - Substitua 'USER_ID_AQUI' pelo ID real
   - Execute os comandos na ordem (STEP 1 a 6)
   - Verifique o resultado

2. PARA ATUALIZAR UM USUÁRIO:
   - Use a seção 2, ajustando os valores
   - Execute UPDATE e depois SELECT para verificar

3. PARA DIAGNOSTICAR PROBLEMAS:
   - Use a seção 4 para investigar

4. IMPORTANTE:
   - SEMPRE faça backup antes de operações críticas
   - Teste primeiro em ambiente de desenvolvimento
   - A exclusão do auth.users deve ser feita via Admin API do Supabase
*/ 