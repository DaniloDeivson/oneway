-- ============================================
-- ADICIONAR COLUNA TANK_CAPACITY NA TABELA VEHICLES
-- ============================================

-- Adicionar campo tank_capacity na tabela vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tank_capacity numeric DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN vehicles.tank_capacity IS 'Capacidade do tanque de combustível em litros';

-- Atualizar registros existentes com valor padrão
UPDATE vehicles SET tank_capacity = 0 WHERE tank_capacity IS NULL;

-- Verificar se o campo foi criado
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'vehicles' AND column_name = 'tank_capacity';

-- Verificar alguns registros
SELECT id, plate, model, tank_capacity FROM vehicles LIMIT 5; 