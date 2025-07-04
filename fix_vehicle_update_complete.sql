-- =====================================================
-- SQL PARA CORRIGIR E GARANTIR UPDATE COMPLETO DE VEÍCULOS
-- =====================================================

-- 1. Garantir que a coluna initial_mileage existe
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS initial_mileage numeric DEFAULT 0;

-- 2. Corrigir dados antigos: preencher initial_mileage onde está nulo/zero
UPDATE vehicles
SET initial_mileage = COALESCE(mileage, 0)
WHERE initial_mileage IS NULL OR initial_mileage = 0;

-- 3. Função para garantir consistência automática
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
    
    -- Garantir que mileage não seja menor que initial_mileage
    IF NEW.mileage < NEW.initial_mileage THEN
      NEW.mileage := NEW.initial_mileage;
    END IF;
  END IF;

  -- Garantir que updated_at seja sempre atualizado
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_ensure_vehicle_consistency ON vehicles;
DROP TRIGGER IF EXISTS trg_preserve_initial_mileage ON vehicles;

-- 5. Criar o trigger para rodar SEMPRE
CREATE TRIGGER trg_ensure_vehicle_consistency
BEFORE INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION trg_ensure_vehicle_consistency();

-- 6. Verificar se há problemas nos dados atuais
SELECT 
  id,
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

-- 7. Comentários para documentação
COMMENT ON COLUMN vehicles.initial_mileage IS 'Quilometragem inicial/original do veículo no momento do cadastro - NUNCA deve ser alterada após definida';
COMMENT ON FUNCTION trg_ensure_vehicle_consistency() IS 'Garante consistência automática dos dados de quilometragem em veículos';

-- 8. Mensagem de conclusão
SELECT 'CORREÇÃO APLICADA COM SUCESSO! Todos os updates de veículos agora preservarão a quilometragem inicial automaticamente.' as resultado; 