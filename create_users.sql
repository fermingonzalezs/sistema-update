-- =====================================================
-- SCRIPT PARA CREAR USUARIOS ADMINISTRATIVOS
-- Sistema Update - Crear 3 usuarios admin
-- =====================================================

-- 1. Habilitar extensión pgcrypto para encriptar contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Crear función de verificación de login (si no existe)
CREATE OR REPLACE FUNCTION verificar_usuario_login(p_email_or_username TEXT, p_password TEXT)
RETURNS TABLE(
    id INTEGER,
    username VARCHAR(50),
    nombre VARCHAR(100),
    nivel VARCHAR(20),
    email TEXT,
    activo BOOLEAN,
    necesita_contrasena BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.nombre,
        u.nivel,
        u.email,
        u.activo,
        false as necesita_contrasena
    FROM usuarios u
    WHERE (u.username = p_email_or_username OR u.email = p_email_or_username)
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.activo = true;
END;
$$;

-- 3. Insertar los 3 usuarios administrativos
INSERT INTO usuarios (username, password_hash, nombre, nivel, email, activo, primer_acceso) VALUES
('fermin.tech', crypt('update3008$', gen_salt('bf')), 'Fermín Admin', 'admin', 'fermin.tech@updatetech.com', true, false),
('alvaro.tech', crypt('update3008$', gen_salt('bf')), 'Álvaro Admin', 'admin', 'alvaro.tech@updatetech.com', true, false),
('yael.tech', crypt('update3008$', gen_salt('bf')), 'Yael Admin', 'admin', 'yael.tech@updatetech.com', true, false)
ON CONFLICT (username) DO UPDATE SET
    password_hash = crypt('update3008$', gen_salt('bf')),
    nombre = EXCLUDED.nombre,
    nivel = 'admin',
    email = EXCLUDED.email,
    activo = true,
    primer_acceso = false,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Crear funciones adicionales para la gestión de usuarios (si no existen)
CREATE OR REPLACE FUNCTION log_login_attempt(
    username TEXT,
    success BOOLEAN,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    failure_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Por ahora solo loguear en los logs de Supabase
    -- Se puede crear una tabla de auditoría más adelante si es necesario
    RAISE NOTICE 'Login attempt: % - Success: % - Reason: %', username, success, failure_reason;
END;
$$;

CREATE OR REPLACE FUNCTION set_current_user_context(
    user_id INTEGER,
    user_email TEXT,
    user_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Establecer contexto del usuario para RLS
    PERFORM set_config('app.current_user_id', user_id::text, true);
    PERFORM set_config('app.current_user_email', user_email, true);
    PERFORM set_config('app.current_user_role', user_role, true);
END;
$$;

CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Limpiar contexto del usuario
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_user_email', '', true);
    PERFORM set_config('app.current_user_role', '', true);
END;
$$;

-- 5. Verificar que los usuarios se crearon correctamente
SELECT 
    id,
    username,
    nombre,
    nivel,
    email,
    activo,
    created_at
FROM usuarios 
WHERE username IN ('fermin.tech', 'alvaro.tech', 'yael.tech')
ORDER BY username;

-- 6. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Script completado exitosamente';
    RAISE NOTICE '👤 Usuarios creados:';
    RAISE NOTICE '   - fermin.tech / update3008$ (admin)';
    RAISE NOTICE '   - alvaro.tech / update3008$ (admin)';
    RAISE NOTICE '   - yael.tech / update3008$ (admin)';
    RAISE NOTICE '🔐 Todos los usuarios tienen nivel admin y están activos';
END $$;