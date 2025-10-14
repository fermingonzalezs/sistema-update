-- =====================================================
-- ACTUALIZAR CONSTRAINT DE tipo_producto EN venta_items
-- =====================================================
-- Este script actualiza el CHECK constraint para permitir
-- las nuevas categorías específicas en lugar de solo 'otro'
-- =====================================================

-- 1. Eliminar el constraint antiguo
ALTER TABLE venta_items
DROP CONSTRAINT IF EXISTS ventaitems_tipo_producto_check;

-- 2. Crear el nuevo constraint con todas las categorías
ALTER TABLE venta_items
ADD CONSTRAINT ventaitems_tipo_producto_check
CHECK (tipo_producto IN (
  'computadora',
  'celular',
  'perifericos',
  'monitores',
  'componentes',
  'accesorios',
  'fundas_templados',
  'otro'
));

-- 3. Agregar comentario explicativo
COMMENT ON CONSTRAINT ventaitems_tipo_producto_check ON venta_items IS
'Constraint actualizado: permite categorías específicas de productos (perifericos, monitores, componentes, accesorios, fundas_templados) además de computadora, celular y otro';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ver el constraint actual
SELECT
    tc.constraint_name,
    tc.table_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'venta_items'
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name = 'ventaitems_tipo_producto_check';

-- Ver valores únicos actuales en tipo_producto
SELECT DISTINCT tipo_producto, COUNT(*) as cantidad
FROM venta_items
GROUP BY tipo_producto
ORDER BY tipo_producto;

-- =====================================================
-- NOTAS:
-- =====================================================
-- Después de esta migración, venta_items.tipo_producto acepta:
--   - 'computadora' (notebooks)
--   - 'celular' (celulares)
--   - 'perifericos' (periféricos)
--   - 'monitores' (monitores)
--   - 'componentes' (componentes)
--   - 'accesorios' (accesorios)
--   - 'fundas_templados' (fundas y templados)
--   - 'otro' (para otros productos no categorizados)
-- =====================================================
