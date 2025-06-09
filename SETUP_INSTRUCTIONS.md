# 🔐 Sistema de Login - Instrucciones de Configuración

## 📋 Resumen

Se ha implementado un sistema de autenticación completo con niveles de usuario:

- **admin**: Acceso completo a todas las secciones
- **soporte**: Solo acceso a secciones de soporte (carga de equipos, reparaciones, repuestos, etc.)
- **ventas**: Solo acceso a secciones de ventas (inventario, celulares, otros, clientes, etc.)
- **contabilidad**: Solo acceso a secciones de contabilidad (plan de cuentas, libro diario, gastos, etc.)

## 🚀 Pasos para Configurar

### 1. Ejecutar el SQL en Supabase

1. Ve a tu panel de Supabase
2. Navega a **SQL Editor**
3. Ejecuta el contenido del archivo `database/users.sql`

### 2. Verificar la Configuración

El sistema creará automáticamente:
- Tabla `usuarios` con encriptación de contraseñas
- Funciones para crear usuarios y verificar login
- Usuario admin por defecto:
  - **Usuario**: `admin`
  - **Contraseña**: `admin123`
  - **Nivel**: `admin`

### 3. Crear Usuarios Adicionales

Para crear más usuarios, ejecuta en Supabase:

```sql
-- Crear usuario de ventas
SELECT crear_usuario('vendedor1', 'password123', 'Juan Pérez', 'ventas');

-- Crear usuario de soporte
SELECT crear_usuario('tecnico1', 'password123', 'María García', 'soporte');

-- Crear usuario de contabilidad
SELECT crear_usuario('contador1', 'password123', 'Carlos López', 'contabilidad');
```

## 🔒 Características de Seguridad

- **Contraseñas encriptadas**: Usa bcrypt con PostgreSQL
- **Sesiones persistentes**: Los usuarios permanecen logueados
- **Control de acceso**: Cada nivel solo ve sus secciones permitidas
- **Validación robusta**: Verificación de usuarios activos
- **Logout seguro**: Limpia sesión local

## 🎯 Niveles de Acceso

### Admin (admin)
- ✅ Todas las secciones
- ✅ Gestión completa

### Ventas (ventas)
- ✅ Notebooks (inventario)
- ✅ Celulares
- ✅ Otros Productos
- ✅ Procesar Venta
- ✅ Gestión de Fotos
- ✅ Generador Copys
- ✅ Clientes

### Soporte (soporte)
- ✅ Carga de Equipos
- ✅ Reparaciones
- ✅ Repuestos
- ✅ Recuento Repuestos
- ✅ Presupuestos de Reparación

### Contabilidad (contabilidad)
- ✅ Plan de Cuentas
- ✅ Libro Diario
- ✅ Reporte Movimientos
- ✅ Libro Mayor
- ✅ Conciliación Caja
- ✅ Gastos Operativos
- ✅ Cuentas Corrientes

## 🛠️ Componentes Creados

1. **`src/components/Login.jsx`** - Interfaz de login
2. **`src/context/AuthContext.jsx`** - Contexto de autenticación
3. **`src/hooks/useAuth.js`** - Hook de autenticación
4. **`database/users.sql`** - Script de base de datos

## 📝 Modificaciones Realizadas

1. **App.jsx**: Integrado sistema de autenticación
2. **Sidebar.jsx**: Filtrado de secciones por nivel
3. **Protección de rutas**: Cada sección verifica permisos

## ⚠️ Importante

1. **Ejecuta el SQL primero** antes de probar el login
2. **Usuario por defecto**: admin / admin123
3. **Cambia la contraseña** del admin en producción
4. **Backup de la BD** antes de ejecutar cambios

¡El sistema está listo para usar! 🎉