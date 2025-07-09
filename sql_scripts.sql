-- Scripts SQL para actualización de la tabla "otros"
-- Proyecto: Sistema Update
-- Fecha: 2025-01-07

-- =================================================
-- CONSULTAS DE ANÁLISIS
-- =================================================

-- Ver estadísticas actuales de sucursales
SELECT 
    sucursal,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN disponible = true THEN 1 END) as disponibles,
    COUNT(CASE WHEN disponible = false THEN 1 END) as no_disponibles
FROM otros 
GROUP BY sucursal 
ORDER BY sucursal;

-- Ver todos los valores únicos de sucursal
SELECT DISTINCT sucursal 
FROM otros 
WHERE sucursal IS NOT NULL
ORDER BY sucursal;

-- Contar registros por sucursal
SELECT sucursal, COUNT(*) as cantidad
FROM otros
GROUP BY sucursal
ORDER BY cantidad DESC;

-- Ver registros sin sucursal asignada
SELECT id, descripcion_producto, sucursal
FROM otros
WHERE sucursal IS NULL OR sucursal = '';

-- =================================================
-- SCRIPTS DE ACTUALIZACIÓN
-- =================================================

-- PRECAUCIÓN: Estos scripts modifican datos en la base de datos
-- Asegúrate de tener un backup antes de ejecutar

-- 1. Actualizar TODOS los registros a 'la_plata'
-- ADVERTENCIA: Esto afecta TODOS los registros
UPDATE otros 
SET sucursal = 'la_plata', 
    updated_at = NOW() 
WHERE 1=1;

-- 2. Actualizar solo registros con sucursal 'capital' a 'la_plata'
UPDATE otros 
SET sucursal = 'la_plata', 
    updated_at = NOW() 
WHERE sucursal = 'capital';

-- 3. Actualizar registros sin sucursal asignada
UPDATE otros 
SET sucursal = 'la_plata', 
    updated_at = NOW() 
WHERE sucursal IS NULL OR sucursal = '';

-- 4. Actualizar registros por rango de fechas
UPDATE otros 
SET sucursal = 'la_plata', 
    updated_at = NOW() 
WHERE created_at >= '2025-01-01' 
AND (sucursal IS NULL OR sucursal = '');

-- 5. Actualizar registros por categoría específica
UPDATE otros 
SET sucursal = 'la_plata', 
    updated_at = NOW() 
WHERE categoria = 'audio' 
AND sucursal IS NULL;

-- =================================================
-- SCRIPTS DE VALIDACIÓN (después de actualizar)
-- =================================================

-- Verificar que la actualización fue exitosa
SELECT 
    'Total registros' as descripcion,
    COUNT(*) as cantidad
FROM otros
UNION ALL
SELECT 
    'Registros con sucursal la_plata' as descripcion,
    COUNT(*) as cantidad
FROM otros
WHERE sucursal = 'la_plata'
UNION ALL
SELECT 
    'Registros sin sucursal' as descripcion,
    COUNT(*) as cantidad
FROM otros
WHERE sucursal IS NULL OR sucursal = '';

-- Ver últimos registros modificados
SELECT id, descripcion_producto, sucursal, updated_at
FROM otros
ORDER BY updated_at DESC
LIMIT 10;

-- =================================================
-- SCRIPTS DE ROLLBACK (en caso de error)
-- =================================================

-- Nota: Estos scripts solo funcionan si tienes un backup o 
-- conoces los valores originales

-- Ejemplo: Restaurar sucursal basada en algún criterio
-- UPDATE otros 
-- SET sucursal = 'capital', 
--     updated_at = NOW() 
-- WHERE id IN (
--     SELECT id FROM backup_otros 
--     WHERE sucursal = 'capital'
-- );

-- =================================================
-- FUNCIONES ÚTILES PARA POSTGRESQL/SUPABASE
-- =================================================

