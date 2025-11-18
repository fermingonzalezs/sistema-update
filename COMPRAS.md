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

### 2. `compras_recibos` (Agrupadores de Compras)
- **Propósito**: Agrupar múltiples productos de una misma compra/importación
- **Cuándo se crea**: Cuando se realiza una importación
- **Estructura**:
  - 1 fila = 1 importación/compra completa
  - Contiene datos generales (proveedor, fecha, estado)
  - Vincula todos los items de esa compra mediante `recibo_id`
- **Campos principales**:
  - `id`: UUID único
  - `proveedor`: Nombre del proveedor
  - `fecha`: Fecha de la compra
  - `estado`: 'importacion' → 'recibido'
  - `descripcion`: Observaciones generales

### 3. `compras` (Items Individuales de Compra)
- **Propósito**: Guardar cada producto individual de una compra
- **Estructura**:
  - 1 fila = 1 producto en una compra
  - Si importas 10 productos = 10 filas en `compras`
  - Cada fila tiene `recibo_id` para agruparse con su recibo
- **Campos principales**:
  - `item`: Nombre/descripción del producto
  - `cantidad`: Cantidad de unidades
  - `monto`: Precio total (cantidad × precio_unitario)
  - `proveedor`: Nombre del proveedor
  - `recibo_id`: FK a `compras_recibos.id` - vincula con su recibo
  - `estado`: 'en_camino' → 'ingresado'
  - `fecha`: Fecha de compra
  - Campos de logística: `numero_seguimiento`, `logistica_empresa`, `peso_estimado_kg`, etc.
  - Campos de recepción: `fecha_ingreso_real`, `peso_real_kg`, `precio_por_kg`, `costos_logistica_usd`

## Flujo de Compra

### PASO 1: CREAR NUEVA IMPORTACIÓN
```
Usuario ingresa en "Nueva Importación":
- Proveedor
- Fecha
- 10 productos (item, cantidad, precio_unitario)
- Datos de logística (empresa, número seguimiento, etc.)

Sistema crea:
1. UN registro en compras_recibos
   - proveedor: "Proveedor X"
   - fecha: "2025-11-18"
   - estado: "importacion"
   - id generado: uuid (ej: "abc123")

2. DIEZ registros en compras (uno por cada producto)
   - compra #1: item="Notebook", cantidad=10, monto=5000, recibo_id="abc123", estado="en_camino"
   - compra #2: item="Mouse", cantidad=10, monto=500, recibo_id="abc123", estado="en_camino"
   - compra #3: item="Monitor", cantidad=10, monto=3000, recibo_id="abc123", estado="en_camino"
   - ... (10 filas totales)
```

### PASO 2: VER IMPORTACIONES
```
Pantalla muestra:
- Tabla con los RECIBOS (compras_recibos)
  - Cada fila es 1 recibo (1 importación)
  - Muestra: Proveedor, Fecha, Estado, Acciones

Cuando expandes un recibo:
- Se muestran todos los ITEMS (compras)
  - Filtrados por recibo_id = ese recibo
  - Muestra: Producto, Cantidad, Precio Unitario, Total, Acciones
```

### PASO 3: RECEPCIONAR IMPORTACIÓN
```
Usuario hace clic en "Recepcionar" en un recibo
- Ingresa fecha de recepción
- Ingresa peso real, precio por kg, costos, etc.

Sistema:
1. Busca todos los items en compras WHERE recibo_id = ese recibo
2. Actualiza cada item:
   - estado: "en_camino" → "ingresado"
   - fecha_ingreso_real: fecha ingresada
   - peso_real_kg: peso ingresado
   - costos_logistica_usd: costos ingresados
3. Actualiza el recibo:
   - estado: "importacion" → "recibido"

Resultado final:
- compras_recibos: 1 recibo con estado "recibido"
- compras: 10 items con estado "ingresado"
```

### PASO 4: (FUTURO) PASAR A INVENTARIO
```
Cuando se ingresa la mercadería al sistema:
1. Los items en compras estado="ingresado" son listos para inventario
2. Se pueden agregar a tablas de inventario (computadoras, celulares, otros, repuestos)
3. Se puede crear un campo en compras para marcar "inventariado"
```

## Relaciones y Vinculaciones

```
compras_recibos (1 recibo)
    ↓ (1 a muchos)
compras (N items de ese recibo)
    ↓ (mediante recibo_id)
    Todos los items comparten:
    - Proveedor
    - Fecha
    - Número de seguimiento
    - Logística
    - Costos de envío
```

## Estados en Compras

| Estado | Significado | Cuándo |
|--------|-------------|--------|
| `en_camino` | El producto está en tránsito | Cuando se crea la compra |
| `ingresado` | El producto llegó y fue recepcionado | Cuando se recepciona el recibo |

## Estados en Compras Recibos

| Estado | Significado | Cuándo |
|--------|-------------|--------|
| `importacion` | Importación pendiente de recepción | Cuando se crea |
| `recibido` | Todos los items fueron recepcionados | Cuando se acepta la recepción |

## Diferencia con `importaciones`

La tabla `importaciones` (antigua) es para **cotizaciones/presupuestos únicos**:
- Se usa cuando cotizas un producto con un proveedor
- Almacena datos de costo: precio USA, impuestos, envío, etc.
- NO interfiere con el flujo de compras realizadas
- Es independiente de `compras` y `compras_recibos`

---

**FLUJO SIMPLIFICADO:**
```
Cotización → importaciones (presupuesto)
                ↓
Aprobado → compras_recibos (1 recibo) + compras (N items)
                ↓
Recepcionado → compras estado=ingresado, compras_recibos estado=recibido
```
