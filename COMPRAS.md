# Sistema de Compras e Importaciones

## Descripción General

El sistema de compras maneja dos flujos principales:
1. **Compras Nacionales**: Compras locales simples
2. **Importaciones**: Compras internacionales con seguimiento detallado

## Estructura de Tablas

### 1. `importaciones` (Cotizaciones/Presupuestos)
- **Propósito**: Almacenar cotizaciones únicas y presupuestos de importación
- **Cuándo se usa**: Solo en fase de cotización/presupuesto
- **Campos principales**:
  - `proveedor_nombre`: Nombre del proveedor
  - `precio_compra_usd`: Monto cotizado
  - `estado`: 'cotizacion', 'aprobada', etc.
  - Datos de logística (peso, costos USA, costos ARG, etc.)
- **Nota**: Esta tabla es independiente del flujo de compras realizadas

### 2. `compras_recibos` (Agrupadores de Compras Locales)
- **Propósito**: Agrupar múltiples productos de una misma compra nacional o importación
- **Cuándo se crea**: Cuando se realiza una compra (local o importada)
- **Estructura**:
  - 1 fila = 1 recibo/compra completa
  - Contiene datos generales (proveedor, fecha, estado)
  - Vincula todos los items de esa compra mediante `recibo_id`
- **Campos principales**:
  - `id`: UUID único (generado automáticamente)
  - `numero_recibo`: Número único formato "AAAA-##" (ej: "2025-01", "2025-02", etc.)
  - `proveedor`: Nombre del proveedor
  - `fecha`: Fecha de la compra
  - `metodo_pago`: Método de pago (efectivo_pesos, dolares_billete, transferencia, criptomonedas, tarjeta_credito, cuenta_corriente)
  - `estado`: 'borrador' → 'procesado'
  - `descripcion`: Observaciones generales
  - `fecha_procesamiento`: Timestamp cuando se procesó el recibo

### 3. `compra_items` (Items Individuales de Compra Local)
- **Propósito**: Guardar cada producto individual de una compra
- **Estructura**:
  - 1 fila = 1 producto en una compra
  - Si compras 10 productos = 10 filas en `compra_items`
  - Cada fila tiene `recibo_id` para agruparse con su recibo
- **Campos principales**:
  - `id`: ID autoincremental único (IDENTITY ALWAYS)
  - `recibo_id`: FK a `compras_recibos.id` - vincula con su recibo
  - `producto`: Nombre/descripción del producto
  - `cantidad`: Cantidad de unidades
  - `serial`: Número de serie (opcional)
  - `precio_unitario`: Precio por unidad
  - `precio_total`: Precio total (cantidad × precio_unitario)
  - `descripcion`: Observaciones del item

## Flujo de Compra - Sistema Nuevo de Compras Locales

### PASO 1: CREAR NUEVO RECIBO
```
Usuario ingresa en "Compras - Nueva Compra":
1. Llena el formulario de recibo:
   - Proveedor: Nombre del proveedor
   - Fecha: Fecha de la compra
   - Método de Pago: Selecciona de opciones disponibles
   - Descripción: Notas opcionales

Sistema crea:
- UN registro en compras_recibos con estado="borrador"
  - numero_recibo: Se genera automáticamente (AAAA-##)
  - proveedor: "Proveedor X"
  - fecha: "2025-11-18"
  - metodo_pago: "transferencia"
  - estado: "borrador"
  - id: UUID generado (ej: "abc123")

Resultado: El usuario pasa a la vista de carrito
```

### PASO 2: AGREGAR PRODUCTOS AL CARRITO
```
En la vista de carrito:
1. Usuario selecciona destino: "Stock" o "Testeo"
2. Hace clic en "Agregar Producto"
3. Selecciona tipo de equipo (Notebook, Celular, Otro)
4. Ingresa datos del equipo (modelo, serial, precio, etc.)
5. Se agrega temporalmente al carrito (sin guardar en BD aún)

Carrito muestra:
- Lista de productos agregados
- Opción de eliminar productos individuales
```