-- Crear función para actualizar sucursal en lote
CREATE OR REPLACE FUNCTION actualizar_sucursal_otros(
    p_nueva_sucursal TEXT,
    p_sucursal_actual TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_count INTEGER;
    v_result JSON;
BEGIN
    -- Si se especifica sucursal actual, filtrar por ella
    IF p_sucursal_actual IS NOT NULL THEN
        UPDATE otros 
        SET sucursal = p_nueva_sucursal, 
            updated_at = NOW() 
        WHERE sucursal = p_sucursal_actual;
    ELSE
        -- Actualizar todos los registros
        UPDATE otros 
        SET sucursal = p_nueva_sucursal, 
            updated_at = NOW();
    END IF;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    v_result := json_build_object(
        'success', true,
        'count', v_count,
        'nueva_sucursal', p_nueva_sucursal,
        'sucursal_filtro', p_sucursal_actual
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'count', 0
        );
END;
$$ LANGUAGE plpgsql;

-- Usar la función:
-- SELECT actualizar_sucursal_otros('la_plata');
-- SELECT actualizar_sucursal_otros('la_plata', 'capital');

-- =================================================
-- ÍNDICES PARA MEJORAR PERFORMANCE
-- =================================================

-- Crear índice en sucursal si no existe
CREATE INDEX IF NOT EXISTS idx_otros_sucursal ON otros(sucursal);

-- Índice compuesto para sucursal y disponible
CREATE INDEX IF NOT EXISTS idx_otros_sucursal_disponible ON otros(sucursal, disponible);

-- =================================================
-- CONSTRAINTS Y VALIDACIONES
-- =================================================

-- Agregar constraint para validar valores de sucursal
-- ALTER TABLE otros 
-- ADD CONSTRAINT chk_sucursal_valida 
-- CHECK (sucursal IN ('la_plata', 'capital', 'otras'));

-- =================================================
-- TRIGGERS PARA AUDITORÍA
-- =================================================

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS otros_audit (
    id SERIAL PRIMARY KEY,
    tabla_nombre TEXT NOT NULL,
    registro_id UUID NOT NULL,
    operacion TEXT NOT NULL,
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    usuario_modificacion TEXT,
    fecha_modificacion TIMESTAMP DEFAULT NOW()
);

-- Crear función de trigger para auditoría
CREATE OR REPLACE FUNCTION audit_otros_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO otros_audit (
            tabla_nombre, registro_id, operacion, 
            valores_anteriores, valores_nuevos,
            usuario_modificacion, fecha_modificacion
        ) VALUES (
            'otros', NEW.id, 'UPDATE',
            to_jsonb(OLD), to_jsonb(NEW),
            current_user, NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO otros_audit (
            tabla_nombre, registro_id, operacion, 
            valores_anteriores, valores_nuevos,
            usuario_modificacion, fecha_modificacion
        ) VALUES (
            'otros', NEW.id, 'INSERT',
            NULL, to_jsonb(NEW),
            current_user, NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO otros_audit (
            tabla_nombre, registro_id, operacion, 
            valores_anteriores, valores_nuevos,
            usuario_modificacion, fecha_modificacion
        ) VALUES (
            'otros', OLD.id, 'DELETE',
            to_jsonb(OLD), NULL,
            current_user, NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
-- DROP TRIGGER IF EXISTS tr_otros_audit ON otros;
-- CREATE TRIGGER tr_otros_audit
--     AFTER INSERT OR UPDATE OR DELETE ON otros
--     FOR EACH ROW
--     EXECUTE FUNCTION audit_otros_changes();

-- =================================================
-- NOTAS IMPORTANTES
-- =================================================

/*
1. BACKUP: Siempre realiza un backup antes de ejecutar scripts de actualización
2. TESTING: Prueba primero en un entorno de desarrollo
3. TRANSACCIONES: Usa transacciones para operaciones críticas
4. MONITORING: Monitorea el performance durante actualizaciones masivas
5. ROLLBACK: Ten un plan de rollback preparado

Ejemplo de uso con transacciones:
BEGIN;
UPDATE otros SET sucursal = 'la_plata' WHERE sucursal = 'capital';
-- Verificar que todo esté correcto
SELECT COUNT(*) FROM otros WHERE sucursal = 'la_plata';
-- Si todo está bien: COMMIT;
-- Si hay problemas: ROLLBACK;
*/