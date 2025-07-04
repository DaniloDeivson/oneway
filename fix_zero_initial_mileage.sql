-- =====================================================
-- CORREÇÃO ESPECÍFICA PARA VEÍCULOS COM INITIAL_MILEAGE = 0
-- =====================================================

-- 1. Identificar veículos com problema
SELECT 'ANTES DA CORREÇÃO - Veículos com problema:' as status;
SELECT plate, mileage, initial_mileage 
FROM vehicles 
WHERE initial_mileage = 0 OR initial_mileage IS NULL;

-- 2. Corrigir veículos de teste (definir quilometragem inicial apropriada)
UPDATE vehicles 
SET initial_mileage = CASE 
    WHEN plate = 'TEST1234' THEN 1000  -- Definir 1000 km como inicial para teste
    WHEN plate = 'TEST123' THEN 500    -- Definir 500 km como inicial para teste
    WHEN plate = 'ABC1239' THEN 2000   -- Definir 2000 km como inicial
    ELSE COALESCE(mileage, 0)          -- Para outros casos, usar mileage atual
END,
mileage = CASE 
    WHEN plate = 'TEST1234' THEN GREATEST(mileage, 1000)  -- Garantir que mileage >= inicial
    WHEN plate = 'TEST123' THEN GREATEST(mileage, 500)    -- Garantir que mileage >= inicial
    WHEN plate = 'ABC1239' THEN GREATEST(mileage, 2000)   -- Garantir que mileage >= inicial
    ELSE mileage                                          -- Manter mileage atual para outros
END,
updated_at = now()
WHERE initial_mileage = 0 OR initial_mileage IS NULL;

-- 3. Verificar resultado após correção
SELECT 'APÓS CORREÇÃO - Status dos veículos:' as status;
SELECT 
  plate,
  mileage as km_atual,
  initial_mileage as km_inicial,
  CASE 
    WHEN initial_mileage IS NULL THEN 'ERRO - INICIAL NULO'
    WHEN initial_mileage = 0 THEN 'ERRO - INICIAL ZERO'
    WHEN initial_mileage = mileage THEN 'OK - INICIAL = ATUAL'
    WHEN initial_mileage < mileage THEN 'OK - INICIAL < ATUAL'
    WHEN initial_mileage > mileage THEN 'PROBLEMA - INICIAL > ATUAL'
    ELSE 'INDEFINIDO'
  END as status_quilometragem
FROM vehicles
ORDER BY created_at DESC;

-- 4. Verificar se ainda há problemas
SELECT 
  COUNT(*) as total_veiculos,
  COUNT(CASE WHEN initial_mileage = 0 OR initial_mileage IS NULL THEN 1 END) as com_problema,
  COUNT(CASE WHEN initial_mileage > 0 THEN 1 END) as corrigidos
FROM vehicles;

-- 5. Mensagem final
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM vehicles WHERE initial_mileage = 0 OR initial_mileage IS NULL) = 0 
    THEN '✅ TODOS OS VEÍCULOS CORRIGIDOS COM SUCESSO!'
    ELSE '⚠️ AINDA HÁ VEÍCULOS COM PROBLEMA - VERIFICAR MANUALMENTE'
  END as resultado_final; 