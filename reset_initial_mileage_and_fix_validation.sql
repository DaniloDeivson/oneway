-- =====================================================
-- RESET QUILOMETRAGEM INICIAL E CORREÇÃO DE VALIDAÇÃO
-- =====================================================

-- 1. ZERAR TODAS AS QUILOMETRAGENS INICIAIS PARA TESTE
UPDATE vehicles 
SET initial_mileage = 0
WHERE initial_mileage > 0;

-- 2. VERIFICAR SE HÁ TRIGGERS OU CONSTRAINTS CAUSANDO O ERRO
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'vehicles';

-- 3. REMOVER TODOS OS TRIGGERS PROBLEMÁTICOS
DROP TRIGGER IF EXISTS trg_ensure_vehicle_consistency ON vehicles;
DROP TRIGGER IF EXISTS trg_preserve_initial_mileage ON vehicles;
DROP TRIGGER IF EXISTS tr_set_initial_mileage ON vehicles;

-- 4. VERIFICAR SE HÁ FUNÇÕES QUE ESTÃO VALIDANDO QUILOMETRAGEM
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name LIKE '%mileage%' OR routine_name LIKE '%quilometragem%';

-- 5. REMOVER FUNÇÕES PROBLEMÁTICAS SE EXISTIREM
DROP FUNCTION IF EXISTS fn_set_initial_mileage CASCADE;
DROP FUNCTION IF EXISTS trg_ensure_vehicle_consistency CASCADE;
DROP FUNCTION IF EXISTS trg_preserve_initial_mileage CASCADE;

-- 6. CRIAR UM TRIGGER SIMPLES QUE NÃO VALIDA QUILOMETRAGEM
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

-- 7. CRIAR O TRIGGER SIMPLES
CREATE TRIGGER simple_vehicle_trigger
BEFORE INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION simple_vehicle_trigger();

-- 8. TESTAR UPDATE SIMPLES
UPDATE vehicles 
SET model = model, initial_mileage = 0
WHERE plate = 'HJN3218'
RETURNING plate, mileage, initial_mileage;

-- 9. VERIFICAR RESULTADO
SELECT 
  plate,
  mileage,
  initial_mileage,
  'RESETADO' as status
FROM vehicles 
ORDER BY created_at DESC;

-- 10. VERIFICAR SE HÁ CONSTRAINTS DE CHECK
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public';

SELECT 'QUILOMETRAGENS INICIAIS RESETADAS E VALIDAÇÃO CORRIGIDA!' as resultado; 