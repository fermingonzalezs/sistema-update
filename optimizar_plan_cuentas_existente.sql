-- OPTIMIZACIÓN DEL PLAN DE CUENTAS EXISTENTE
-- Este script agrega algunas cuentas faltantes para gastos específicos
-- OPCIONAL: Solo ejecutar si quieres cuentas más específicas

-- ==========================================
-- AGREGAR CUENTAS FALTANTES (OPCIONAL)
-- ==========================================

-- Agregar cuentas específicas que faltan
INSERT INTO plan_cuentas (codigo, nombre, tipo, nivel, padre_id, imputable, activa, moneda_original, requiere_cotizacion)
SELECT * FROM (VALUES
    -- Gastos más específicos
    ('5.02.009', 'IMPUESTOS Y TASAS', 'egreso', 3, null, true, true, 'ARS', true),
    ('5.02.010', 'PUBLICIDAD Y MARKETING', 'egreso', 3, null, true, true, 'ARS', true),
    ('5.02.011', 'MANTENIMIENTO Y REPARACIONES', 'egreso', 3, null, true, true, 'ARS', true),
    ('5.02.012', 'SEGUROS', 'egreso', 3, null, true, true, 'ARS', true),
    ('5.02.013', 'GASTOS DE COMUNICACIONES', 'egreso', 3, null, true, true, 'ARS', true),
    ('5.02.014', 'HONORARIOS PROFESIONALES', 'egreso', 3, null, true, true, 'ARS', true)
) AS nuevas_cuentas(codigo, nombre, tipo, nivel, padre_id, imputable, activa, moneda_original, requiere_cotizacion)
WHERE NOT EXISTS (
    SELECT 1 FROM plan_cuentas pc 
    WHERE pc.codigo = nuevas_cuentas.codigo
);

-- ==========================================
-- ACTUALIZAR NOMBRES PARA MAYOR CLARIDAD (OPCIONAL)
-- ==========================================

-- Actualizar algunos nombres para que sean más descriptivos
UPDATE plan_cuentas SET 
    nombre = 'COMPRAS A PROVEEDORES',
    updated_at = NOW()
WHERE codigo = '5.01.001' AND nombre = 'CMV PESOS';

-- ==========================================
-- MAPEO ACTUALIZADO DE CATEGORÍAS
-- ==========================================

-- Mostrar el mapeo actualizado usando tus cuentas existentes
SELECT 'MAPEO DE CATEGORÍAS DE GASTOS A CUENTAS EXISTENTES' as info;

SELECT * FROM (VALUES
    ('proveedor', '5.01.001', 'COMPRAS A PROVEEDORES (antes CMV PESOS)'),
    ('servicios', '5.02.002', 'SERVICIOS PUBLICOS'),
    ('alquiler', '5.02.001', 'ALQUILERES'),
    ('sueldos', '5.02.003', 'SUELDOS Y JORNALES'),
    ('impuestos', '5.02.009', 'IMPUESTOS Y TASAS (nueva)'),
    ('transporte', '5.02.006', 'GASTOS DE VEHICULO'),
    ('marketing', '5.02.010', 'PUBLICIDAD Y MARKETING (nueva)'),
    ('mantenimiento', '5.02.011', 'MANTENIMIENTO Y REPARACIONES (nueva)'),
    ('administrativos', '5.02.005', 'GASTOS DE OFICINA'),
    ('otros', '5.02.005', 'GASTOS DE OFICINA (fallback)')
) AS mapeo(categoria_gasto, codigo_cuenta, nombre_cuenta_descripcion);

-- ==========================================
-- VERIFICAR ESTRUCTURA FINAL
-- ==========================================

-- Mostrar todas las cuentas de gastos (5.x)
SELECT 
    codigo,
    nombre,
    tipo,
    imputable,
    activa,
    moneda_original,
    requiere_cotizacion
FROM plan_cuentas 
WHERE codigo LIKE '5.%' 
  AND activa = true
ORDER BY codigo;

-- Contar cuentas por categoría
SELECT 
    CASE 
        WHEN codigo LIKE '5.01.%' THEN 'Costo de Mercadería Vendida'
        WHEN codigo LIKE '5.02.%' THEN 'Gastos Operativos'
        ELSE 'Otros Gastos'
    END as categoria,
    COUNT(*) as cantidad_cuentas,
    STRING_AGG(codigo || ' - ' || nombre, E'\n') as cuentas
FROM plan_cuentas 
WHERE codigo LIKE '5.%' AND activa = true
GROUP BY 
    CASE 
        WHEN codigo LIKE '5.01.%' THEN 'Costo de Mercadería Vendida'
        WHEN codigo LIKE '5.02.%' THEN 'Gastos Operativos'
        ELSE 'Otros Gastos'
    END
ORDER BY categoria;

-- ==========================================
-- MOSTRAR CUENTAS DE CAJA/BANCO DISPONIBLES
-- ==========================================

SELECT 'CUENTAS DISPONIBLES PARA MÉTODOS DE PAGO' as info;

SELECT 
    codigo,
    nombre,
    CASE 
        WHEN codigo LIKE '1.01.%' THEN 'CAJA'
        WHEN codigo LIKE '1.02.%' THEN 'BANCO'
        WHEN codigo LIKE '1.03.%' THEN 'OTROS MEDIOS'
        ELSE 'OTROS'
    END as tipo_cuenta,
    moneda_original,
    CASE WHEN requiere_cotizacion THEN 'Sí' ELSE 'No' END as requiere_cotizacion
FROM plan_cuentas 
WHERE codigo LIKE '1.0%' 
  AND activa = true
  AND tipo = 'activo'
ORDER BY codigo;

SELECT 'PLAN DE CUENTAS OPTIMIZADO PARA GASTOS OPERATIVOS' as resultado;