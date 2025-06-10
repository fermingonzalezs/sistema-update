-- RESET COMPLETO: Asientos Contables y Gastos Operativos
-- Ejecutar en Supabase para recrear todo desde cero

-- ==========================================
-- 1. ELIMINAR TABLAS EXISTENTES
-- ==========================================

-- Eliminar en orden correcto (por dependencias)
DROP TABLE IF EXISTS public.movimientos_contables CASCADE;
DROP TABLE IF EXISTS public.gastos_operativos CASCADE;
DROP TABLE IF EXISTS public.asientos_contables CASCADE;

-- ==========================================
-- 2. CREAR TABLA ASIENTOS_CONTABLES COMPLETA
-- ==========================================

CREATE TABLE public.asientos_contables (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  
  -- CAMPOS DE TOTALES (siempre en USD)
  total_debe NUMERIC(12,4) NOT NULL CHECK (total_debe >= 0),
  total_haber NUMERIC(12,4) NOT NULL CHECK (total_haber >= 0),
  
  -- CAMPOS DE ESTADO Y TIPO
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador' 
    CHECK (estado IN ('borrador', 'registrado', 'anulado')),
  es_automatico BOOLEAN NOT NULL DEFAULT false,
  
  -- CAMPOS DE ORIGEN (para asientos automáticos)
  origen_operacion VARCHAR(50) NULL 
    CHECK (origen_operacion IN ('venta', 'compra', 'gasto', 'conciliacion', 'manual') OR origen_operacion IS NULL),
  operacion_id INTEGER NULL,
  
  -- CAMPOS DE COTIZACIÓN
  cotizacion_promedio NUMERIC(10,2) NULL,
  
  -- CAMPOS DE AUDITORÍA
  usuario VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- CONSTRAINT PARA BALANCE
  CONSTRAINT asientos_balance_check 
  CHECK (ABS(total_debe - total_haber) < 0.01)
);

-- Índices para performance
CREATE INDEX idx_asientos_fecha ON public.asientos_contables(fecha);
CREATE INDEX idx_asientos_estado ON public.asientos_contables(estado);
CREATE INDEX idx_asientos_automatico ON public.asientos_contables(es_automatico);
CREATE INDEX idx_asientos_origen ON public.asientos_contables(origen_operacion);
CREATE INDEX idx_asientos_numero ON public.asientos_contables(numero);

-- Comentarios
COMMENT ON TABLE public.asientos_contables IS 'Asientos contables con soporte para automáticos y manuales';
COMMENT ON COLUMN public.asientos_contables.total_debe IS 'Total debe en USD (moneda base)';
COMMENT ON COLUMN public.asientos_contables.total_haber IS 'Total haber en USD (moneda base)';
COMMENT ON COLUMN public.asientos_contables.es_automatico IS 'true si fue generado automáticamente';
COMMENT ON COLUMN public.asientos_contables.origen_operacion IS 'Tipo de operación que originó el asiento';
COMMENT ON COLUMN public.asientos_contables.operacion_id IS 'ID de la operación que originó el asiento';

-- ==========================================
-- 3. CREAR TABLA MOVIMIENTOS_CONTABLES
-- ==========================================

CREATE TABLE public.movimientos_contables (
  id SERIAL PRIMARY KEY,
  asiento_id INTEGER NOT NULL REFERENCES public.asientos_contables(id) ON DELETE CASCADE,
  cuenta_id INTEGER NOT NULL REFERENCES public.plan_cuentas(id) ON DELETE RESTRICT,
  
  -- CAMPOS DE MOVIMIENTO (siempre en USD)
  debe NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (debe >= 0),
  haber NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (haber >= 0),
  
  -- CAMPOS DE CONVERSIÓN (para movimientos originales en ARS)
  monto_original_ars NUMERIC(12,2) NULL,
  cotizacion_manual NUMERIC(10,2) NULL,
  observaciones_cambio TEXT NULL,
  
  -- AUDITORÍA
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- CONSTRAINTS
  CONSTRAINT movimientos_debe_o_haber_check 
  CHECK ((debe > 0 AND haber = 0) OR (haber > 0 AND debe = 0)),
  
  CONSTRAINT movimientos_conversion_check
  CHECK (
    (monto_original_ars IS NULL AND cotizacion_manual IS NULL) OR
    (monto_original_ars IS NOT NULL AND cotizacion_manual IS NOT NULL AND cotizacion_manual > 0)
  )
);

-- Índices para performance
CREATE INDEX idx_movimientos_asiento ON public.movimientos_contables(asiento_id);
CREATE INDEX idx_movimientos_cuenta ON public.movimientos_contables(cuenta_id);

-- Comentarios
COMMENT ON TABLE public.movimientos_contables IS 'Movimientos contables individuales de cada asiento';
COMMENT ON COLUMN public.movimientos_contables.cuenta_id IS 'Foreign key a plan_cuentas';
COMMENT ON COLUMN public.movimientos_contables.debe IS 'Monto debe en USD';
COMMENT ON COLUMN public.movimientos_contables.haber IS 'Monto haber en USD';
COMMENT ON COLUMN public.movimientos_contables.monto_original_ars IS 'Monto original si era en ARS';
COMMENT ON COLUMN public.movimientos_contables.cotizacion_manual IS 'Cotización usada para conversión ARS->USD';

