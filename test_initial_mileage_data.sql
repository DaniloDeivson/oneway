-- =====================================================
-- TESTE PARA VERIFICAR OS DADOS DE INITIAL_MILEAGE
-- =====================================================

-- 1. Verificar se a coluna existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' AND column_name = 'initial_mileage';

-- 2. Verificar os dados atuais
SELECT 
  plate,
  mileage,
  initial_mileage,
  CASE 
    WHEN initial_mileage IS NULL THEN 'NULL'
    WHEN initial_mileage = 0 THEN 'ZERO'
    ELSE 'OK'
  END as status_inicial
FROM vehicles 
ORDER BY created_at DESC;

-- 3. Verificar se há dados inconsistentes
SELECT 
  COUNT(*) as total_veiculos,
  COUNT(CASE WHEN initial_mileage IS NULL THEN 1 END) as initial_null,
  COUNT(CASE WHEN initial_mileage = 0 THEN 1 END) as initial_zero,
  COUNT(CASE WHEN initial_mileage > 0 THEN 1 END) as initial_ok
FROM vehicles;

-- 4. Corrigir dados se necessário
UPDATE vehicles 
SET initial_mileage = COALESCE(mileage, 0)
WHERE initial_mileage IS NULL OR initial_mileage = 0;

-- 5. Verificar resultado após correção
SELECT 
  plate,
  mileage,
  initial_mileage,
  'CORRIGIDO' as status
FROM vehicles 
ORDER BY created_at DESC; 