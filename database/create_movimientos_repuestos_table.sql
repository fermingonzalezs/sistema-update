-- Crear tabla para movimientos de repuestos (entradas y salidas)
CREATE TABLE IF NOT EXISTS movimientos_repuestos (
  id SERIAL PRIMARY KEY,
  repuesto_id INTEGER REFERENCES repuestos(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  reparacion_id INTEGER REFERENCES reparaciones(id) ON DELETE SET NULL,
  motivo TEXT NOT NULL,
  usuario TEXT NOT NULL DEFAULT 'admin',
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stock_anterior INTEGER NOT NULL DEFAULT 0,
  stock_nuevo INTEGER NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_repuestos_repuesto_id ON movimientos_repuestos(repuesto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_repuestos_tipo ON movimientos_repuestos(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_repuestos_fecha ON movimientos_repuestos(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_repuestos_reparacion ON movimientos_repuestos(reparacion_id);

-- Crear tabla para recuentos de repuestos (si no existe)
CREATE TABLE IF NOT EXISTS recuentos_repuestos (
  id SERIAL PRIMARY KEY,
  fecha_recuento DATE NOT NULL,
  tipo_recuento TEXT NOT NULL CHECK (tipo_recuento IN ('completo', 'parcial', 'por_categoria')),
  repuestos_contados JSONB,
  diferencias_encontradas JSONB,
  observaciones TEXT,
  usuario_recuento TEXT NOT NULL DEFAULT 'admin',
  estado TEXT NOT NULL CHECK (estado IN ('sin_diferencias', 'con_diferencias')) DEFAULT 'sin_diferencias',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla de recuentos
CREATE INDEX IF NOT EXISTS idx_recuentos_repuestos_fecha ON recuentos_repuestos(fecha_recuento);
CREATE INDEX IF NOT EXISTS idx_recuentos_repuestos_tipo ON recuentos_repuestos(tipo_recuento);
CREATE INDEX IF NOT EXISTS idx_recuentos_repuestos_estado ON recuentos_repuestos(estado);

-- Insertar algunos movimientos de ejemplo (opcional)
INSERT INTO movimientos_repuestos (
  repuesto_id, 
  tipo_movimiento, 
  cantidad, 
  motivo, 
  usuario, 
  stock_anterior, 
  stock_nuevo, 
  observaciones
) VALUES 
(1, 'entrada', 10, 'Compra de inventario', 'admin', 0, 10, 'Stock inicial de ejemplo'),
(2, 'entrada', 5, 'Compra de inventario', 'admin', 0, 5, 'Stock inicial de ejemplo')
ON CONFLICT DO NOTHING;

-- Comentarios para documentar la estructura
COMMENT ON TABLE movimientos_repuestos IS 'Registro de movimientos de entrada y salida de repuestos';
COMMENT ON COLUMN movimientos_repuestos.tipo_movimiento IS 'Tipo de movimiento: entrada o salida';
COMMENT ON COLUMN movimientos_repuestos.repuesto_id IS 'Referencia al repuesto en la tabla repuestos';
COMMENT ON COLUMN movimientos_repuestos.reparacion_id IS 'Referencia opcional a la reparación que usa el repuesto';
COMMENT ON COLUMN movimientos_repuestos.stock_anterior IS 'Stock antes del movimiento';
COMMENT ON COLUMN movimientos_repuestos.stock_nuevo IS 'Stock después del movimiento';

COMMENT ON TABLE recuentos_repuestos IS 'Registro de recuentos físicos de inventario de repuestos';
COMMENT ON COLUMN recuentos_repuestos.repuestos_contados IS 'JSON con los repuestos contados y sus cantidades';
COMMENT ON COLUMN recuentos_repuestos.diferencias_encontradas IS 'JSON con las diferencias encontradas entre sistema y físico';