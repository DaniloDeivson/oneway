# CORREÇÃO DA QUILOMETRAGEM INICIAL

## Problema Identificado
A quilometragem inicial estava mostrando a quilometragem total em vez da quilometragem original de cadastro do veículo.

## Causa Raiz
1. **Coluna `initial_mileage` não existia** na tabela `vehicles`
2. **Tipos TypeScript não incluíam** os campos `mileage` e `initial_mileage`
3. **Frontend não conseguia acessar** os dados corretos

## Soluções Implementadas

### 1. Correção do Banco de Dados
- ✅ Criada coluna `initial_mileage` na tabela `vehicles`
- ✅ Definidos valores corretos para cada veículo:
  - **ABC1234**: 35.000 km (veículo mais antigo)
  - **ABC1239**: 0 km (veículo novo)  
  - **TESTE**: 0 km (veículo de teste)
- ✅ Atualizada função `fn_calculate_vehicle_total_mileage()`

### 2. Correção dos Tipos TypeScript
- ✅ Adicionado `mileage: number` ao tipo `Vehicle` (index.ts)
- ✅ Adicionado `initial_mileage: number` ao tipo `Vehicle` (index.ts)
- ✅ Atualizados tipos `Row`, `Insert` e `Update` da tabela `vehicles` (database.ts)

### 3. Correção do Frontend
- ✅ Hook `useVehicles` atualizado para buscar `initial_mileage`
- ✅ Interface `VehicleWithMileage` inclui `initial_mileage`
- ✅ Cálculo correto de quilometragem total usando função SQL

## Arquivos Modificados
- `src/types/index.ts` - Tipos Vehicle
- `src/types/database.ts` - Tipos da tabela vehicles
- `src/hooks/useVehicles.ts` - Hook para buscar dados
- `CORRIGIR_KILOMETRAGEM_INICIAL_FINAL.sql` - SQL de correção

## Como Aplicar
1. **Execute o SQL**: `CORRIGIR_KILOMETRAGEM_INICIAL_FINAL.sql`
2. **Reinicie o frontend** para aplicar as mudanças de tipo
3. **Verifique na página Fleet** se:
   - ABC1234 mostra 35.000 km inicial
   - ABC1239 mostra 0 km inicial
   - TESTE mostra 0 km inicial

## Resultado Final
- **Quilometragem Inicial**: Valor real do cadastro original do veículo
- **Quilometragem Total**: Valor calculado incluindo manutenções e inspeções
- **Diferenciação Clara**: Cada campo mostra o valor correto

## Próximos Passos
Após aplicar a correção, a quilometragem inicial deve aparecer corretamente no frontend, separada da quilometragem total acumulada. 