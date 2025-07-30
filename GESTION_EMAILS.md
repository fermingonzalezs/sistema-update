# Gestión de Emails Autorizados

## Sistema Implementado ✅

### **Usuario Admin Fijo:**
- **Usuario**: `admin`
- **Contraseña**: `adminadmin666`
- **Acceso**: Completo al sistema

### **Emails Autorizados:**
Los usuarios se agregan manualmente a la base de datos y la primera vez que ingresan deben configurar su contraseña.

## Comandos SQL para Gestión

### 1. Agregar Email Autorizado
```sql
SELECT agregar_usuario_autorizado(
  'email@empresa.com',      -- Email del usuario
  'Nombre Completo',        -- Nombre para mostrar
  'ventas'                  -- Nivel: admin/ventas/soporte/contabilidad
);
```

**Ejemplos:**
```sql
-- Agregar vendedor
SELECT agregar_usuario_autorizado('pedro.martinez@empresa.com', 'Pedro Martínez', 'ventas');

-- Agregar contador
SELECT agregar_usuario_autorizado('ana.rodriguez@empresa.com', 'Ana Rodríguez', 'contabilidad');

-- Agregar técnico
SELECT agregar_usuario_autorizado('luis.gonzalez@empresa.com', 'Luis González', 'soporte');

-- Agregar admin
SELECT agregar_usuario_autorizado('gerente@empresa.com', 'Gerente General', 'admin');
```

### 2. Ver Emails Autorizados
```sql
SELECT * FROM listar_emails_autorizados();
```

### 3. Eliminar Email Autorizado
```sql
DELETE FROM usuarios WHERE email = 'email@empresa.com';
```

### 4. Cambiar Nivel de Usuario
```sql
UPDATE usuarios 
SET nivel = 'admin' 
WHERE email = 'usuario@empresa.com';
```

### 5. Desactivar Usuario (sin eliminar)
```sql
UPDATE usuarios 
SET activo = false 
WHERE email = 'usuario@empresa.com';
```

### 6. Resetear Contraseña (forzar reconfiguración)
```sql
UPDATE usuarios 
SET password_hash = '', primer_acceso = true 
WHERE email = 'usuario@empresa.com';
```

## Cómo Funciona el Login

### **Para Admin:**
1. Ingresa: `admin` (usuario) y `adminadmin666` (contraseña)
2. Acceso inmediato al sistema

### **Para Emails Autorizados:**
1. Usuario ingresa su **email completo** (ej: `juan@empresa.com`)
2. **Puede dejar la contraseña vacía** en el primer acceso
3. Sistema detecta que necesita configurar contraseña
4. **Pantalla de configuración** aparece automáticamente
5. Usuario establece contraseña segura
6. **Próximos accesos**: email + contraseña configurada

## Niveles de Acceso

- **admin**: Acceso completo (todas las secciones)
- **ventas**: Inventario, clientes, ventas, listas
- **soporte**: Reparaciones, equipos, repuestos, testeo
- **contabilidad**: Cuentas, gastos, reportes financieros

## Emails de Ejemplo Preconfigurados

Ya están creados estos emails para pruebas:
- `juan.perez@empresa.com` (Ventas)
- `maria.garcia@empresa.com` (Contabilidad) 
- `carlos.lopez@empresa.com` (Soporte)

Puedes probar ingresando cualquiera de estos emails para ver el flujo completo.

## Mantenimiento

### Ver usuarios sin contraseña:
```sql
SELECT email, nombre, nivel 
FROM usuarios 
WHERE password_hash = '' AND primer_acceso = true;
```

### Ver usuarios activos:
```sql
SELECT email, nombre, nivel, 
       CASE WHEN password_hash != '' THEN 'Configurada' ELSE 'Pendiente' END as estado_password
FROM usuarios 
WHERE activo = true 
ORDER BY nombre;
```

---

**¡El sistema está listo para usar!** 🎉