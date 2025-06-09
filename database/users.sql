-- Tabla de usuarios con niveles de acceso
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('admin', 'soporte', 'ventas', 'contabilidad')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_nivel ON usuarios(nivel);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Función para hashear contraseñas (usando crypt de PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para crear usuario
CREATE OR REPLACE FUNCTION crear_usuario(
  p_username VARCHAR(50),
  p_password VARCHAR(100),
  p_nombre VARCHAR(100),
  p_nivel VARCHAR(20)
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO usuarios (username, password_hash, nombre, nivel)
  VALUES (p_username, crypt(p_password, gen_salt('bf')), p_nombre, p_nivel);
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar login
CREATE OR REPLACE FUNCTION verificar_login(
  p_username VARCHAR(50),
  p_password VARCHAR(100)
) RETURNS TABLE (
  id INTEGER,
  username VARCHAR(50),
  nombre VARCHAR(100),
  nivel VARCHAR(20),
  activo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.nombre, u.nivel, u.activo
  FROM usuarios u
  WHERE u.username = p_username 
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.activo = true;
END;
$$ LANGUAGE plpgsql;

-- Insertar usuario admin por defecto
SELECT crear_usuario('admin', 'admin123', 'Administrador', 'admin');

-- Comentarios sobre los niveles de acceso:
-- admin: Acceso completo a todas las secciones
-- soporte: Solo acceso a secciones de soporte y carga de equipos
-- ventas: Solo acceso a secciones de ventas y clientes
-- contabilidad: Solo acceso a secciones de contabilidad