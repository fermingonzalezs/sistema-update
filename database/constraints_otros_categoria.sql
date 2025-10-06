-- =====================================================
-- CONSTRAINTS PARA TABLA OTROS - CATEGORÍAS
-- =====================================================
-- Este script agrega un constraint CHECK para validar
-- que solo se permitan las 5 categorías válidas en la
-- tabla 'otros'
-- =====================================================

-- 1. Primero, eliminar el constraint si ya existe (por si se ejecuta múltiples veces)
ALTER TABLE otros
DROP CONSTRAINT IF EXISTS check_categoria_valida;

-- 2. Agregar el constraint CHECK con las 5 categorías permitidas
ALTER TABLE otros
ADD CONSTRAINT check_categoria_valida
CHECK (categoria IN (
    'ACCESORIOS',
    'MONITORES',
    'PERIFERICOS',
    'COMPONENTES',
    'FUNDAS_TEMPLADOS'
));

-- 3. (OPCIONAL) Actualizar categorías existentes que no cumplan con el estándar
-- Si hay datos legacy, puedes ejecutar estas actualizaciones antes del constraint:

-- Normalizar categorías legacy a las nuevas categorías
UPDATE otros SET categoria = 'ACCESORIOS' WHERE LOWER(categoria) IN ('gadgets', 'audio', 'apple', 'otros', 'accesorios');
UPDATE otros SET categoria = 'MONITORES' WHERE LOWER(categoria) = 'monitores';
UPDATE otros SET categoria = 'PERIFERICOS' WHERE LOWER(categoria) IN ('teclados', 'mouse', 'perifericos');
UPDATE otros SET categoria = 'COMPONENTES' WHERE LOWER(categoria) IN ('procesadores', 'motherboards', 'componentes');
UPDATE otros SET categoria = 'FUNDAS_TEMPLADOS' WHERE LOWER(categoria) IN ('fundas', 'templados', 'fundas_templados', 'fundas/templados');

-- 4. Verificar que todas las categorías estén normalizadas
-- Este query debe devolver 0 filas. Si devuelve filas, hay categorías no normalizadas
SELECT DISTINCT categoria
FROM otros
WHERE categoria NOT IN (
    'ACCESORIOS',
    'MONITORES',
    'PERIFERICOS',
    'COMPONENTES',
    'FUNDAS_TEMPLADOS'
);

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Conéctate a Supabase SQL Editor
-- 2. Ejecuta PRIMERO el paso 3 (normalización) si tienes datos legacy
-- 3. Verifica con el paso 4 que no haya categorías inválidas
-- 4. Finalmente ejecuta los pasos 1 y 2 para agregar el constraint
--
-- NOTA: Si el paso 4 devuelve filas, significa que hay categorías
-- que no están contempladas. Deberás decidir a qué categoría
-- normalizar esos registros antes de aplicar el constraint.
-- =====================================================

-- =====================================================
-- OPCIONAL: Agregar índice para mejorar performance en búsquedas
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_otros_categoria ON otros(categoria);

-- =====================================================
-- INFORMACIÓN DEL CONSTRAINT
-- =====================================================
-- Después de aplicar este constraint:
-- ✅ Solo se pueden insertar las 5 categorías válidas
-- ✅ Las validaciones son a nivel de base de datos (más seguro)
-- ✅ Cualquier cliente (web, API, SQL directo) respeta las reglas
-- ✅ Previene inconsistencias en los datos
-- =====================================================
