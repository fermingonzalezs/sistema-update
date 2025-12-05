-- =====================================================
-- MIGRACIÓN: Normalización de Campos de Productos
-- =====================================================
-- Este script convierte campos TEXT a numéricos y agrega
-- la columna linea_procesador para notebooks
--
-- IMPORTANTE: El usuario ejecutará esta migración DESPUÉS
-- de convertir manualmente los datos existentes a formato numérico
-- =====================================================

-- =====================================================
-- TABLA: inventario (Notebooks/Computadoras)
-- =====================================================

-- Paso 1: Convertir campos TEXT a numéricos
ALTER TABLE inventario
  ALTER COLUMN ram TYPE INTEGER USING NULLIF(regexp_replace(ram, '[^0-9]', '', 'g'), '')::INTEGER,
  ALTER COLUMN ssd TYPE INTEGER USING NULLIF(regexp_replace(ssd, '[^0-9]', '', 'g'), '')::INTEGER,
  ALTER COLUMN hdd TYPE INTEGER USING NULLIF(regexp_replace(hdd, '[^0-9]', '', 'g'), '')::INTEGER,
  ALTER COLUMN pantalla TYPE DECIMAL(4,2) USING NULLIF(regexp_replace(pantalla, '[^0-9.]', '', 'g'), '')::DECIMAL(4,2);

-- Paso 2: Agregar columna linea_procesador
ALTER TABLE inventario
  ADD COLUMN IF NOT EXISTS linea_procesador TEXT DEFAULT 'otro';

-- Paso 3: Agregar constraint para valores válidos de linea_procesador
ALTER TABLE inventario
  ADD CONSTRAINT check_linea_procesador
  CHECK (linea_procesador IN (
    'i3', 'i5', 'i7', 'i9',
    'r3', 'r5', 'r7', 'r9',
    'm1', 'm2', 'm3', 'm4', 'm5',
    'otro'
  ));

-- Paso 4: Agregar comentarios descriptivos
COMMENT ON COLUMN inventario.ram IS 'RAM en GB (numérico)';
COMMENT ON COLUMN inventario.ssd IS 'SSD en GB (numérico)';
COMMENT ON COLUMN inventario.hdd IS 'HDD en GB (numérico)';
COMMENT ON COLUMN inventario.pantalla IS 'Tamaño de pantalla en pulgadas (numérico, usar punto decimal ej: 15.6)';
COMMENT ON COLUMN inventario.linea_procesador IS 'Línea de procesador: i3-i9 (Intel), r3-r9 (AMD), m1-m5 (Apple), otro';

-- =====================================================
-- TABLA: celulares (Smartphones)
-- =====================================================

-- Paso 1: Convertir campos TEXT a numéricos
ALTER TABLE celulares
  ALTER COLUMN capacidad TYPE INTEGER USING NULLIF(regexp_replace(capacidad, '[^0-9]', '', 'g'), '')::INTEGER,
  ALTER COLUMN ram TYPE INTEGER USING NULLIF(regexp_replace(ram, '[^0-9]', '', 'g'), '')::INTEGER;

