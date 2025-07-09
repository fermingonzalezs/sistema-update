# Actualización de Sucursal en Tabla "Otros"

## Descripción
Este documento describe cómo actualizar el campo `sucursal` en la tabla `otros` de la base de datos. Se han creado funciones utilitarias para facilitar estas operaciones.

## Archivo Principal
- **Ubicación**: `/src/services/databaseUtilsService.js`
- **Hook existente**: `/src/modules/ventas/hooks/useOtros.js`

## Funciones Disponibles

### 1. `actualizarSucursalOtros(nuevaSucursal, sucursalActual)`
Actualiza el campo sucursal de todos los registros en la tabla "otros".

**Parámetros:**
- `nuevaSucursal` (string): El valor de sucursal a asignar (ej: 'la_plata', 'capital', etc.)
- `sucursalActual` (string, opcional): Filtrar por sucursal actual (si no se especifica, actualiza todos)

**Retorna:**
```javascript
{
  success: boolean,
  count: number,
  error?: string
}
```

### 2. `obtenerEstadisticasSucursalOtros()`
Obtiene estadísticas de la tabla "otros" agrupadas por sucursal.

**Retorna:**
```javascript
{
  success: boolean,
  data?: [{
    sucursal: string,
    total: number,
    disponibles: number,
    no_disponibles: number
  }],
  error?: string
}
```

### 3. `actualizarMultiplesOtros(registros)`
Actualiza múltiples campos para registros específicos.

**Parámetros:**
- `registros` (Array): Array de objetos con `{id: string, updates: object}`

### 4. Funciones de Debug
- `debug.examinarRegistro(id)`: Examina la estructura de un registro
- `debug.listarSucursales()`: Lista todas las sucursales existentes

## Cómo Usar

### Método 1: Desde la Consola del Navegador
```javascript
// Importar el servicio
import { databaseUtilsService } from './src/services/databaseUtilsService.js';

// Ver estadísticas actuales
const stats = await databaseUtilsService.obtenerEstadisticasSucursalOtros();
console.log('Estadísticas:', stats);

// Actualizar todos los registros a 'la_plata'
const resultado = await databaseUtilsService.actualizarSucursalOtros('la_plata');
console.log('Resultado:', resultado);

// Actualizar solo los registros con sucursal 'capital' a 'la_plata'
const resultado2 = await databaseUtilsService.actualizarSucursalOtros('la_plata', 'capital');
console.log('Resultado:', resultado2);
```

### Método 2: Desde el Hook useOtros
El hook existente `/src/modules/ventas/hooks/useOtros.js` ya tiene una función `update` que puede usarse:

```javascript
// Dentro de un componente React
import { useOtros } from '../../../modules/ventas/hooks/useOtros.js';

const { updateOtro } = useOtros();

// Actualizar un registro específico
await updateOtro(id, { sucursal: 'la_plata' });
```

### Método 3: Usando directamente Supabase
```javascript
import { supabase } from '../lib/supabase.js';

// Actualizar todos los registros
const { data, error } = await supabase
  .from('otros')
  .update({ sucursal: 'la_plata' })
  .select('id');

console.log('Registros actualizados:', data?.length);
```

## Valores Típicos de Sucursal
Según el código existente, los valores típicos son:
- `'la_plata'` - Sucursal La Plata
- `'capital'` - Sucursal Capital
- `'otras'` - Otras sucursales

## Estructura SQL Equivalente
```sql
-- Actualizar todos los registros
UPDATE otros 
SET sucursal = 'la_plata', 
    updated_at = NOW() 
WHERE 1=1;

-- Actualizar solo registros con sucursal específica
UPDATE otros 
SET sucursal = 'la_plata', 
    updated_at = NOW() 
WHERE sucursal = 'capital';

-- Ver estadísticas
SELECT 
    sucursal, 
    COUNT(*) as total,
    COUNT(CASE WHEN disponible = true THEN 1 END) as disponibles,
    COUNT(CASE WHEN disponible = false THEN 1 END) as no_disponibles
FROM otros 
GROUP BY sucursal;
```

## Precauciones
1. **Backup**: Siempre realiza un backup antes de actualizaciones masivas
2. **Pruebas**: Prueba primero con un número pequeño de registros
3. **Validación**: Verifica que la nueva sucursal sea válida
4. **Logs**: Revisa los logs de la consola para confirmar los cambios

## Debugging
Para examinar la estructura de la tabla y los datos:

```javascript
// Listar todas las sucursales existentes
const sucursales = await databaseUtilsService.debug.listarSucursales();

// Examinar un registro específico
const registro = await databaseUtilsService.debug.examinarRegistro('id-del-registro');
```

## Ejemplo Completo
```javascript
// 1. Ver estado actual
const estadisticas = await databaseUtilsService.obtenerEstadisticasSucursalOtros();
console.log('Estado actual:', estadisticas);

// 2. Actualizar todos los registros
const resultado = await databaseUtilsService.actualizarSucursalOtros('la_plata');
console.log(`✅ ${resultado.count} registros actualizados`);

// 3. Verificar cambios
const nuevasEstadisticas = await databaseUtilsService.obtenerEstadisticasSucursalOtros();
console.log('Estado después:', nuevasEstadisticas);
```

## Notas Adicionales
- El campo `updated_at` se actualiza automáticamente
- Las funciones incluyen manejo de errores y logging detallado
- Compatible con la arquitectura existente del proyecto
- Usa las mismas configuraciones de Supabase del proyecto