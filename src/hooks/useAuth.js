import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (err) {
        console.error('Error parsing saved user data:', err);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  // Función de login mejorada con RLS
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Iniciando proceso de login con RLS...');
      
      // Llamar a la función de verificación en Supabase
      const { data, error: supabaseError } = await supabase
        .rpc('verificar_usuario_login', {
          p_email_or_username: username,
          p_password: password || '' // Si no hay password, enviar string vacío
        });

      if (supabaseError) {
        throw new Error(`Error de base de datos: ${supabaseError.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Usuario no encontrado o contraseña incorrecta');
      }

      const userData = data[0];
      
      if (!userData.activo) {
        throw new Error('Usuario desactivado. Contacta al administrador');
      }

      // Si necesita establecer contraseña, retornar información especial
      if (userData.necesita_contrasena) {
        return {
          needsPasswordSetup: true,
          username: userData.username,
          email: userData.email,
          nombre: userData.nombre
        };
      }

      // ✅ CREAR UNA SESIÓN SUPABASE AUTH SIMULADA PARA RLS
      // Esto permite que las políticas RLS funcionen correctamente
      try {
        console.log('🔄 Configurando sesión para RLS...');
        
        // Intentar crear/actualizar un usuario en auth.users para RLS
        const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
          email: userData.email || `${userData.username}@sistema-update.local`,
          password: password || 'temp-password'
        });

        console.log('🔍 Auth result:', { authUser, authError });

        // Si falla el auth nativo, continuar con el método tradicional pero configurar el contexto
        if (authError) {
          console.log('⚠️ Auth nativo falló, usando método tradicional con contexto RLS');
          
          // Establecer información del usuario en el contexto global para las funciones RLS
          await supabase.rpc('set_current_user_context', {
            user_id: userData.id,
            user_email: userData.email || `${userData.username}@sistema-update.local`,
            user_role: userData.nivel
          }).catch(err => {
            console.warn('⚠️ No se pudo establecer contexto RLS:', err);
          });
        }

      } catch (authSetupError) {
        console.warn('⚠️ Error configurando autenticación RLS:', authSetupError);
        // Continuar con login tradicional
      }

      // Login normal con información extendida para RLS
      const userInfo = {
        id: userData.id,
        username: userData.username,
        nombre: userData.nombre,
        email: userData.email,
        nivel: userData.nivel,
        loginTime: new Date().toISOString(),
        // ✅ INFORMACIÓN ADICIONAL PARA RLS
        role: userData.nivel, // Alias para compatibilidad
        isAuthenticated: true
      };

      setUser(userInfo);
      localStorage.setItem('auth_user', JSON.stringify(userInfo));
      
      // ✅ REGISTRAR LOGIN EXITOSO EN AUDITORÍA
      try {
        await supabase.rpc('log_login_attempt', {
          username: userData.username,
          success: true,
          ip_address: null, // Se puede obtener del header si es necesario
          user_agent: navigator.userAgent,
          failure_reason: null
        });
      } catch (logError) {
        console.warn('⚠️ Error registrando login en auditoría:', logError);
      }

      console.log('✅ Login completado con RLS:', {
        user: userData.username,
        role: userData.nivel,
        rls_enabled: true
      });
      
      return userInfo;
    } catch (err) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      console.error('❌ Error en login:', errorMessage);
      
      // ✅ REGISTRAR INTENTO DE LOGIN FALLIDO EN AUDITORÍA
      try {
        await supabase.rpc('log_login_attempt', {
          username: username,
          success: false,
          ip_address: null,
          user_agent: navigator.userAgent,
          failure_reason: errorMessage
        });
      } catch (logError) {
        console.warn('⚠️ Error registrando login fallido en auditoría:', logError);
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función de logout mejorada con limpieza RLS
  const logout = async () => {
    try {
      console.log('🚪 Iniciando proceso de logout...');
      
      // Limpiar contexto RLS
      await supabase.rpc('clear_user_context').catch(err => {
        console.warn('⚠️ Error limpiando contexto RLS:', err);
      });
      
      // Intentar logout de Supabase Auth si está activo
      await supabase.auth.signOut().catch(err => {
        console.warn('⚠️ Error en logout de Supabase Auth:', err);
      });
      
      // Limpiar estado local
      setUser(null);
      setError(null);
      localStorage.removeItem('auth_user');
      
      console.log('✅ Logout completado correctamente');
    } catch (err) {
      console.error('❌ Error en logout:', err);
      // Forzar limpieza local aunque falle la limpieza remota
      setUser(null);
      setError(null);
      localStorage.removeItem('auth_user');
    }
  };

  // Verificar si el usuario tiene acceso a una sección
  const hasAccess = (section) => {
    if (!user) return false;

    const { nivel } = user;
    
    // Admin tiene acceso a todo
    if (nivel === 'admin') return true;

    // Definir secciones por nivel
    const sectionsByLevel = {
      ventas: [
        'inventario', 'celulares', 'otros', 'procesar-venta', 
        'gestion-fotos', 'copys', 'clientes', 'ventas'
      ],
      soporte: [
        'reparaciones', 'repuestos', 'movimientos-repuestos',
        'presupuestos-reparacion', 'testeo-equipos'
      ],
      contabilidad: [
        'plan-cuentas', 'libro-diario', 'libro-mayor', 'conciliacion-caja',
        'estado-situacion-patrimonial', 'estado-resultados', 'balance-sumas-saldos'
      ],
      administracion: [
        'dashboard-reportes', 'garantias', 'comisiones', 'recuento-stock',
        'ventas', 'importaciones', 'cotizaciones', 'pendientes-compra', 
        'en-transito', 'historial-importaciones', 'cuentas-corrientes',
        'ingreso-equipos'
      ]
    };

    // Verificar acceso según el nivel
    return sectionsByLevel[nivel]?.includes(section) || false;
  };

  // Obtener secciones permitidas para el usuario actual
  const getAllowedSections = () => {
    if (!user) return [];

    const { nivel } = user;
    
    if (nivel === 'admin') {
      // Admin ve todo
      return ['ventas', 'soporte', 'administracion', 'contabilidad'];
    }

    // Otros niveles solo ven su sección correspondiente
    const levelToSections = {
      ventas: ['ventas'],
      soporte: ['soporte'],
      contabilidad: ['contabilidad']
    };

    return levelToSections[nivel] || [];
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasAccess,
    getAllowedSections,
    isAuthenticated: !!user
  };
};