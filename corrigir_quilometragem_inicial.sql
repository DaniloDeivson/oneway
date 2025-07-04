-- SQL para corrigir a quilometragem inicial dos veículos existentes
-- Execute este SQL após aplicar a migração anterior

-- 1. Primeiro, aplicar a migração principal
-- Adicionar campo para preservar quilometragem inicial
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS initial_mileage numeric DEFAULT 0;

-- 2. Corrigir dados específicos baseado no que você mostrou
-- Para o veículo ABC1234 (35.000 km - parece ser quilometragem original alta)
UPDATE vehicles 
SET initial_mileage = 35000,
    mileage = 35000
WHERE plate = 'ABC1234';

-- Para o veículo ABC1239 (0 km - veículo novo)
UPDATE vehicles 
SET initial_mileage = 0,
    mileage = 0  
WHERE plate = 'ABC1239';

-- Para o veículo TESTE (que teve 500 km de manutenção, mas inicial deveria ser menor)
-- Vamos assumir que a quilometragem inicial era 0 e agora está em 500 devido à manutenção
UPDATE vehicles 
SET initial_mileage = 0
WHERE plate = 'TESTE';

-- 3. Para todos os outros veículos, definir initial_mileage baseado em uma lógica
-- Se o veículo tem ordens de serviço, usar a menor quilometragem como inicial
UPDATE vehicles 
SET initial_mileage = CASE 
    WHEN EXISTS (
        SELECT 1 FROM service_notes sn 
        WHERE sn.vehicle_id = vehicles.id 
        AND sn.mileage IS NOT NULL
    ) THEN (
        -- Se tem ordens de serviço, usar a menor quilometragem ou a do veículo
        LEAST(
            COALESCE(vehicles.mileage, 0),
            COALESCE((
                SELECT MIN(sn.mileage) 
                FROM service_notes sn 
                WHERE sn.vehicle_id = vehicles.id 
                AND sn.mileage IS NOT NULL
            ), vehicles.mileage)
        )
    )
    ELSE COALESCE(vehicles.mileage, 0)
END
WHERE initial_mileage IS NULL OR initial_mileage = 0;

-- 4. Verificar os resultados
SELECT 
    plate as placa,
    initial_mileage as km_inicial,
    mileage as km_atual,
    fn_calculate_vehicle_total_mileage(id) as km_total_calculado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM service_notes sn WHERE sn.vehicle_id = vehicles.id AND sn.mileage IS NOT NULL)
        THEN 'TEM MANUTENÇÃO'
        ELSE 'SEM MANUTENÇÃO'
    END as status_manutencao
FROM vehicles 
ORDER BY plate;

-- 5. Se quiser corrigir manualmente um veículo específico, use:
-- UPDATE vehicles 
-- SET initial_mileage = [QUILOMETRAGEM_INICIAL_DESEJADA]
-- WHERE plate = '[PLACA_DO_VEICULO]';

-- Exemplo para o veículo TESTE - se a quilometragem inicial deveria ser 100:
-- UPDATE vehicles 
-- SET initial_mileage = 100
-- WHERE plate = 'TESTE'; 