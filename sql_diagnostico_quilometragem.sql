-- SQL DE DIAGNÓSTICO COMPLETO PARA QUILOMETRAGEM
-- Execute este SQL para identificar onde está o problema

-- 1. VERIFICAR SE AS FUNÇÕES E TRIGGERS EXISTEM
SELECT 'VERIFICANDO FUNÇÕES E TRIGGERS' as diagnostico;

SELECT 
    'Trigger exists: ' || CASE 
        WHEN COUNT(*) > 0 THEN 'SIM' 
        ELSE 'NÃO - PROBLEMA AQUI!' 
    END as resultado
FROM information_schema.triggers 
WHERE trigger_name = 'tr_update_vehicle_mileage_on_checkout';

SELECT 
    'Function exists: ' || CASE 
        WHEN COUNT(*) > 0 THEN 'SIM' 
        ELSE 'NÃO - PROBLEMA AQUI!' 
    END as resultado
FROM pg_proc 
WHERE proname = 'fn_update_vehicle_mileage_on_checkout';

-- 2. VERIFICAR DADOS DE QUILOMETRAGEM PARA TODOS OS VEÍCULOS
SELECT 'VERIFICANDO DADOS DE QUILOMETRAGEM' as diagnostico;

SELECT 
    v.plate as placa,
    v.model as modelo,
    v.mileage as km_veiculo,
    COALESCE(MAX(i.mileage), 0) as max_km_inspecoes,
    COALESCE(MAX(sn.mileage), 0) as max_km_manutencao,
    fn_calculate_vehicle_total_mileage(v.id) as km_total_calculado
FROM vehicles v
LEFT JOIN inspections i ON i.vehicle_id = v.id AND i.mileage IS NOT NULL
LEFT JOIN service_notes sn ON sn.vehicle_id = v.id AND sn.mileage IS NOT NULL
GROUP BY v.id, v.plate, v.model, v.mileage
ORDER BY v.plate;

-- 3. VERIFICAR ORDENS DE SERVIÇO COM QUILOMETRAGEM
SELECT 'VERIFICANDO ORDENS DE SERVIÇO COM QUILOMETRAGEM' as diagnostico;

SELECT 
    sn.id as ordem_id,
    v.plate as placa,
    sn.description as descricao,
    sn.mileage as km_ordem,
    sn.status,
    sn.created_at,
    sn.end_date
FROM service_notes sn
JOIN vehicles v ON v.id = sn.vehicle_id
WHERE sn.mileage IS NOT NULL AND sn.mileage > 0
ORDER BY sn.created_at DESC
LIMIT 10;

-- 4. VERIFICAR CHECK-INS/CHECK-OUTS DE MANUTENÇÃO
SELECT 'VERIFICANDO CHECK-INS/CHECK-OUTS' as diagnostico;

SELECT 
    mc.id as checkin_id,
    sn.id as ordem_id,
    v.plate as placa,
    sn.mileage as km_ordem,
    mc.checkin_at,
    mc.checkout_at,
    CASE 
        WHEN mc.checkout_at IS NOT NULL THEN 'CHECKOUT FEITO'
        ELSE 'AINDA EM ANDAMENTO'
    END as status_checkout
FROM maintenance_checkins mc
JOIN service_notes sn ON sn.id = mc.service_note_id
JOIN vehicles v ON v.id = sn.vehicle_id
WHERE sn.mileage IS NOT NULL AND sn.mileage > 0
ORDER BY mc.created_at DESC
LIMIT 10;

-- 5. TESTAR A FUNÇÃO DE CÁLCULO DIRETAMENTE
SELECT 'TESTANDO FUNÇÃO DE CÁLCULO PARA CADA VEÍCULO' as diagnostico;

SELECT 
    v.plate as placa,
    fn_test_mileage_update(v.id) as resultado_teste
FROM vehicles v
WHERE EXISTS (
    SELECT 1 FROM service_notes sn 
    WHERE sn.vehicle_id = v.id AND sn.mileage IS NOT NULL AND sn.mileage > 0
)
LIMIT 5;

-- 6. VERIFICAR LOGS DO SISTEMA (se houver)
SELECT 'VERIFICANDO SE HÁ CONFLITOS' as diagnostico;

-- Verificar se há veículos com quilometragem de manutenção maior que a do veículo
SELECT 
    v.plate as placa_problema,
    v.mileage as km_veiculo_atual,
    MAX(sn.mileage) as max_km_manutencao,
    'MANUTENÇÃO TEM KM MAIOR - DEVERIA ATUALIZAR' as problema
FROM vehicles v
JOIN service_notes sn ON sn.vehicle_id = v.id
WHERE sn.mileage IS NOT NULL 
    AND sn.mileage > COALESCE(v.mileage, 0)
GROUP BY v.id, v.plate, v.mileage
HAVING MAX(sn.mileage) > COALESCE(v.mileage, 0);

-- 7. FORÇAR ATUALIZAÇÃO MANUAL (TEMPORÁRIO PARA TESTE)
SELECT 'EXECUTANDO ATUALIZAÇÃO MANUAL PARA TESTE' as diagnostico;

-- Esta query vai atualizar manualmente a quilometragem dos veículos
-- baseado na maior quilometragem encontrada nas ordens de serviço
UPDATE vehicles 
SET mileage = subquery.max_mileage,
    updated_at = now()
FROM (
    SELECT 
        v.id,
        GREATEST(
            COALESCE(v.mileage, 0),
            COALESCE(MAX(sn.mileage), 0),
            COALESCE(MAX(i.mileage), 0)
        ) as max_mileage
    FROM vehicles v
    LEFT JOIN service_notes sn ON sn.vehicle_id = v.id AND sn.mileage IS NOT NULL
    LEFT JOIN inspections i ON i.vehicle_id = v.id AND i.mileage IS NOT NULL
    GROUP BY v.id, v.mileage
) subquery
WHERE vehicles.id = subquery.id 
    AND COALESCE(vehicles.mileage, 0) < subquery.max_mileage;

-- 8. VERIFICAR RESULTADO APÓS ATUALIZAÇÃO MANUAL
SELECT 'RESULTADO APÓS ATUALIZAÇÃO MANUAL' as diagnostico;

SELECT 
    v.plate as placa,
    v.mileage as km_veiculo_atualizado,
    fn_calculate_vehicle_total_mileage(v.id) as km_total_calculado
FROM vehicles v
ORDER BY v.plate; 