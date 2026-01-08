# 🎯 Sistema de Razones de Operación - Auditoría Mejorada

## ✅ Implementación Completa

Ahora el sistema de auditoría diferencia entre:
- ✅ **Ventas** (eliminación por venta)
- ⚠️ **Eliminaciones manuales** (alguien borró sin vender)

---

## 📊 Columnas Nuevas en `audit_log`

### **1. `razon_operacion`**
Indica el contexto/razón de la operación.

**Valores para INVENTARIO (celulares, inventario, otros):**
- `venta` - Producto eliminado porque se vendió
- `eliminacion_manual` - Producto eliminado manualmente (sin venta)

### **2. `referencia_id`**
ID de la operación relacionada (transaccion_id, asiento_id, etc.)

---

## 🔧 Cómo Usar en el Código

### **En Ventas - Marcar como 'venta'**

Cuando proceses una venta y elimines productos del inventario, **DEBES** configurar el contexto antes:

```javascript
import { setOperationContext, clearOperationContext } from '../shared/services/auditService';

// En useVentas.js o donde proceses ventas
const procesarVenta = async (carrito, cliente, transaccionId) => {
  try {
    // ⭐ CONFIGURAR CONTEXTO ANTES DE ELIMINAR PRODUCTOS
    await setOperationContext('venta', transaccionId);

    // Eliminar productos del inventario
    for (const item of carrito) {
      if (item.tipo === 'celular') {
        await supabase
          .from('celulares')
          .delete()
          .eq('id', item.id);
        // ✅ El trigger capturará razon_operacion = 'venta'
        // ✅ Y referencia_id = transaccionId
      }

      if (item.tipo === 'notebook') {
        await supabase
          .from('inventario')
          .delete()
          .eq('id', item.id);
      }

      // ... otros tipos de productos
    }

    // ⭐ LIMPIAR CONTEXTO DESPUÉS
    await clearOperationContext();

    console.log('✅ Venta procesada con contexto de auditoría');

  } catch (error) {
    console.error('Error en venta:', error);
    await clearOperationContext(); // Limpiar incluso si hay error
  }
};
```

### **Eliminaciones Manuales - Se marca automáticamente**

Cuando eliminas un producto desde la UI (botón eliminar), **NO configures contexto**. Por defecto se marcará como `eliminacion_manual`:

```javascript
// En componentes de inventario
const eliminarProducto = async (productoId) => {
  // NO configurar contexto aquí
  await supabase
    .from('celulares')
    .delete()
    .eq('id', productoId);

  // ✅ El trigger capturará razon_operacion = 'eliminacion_manual'
  // ✅ porque no hay contexto configurado
};
```

---

## 📝 Consultas SQL Diferenciadas

### **1. Ver SOLO Ventas (productos vendidos)**

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
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND razon_operacion = 'venta'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### **2. Ver SOLO Eliminaciones Manuales (⚠️ sospechosas)**

```sql
-- ⚠️ ELIMINACIONES MANUALES (últimos 7 días)
SELECT
  created_at as cuando,
  user_email as quien,
  user_role as rol,
  table_name as tipo,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'precio_venta_usd' as precio_perdido
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND razon_operacion = 'eliminacion_manual'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### **3. Comparar Ventas vs Eliminaciones**

```sql
-- 📊 COMPARACIÓN: Ventas vs Eliminaciones (últimos 30 días)
SELECT
  razon_operacion,
  COUNT(*) as cantidad,
  COUNT(DISTINCT user_email) as usuarios,
  SUM((old_values->>'precio_venta_usd')::numeric) as valor_total_usd
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND razon_operacion IN ('venta', 'eliminacion_manual')
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY razon_operacion
ORDER BY razon_operacion;
```

**Resultado esperado:**
```
razon_operacion      | cantidad | usuarios | valor_total_usd
---------------------|----------|----------|----------------
venta                |   145    |    3     |   $125,450
eliminacion_manual   |     8    |    2     |    $6,200
```

### **4. Identificar Usuarios con Muchas Eliminaciones Manuales**

```sql
-- 🚨 USUARIOS CON ELIMINACIONES SOSPECHOSAS
SELECT
  user_email,
  user_role,
  COUNT(*) as eliminaciones_manuales,
  SUM((old_values->>'precio_venta_usd')::numeric) as valor_eliminado_usd,
  string_agg(DISTINCT old_values->>'serial', ', ') as seriales_eliminados
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND razon_operacion = 'eliminacion_manual'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY user_email, user_role
HAVING COUNT(*) > 3  -- Más de 3 eliminaciones manuales
ORDER BY eliminaciones_manuales DESC;
```

### **5. Detalle de una Venta Específica**

```sql
-- 🔍 VER TODOS LOS PRODUCTOS DE UNA VENTA
SELECT
  created_at,
  table_name as tipo_producto,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo,
  old_values->>'marca' as marca,
  old_values->>'precio_venta_usd' as precio
