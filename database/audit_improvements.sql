-- ============================================
-- MEJORAS DE AUDITORÍA - SCRIPT SQL
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================

-- Índice compuesto para búsquedas por categoría y fecha (el más usado)
CREATE INDEX IF NOT EXISTS idx_audit_log_categoria_created 
ON audit_log(categoria, created_at DESC);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_audit_log_user_email 
ON audit_log(user_email);

-- Índice para búsquedas por operación
CREATE INDEX IF NOT EXISTS idx_audit_log_operation 
ON audit_log(operation);

-- Índice para búsquedas por tabla
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name 
ON audit_log(table_name);

-- Índice GIN para búsquedas en old_values (serial, modelo, etc.)
CREATE INDEX IF NOT EXISTS idx_audit_log_old_values_gin 
ON audit_log USING gin(old_values);

-- Índice para razón de operación
CREATE INDEX IF NOT EXISTS idx_audit_log_razon 
ON audit_log(razon_operacion);

-- ============================================
-- 2. VISTAS POR CATEGORÍA
-- ============================================

-- Vista: Auditoría de Ventas
CREATE OR REPLACE VIEW audit_ventas AS
SELECT 
  id,
  created_at as fecha,
  user_email as usuario,
  user_role as rol,
  user_branch as sucursal,
  table_name as tabla,
  operation as operacion,
  razon_operacion as razon,
  old_values,
  new_values,
  changed_fields as campos_modificados,
  referencia_id,
  description as descripcion,
  severity as severidad
FROM audit_log 
WHERE categoria = 'ventas'
ORDER BY created_at DESC;

-- Vista: Auditoría de Inventario
CREATE OR REPLACE VIEW audit_inventario AS
SELECT 
  id,
  created_at as fecha,
  user_email as usuario,
  user_role as rol,
  user_branch as sucursal,
  table_name as tabla,
  operation as operacion,
  razon_operacion as razon,
  old_values,
  new_values,
  changed_fields as campos_modificados,
  referencia_id,
  description as descripcion,
  severity as severidad,
  -- Campos extraídos para facilitar búsquedas
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'precio_venta_usd' as precio_usd
FROM audit_log 
WHERE categoria = 'inventario'
ORDER BY created_at DESC;

-- Vista: Auditoría de Contabilidad
CREATE OR REPLACE VIEW audit_contabilidad AS
SELECT 
  id,
  created_at as fecha,
  user_email as usuario,
  user_role as rol,
  table_name as tabla,
  operation as operacion,
  old_values,
  new_values,
  changed_fields as campos_modificados,
  description as descripcion,
  severity as severidad
FROM audit_log 
WHERE categoria = 'contabilidad'
ORDER BY created_at DESC;

-- Vista: Auditoría de Soporte
CREATE OR REPLACE VIEW audit_soporte AS
SELECT 
  id,
  created_at as fecha,
  user_email as usuario,
  user_role as rol,
  user_branch as sucursal,
  table_name as tabla,
  operation as operacion,
  old_values,
  new_values,
  changed_fields as campos_modificados,
  description as descripcion,
  severity as severidad
FROM audit_log 
WHERE categoria = 'soporte'
ORDER BY created_at DESC;

-- Vista: Auditoría de Importaciones
CREATE OR REPLACE VIEW audit_importaciones AS
SELECT 
  id,
  created_at as fecha,
  user_email as usuario,
  user_role as rol,
  table_name as tabla,
  operation as operacion,
  old_values,
  new_values,
  changed_fields as campos_modificados,
  description as descripcion,
  severity as severidad
FROM audit_log 
WHERE categoria = 'importaciones'
ORDER BY created_at DESC;

-- Vista: Auditoría de Administración (logins, logouts, etc.)
CREATE OR REPLACE VIEW audit_administracion AS
SELECT 
  id,
  created_at as fecha,
  user_email as usuario,
  user_role as rol,
  user_branch as sucursal,
  table_name as tabla,
  operation as operacion,
  old_values,
  new_values,
  description as descripcion,
  severity as severidad
FROM audit_log 
WHERE categoria = 'administracion'
ORDER BY created_at DESC;

-- Vista: Auditoría de Sistema
CREATE OR REPLACE VIEW audit_sistema AS
SELECT 
  id,
  created_at as fecha,
  user_email as usuario,
  user_role as rol,
  table_name as tabla,
  operation as operacion,
  old_values,
  new_values,
  description as descripcion,
  severity as severidad
FROM audit_log 
WHERE categoria = 'sistema'
ORDER BY created_at DESC;

-- ============================================
-- 3. FUNCIÓN HELPER PARA ESTADÍSTICAS
-- ============================================

CREATE OR REPLACE FUNCTION get_audit_stats(days_back integer DEFAULT 7)
RETURNS TABLE (
  categoria text,
  inserts bigint,
  updates bigint,
  deletes bigint,
  total bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.categoria,
    COUNT(*) FILTER (WHERE al.operation = 'INSERT') as inserts,
    COUNT(*) FILTER (WHERE al.operation = 'UPDATE') as updates,
    COUNT(*) FILTER (WHERE al.operation = 'DELETE') as deletes,
    COUNT(*) as total
  FROM audit_log al
  WHERE al.created_at > NOW() - (days_back || ' days')::interval
  GROUP BY al.categoria
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================

-- Ejecutar para verificar que todo se creó correctamente:
-- SELECT * FROM audit_ventas LIMIT 5;
-- SELECT * FROM audit_inventario LIMIT 5;
-- SELECT * FROM get_audit_stats(7);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
