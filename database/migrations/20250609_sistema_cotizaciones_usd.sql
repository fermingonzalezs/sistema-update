-- Migración: Sistema de Conversión a Dólares con Cotización Manual
-- UPDATE WW SRL - Todas las operaciones en USD como moneda base

-- 1. Actualizar tabla plan_cuentas para incluir información de moneda
ALTER TABLE plan_cuentas 
ADD COLUMN IF NOT EXISTS moneda_original VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS requiere_cotizacion BOOLEAN DEFAULT false;

-- 2. Actualizar tabla movimientos_contables para conversiones
ALTER TABLE movimientos_contables
ADD COLUMN IF NOT EXISTS cotizacion_manual DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS monto_original_ars DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS observaciones_cambio TEXT;

-- 3. Actualizar tabla asientos_contables para cotización promedio
ALTER TABLE asientos_contables
ADD COLUMN IF NOT EXISTS cotizacion_promedio DECIMAL(10,4);

-- 4. Crear tabla para historial de cotizaciones manuales
CREATE TABLE IF NOT EXISTS cotizaciones_manuales (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    cotizacion DECIMAL(10,4) NOT NULL,
    usuario VARCHAR(255) DEFAULT 'admin',
    observaciones TEXT,
    operacion_tipo VARCHAR(50), -- 'libro_diario', 'venta', 'compra', etc.
    operacion_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON cotizaciones_manuales(fecha);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_operacion ON cotizaciones_manuales(operacion_tipo, operacion_id);
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_moneda ON plan_cuentas(moneda_original, requiere_cotizacion);

-- 6. Actualizar cuentas existentes - Asumir que las cajas en pesos requieren cotización
UPDATE plan_cuentas 
SET moneda_original = 'ARS', requiere_cotizacion = true 
WHERE LOWER(nombre) LIKE '%peso%' 
   OR LOWER(nombre) LIKE '%ars%' 
   OR LOWER(codigo) LIKE '%ars%'
   OR LOWER(nombre) LIKE '%caja%'
   OR LOWER(nombre) LIKE '%efectivo%';

-- 7. Mantener cuentas en USD (por defecto ya están configuradas)
UPDATE plan_cuentas 
SET moneda_original = 'USD', requiere_cotizacion = false 
WHERE LOWER(nombre) LIKE '%usd%' 
   OR LOWER(nombre) LIKE '%dolar%' 
   OR LOWER(nombre) LIKE '%dollar%'
   OR LOWER(codigo) LIKE '%usd%';

-- 8. Comentarios para documentar el sistema
COMMENT ON COLUMN plan_cuentas.moneda_original IS 'Moneda original de la cuenta: ARS o USD';
COMMENT ON COLUMN plan_cuentas.requiere_cotizacion IS 'Si la cuenta requiere cotización manual para convertir a USD';
COMMENT ON COLUMN movimientos_contables.cotizacion_manual IS 'Cotización manual ingresada para convertir ARS a USD';
COMMENT ON COLUMN movimientos_contables.monto_original_ars IS 'Monto original en pesos antes de conversión';
COMMENT ON COLUMN movimientos_contables.observaciones_cambio IS 'Detalles de la conversión realizada';
COMMENT ON TABLE cotizaciones_manuales IS 'Historial de cotizaciones manuales ingresadas por usuarios';

-- 9. Trigger para actualizar updated_at en cotizaciones_manuales
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cotizaciones_manuales_updated_at 
    BEFORE UPDATE ON cotizaciones_manuales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();