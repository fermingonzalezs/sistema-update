/**
 * Servicio de Auditoría
 * Configura el contexto de usuario para que los triggers de Supabase
 * puedan capturar correctamente quién realizó cada operación
 */

import { supabase } from '../../lib/supabase';

/**
 * Configura el contexto de usuario en Supabase para auditoría
 * DEBE llamarse inmediatamente después del login exitoso
 *
 * @param {Object} user - Objeto del usuario autenticado
 * @param {string} user.email - Email del usuario
 * @param {string} user.role - Rol del usuario (admin, ventas, contabilidad, soporte)
 * @param {string} user.branch - Sucursal del usuario (la_plata, mitre, servicio_tecnico)
 * @returns {Promise<boolean>} - true si se configuró correctamente
 */
export const setAuditContext = async (user) => {
  try {
    if (!user || !user.email) {
      console.warn('⚠️ setAuditContext: Usuario no válido', user);
      return false;
    }

    const sessionId = crypto.randomUUID();

    // Configurar variables de sesión en Supabase
    // Estas variables son leídas por los triggers de auditoría
    const configs = [
      { name: 'app.user_id', value: user.id?.toString() || '' },
      { name: 'app.user_email', value: user.email },
      { name: 'app.user_role', value: user.role || user.nivel || 'unknown' },
      { name: 'app.user_branch', value: user.branch || user.sucursal || 'unknown' },
      { name: 'app.session_id', value: sessionId }
    ];

    // Ejecutar todas las configuraciones
    const results = await Promise.all(
      configs.map(({ name, value }) =>
        supabase.rpc('set_config', {
          setting: name,
          value: value
        }).catch(err => {
          console.error(`Error configurando ${name}:`, err);
          return { error: err };
        })
      )
    );

    // Verificar si hubo errores
    const hasErrors = results.some(r => r.error);

    if (hasErrors) {
      console.warn('⚠️ Algunos parámetros de auditoría no se configuraron correctamente');
    } else {
      console.log('✅ Contexto de auditoría configurado:', {
        email: user.email,
        role: user.role || user.nivel,
        branch: user.branch || user.sucursal,
        sessionId
      });
    }

    return !hasErrors;

  } catch (error) {
    console.error('❌ Error en setAuditContext:', error);
    return false;
  }
};

/**
 * Limpia el contexto de auditoría al hacer logout
 */
export const clearAuditContext = async () => {
  try {
    const configs = [
      'app.user_id',
      'app.user_email',
      'app.user_role',
      'app.user_branch',
      'app.session_id',
      'app.razon_operacion',
      'app.referencia_id'
    ];

    await Promise.all(
      configs.map(name =>
        supabase.rpc('set_config', {
          setting: name,
          value: ''
        }).catch(() => {}) // Ignorar errores en limpieza
      )
    );

    console.log('🧹 Contexto de auditoría limpiado');

  } catch (error) {
    console.error('Error limpiando contexto de auditoría:', error);
  }
};

/**
 * Configura la razón de la operación antes de realizar cambios
 * Esto hace que los triggers capturen automáticamente el contexto
 *
 * @param {string} razon - Razón de la operación
 * @param {string} referenciaId - ID de referencia (transaccion_id, asiento_id, etc)
 *
 * RAZONES PARA INVENTARIO:
 * - 'venta' - Eliminado porque se vendió
 * - 'eliminacion_manual' - Eliminado manualmente
 *
 * Ejemplo de uso:
 * await setOperationContext('venta', transaccionId);
 * await supabase.from('celulares').delete().eq('id', productoId);
 * // El trigger capturará razon_operacion = 'venta'
 */
export const setOperationContext = async (razon, referenciaId = null) => {
  try {
    const configs = [
      { name: 'app.razon_operacion', value: razon || '' }
    ];

    if (referenciaId) {
      configs.push({ name: 'app.referencia_id', value: referenciaId.toString() });
    }

    const results = await Promise.all(
      configs.map(({ name, value }) =>
        supabase.rpc('set_config', {
          setting: name,
          value: value
        }).catch(err => {
          console.error(`Error configurando ${name}:`, err);
          return { error: err };
        })
      )
    );

    const hasErrors = results.some(r => r.error);

    if (!hasErrors) {
      console.log('✅ Contexto de operación configurado:', { razon, referenciaId });
    }

    return !hasErrors;

  } catch (error) {
    console.error('❌ Error en setOperationContext:', error);
    return false;
  }
};

/**
 * Limpia el contexto de operación después de realizar cambios
 * Recomendado llamar después de operaciones importantes
 */
export const clearOperationContext = async () => {
  try {
    await Promise.all([
      supabase.rpc('set_config', { setting: 'app.razon_operacion', value: '' }),
      supabase.rpc('set_config', { setting: 'app.referencia_id', value: '' })
    ]);

    console.log('🧹 Contexto de operación limpiado');
  } catch (error) {
    console.error('Error limpiando contexto de operación:', error);
  }
};

/**
 * Registra un evento de auditoría manualmente desde React
 * Útil para eventos que no son operaciones de base de datos
 * (ej: login, exportaciones, impresiones de reportes)
 *
 * @param {Object} event
 * @param {string} event.categoria - ventas, contabilidad, inventario, etc.
 * @param {string} event.operation - LOGIN, LOGOUT, EXPORT, PRINT, etc.
 * @param {string} event.description - Descripción del evento
 * @param {string} event.severity - info, warning, critical
 * @param {Object} event.data - Datos adicionales (opcional)
 */
export const logManualEvent = async (event) => {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        user_email: event.user_email,
        user_role: event.user_role,
        user_branch: event.user_branch,
        table_name: 'manual_event',
        operation: event.operation || 'CUSTOM',
        categoria: event.categoria || 'sistema',
        severity: event.severity || 'info',
        description: event.description,
        new_values: event.data || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error registrando evento manual:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error en logManualEvent:', error);
    return false;
  }
};

/**
 * Función helper para registrar login exitoso
 */
export const logLoginEvent = async (user) => {
  return logManualEvent({
    user_email: user.email,
    user_role: user.role || user.nivel,
    user_branch: user.branch || user.sucursal,
    categoria: 'administracion',
    operation: 'LOGIN',
    description: `Login exitoso de ${user.email}`,
    severity: 'info',
    data: {
      email: user.email,
      role: user.role || user.nivel,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Función helper para registrar logout
 */
export const logLogoutEvent = async (user) => {
  return logManualEvent({
    user_email: user.email,
    user_role: user.role || user.nivel,
    user_branch: user.branch || user.sucursal,
    categoria: 'administracion',
    operation: 'LOGOUT',
    description: `Logout de ${user.email}`,
    severity: 'info',
    data: {
      email: user.email,
      timestamp: new Date().toISOString()
    }
  });
};
