-- ============================================
-- CORREÇÃO DA FUNÇÃO DE CÁLCULO DE QUILOMETRAGEM
-- ============================================

-- Corrigir a função de cálculo para não forçar quilometragem inicial como mínimo
CREATE OR REPLACE FUNCTION fn_calculate_vehicle_total_mileage(p_vehicle_id uuid)
RETURNS numeric AS $$
DECLARE
  v_current_mileage numeric;
  v_latest_inspection_mileage numeric;
  v_latest_service_note_mileage numeric;
  v_total_mileage numeric;
BEGIN
  -- Pegar quilometragem atual do veículo
  SELECT COALESCE(mileage, 0)
  INTO v_current_mileage
  FROM vehicles
  WHERE id = p_vehicle_id;

  -- Pegar a maior quilometragem registrada em inspeções
  SELECT COALESCE(MAX(mileage), 0)
  INTO v_latest_inspection_mileage
  FROM inspections
  WHERE vehicle_id = p_vehicle_id AND mileage IS NOT NULL;

  -- Pegar a maior quilometragem registrada em notas de serviço
  SELECT COALESCE(MAX(mileage), 0)
  INTO v_latest_service_note_mileage
  FROM service_notes
  WHERE vehicle_id = p_vehicle_id AND mileage IS NOT NULL;

  -- Calcular quilometragem total como o maior valor entre atual, inspeções e notas de serviço
  -- Não usar GREATEST com initial_mileage para permitir que seja menor
  v_total_mileage := GREATEST(
    v_current_mileage,
    v_latest_inspection_mileage,
    v_latest_service_note_mileage
  );

  RETURN v_total_mileage;
END;
$$ LANGUAGE plpgsql;

-- Corrigir a função trigger para não forçar quilometragem inicial
CREATE OR REPLACE FUNCTION fn_set_initial_mileage()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é um novo veículo e não tem quilometragem inicial definida
  IF TG_OP = 'INSERT' AND NEW.initial_mileage IS NULL THEN
    NEW.initial_mileage := COALESCE(NEW.mileage, 0);
  END IF;
  
  -- Para atualizações, não forçar que a quilometragem atual seja maior que a inicial
  -- Permitir que a quilometragem inicial seja editada independentemente
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS tr_set_initial_mileage ON vehicles;
CREATE TRIGGER tr_set_initial_mileage
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_initial_mileage();

-- Atualizar a quilometragem total para todos os veículos
UPDATE vehicles 
SET mileage = fn_calculate_vehicle_total_mileage(id)
WHERE id IS NOT NULL; 