FROM audit_log
WHERE razon_operacion = 'venta'
  AND referencia_id = '123'  -- 👈 Cambiar por el ID de transacción
ORDER BY created_at DESC;
```

### **6. Buscar si un Serial se Vendió o se Eliminó**

```sql
-- 🔍 HISTORIA DE UN SERIAL ESPECÍFICO
SELECT
  created_at,
  operation,
  razon_operacion,
  user_email,
  referencia_id as transaccion_id,
  CASE
    WHEN razon_operacion = 'venta' THEN '✅ Vendido'
    WHEN razon_operacion = 'eliminacion_manual' THEN '⚠️ Eliminado manualmente'
    ELSE '❓ Sin razón'
  END as estado
FROM audit_log
WHERE old_values->>'serial' = 'ABC123'  -- 👈 Cambiar por el serial buscado
ORDER BY created_at DESC;
```

---

## 🎯 Casos de Uso Reales

### **Caso 1: Verificar si un iPhone se vendió**

```sql
SELECT
  created_at,
  user_email as vendedor,
  razon_operacion,
  referencia_id as numero_venta,
  old_values->>'serial' as serial,
  old_values->>'precio_venta_usd' as precio
FROM audit_log
WHERE old_values->>'serial' = 'FN4VVH4MV4'
  AND operation = 'DELETE';
```

**Si `razon_operacion = 'venta'` → Se vendió ✅**
**Si `razon_operacion = 'eliminacion_manual'` → Se borró sin vender ⚠️**

---

### **Caso 2: Auditar eliminaciones del día**

```sql
-- Ver TODAS las eliminaciones de hoy diferenciadas
SELECT
  created_at,
  user_email,
  razon_operacion,
  table_name,
  old_values->>'serial' as serial,
  old_values->>'modelo' as modelo
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY razon_operacion, created_at DESC;
```

---

### **Caso 3: Reportes para gerencia**

```sql
-- 📊 REPORTE MENSUAL: Salida de Stock
SELECT
  DATE(created_at) as fecha,
  razon_operacion,
  COUNT(*) as unidades,
  SUM((old_values->>'precio_venta_usd')::numeric) as valor_usd
FROM audit_log
WHERE operation = 'DELETE'
  AND categoria = 'inventario'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE(created_at), razon_operacion
ORDER BY fecha DESC, razon_operacion;
```

---

## 🔄 Migración de Datos Existentes

Todos los logs antiguos ya fueron actualizados:
- Eliminaciones de inventario → marcadas como `eliminacion_manual`
- **Para marcar las ventas antiguas correctamente**, ejecuta:

```sql
-- Actualizar logs antiguos que fueron ventas
-- (buscando en venta_items los productos eliminados)
UPDATE audit_log al
SET
  razon_operacion = 'venta',
  referencia_id = vi.transaccion_id::text
FROM venta_items vi
WHERE al.operation = 'DELETE'
  AND al.categoria = 'inventario'
  AND al.razon_operacion = 'eliminacion_manual'
  AND al.old_values->>'serial' = vi.serial_producto
  AND al.created_at BETWEEN vi.created_at - INTERVAL '5 minutes'
                        AND vi.created_at + INTERVAL '5 minutes';
```

---

## 💡 Consejos de Implementación

### **1. En TODOS los hooks de ventas**

Busca donde eliminas productos y agrega:

```javascript
// ANTES
await supabase.from('celulares').delete().eq('id', id);

// DESPUÉS
await setOperationContext('venta', transaccionId);
await supabase.from('celulares').delete().eq('id', id);
await clearOperationContext();
```

### **2. Archivos a modificar**

- `src/modules/ventas/hooks/useVentas.js` ⭐ PRINCIPAL
- `src/modules/ventas/hooks/useCelulares.js` (si elimina en ventas)
- `src/modules/ventas/hooks/useInventario.js` (si elimina en ventas)
- `src/modules/ventas/hooks/useOtros.js` (si elimina en ventas)

### **3. NO modificar en componentes de administración**

Los componentes donde el usuario elimina productos manualmente (botón "Eliminar") **NO necesitan cambios**. Dejarlos como están para que marquen como `eliminacion_manual`.

---

## ✅ Resumen

| Escenario | Configurar Contexto | razon_operacion | Qué Significa |
|-----------|---------------------|-----------------|---------------|
| **Procesar venta** | SÍ (`setOperationContext('venta', transaccionId)`) | `venta` | Producto vendido ✅ |
| **Botón "Eliminar"** | NO | `eliminacion_manual` | Eliminado manualmente ⚠️ |
| **Ajuste de stock** | NO | `eliminacion_manual` | Corrección manual ⚠️ |

---

## 🚀 Siguiente Paso

¿Quieres que modifique el hook `useVentas.js` para implementar esto automáticamente en el proceso de ventas?
