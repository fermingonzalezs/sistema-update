-- Crear tabla para testeo de equipos
CREATE TABLE IF NOT EXISTS testeo_equipos (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('notebook', 'celular')),
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    serial VARCHAR(100),
    precio_compra DECIMAL(10,2) DEFAULT 0,
    proveedor VARCHAR(100),
    observaciones TEXT,
    
    -- Campos de testeo
    estado_testeo VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_testeo IN ('pendiente', 'aprobado', 'rechazado')),
    checklist_data JSONB, -- Almacena el checklist como JSON
    checklist_completado BOOLEAN DEFAULT FALSE,
    estado_estetico VARCHAR(20) DEFAULT 'bueno' CHECK (estado_estetico IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'malo')),
    observaciones_testeo TEXT,
    fecha_testeo TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_testeo_equipos_tipo ON testeo_equipos(tipo);
CREATE INDEX IF NOT EXISTS idx_testeo_equipos_estado ON testeo_equipos(estado_testeo);
CREATE INDEX IF NOT EXISTS idx_testeo_equipos_marca_modelo ON testeo_equipos(marca, modelo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_testeo_equipos_updated_at
    BEFORE UPDATE ON testeo_equipos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos datos de ejemplo (opcional)
INSERT INTO testeo_equipos (tipo, marca, modelo, serial, proveedor, observaciones) VALUES
('notebook', 'Lenovo', 'ThinkPad E14', 'LT001234', 'TechnoComputer', 'Notebook usado en buen estado'),
('celular', 'Samsung', 'Galaxy A54', 'SM789456', 'MobileStore', 'Celular seminuevo con caja'),
('notebook', 'HP', 'Pavilion 15', 'HP567890', 'CompuMundo', 'Requiere limpieza interna')
ON CONFLICT DO NOTHING;