-- Script para solucionar problemas de foreign keys en plan_cuentas
-- UPDATE WW SRL - Migración de base de datos

-- 1. Agregar columnas faltantes a plan_cuentas si no existen
ALTER TABLE plan_cuentas 
ADD COLUMN IF NOT EXISTS fecha_desactivacion TIMESTAMPTZ;

-- 2. Verificar todas las dependencias existentes
-- Este query te ayuda a identificar qué tablas referencian plan_cuentas

SELECT 
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_destino,
    ccu.column_name as columna_destino,
    tc.constraint_name as nombre_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'plan_cuentas'
ORDER BY tc.table_name;

-- 3. Para eliminar registros conflictivos (OPCIONAL - usar con cuidado)
-- Ejemplo: eliminar conciliaciones huérfanas
/*
DELETE FROM conciliaciones_caja 
WHERE cuenta_caja_id NOT IN (SELECT id FROM plan_cuentas WHERE activa = true);
*/

-- 4. Para reasignar registros a otra cuenta (OPCIONAL)
-- Ejemplo: mover gastos operativos de cuenta eliminada a cuenta genérica
/*
UPDATE gastos_operativos 
SET cuenta_pago_id = (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01' LIMIT 1)
WHERE cuenta_pago_id = [ID_CUENTA_A_ELIMINAR];
*/

-- 5. Query para verificar dependencias de una cuenta específica antes de eliminar
-- Reemplaza [ID_CUENTA] por el ID de la cuenta que quieres eliminar
/*
-- Verificar movimientos contables
SELECT 'movimientos_contables' as tabla, COUNT(*) as cantidad 
FROM movimientos_contables WHERE cuenta_id = [ID_CUENTA]
UNION ALL
-- Verificar conciliaciones de caja
SELECT 'conciliaciones_caja' as tabla, COUNT(*) as cantidad 
FROM conciliaciones_caja WHERE cuenta_caja_id = [ID_CUENTA]
UNION ALL
-- Verificar gastos operativos
SELECT 'gastos_operativos' as tabla, COUNT(*) as cantidad 
FROM gastos_operativos WHERE cuenta_pago_id = [ID_CUENTA];
*/