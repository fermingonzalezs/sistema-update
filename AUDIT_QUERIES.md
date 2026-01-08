# 📊 Sistema de Auditoría - Consultas Útiles

## ✅ Sistema Implementado

### **Mejoras Realizadas:**

1. **Columna `categoria`** agregada a `audit_log`
   - Valores: `ventas`, `contabilidad`, `inventario`, `soporte`, `importaciones`, `administracion`, `sistema`
   - Se asigna automáticamente según la tabla

2. **Captura de usuario** mejorada
   - Ahora captura `user_email`, `user_role`, `user_branch` correctamente
   - Se configura automáticamente al hacer login

3. **Servicio de auditoría** en React
   - `setAuditContext(user)` - Se ejecuta en login
   - `clearAuditContext()` - Se ejecuta en logout
   - `logLoginEvent(user)` - Registra logins
   - `logLogoutEvent(user)` - Registra logouts

---

## 📝 Consultas SQL Útiles

### **1. Ver Eliminaciones Recientes por Categoría** ⭐ MEJORADO

```sql
-- 🛍️ PRODUCTOS VENDIDOS (últimos 7 días)
SELECT
  created_at as fecha_venta,
  user_email as vendedor,
  table_name as tipo_producto,
  referencia_id as transaccion_id,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'precio_venta_usd' as precio
FROM audit_log
WHERE categoria = 'inventario'
  AND operation = 'DELETE'
  AND razon_operacion = 'venta'  -- ⭐ SOLO VENTAS
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- ⚠️ ELIMINACIONES MANUALES (últimos 7 días)
SELECT
  created_at as fecha,
  user_email as quien_elimino,
  user_role as rol,
  table_name as tipo_producto,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'precio_venta_usd' as precio_perdido
FROM audit_log
WHERE categoria = 'inventario'
  AND operation = 'DELETE'
  AND razon_operacion = 'eliminacion_manual'  -- ⭐ SOLO ELIMINACIONES MANUALES
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- 📊 COMPARACIÓN: Ventas vs Eliminaciones
SELECT
  razon_operacion,
  COUNT(*) as cantidad,
  SUM((old_values->>'precio_venta_usd')::numeric) as valor_total_usd
FROM audit_log
WHERE categoria = 'inventario'
  AND operation = 'DELETE'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY razon_operacion
ORDER BY razon_operacion;
```

```sql
-- 🔍 ELIMINACIONES DE VENTAS (últimos 7 días)
SELECT
  created_at as fecha,
  user_email as usuario,
  table_name as tabla,
  old_values->>'numero_transaccion' as numero_venta,
  old_values->>'cliente_nombre' as cliente,
  old_values->>'total_venta' as total
FROM audit_log
WHERE categoria = 'ventas'
  AND operation = 'DELETE'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- 🔍 ELIMINACIONES DE CONTABILIDAD (últimos 7 días)
SELECT
  created_at as fecha,
  user_email as usuario,
  table_name as tabla,
  old_values->>'numero' as numero_asiento,
  old_values->>'fecha' as fecha_asiento,
  old_values->>'descripcion' as descripcion,
  old_values->>'total_debe' as debe,
  old_values->>'total_haber' as haber
FROM audit_log
WHERE categoria = 'contabilidad'
  AND operation = 'DELETE'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

### **2. Buscar Equipo Eliminado por Serial**

```sql
-- 🔍 BUSCAR POR SERIAL
SELECT
  created_at as cuando_se_elimino,
  user_email as quien_elimino,
  user_role as rol,
  user_branch as sucursal,
  table_name as tipo_producto,
  old_values as datos_completos
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND old_values->>'serial' = 'FN4VVH4MV4'  -- 👈 Cambiar por el serial buscado
ORDER BY created_at DESC;
```

---

### **3. Actividad por Usuario**

```sql
-- 📊 RESUMEN DE ACTIVIDAD POR USUARIO (últimos 30 días)
SELECT
  user_email,
  user_role,
  categoria,
  operation,
  COUNT(*) as cantidad
FROM audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
  AND user_email IS NOT NULL  -- Solo operaciones con usuario identificado
GROUP BY user_email, user_role, categoria, operation
ORDER BY user_email, categoria, cantidad DESC;
```

```sql
-- 📊 ELIMINACIONES POR USUARIO
SELECT
  user_email,
  user_role,
  categoria,
  COUNT(*) as eliminaciones,
  MIN(created_at) as primera,
  MAX(created_at) as ultima
FROM audit_log
WHERE operation = 'DELETE'
  AND created_at > NOW() - INTERVAL '30 days'
  AND user_email IS NOT NULL
GROUP BY user_email, user_role, categoria
ORDER BY eliminaciones DESC;
```

---

### **4. Filtros por Modelo/Producto**

```sql
-- 🔍 SOLO iPhone 17 Pro (sin Pro Max)
SELECT
  created_at,
  user_email,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'color' as color,
  old_values->>'precio_venta_usd' as precio
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND table_name = 'celulares'
  AND old_values->>'modelo' = 'iPhone 17 Pro '  -- Nota el espacio al final
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- 🔍 Cualquier iPhone 17 (incluye Pro, Pro Max, base)
SELECT
  created_at,
  user_email,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'capacidad' as capacidad,
  old_values->>'color' as color
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND table_name = 'celulares'
  AND old_values->>'modelo' LIKE '%iPhone 17%'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- 🔍 MacBooks eliminadas