### PASO 3: PROCESAR RECIBO
```
Usuario hace clic en "Procesar Recibo":
- Sistema solicita confirmación (cantidad items a stock y testeo)
- Usuario confirma

Sistema:
1. Guarda todos los items del carrito en compra_items
   - Para cada item: genera registro con recibo_id
   - Todos heredan: proveedor, fecha, metodo_pago del recibo
2. Actualiza el recibo: estado "borrador" → "procesado"
3. Limpia el carrito y vuelve a la vista inicial
4. Actualiza el historial de recibos

Resultado:
- compras_recibos: 1 recibo con estado="procesado"
- compra_items: N items con los datos del compra
```

### PASO 4: VER HISTORIAL DE RECIBOS
```
En la vista inicial se muestra:
- Tabla con todos los RECIBOS procesados (compras_recibos)
  - Cada fila es 1 recibo (1 compra)
  - Muestra: Proveedor, Fecha, Cantidad Items, Acciones

Cuando expandes un recibo (clic en el chevron):
- Se muestran todos los ITEMS (compra_items)
  - Filtrados por recibo_id = ese recibo
  - Muestra: Serial, Producto, Tipo, Destino (Stock/Testeo)
```

### PASO 5: (FUTURO) PASAR A INVENTARIO
```
Los items procesados en compra_items con destino="stock"
pueden ser agregados a las tablas de inventario:
- inventario (notebooks)
- celulares (smartphones)
- otros (accesorios)
- repuestos (parts)

Con destino="testeo" → pasan a tabla de testeo_equipos
```

## Relaciones y Vinculaciones

```
compras_recibos (1 recibo)
    ↓ (1 a muchos)
compra_items (N items de ese recibo)
    ↓ (mediante recibo_id)
    Todos los items comparten:
    - numero_recibo
    - proveedor
    - fecha
    - metodo_pago
```

## Estados en Compras Recibos (Sistema Nuevo)

| Estado | Significado | Cuándo |
|--------|-------------|--------|
| `borrador` | Recibo creado, agregando productos | Cuando se crea el recibo |
| `procesado` | Recibo finalizado, items guardados | Cuando se hace clic en "Procesar Recibo" |

## Métodos de Pago Disponibles

| Método | Código | Descripción |
|--------|--------|-------------|
| Efectivo en Pesos | `efectivo_pesos` | Pago en efectivo ARG |
| Dólares Billete | `dolares_billete` | Pago en USD cash |
| Transferencia | `transferencia` | Transferencia bancaria |
| Criptomonedas | `criptomonedas` | Pago en cripto |
| Tarjeta de Crédito | `tarjeta_credito` | Pago con tarjeta |
| Cuenta Corriente | `cuenta_corriente` | Cargo a cuenta de proveedor |

## Diferencia con `importaciones`

La tabla `importaciones` (antigua) es para **cotizaciones/presupuestos únicos**:
- Se usa cuando cotizas un producto con un proveedor
- Almacena datos de costo: precio USA, impuestos, envío, etc.
- NO interfiere con el flujo de compras realizadas
- Es independiente de `compras` y `compras_recibos`

## Servicio de Compras

El servicio `comprasLocalesService` (en `src/modules/compras/services/comprasLocalesService.js`) proporciona:

### Métodos Disponibles

1. **`generarNumeroRecibo()`**
   - Genera automáticamente número único formato "AAAA-##"
   - Incrementa secuencialmente cada año

2. **`crearRecibo(reciboData, items = [])`**
   - Crea un nuevo recibo y sus items
   - Parámetros:
     - `reciboData`: { proveedor, fecha_compra, metodo_pago, observaciones }
     - `items`: Array de items (opcional al crear)

3. **`getReciboConItems(id)`**
   - Obtiene un recibo específico con todos sus items

4. **`getAllRecibos()`**
   - Obtiene todos los recibos procesados con sus items

5. **`updateRecibo(id, reciboData, items = [])`**
   - Actualiza un recibo y sus items
   - Elimina items viejos y crea nuevos

6. **`procesarRecibo(id)`**
   - Cambia estado de 'borrador' a 'procesado'

7. **`deleteRecibo(id)`**
   - Elimina un recibo y sus items en cascada

8. **`deleteItem(itemId)`**
   - Elimina un item específico

---

**FLUJO SIMPLIFICADO - NUEVO SISTEMA:**
```
CREAR RECIBO (borrador)
        ↓
AGREGAR PRODUCTOS AL CARRITO (temporal)
        ↓
PROCESAR RECIBO (confirmar)
        ↓
compras_recibos estado=procesado
+ compra_items (N items)
        ↓
HISTORIAL (ver recibos procesados)
```
