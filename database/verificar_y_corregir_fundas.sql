-- =====================================================
-- VERIFICAR Y CORREGIR CATEGORÍA DE FUNDAS
-- =====================================================

-- PASO 1: Verificar qué categorías tienen las fundas actuales
-- (Ejecutar primero para ver el estado actual)
SELECT
    id,
    nombre_producto,
    categoria,
    precio_venta_usd,
    cantidad_la_plata,
    cantidad_mitre,
    created_at
FROM otros
WHERE
    LOWER(nombre_producto) LIKE '%funda%'
    OR LOWER(nombre_producto) LIKE '%templado%'
    OR LOWER(descripcion) LIKE '%funda%'
    OR LOWER(descripcion) LIKE '%templado%'
ORDER BY created_at DESC;

-- =====================================================
-- PASO 2: Si las fundas tienen categoría incorrecta, corregirlas
-- (Solo ejecutar si el PASO 1 muestra que las fundas NO tienen categoria = 'FUNDAS_TEMPLADOS')
-- =====================================================

-- Opción A: Actualizar todas las fundas/templados a la nueva categoría
UPDATE otros
SET categoria = 'FUNDAS_TEMPLADOS'
WHERE
    LOWER(nombre_producto) LIKE '%funda%'
    OR LOWER(nombre_producto) LIKE '%templado%'
    OR LOWER(descripcion) LIKE '%funda%'
    OR LOWER(descripcion) LIKE '%templado%';

-- Opción B: Si sabes los IDs específicos, actualizar por ID
-- UPDATE otros
-- SET categoria = 'FUNDAS_TEMPLADOS'
-- WHERE id IN (123, 124, 125);  -- Reemplazar con IDs reales

-- =====================================================
-- PASO 3: Verificar que la actualización funcionó
-- =====================================================
SELECT
    categoria,
    COUNT(*) as cantidad_productos
FROM otros
WHERE categoria = 'FUNDAS_TEMPLADOS'
GROUP BY categoria;

-- Debería mostrar algo como:
-- categoria         | cantidad_productos
-- ------------------|-------------------
-- FUNDAS_TEMPLADOS  | 5

-- =====================================================
-- PASO 4: Ver todos los productos FUNDAS_TEMPLADOS
-- =====================================================
SELECT
    id,
    nombre_producto,
    categoria,
    precio_venta_usd,
    cantidad_la_plata + cantidad_mitre as stock_total
FROM otros
WHERE categoria = 'FUNDAS_TEMPLADOS'
ORDER BY nombre_producto;

-- =====================================================
-- INFORMACIÓN ADICIONAL
-- =====================================================
-- Si después de ejecutar esto aún no aparecen en el catálogo:
-- 1. Verifica que los productos tengan stock > 0 (cantidad_la_plata o cantidad_mitre)
-- 2. Verifica que la categoría sea exactamente 'FUNDAS_TEMPLADOS' (mayúsculas)
-- 3. Refresca el navegador (Ctrl+F5) para limpiar el cache
-- 4. Revisa la consola del navegador (F12) para ver si hay errores
-- =====================================================
