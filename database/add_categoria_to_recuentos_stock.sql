-- =====================================================
-- AGREGAR CAMPO CATEGORIA A TABLA RECUENTOS_STOCK
-- =====================================================
-- Este script agrega el campo 'categoria' para soportar
-- recuentos por categoría individual en vez de todo junto
-- =====================================================

-- 1. Agregar columna categoria (opcional para registros legacy)
ALTER TABLE recuentos_stock
ADD COLUMN IF NOT EXISTS categoria TEXT;

-- 2. Agregar comentario explicativo
COMMENT ON COLUMN recuentos_stock.categoria IS 
'Categoría del recuento: notebooks, celulares, o otros_SUBCATEGORIA (ej: otros_AUDIO, otros_MONITORES)';

-- 3. Crear índice para mejorar consultas por sucursal+categoria
CREATE INDEX IF NOT EXISTS idx_recuentos_sucursal_categoria 
ON recuentos_stock(sucursal, categoria);

-- 4. Actualizar registros legacy (opcional - asignar 'todas' a los existentes)
UPDATE recuentos_stock
SET categoria = 'todas'
WHERE categoria IS NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que la columna fue creada correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recuentos_stock' AND column_name = 'categoria';

-- Ver estructura completa de la tabla
-- SELECT * FROM information_schema.columns WHERE table_name = 'recuentos_stock';
