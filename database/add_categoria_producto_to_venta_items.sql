-- =====================================================
-- AGREGAR CAMPO CATEGORIA_PRODUCTO A VENTA_ITEMS
-- =====================================================
-- Este script agrega un campo opcional para almacenar
-- la categoría específica de productos tipo "otro"
-- =====================================================

-- 1. Agregar columna categoria_producto (opcional)
ALTER TABLE venta_items
ADD COLUMN IF NOT EXISTS categoria_producto TEXT;

-- 2. Agregar comentario explicativo
COMMENT ON COLUMN venta_items.categoria_producto IS
'Categoría específica del producto cuando tipo_producto = otro. Ej: accesorios, monitores, perifericos, componentes, fundas_templados';

-- 3. Actualizar registros existentes que tengan categoría en tipo_producto
-- (esto es por si ya hay datos con categorías en tipo_producto por error)
UPDATE venta_items
SET categoria_producto = tipo_producto,
    tipo_producto = 'otro'
WHERE tipo_producto NOT IN ('computadora', 'celular', 'otro');

-- 4. Crear índice para mejorar consultas por categoría
CREATE INDEX IF NOT EXISTS idx_venta_items_categoria_producto
ON venta_items(categoria_producto)
WHERE categoria_producto IS NOT NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que no haya tipo_producto inválidos
SELECT DISTINCT tipo_producto
FROM venta_items
WHERE tipo_producto NOT IN ('computadora', 'celular', 'otro');
-- Este query debe devolver 0 filas

-- Ver distribución de categorías
SELECT
    tipo_producto,
    categoria_producto,
    COUNT(*) as cantidad
FROM venta_items
GROUP BY tipo_producto, categoria_producto
ORDER BY tipo_producto, categoria_producto;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- Después de ejecutar esta migración, actualizar el código en:
-- src/modules/ventas/hooks/useVentas.js
--
-- Cambiar la línea:
--   tipo_producto: tipoProducto
--
-- Por:
--   tipo_producto: item.tipo === 'otro' ? 'otro' : item.tipo,
--   categoria_producto: item.tipo === 'otro' && item.categoria ? item.categoria : null
-- =====================================================
