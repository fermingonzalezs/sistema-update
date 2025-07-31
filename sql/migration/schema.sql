-- =====================================================
-- MIGRACIÓN DE ESQUEMA: SUPABASE → POSTGRESQL
-- Sistema Update - Base de datos completa
-- Generado automáticamente desde Supabase
-- =====================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS BASE (Sin dependencias)
-- =====================================================

-- 1. USUARIOS
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    nivel VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    primer_acceso BOOLEAN DEFAULT true,
    invitado_por TEXT,
    ultimo_acceso TIMESTAMP WITHOUT TIME ZONE
);

-- 2. VENDEDORES
CREATE TABLE vendedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 3. CLIENTES
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    cumpleanos DATE,
    procedencia VARCHAR(50),
    profesion VARCHAR(100),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PLAN DE CUENTAS (con auto-referencia)
CREATE TABLE plan_cuentas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    nivel INTEGER,
    padre_id INTEGER REFERENCES plan_cuentas(id),
    imputable BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    moneda_original TEXT DEFAULT 'ARS',
    requiere_cotizacion BOOLEAN DEFAULT false,
    categoria VARCHAR(100)
);

-- 5. COTIZACIONES DIARIAS
CREATE TABLE cotizaciones_diarias (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    cotizacion_compra NUMERIC NOT NULL,
    cotizacion_venta NUMERIC NOT NULL,
    cotizacion_promedio NUMERIC NOT NULL,
    fuente VARCHAR(50) NOT NULL,
    datos_raw JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ASIENTOS CONTABLES
CREATE TABLE asientos_contables (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    total_debe NUMERIC NOT NULL,
    total_haber NUMERIC NOT NULL,
    origen_operacion VARCHAR(50),
    operacion_id INTEGER,
    cotizacion_promedio NUMERIC,
    usuario VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 7. PROVEEDORES SUGERIDOS
CREATE TABLE proveedores_sugeridos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 8. SERVICIOS DE REPARACIÓN
CREATE TABLE servicios_reparacion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    precio_base NUMERIC DEFAULT 0 NOT NULL,
    tiempo_estimado TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. REPARACIONES
CREATE TABLE reparaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero TEXT NOT NULL,
    fecha_ingreso DATE DEFAULT CURRENT_DATE NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    cliente_email TEXT,
    equipo_tipo TEXT,
    equipo_marca TEXT,
    equipo_modelo TEXT,
    equipo_serial TEXT,
    accesorios_incluidos TEXT,
    problema_reportado TEXT NOT NULL,
    diagnostico TEXT,
    estado TEXT DEFAULT 'ingresado',
    presupuesto NUMERIC,
    costo_repuestos NUMERIC,
    tiempo_estimado TEXT,
    tecnico_asignado TEXT,
    prioridad TEXT DEFAULT 'media',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    presupuesto_json JSONB,
    cotizacion_usada NUMERIC,
    monto_pesos_original NUMERIC
);

-- =====================================================
-- TABLAS DE INVENTARIO
-- =====================================================

-- 10. INVENTARIO COMPUTADORAS
CREATE TABLE inventario (
    id BIGSERIAL PRIMARY KEY,
    serial VARCHAR(100) NOT NULL,
    modelo TEXT NOT NULL,
    precio_costo_usd NUMERIC DEFAULT 0 NOT NULL,
    envios_repuestos NUMERIC DEFAULT 0 NOT NULL,
    precio_costo_total NUMERIC,
    precio_venta_usd NUMERIC DEFAULT 0 NOT NULL,
    sucursal VARCHAR(50) DEFAULT 'la_plata' NOT NULL,
    condicion VARCHAR(20) DEFAULT 'usado' NOT NULL,
    procesador TEXT DEFAULT '',
    slots VARCHAR(10) DEFAULT '2',
    tipo_ram VARCHAR(20) DEFAULT 'DDR4',
    ram VARCHAR(20) DEFAULT '',
    ssd VARCHAR(20) DEFAULT '',
    hdd VARCHAR(20) DEFAULT '',
    so VARCHAR(20) DEFAULT 'WIN11',
    pantalla VARCHAR(20) DEFAULT '',
    resolucion VARCHAR(20) DEFAULT 'FHD',
    placa_video TEXT DEFAULT '',
    vram VARCHAR(20) DEFAULT '',
    teclado_retro VARCHAR(10) DEFAULT 'SI',
    idioma_teclado VARCHAR(20) DEFAULT 'Español',
    color VARCHAR(50) DEFAULT '',
    bateria VARCHAR(50) DEFAULT '',
    duracion VARCHAR(20) DEFAULT '',
    garantia_update VARCHAR(100) DEFAULT '6 meses',
    garantia_oficial VARCHAR(100) DEFAULT '',
    fallas TEXT DEFAULT 'Ninguna',
    disponible BOOLEAN NOT NULL,
    ingreso DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    marca VARCHAR,
    refresh VARCHAR,
    touchscreen BOOLEAN,
    estado VARCHAR(5)
);

-- 11. CELULARES
CREATE TABLE celulares (
    id BIGSERIAL PRIMARY KEY,
    serial TEXT NOT NULL,
    sucursal TEXT,
    precio_compra_usd NUMERIC,
    precio_venta_usd NUMERIC,
    modelo TEXT,
    capacidad TEXT,
    condicion TEXT NOT NULL,
    color TEXT,
    estado TEXT,
    bateria TEXT,
    ciclos INTEGER,
    garantia TEXT,
    fallas TEXT,
    disponible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    marca VARCHAR
);

-- 12. OTROS PRODUCTOS
CREATE TABLE otros (
    id BIGSERIAL PRIMARY KEY,
    nombre_producto TEXT,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio_compra_usd NUMERIC,
    precio_venta_usd NUMERIC,
    cantidad_la_plata INTEGER DEFAULT 0,
    cantidad_mitre INTEGER DEFAULT 0,
    garantia VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    condicion VARCHAR(50) DEFAULT 'nuevo'
);

-- 13. REPUESTOS (Usa misma secuencia que otros)
CREATE TABLE repuestos (
    id BIGINT DEFAULT nextval('otros_id_seq') PRIMARY KEY,
    nombre_producto TEXT,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio_compra_usd NUMERIC,
    precio_venta_usd NUMERIC,
    cantidad_la_plata INTEGER DEFAULT 0,
    cantidad_mitre INTEGER DEFAULT 0,
    garantia VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    condicion VARCHAR(50) DEFAULT 'nuevo'
);

-- =====================================================
-- TABLAS DE TRANSACCIONES
-- =====================================================

-- 14. TRANSACCIONES
CREATE TABLE transacciones (
    id BIGSERIAL PRIMARY KEY,
    numero_transaccion TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_email TEXT,
    cliente_telefono TEXT,
    metodo_pago TEXT NOT NULL,
    total_venta NUMERIC NOT NULL,
    total_costo NUMERIC,
    margen_total NUMERIC,
    observaciones TEXT,
    vendedor TEXT,
    sucursal TEXT,
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    cliente_id INTEGER REFERENCES clientes(id),
    metodo_pago_2 TEXT,
    monto_pago_1 NUMERIC,
    monto_pago_2 NUMERIC
);

-- 15. VENTA ITEMS
CREATE TABLE venta_items (
    id BIGSERIAL PRIMARY KEY,
    transaccion_id BIGINT REFERENCES transacciones(id),
    tipo_producto TEXT NOT NULL,
    producto_id BIGINT NOT NULL,
    serial_producto TEXT,
    copy TEXT NOT NULL,
    cantidad INTEGER DEFAULT 1 NOT NULL,
    precio_unitario NUMERIC NOT NULL,
    precio_total NUMERIC NOT NULL,
    precio_costo NUMERIC,
    margen_item NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLAS CON DEPENDENCIAS COMPLEJAS
-- =====================================================

-- 16. MOVIMIENTOS CONTABLES
CREATE TABLE movimientos_contables (
    id BIGSERIAL PRIMARY KEY,
    asiento_id INTEGER REFERENCES asientos_contables(id) NOT NULL,
    cuenta_id INTEGER REFERENCES plan_cuentas(id) NOT NULL,
    debe NUMERIC DEFAULT 0.00 NOT NULL,
    haber NUMERIC DEFAULT 0.00 NOT NULL,
    cotizacion NUMERIC,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 17. CUENTAS CORRIENTES
CREATE TABLE cuentas_corrientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) NOT NULL,
    tipo_movimiento VARCHAR(10) NOT NULL,
    tipo_operacion VARCHAR(20) NOT NULL,
    concepto TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    fecha_operacion DATE DEFAULT CURRENT_DATE NOT NULL,
    estado VARCHAR(15) DEFAULT 'pendiente' NOT NULL,
    referencia_venta_id BIGINT REFERENCES venta_items(id),
    comprobante VARCHAR(100),
    observaciones TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. CONCILIACIONES CAJA
CREATE TABLE conciliaciones_caja (
    id SERIAL PRIMARY KEY,
    cuenta_caja_id INTEGER REFERENCES plan_cuentas(id),
    fecha_conciliacion DATE,
    saldo_contable NUMERIC,
    saldo_fisico NUMERIC,
    diferencia NUMERIC,
    observaciones TEXT,
    usuario_concilio VARCHAR(50),
    estado VARCHAR(20),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 19. IMPORTACIONES
CREATE TABLE importaciones (
    id SERIAL PRIMARY KEY,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    estado VARCHAR(50) DEFAULT 'cotizacion',
    cliente_id INTEGER REFERENCES clientes(id),
    descripcion TEXT NOT NULL,
    link_producto TEXT,
    proveedor_nombre VARCHAR(255),
    precio_compra_usd NUMERIC NOT NULL,
    peso_estimado_kg NUMERIC NOT NULL,
    impuestos_usa_porcentaje NUMERIC DEFAULT 0,
    envio_usa_fijo NUMERIC DEFAULT 0,
    envio_arg_fijo NUMERIC DEFAULT 0,
    precio_por_kg NUMERIC NOT NULL,
    total_cotizado NUMERIC,
    fecha_aprobacion TIMESTAMP WITHOUT TIME ZONE,
    numero_seguimiento VARCHAR(255),
    peso_real_kg NUMERIC,
    costos_finales NUMERIC,
    diferencia_estimado_real NUMERIC,
    activo BOOLEAN DEFAULT true
);

-- 20. PRESUPUESTOS REPARACIÓN
CREATE TABLE presupuestos_reparacion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reparacion_id UUID REFERENCES reparaciones(id) NOT NULL,
    numero_presupuesto TEXT NOT NULL,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    estado TEXT DEFAULT 'pendiente',
    subtotal_servicios NUMERIC DEFAULT 0,
    subtotal_repuestos NUMERIC DEFAULT 0,
    subtotal_repuestos_terceros NUMERIC DEFAULT 0,
    costo_total NUMERIC DEFAULT 0,
    margen_ganancia NUMERIC DEFAULT 30.00,
    precio_final NUMERIC DEFAULT 0,
    observaciones TEXT,
    validez_dias INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- TABLAS DE GESTIÓN Y ADMINISTRACIÓN
-- =====================================================

-- 21. FOTOS PRODUCTOS
CREATE TABLE fotos_productos (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    tipo_producto VARCHAR(20) NOT NULL,
    url_foto TEXT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tamaño_archivo INTEGER,
    orden INTEGER DEFAULT 1,
    es_principal BOOLEAN DEFAULT false,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 22. LISTAS PRECIOS
CREATE TABLE listas_precios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    mensaje_inicial TEXT,
    mensaje_final TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    productos_incluidos JSONB DEFAULT '[]'
);

-- 23. INGRESOS EQUIPOS
CREATE TABLE ingresos_equipos (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tipo_producto VARCHAR(50) NOT NULL,
    descripcion_completa TEXT NOT NULL,
    precio_compra NUMERIC,
    proveedor VARCHAR(255),
    garantias TEXT,
    destino VARCHAR(20) NOT NULL,
    usuario_ingreso VARCHAR(255),
    referencia_inventario_id INTEGER,
    estado VARCHAR(20) DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 24. TESTEO EQUIPOS
CREATE TABLE testeo_equipos (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    serial VARCHAR(100),
    proveedor VARCHAR(100),
    observaciones TEXT,
    estado_testeo VARCHAR(20) DEFAULT 'pendiente',
    checklist_data JSONB,
    checklist_completado BOOLEAN DEFAULT false,
    estado_estetico VARCHAR(20) DEFAULT 'bueno',
    observaciones_testeo TEXT,
    fecha_testeo TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. MOVIMIENTOS REPUESTOS EQUIPOS
CREATE TABLE movimientos_repuestos_equipos (
    id SERIAL PRIMARY KEY,
    serial_equipo VARCHAR(255) NOT NULL,
    motivo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    entradas JSONB DEFAULT '[]',
    salidas JSONB DEFAULT '[]',
    total_entradas NUMERIC DEFAULT 0,
    total_salidas NUMERIC DEFAULT 0,
    resultado_final NUMERIC DEFAULT 0,
    usuario VARCHAR(100) DEFAULT 'admin',
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 26. RECUENTOS STOCK
CREATE TABLE recuentos_stock (
    id SERIAL PRIMARY KEY,
    fecha_recuento DATE,
    tipo_recuento VARCHAR(20),
    productos_contados JSONB,
    diferencias_encontradas JSONB,
    observaciones TEXT,
    usuario_recuento VARCHAR(50),
    estado VARCHAR(20),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    sucursal VARCHAR(20) DEFAULT 'la_plata'
);

-- 27. RECUENTOS REPUESTOS
CREATE TABLE recuentos_repuestos (
    id SERIAL PRIMARY KEY,
    fecha_recuento DATE,
    tipo_recuento VARCHAR(20),
    repuestos_contados JSONB,
    diferencias_encontradas JSONB,
    observaciones TEXT,
    usuario_recuento VARCHAR(50),
    estado VARCHAR(20),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    sucursal VARCHAR(20) DEFAULT 'la_plata'
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices únicos
CREATE UNIQUE INDEX idx_inventario_serial ON inventario(serial);
CREATE UNIQUE INDEX idx_celulares_serial ON celulares(serial);
CREATE UNIQUE INDEX idx_usuarios_username ON usuarios(username);
CREATE UNIQUE INDEX idx_plan_cuentas_codigo ON plan_cuentas(codigo);

-- Índices de búsqueda frecuente
CREATE INDEX idx_inventario_disponible ON inventario(disponible);
CREATE INDEX idx_celulares_disponible ON celulares(disponible);
CREATE INDEX idx_clientes_activo ON clientes(activo);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha_venta);
CREATE INDEX idx_movimientos_contables_cuenta ON movimientos_contables(cuenta_id);
CREATE INDEX idx_movimientos_contables_asiento ON movimientos_contables(asiento_id);
CREATE INDEX idx_cuentas_corrientes_cliente ON cuentas_corrientes(cliente_id);
CREATE INDEX idx_venta_items_transaccion ON venta_items(transaccion_id);
CREATE INDEX idx_fotos_productos_lookup ON fotos_productos(producto_id, tipo_producto);

-- Índices para fechas (optimización reportes)
CREATE INDEX idx_asientos_contables_fecha ON asientos_contables(fecha);
CREATE INDEX idx_cotizaciones_diarias_fecha ON cotizaciones_diarias(fecha);
CREATE INDEX idx_reparaciones_fecha_ingreso ON reparaciones(fecha_ingreso);

-- =====================================================
-- COMENTARIOS DESCRIPTIVOS
-- =====================================================

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles y permisos';
COMMENT ON TABLE clientes IS 'Clientes del negocio para ventas y servicios';
COMMENT ON TABLE plan_cuentas IS 'Plan de cuentas contable jerárquico';
COMMENT ON TABLE inventario IS 'Inventario de computadoras/notebooks';
COMMENT ON TABLE celulares IS 'Inventario de dispositivos móviles';
COMMENT ON TABLE otros IS 'Inventario de otros productos y accesorios';
COMMENT ON TABLE repuestos IS 'Inventario de repuestos para reparaciones';
COMMENT ON TABLE transacciones IS 'Transacciones de venta realizadas';
COMMENT ON TABLE venta_items IS 'Items detallados de cada transacción';
COMMENT ON TABLE asientos_contables IS 'Asientos del libro diario contable';
COMMENT ON TABLE movimientos_contables IS 'Movimientos detallados debe/haber por cuenta';
COMMENT ON TABLE cuentas_corrientes IS 'Cuentas corrientes de clientes';
COMMENT ON TABLE reparaciones IS 'Órdenes de reparación de equipos';
COMMENT ON TABLE importaciones IS 'Tracking de importaciones y cotizaciones';

-- =====================================================
-- TRIGGERS DE ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_celulares_updated_at BEFORE UPDATE ON celulares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_otros_updated_at BEFORE UPDATE ON otros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repuestos_updated_at BEFORE UPDATE ON repuestos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plan_cuentas_updated_at BEFORE UPDATE ON plan_cuentas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VALIDACIONES FINALES
-- =====================================================

-- Verificar que se crearon todas las tablas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    IF table_count >= 27 THEN
        RAISE NOTICE 'SUCCESS: % tablas creadas correctamente', table_count;
    ELSE
        RAISE EXCEPTION 'ERROR: Solo se crearon % tablas, esperadas 27 o más', table_count;
    END IF;
END $$;

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- Total de tablas: 27
-- Total de índices: ~20
-- Total de foreign keys: 10
-- Compatible con PostgreSQL 12+
-- =====================================================