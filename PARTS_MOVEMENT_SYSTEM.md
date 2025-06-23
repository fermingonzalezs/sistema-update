# Parts Entry/Exit System - Sistema de Movimientos de Repuestos

## Overview

The parts entry/exit system provides complete traceability for parts inventory management in the repair workflow. It tracks all parts movements from arrival to usage, maintaining accurate stock levels and providing audit trails.

## Components Created

### 1. Database Tables

#### `movimientos_repuestos`
Main table for tracking parts movements:
- **id**: Primary key
- **repuesto_id**: Foreign key to `repuestos` table
- **tipo_movimiento**: 'entrada' (entry) or 'salida' (exit)
- **cantidad**: Quantity moved
- **reparacion_id**: Optional foreign key to `reparaciones` table
- **motivo**: Reason for movement
- **usuario**: User who made the movement
- **fecha_movimiento**: Timestamp of movement
- **stock_anterior**: Stock before movement
- **stock_nuevo**: Stock after movement
- **observaciones**: Additional notes

#### `recuentos_repuestos`
Table for physical inventory counts:
- **id**: Primary key
- **fecha_recuento**: Date of count
- **tipo_recuento**: Type of count (completo, parcial, por_categoria)
- **repuestos_contados**: JSON with counted parts
- **diferencias_encontradas**: JSON with differences found
- **observaciones**: Notes about the count
- **usuario_recuento**: User who performed the count
- **estado**: Status (sin_diferencias, con_diferencias)

### 2. Service Layer

#### `movimientosRepuestosService`
Located in: `/src/modules/soporte/hooks/useMovimientosRepuestos.js`

**Key Methods:**
- `getAll(filtros)` - Get all movements with optional filters
- `registrarEntrada(movimientoData)` - Register parts entry
- `registrarSalida(movimientoData)` - Register parts exit with stock validation
- `getByRepuesto(repuestoId)` - Get movements for specific part
- `getByReparacion(reparacionId)` - Get movements for specific repair
- `aplicarRepuestosReparacion(reparacionId, repuestosUsados)` - Apply parts from repair quote
- `getEstadisticas(fechaDesde, fechaHasta)` - Get movement statistics

### 3. React Components

#### `MovimientosRepuestosSection.jsx`
Main component for parts movement management:
- **Location**: `/src/modules/soporte/components/MovimientosRepuestosSection.jsx`
- **Features**:
  - Entry and exit forms with validation
  - Movement history table
  - Real-time statistics
  - Filtering by type, part, and date range
  - Integration with repairs system

#### `ModalAplicarRepuestos.jsx`
Modal for applying parts to completed repairs:
- **Location**: `/src/modules/soporte/components/ModalAplicarRepuestos.jsx`
- **Features**:
  - Shows parts from repair quote
  - Confirms parts usage
  - Automatically deducts stock
  - Records movements with repair reference

### 4. Custom React Hook

#### `useMovimientosRepuestos`
Located in: `/src/modules/soporte/hooks/useMovimientosRepuestos.js`

**Returns:**
- `movimientos` - Array of movements
- `loading` - Loading state
- `error` - Error state
- `obtenerMovimientos(filtros)` - Function to fetch movements
- `registrarEntrada(data)` - Function to register entry
- `registrarSalida(data)` - Function to register exit
- `obtenerEstadisticas(desde, hasta)` - Function to get statistics
- `aplicarRepuestosReparacion(id, repuestos, usuario)` - Function to apply parts to repair

## Integration Points

### 1. Existing Parts System
- **Reads from**: `repuestos` table for available parts
- **Updates**: Stock quantities in `repuestos` table
- **Validates**: Stock availability before allowing exits

### 2. Repairs System
- **Integrates with**: `ModalPresupuesto.jsx` for repair quotes
- **References**: `reparaciones` table for tracking parts usage per repair
- **Workflow**: Parts can be applied when repairs are completed

### 3. User Interface
- **Added to**: Soporte section in sidebar
- **Access Control**: Available to 'soporte' and 'admin' users
- **Navigation**: `movimientos-repuestos` section ID

## Workflow Examples

