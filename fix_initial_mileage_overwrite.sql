-- =====================================================
-- CORRIGIR SOBRESCRITA DO INITIAL_MILEAGE
-- =====================================================

-- 1. REMOVER O TRIGGER ATUAL
DROP TRIGGER IF EXISTS simple_vehicle_trigger ON vehicles;

-- 2. CRIAR FUNÇÃO CORRIGIDA QUE NÃO SOBRESCREVE INITIAL_MILEAGE
CREATE OR REPLACE FUNCTION simple_vehicle_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT: se initial_mileage não foi definido, usar 0
  IF TG_OP = 'INSERT' THEN
    IF NEW.initial_mileage IS NULL THEN
      NEW.initial_mileage := 0;
    END IF;
  END IF;

  -- Para UPDATE: PRESERVAR initial_mileage se já foi definido pelo usuário
  IF TG_OP = 'UPDATE' THEN
    -- Se o usuário está enviando um initial_mileage específico, usar esse valor
    -- Se não está enviando ou está enviando NULL, preservar o valor antigo
    IF NEW.initial_mileage IS NULL THEN
      NEW.initial_mileage := OLD.initial_mileage;
    END IF;
    
    -- Atualizar timestamp
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RECRIAR O TRIGGER
CREATE TRIGGER simple_vehicle_trigger
BEFORE INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION simple_vehicle_trigger();

-- 4. TESTAR UPDATE PRESERVANDO INITIAL_MILEAGE
UPDATE vehicles 
SET initial_mileage = 5000
WHERE plate = 'HJN3218'
RETURNING plate, mileage, initial_mileage;

-- 5. TESTAR UPDATE SEM ALTERAR INITIAL_MILEAGE
UPDATE vehicles 
SET model = model
WHERE plate = 'HJN3218'
RETURNING plate, mileage, initial_mileage;

-- 6. VERIFICAR RESULTADO
SELECT 
  plate,
  mileage,
  initial_mileage,
  'TRIGGER CORRIGIDO' as status
FROM vehicles 
ORDER BY created_at DESC;

SELECT '✅ INITIAL_MILEAGE AGORA É PRESERVADO CORRETAMENTE!' as resultado; 