-- ==========================================
-- 4. CREAR TABLA GASTOS_OPERATIVOS
-- ==========================================

CREATE TABLE public.gastos_operativos (
  id SERIAL PRIMARY KEY,
  
  -- CAMPOS BÁSICOS
  fecha_gasto DATE NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  subcategoria VARCHAR(100) NULL,
  descripcion TEXT NOT NULL,
  proveedor_nombre VARCHAR(200) NULL,
  numero_comprobante VARCHAR(100) NULL,
  
  -- CAMPOS DE MONTO Y MONEDA
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  moneda VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'ARS')),
  cotizacion_manual NUMERIC(10,2) NULL,
  
  -- CAMPOS DE PAGO
  cuenta_pago_id INTEGER NULL REFERENCES public.plan_cuentas(id) ON DELETE SET NULL,
  metodo_pago VARCHAR(20) NOT NULL DEFAULT 'efectivo' 
    CHECK (metodo_pago IN ('efectivo', 'transferencia', 'cheque', 'tarjeta')),
  
  -- CAMPOS DE ESTADO
  estado VARCHAR(20) NOT NULL DEFAULT 'pagado' 
    CHECK (estado IN ('pendiente', 'pagado', 'anulado')),
  observaciones TEXT NULL,
  
  -- CAMPOS DE AUDITORÍA
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- CONSTRAINT PARA COTIZACIÓN
  CONSTRAINT gastos_cotizacion_check 
  CHECK (
    (moneda = 'USD' AND cotizacion_manual IS NULL) OR 
    (moneda = 'ARS' AND cotizacion_manual IS NOT NULL AND cotizacion_manual > 0)
  )
);

-- Índices para performance
CREATE INDEX idx_gastos_fecha ON public.gastos_operativos(fecha_gasto);
CREATE INDEX idx_gastos_categoria ON public.gastos_operativos(categoria);
CREATE INDEX idx_gastos_estado ON public.gastos_operativos(estado);
CREATE INDEX idx_gastos_moneda ON public.gastos_operativos(moneda);

-- Comentarios
COMMENT ON TABLE public.gastos_operativos IS 'Gastos operativos con soporte para ARS y USD';
COMMENT ON COLUMN public.gastos_operativos.monto IS 'Monto en la moneda original del gasto';
COMMENT ON COLUMN public.gastos_operativos.moneda IS 'Moneda del gasto (USD o ARS)';
COMMENT ON COLUMN public.gastos_operativos.cotizacion_manual IS 'Cotización USD para gastos en ARS';
COMMENT ON COLUMN public.gastos_operativos.cuenta_pago_id IS 'Foreign key a plan_cuentas - Cuenta desde donde se realizó el pago';

-- ==========================================
-- 5. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para gastos_operativos
CREATE TRIGGER update_gastos_operativos_updated_at 
  BEFORE UPDATE ON public.gastos_operativos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para asientos_contables
CREATE TRIGGER update_asientos_contables_updated_at 
  BEFORE UPDATE ON public.asientos_contables 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. CREAR VISTA PARA ASIENTOS PENDIENTES
-- ==========================================

CREATE OR REPLACE VIEW public.asientos_pendientes_revision AS
SELECT 
  a.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', m.id,
        'cuenta_id', m.cuenta_id,
        'debe', m.debe,
        'haber', m.haber,
        'monto_original_ars', m.monto_original_ars,
        'cotizacion_manual', m.cotizacion_manual,
        'plan_cuentas', json_build_object(
          'codigo', pc.codigo,
          'nombre', pc.nombre
        )
      )
    ) FILTER (WHERE m.id IS NOT NULL), 
    '[]'::json
  ) as movimientos_contables
FROM public.asientos_contables a
LEFT JOIN public.movimientos_contables m ON a.id = m.asiento_id
LEFT JOIN public.plan_cuentas pc ON m.cuenta_id = pc.id
WHERE a.estado = 'borrador'
GROUP BY a.id
ORDER BY a.created_at DESC;

COMMENT ON VIEW public.asientos_pendientes_revision IS 'Vista de asientos en estado borrador con sus movimientos';

-- ==========================================
-- 7. DATOS DE EJEMPLO (OPCIONAL)
-- ==========================================

-- Crear secuencia para números de asiento si no existe
CREATE SEQUENCE IF NOT EXISTS asiento_numero_seq START 1;

-- ==========================================
-- 8. VERIFICAR RESULTADO
-- ==========================================

-- Verificar estructura de asientos_contables
SELECT 
    'asientos_contables' as tabla,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'asientos_contables' 
ORDER BY ordinal_position;

-- Verificar estructura de movimientos_contables
SELECT 
    'movimientos_contables' as tabla,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'movimientos_contables' 
ORDER BY ordinal_position;

-- Verificar estructura de gastos_operativos
SELECT 
    'gastos_operativos' as tabla,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'gastos_operativos' 
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
    table_name,
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('asientos_contables', 'movimientos_contables', 'gastos_operativos')
ORDER BY table_name, constraint_name;

-- Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('asientos_contables', 'movimientos_contables', 'gastos_operativos')
ORDER BY tablename, indexname;

-- Verificar vista
SELECT count(*) as asientos_pendientes FROM public.asientos_pendientes_revision;

SELECT 'RESET COMPLETO EXITOSO' as resultado;