-- Paso 2: Agregar comentarios descriptivos
COMMENT ON COLUMN celulares.capacidad IS 'Capacidad de almacenamiento en GB (numérico)';
COMMENT ON COLUMN celulares.ram IS 'Memoria RAM en GB (numérico)';

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar migración exitosa para inventario
DO $$
DECLARE
  total_notebooks INTEGER;
  notebooks_ram_null INTEGER;
  notebooks_ssd_null INTEGER;
  notebooks_pantalla_null INTEGER;
  notebooks_linea_null INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_notebooks FROM inventario;
  SELECT COUNT(*) INTO notebooks_ram_null FROM inventario WHERE ram IS NULL;
  SELECT COUNT(*) INTO notebooks_ssd_null FROM inventario WHERE ssd IS NULL;
  SELECT COUNT(*) INTO notebooks_pantalla_null FROM inventario WHERE pantalla IS NULL;
  SELECT COUNT(*) INTO notebooks_linea_null FROM inventario WHERE linea_procesador IS NULL;

  RAISE NOTICE '================================';
  RAISE NOTICE 'VERIFICACIÓN INVENTARIO (Notebooks)';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total notebooks: %', total_notebooks;
  RAISE NOTICE 'RAM NULL: % (%.1f%%)', notebooks_ram_null, (notebooks_ram_null::DECIMAL / NULLIF(total_notebooks, 0) * 100);
  RAISE NOTICE 'SSD NULL: % (%.1f%%)', notebooks_ssd_null, (notebooks_ssd_null::DECIMAL / NULLIF(total_notebooks, 0) * 100);
  RAISE NOTICE 'Pantalla NULL: % (%.1f%%)', notebooks_pantalla_null, (notebooks_pantalla_null::DECIMAL / NULLIF(total_notebooks, 0) * 100);
  RAISE NOTICE 'Línea procesador NULL: % (%.1f%%)', notebooks_linea_null, (notebooks_linea_null::DECIMAL / NULLIF(total_notebooks, 0) * 100);
  RAISE NOTICE '================================';
END $$;

-- Verificar migración exitosa para celulares
DO $$
DECLARE
  total_celulares INTEGER;
  celulares_capacidad_null INTEGER;
  celulares_ram_null INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_celulares FROM celulares;
  SELECT COUNT(*) INTO celulares_capacidad_null FROM celulares WHERE capacidad IS NULL;
  SELECT COUNT(*) INTO celulares_ram_null FROM celulares WHERE ram IS NULL;

  RAISE NOTICE '================================';
  RAISE NOTICE 'VERIFICACIÓN CELULARES (Smartphones)';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total celulares: %', total_celulares;
  RAISE NOTICE 'Capacidad NULL: % (%.1f%%)', celulares_capacidad_null, (celulares_capacidad_null::DECIMAL / NULLIF(total_celulares, 0) * 100);
  RAISE NOTICE 'RAM NULL: % (%.1f%%)', celulares_ram_null, (celulares_ram_null::DECIMAL / NULLIF(total_celulares, 0) * 100);
  RAISE NOTICE '================================';
END $$;

-- Mostrar muestras de datos migrados
RAISE NOTICE 'Mostrando muestras de datos migrados...';

-- Muestra de notebooks
SELECT
  serial,
  ram as "RAM (GB)",
  ssd as "SSD (GB)",
  hdd as "HDD (GB)",
  pantalla as "Pantalla (pulgadas)",
  linea_procesador as "Línea Procesador"
FROM inventario
LIMIT 10;

-- Muestra de celulares
SELECT
  serial,
  capacidad as "Capacidad (GB)",
  ram as "RAM (GB)"
FROM celulares
LIMIT 10;

-- =====================================================
-- ROLLBACK (Solo ejecutar si algo sale mal)
-- =====================================================
-- ADVERTENCIA: Esto revertirá los cambios. Solo ejecutar si es necesario.
--
-- Para revertir, descomentar y ejecutar:
--
-- ALTER TABLE inventario
--   ALTER COLUMN ram TYPE TEXT,
--   ALTER COLUMN ssd TYPE TEXT,
--   ALTER COLUMN hdd TYPE TEXT,
--   ALTER COLUMN pantalla TYPE TEXT,
--   DROP CONSTRAINT IF EXISTS check_linea_procesador,
--   DROP COLUMN IF EXISTS linea_procesador;
--
-- ALTER TABLE celulares
--   ALTER COLUMN capacidad TYPE TEXT,
--   ALTER COLUMN ram TYPE TEXT;
--
-- RAISE NOTICE 'Rollback completado. Los datos numéricos se han convertido de vuelta a TEXT.';
-- RAISE NOTICE 'IMPORTANTE: Necesitarás restaurar los valores originales desde un backup.';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
