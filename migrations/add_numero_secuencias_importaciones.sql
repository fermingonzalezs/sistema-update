-- Crear tabla para manejar secuencias de números de recibos (ATÓMICA)
CREATE TABLE IF NOT EXISTS numero_secuencias (
  id SERIAL PRIMARY KEY,
  tipo_documento VARCHAR(50) NOT NULL UNIQUE,
  ultimo_numero INT NOT NULL DEFAULT 0,
  ano INT NOT NULL DEFAULT 2026,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_tipo_ano UNIQUE(tipo_documento, ano)
);

-- Insertar registro inicial para importaciones si no existe
INSERT INTO numero_secuencias (tipo_documento, ultimo_numero, ano)
VALUES ('importaciones_recibos', 0, 2026)
ON CONFLICT (tipo_documento, ano) DO NOTHING;

-- Crear función SQL para generar número de recibo de forma ATÓMICA
CREATE OR REPLACE FUNCTION obtener_proximo_numero_recibo(p_ano INT DEFAULT 2026)
RETURNS VARCHAR AS $$
DECLARE
  v_proximo INT;
  v_numero_recibo VARCHAR;
BEGIN
  -- Lock y actualizar la secuencia de forma atómica
  UPDATE numero_secuencias
  SET ultimo_numero = ultimo_numero + 1
  WHERE tipo_documento = 'importaciones_recibos' AND ano = p_ano
  RETURNING ultimo_numero INTO v_proximo;
  
  -- Si no existe la secuencia para este año, crearla
  IF v_proximo IS NULL THEN
    INSERT INTO numero_secuencias (tipo_documento, ultimo_numero, ano)
    VALUES ('importaciones_recibos', 1, p_ano);
    v_proximo := 1;
  END IF;
  
  -- Formar el número de recibo
  v_numero_recibo := p_ano || '-' || LPAD(v_proximo::TEXT, 2, '0');
  
  RETURN v_numero_recibo;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS (si no está ya habilitado)
ALTER TABLE numero_secuencias ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Todos los usuarios autenticados pueden leer y actualizar
CREATE POLICY "Allow authenticated users to manage secuencias"
  ON numero_secuencias
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to manage secuencias"
  ON numero_secuencias
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