SELECT
  created_at,
  user_email,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'procesador' as procesador,
  old_values->>'precio_venta_usd' as precio
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND table_name = 'inventario'
  AND old_values->>'categoria' = 'macbook'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

---

### **5. Cambios en Productos (UPDATE)**

```sql
-- 🔍 CAMBIOS DE PRECIO (últimos 7 días)
SELECT
  created_at,
  user_email,
  table_name,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'precio_venta_usd' as precio_anterior,
  new_values->>'precio_venta_usd' as precio_nuevo,
  (new_values->>'precio_venta_usd')::numeric - (old_values->>'precio_venta_usd')::numeric as diferencia
FROM audit_log
WHERE operation = 'UPDATE'
  AND categoria = 'inventario'
  AND 'precio_venta_usd' = ANY(changed_fields)
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- 🔍 CAMBIOS DE CONDICIÓN (nuevo → usado, etc.)
SELECT
  created_at,
  user_email,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'condicion' as condicion_anterior,
  new_values->>'condicion' as condicion_nueva
FROM audit_log
WHERE operation = 'UPDATE'
  AND categoria = 'inventario'
  AND 'condicion' = ANY(changed_fields)
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- 🔍 CAMBIOS DE SUCURSAL (movimientos entre sucursales)
SELECT
  created_at,
  user_email,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'sucursal' as sucursal_anterior,
  new_values->>'sucursal' as sucursal_nueva
FROM audit_log
WHERE operation = 'UPDATE'
  AND categoria = 'inventario'
  AND 'sucursal' = ANY(changed_fields)
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

### **6. Logins y Seguridad**

```sql
-- 🔐 HISTORIAL DE LOGINS (últimos 7 días)
SELECT
  created_at,
  user_email,
  user_role,
  user_branch,
  description
FROM audit_log
WHERE operation = 'LOGIN'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

```sql
-- 🚨 ACTIVIDAD SOSPECHOSA (muchas eliminaciones en poco tiempo)
SELECT
  user_email,
  DATE(created_at) as fecha,
  COUNT(*) as eliminaciones,
  string_agg(DISTINCT table_name, ', ') as tablas_afectadas
FROM audit_log
WHERE operation = 'DELETE'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_email, DATE(created_at)
HAVING COUNT(*) > 10  -- Más de 10 eliminaciones en un día
ORDER BY eliminaciones DESC;
```

---

### **7. Dashboard de Actividad**

```sql
-- 📊 RESUMEN DIARIO POR CATEGORÍA (últimos 7 días)
SELECT
  DATE(created_at) as fecha,
  categoria,
  COUNT(*) FILTER (WHERE operation = 'INSERT') as creaciones,
  COUNT(*) FILTER (WHERE operation = 'UPDATE') as modificaciones,
  COUNT(*) FILTER (WHERE operation = 'DELETE') as eliminaciones,
  COUNT(*) as total
FROM audit_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), categoria
ORDER BY fecha DESC, categoria;
```

```sql
-- 📊 TOP USUARIOS MÁS ACTIVOS (últimos 30 días)
SELECT
  user_email,
  user_role,
  COUNT(*) as operaciones_totales,
  COUNT(*) FILTER (WHERE operation = 'INSERT') as creaciones,
  COUNT(*) FILTER (WHERE operation = 'UPDATE') as modificaciones,
  COUNT(*) FILTER (WHERE operation = 'DELETE') as eliminaciones
FROM audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
  AND user_email IS NOT NULL
GROUP BY user_email, user_role
ORDER BY operaciones_totales DESC
LIMIT 10;
```

---

## 🔧 Consultas de Mantenimiento

### **Limpiar logs antiguos (mantener 6 meses)**

```sql
-- ⚠️ EJECUTAR CON CUIDADO
DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '6 months'
  AND severity != 'critical';  -- Mantener logs críticos indefinidamente
```

### **Ver tamaño de la tabla audit_log**

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('audit_log')) as tamaño_total,
  count(*) as cantidad_registros
FROM audit_log;
```

---

## 💡 Tips de Uso

1. **Buscar serial específico**: Usa `old_values->>'serial' = 'ABC123'`
2. **Buscar por modelo parcial**: Usa `old_values->>'modelo' LIKE '%iPhone%'`
3. **Filtrar por fecha**: Usa `created_at > NOW() - INTERVAL '7 days'`
4. **Ver datos completos**: Selecciona `old_values` para ver todo el objeto JSON
5. **Filtrar por categoría**: Usa `WHERE categoria = 'inventario'`
6. **Ver cambios específicos**: Usa `WHERE 'campo' = ANY(changed_fields)`

---

## 🚀 Próximos Pasos Sugeridos

1. **Crear componente de visualización** en React para ver logs en la UI
2. **Agregar alertas** para eliminaciones masivas o cambios sospechosos
3. **Exportar reportes** en CSV/PDF de auditoría
4. **Dashboard de seguridad** con métricas en tiempo real
