-- =====================================================
-- CORREÇÃO DE CONFLITO DE FUNÇÕES E RESET COMPLETO
-- =====================================================

-- 1. REMOVER TODAS AS VERSÕES DA FUNÇÃO fn_set_initial_mileage
DROP FUNCTION IF EXISTS fn_set_initial_mileage() CASCADE;
DROP FUNCTION IF EXISTS fn_set_initial_mileage(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS fn_set_initial_mileage(text, numeric) CASCADE;
DROP FUNCTION IF EXISTS fn_set_initial_mileage(varchar, numeric) CASCADE;

-- 2. REMOVER TODAS AS OUTRAS FUNÇÕES RELACIONADAS
DROP FUNCTION IF EXISTS trg_ensure_vehicle_consistency() CASCADE;
DROP FUNCTION IF EXISTS trg_preserve_initial_mileage() CASCADE;
DROP FUNCTION IF EXISTS fn_update_vehicle_mileage_on_checkout() CASCADE;

-- 3. REMOVER TODOS OS TRIGGERS RELACIONADOS
DROP TRIGGER IF EXISTS trg_ensure_vehicle_consistency ON vehicles;
DROP TRIGGER IF EXISTS trg_preserve_initial_mileage ON vehicles;
DROP TRIGGER IF EXISTS tr_set_initial_mileage ON vehicles;
DROP TRIGGER IF EXISTS simple_vehicle_trigger ON vehicles;

-- 4. VERIFICAR SE AINDA HÁ FUNÇÕES PROBLEMÁTICAS
SELECT 
  routine_name, 
  specific_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%mileage%' 
   OR routine_name LIKE '%vehicle%'
   OR routine_name LIKE '%quilometragem%';

-- 5. ZERAR TODAS AS QUILOMETRAGENS INICIAIS
UPDATE vehicles 
SET initial_mileage = 0
WHERE initial_mileage IS NOT NULL AND initial_mileage != 0;

-- 6. CRIAR FUNÇÃO SIMPLES E LIMPA
CREATE OR REPLACE FUNCTION simple_vehicle_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas garantir que initial_mileage não seja null
  IF NEW.initial_mileage IS NULL THEN
    NEW.initial_mileage := 0;
  END IF;
  
  -- Atualizar timestamp apenas em updates
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CRIAR TRIGGER SIMPLES
CREATE TRIGGER simple_vehicle_trigger
BEFORE INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION simple_vehicle_trigger();

-- 8. TESTAR UPDATE
UPDATE vehicles 
SET model = model, initial_mileage = 0
WHERE plate = 'HJN3218'
RETURNING plate, mileage, initial_mileage;

-- 9. VERIFICAR ESTADO FINAL
SELECT 
  plate,
  mileage,
  initial_mileage,
  'LIMPO E RESETADO' as status
FROM vehicles 
ORDER BY created_at DESC;

-- 10. VERIFICAR SE HÁ TRIGGERS ATIVOS
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'vehicles';

SELECT '✅ CONFLITOS RESOLVIDOS E QUILOMETRAGENS RESETADAS!' as resultado; 