### 1. Parts Entry Workflow
1. Navigate to "Movimientos Repuestos" section
2. Click "Entrada" button
3. Select part from dropdown
4. Enter quantity and reason
5. Add optional observations
6. Submit - system automatically:
   - Validates input
   - Records movement
   - Updates part stock
   - Shows confirmation

### 2. Parts Exit Workflow
1. Navigate to "Movimientos Repuestos" section
2. Click "Salida" button
3. Select part from dropdown (shows available stock)
4. Enter quantity (validates against available stock)
5. Optionally associate with a repair
6. Select reason and add observations
7. Submit - system automatically:
   - Validates stock availability
   - Records movement
   - Updates part stock
   - Shows confirmation

### 3. Repair Integration Workflow
1. Create repair quote with parts in `ModalPresupuesto`
2. When repair is completed, use `ModalAplicarRepuestos`
3. Review parts from quote
4. Confirm usage
5. System automatically:
   - Deducts stock for each part
   - Records exit movements
   - Associates movements with repair
   - Updates part availability

## Features

### 1. Stock Validation
- Prevents negative stock
- Shows available quantities
- Validates against current stock levels
- Real-time stock updates

### 2. Audit Trail
- Complete movement history
- User tracking for all operations
- Timestamps for all movements
- Before/after stock levels

### 3. Reporting & Statistics
- Monthly movement statistics
- Entry vs. exit totals
- Movement counts by type
- Date range filtering

### 4. Filtering & Search
- Filter by movement type (entry/exit)
- Filter by specific part
- Date range filtering
- Real-time result updates

### 5. Integration Ready
- Designed to work with existing repair workflow
- References repair records
- Maintains data consistency
- Supports batch operations

## Database Setup

Run the SQL script to create the required tables:
```sql
-- File: /database/create_movimientos_repuestos_table.sql
-- Creates movimientos_repuestos and recuentos_repuestos tables
-- Includes indexes for performance
-- Adds example data (optional)
```

## Access Control

The system respects existing user roles:
- **Admin**: Full access to all features
- **Soporte**: Full access to parts movements
- **Ventas**: No access to parts movements
- **Contabilidad**: No access to parts movements

## Error Handling

The system includes comprehensive error handling:
- Stock validation with user-friendly messages
- Database error handling and rollback
- Form validation with clear feedback
- Loading states during operations

## Future Enhancements

Potential improvements for the system:
1. **Batch Movements**: Support for multiple parts in single operation
2. **Parts Reservations**: Reserve parts for planned repairs
3. **Automatic Reorder Points**: Alerts when stock is low
4. **Barcode Integration**: Scan parts for faster entry/exit
5. **Cost Tracking**: Track costs associated with movements
6. **Supplier Integration**: Link entries to purchase orders
7. **Mobile Support**: Mobile-friendly interface for warehouse operations

## Troubleshooting

### Common Issues

1. **"Stock insuficiente" Error**
   - Check current stock levels in RepuestosSection
   - Verify movement quantities
   - Ensure parts haven't been used elsewhere

2. **Parts Not Showing in Dropdown**
   - Verify parts are marked as 'disponible: true'
   - Check if parts have stock > 0 for exits
   - Refresh the page to reload data

3. **Movements Not Saving**
   - Check database connection
   - Verify user permissions
   - Check browser console for errors

### Database Queries for Debugging

```sql
-- Check parts stock levels
SELECT id, item, categoria, cantidad, disponible FROM repuestos;

-- Check recent movements
SELECT * FROM movimientos_repuestos ORDER BY fecha_movimiento DESC LIMIT 10;

-- Check stock discrepancies
SELECT r.item, r.cantidad as stock_sistema, 
       SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN m.cantidad ELSE -m.cantidad END) as stock_calculado
FROM repuestos r
LEFT JOIN movimientos_repuestos m ON r.id = m.repuesto_id
GROUP BY r.id, r.item, r.cantidad;
```

## Support

For technical support or questions about the parts movement system:
1. Check the error messages in the browser console
2. Verify database connectivity
3. Review user permissions and access control
4. Contact the development team with specific error details