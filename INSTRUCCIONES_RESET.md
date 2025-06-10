# 🔄 RESET COMPLETO - Contabilidad y Gastos Operativos

## 📋 Pasos a seguir en orden:

### 1. **Ejecutar SQL en Supabase**

#### Paso 1a: Reset completo
```sql
-- Copiar y pegar TODO el contenido de: reset_completo_contabilidad.sql
```

#### Paso 1b: Optimizar plan de cuentas existente (OPCIONAL)
```sql
-- Copiar y pegar TODO el contenido de: optimizar_plan_cuentas_existente.sql
-- ESTE PASO ES OPCIONAL - Solo si quieres cuentas más específicas
```

Estos scripts:
- ✅ Elimina tablas existentes (`asientos_contables`, `movimientos_contables`, `gastos_operativos`)
- ✅ Crea `asientos_contables` con campos para automáticos
- ✅ Crea `movimientos_contables` con conversión de monedas y FK a plan_cuentas
- ✅ Crea `gastos_operativos` completa con validaciones y FK a plan_cuentas
- ✅ Crea vista `asientos_pendientes_revision`
- ✅ Agrega triggers para `updated_at`
- ✅ Establece relaciones foreign key correctas
- ✅ **Crea cuentas específicas para cada categoría de gasto**
- ✅ Verifica que todo esté correcto

### 2. **Reemplazar archivos antiguos**

#### Hook:
```bash
# Eliminar hook viejo
rm src/modules/contabilidad/hooks/useGastosOperativos.js

# Renombrar hook nuevo
mv src/modules/contabilidad/hooks/useGastosOperativosNew.js src/modules/contabilidad/hooks/useGastosOperativos.js
```

#### Componente:
```bash
# Eliminar componente viejo
rm src/modules/contabilidad/components/GastosOperativosSection.jsx

# Renombrar componente nuevo
mv src/modules/contabilidad/components/GastosOperativosSectionNew.jsx src/modules/contabilidad/components/GastosOperativosSection.jsx
```

### 3. **Verificar imports**
El archivo `src/modules/contabilidad/components/index.js` ya debería tener:
```js
export { default as GastosOperativosSection } from './GastosOperativosSection';
```

## 🎯 **Resultado esperado:**

### **Funcionalidades:**
- ✅ Gastos en ARS se guardan como ARS (ej: $20.000 ARS)
- ✅ Gastos en USD se guardan como USD (ej: $100 USD)
- ✅ Conversión USD se muestra solo en interfaz
- ✅ Asientos automáticos se generan como "borrador"
- ✅ Los asientos aparecen en "Asientos Contables" para aprobar
- ✅ Sistema funciona solo con cuentas existentes

### **Tabla asientos_contables:**
- ✅ `es_automatico` (boolean) - identifica automáticos
- ✅ `origen_operacion` (varchar) - 'gasto', 'venta', etc.
- ✅ `operacion_id` (integer) - ID del gasto/venta
- ✅ Estados: 'borrador', 'registrado', 'anulado'

### **Tabla gastos_operativos:**
- ✅ `monto` (decimal) - monto en moneda original
- ✅ `moneda` (varchar) - 'USD' o 'ARS'
- ✅ `cotizacion_manual` (decimal) - para conversiones ARS
- ✅ `cuenta_pago_id` (integer) - cuenta de pago
- ✅ Validaciones automáticas por constraints

## 🚀 **Después del reset:**

1. **Probar crear gasto en USD** → Debería guardarse como USD
2. **Probar crear gasto en ARS** → Debería guardarse como ARS con cotización
3. **Verificar asiento automático** → Debería aparecer como "borrador"
4. **Aprobar asiento** → Debería cambiar a "registrado"

## 📊 **Mapeo de Categorías a Cuentas Existentes:**

| Categoría | Código | Cuenta Contable Actual |
|-----------|--------|------------------------|
| `proveedor` | 5.01.001 | CMV PESOS |
| `servicios` | 5.02.002 | SERVICIOS PUBLICOS |
| `alquiler` | 5.02.001 | ALQUILERES |
| `sueldos` | 5.02.003 | SUELDOS Y JORNALES |
| `impuestos` | 5.02.005 | GASTOS DE OFICINA |
| `transporte` | 5.02.006 | GASTOS DE VEHICULO |
| `marketing` | 5.02.005 | GASTOS DE OFICINA |
| `mantenimiento` | 5.02.005 | GASTOS DE OFICINA |
| `administrativos` | 5.02.005 | GASTOS DE OFICINA |
| `otros` | 5.02.005 | GASTOS DE OFICINA |

**💡 Si ejecutas el script opcional, se agregarán cuentas más específicas para impuestos, marketing y mantenimiento.**

## ⚠️ **Importante:**
- Este script ELIMINA todos los datos existentes
- Hacer backup si hay datos importantes
- Ejecutar en horario de baja actividad
- Las cuentas se crearán automáticamente con el mapeo correcto