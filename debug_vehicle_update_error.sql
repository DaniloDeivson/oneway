-- =====================================================
-- DEBUG PARA ERRO 400 NO UPDATE DE VEÍCULOS
-- =====================================================

-- 1. Verificar se há triggers causando problemas
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'vehicles';

-- 2. Temporariamente desabilitar o trigger para teste
DROP TRIGGER IF EXISTS trg_ensure_vehicle_consistency ON vehicles;

-- 3. Testar um update simples
UPDATE vehicles 
SET model = model, updated_at = now()
WHERE plate = 'ABC1239'
RETURNING id, plate, model, mileage, initial_mileage;

-- 4. Recriar o trigger com correções
CREATE OR REPLACE FUNCTION trg_ensure_vehicle_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT: se initial_mileage não foi definido, usar mileage
  IF TG_OP = 'INSERT' THEN
    IF NEW.initial_mileage IS NULL OR NEW.initial_mileage = 0 THEN
      NEW.initial_mileage := COALESCE(NEW.mileage, 0);
    END IF;
    
    -- Garantir que mileage não seja menor que initial_mileage
    IF NEW.mileage < NEW.initial_mileage THEN
      NEW.mileage := NEW.initial_mileage;
    END IF;
  END IF;

  -- Para UPDATE: preservar initial_mileage se já existe um valor válido
  IF TG_OP = 'UPDATE' THEN
    -- Se initial_mileage estava definido e agora veio nulo/zero, preservar o antigo
    IF (OLD.initial_mileage IS NOT NULL AND OLD.initial_mileage > 0) AND 
       (NEW.initial_mileage IS NULL OR NEW.initial_mileage = 0) THEN
      NEW.initial_mileage := OLD.initial_mileage;
    END IF;
    
    -- Se initial_mileage não estava definido, usar o novo valor ou mileage
    IF (OLD.initial_mileage IS NULL OR OLD.initial_mileage = 0) AND 
       (NEW.initial_mileage IS NULL OR NEW.initial_mileage = 0) THEN
      NEW.initial_mileage := COALESCE(NEW.mileage, OLD.mileage, 0);
    END IF;
    
    -- NÃO FORÇAR mileage >= initial_mileage no UPDATE para permitir correções
    -- IF NEW.mileage < NEW.initial_mileage THEN
    --   NEW.mileage := NEW.initial_mileage;
    -- END IF;
  END IF;

  -- Garantir que updated_at seja sempre atualizado apenas em UPDATEs
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro no trigger de veículos: %', SQLERRM;
    RETURN NEW; -- Continuar mesmo com erro
END;
$$ LANGUAGE plpgsql;

-- 5. Recriar o trigger
CREATE TRIGGER trg_ensure_vehicle_consistency
BEFORE INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION trg_ensure_vehicle_consistency();

-- 6. Testar novamente o update
UPDATE vehicles 
SET model = model, updated_at = now()
WHERE plate = 'ABC1239'
RETURNING id, plate, model, mileage, initial_mileage;

-- 7. Verificar se há policies RLS causando problema
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'vehicles';

SELECT 'DIAGNÓSTICO COMPLETO - Agora teste o update na interface' as resultado; 