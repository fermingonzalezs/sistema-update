import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { setAuditContext, clearAuditContext, logLoginEvent, logLogoutEvent } from '../shared/services/auditService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión actual de Supabase Auth al iniciar
  useEffect(() => {
    let authSubscription = null;
    let isComponentMounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isComponentMounted) return;

        if (error) {
          console.error('Error obteniendo sesión:', error);
          setError(error.message);
        } else if (session?.user) {
          const userMetadata = session.user.user_metadata || {};
          console.log('✅ Sesión encontrada:', session.user.email, userMetadata);
          setUser(session.user);
        } else {
          console.log('ℹ️ No hay sesión activa');
        }
      } catch (err) {
        console.error('Error verificando sesión:', err);
        if (isComponentMounted) {
          setError(err.message);
        }
      } finally {
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Escuchar cambios de autenticación con throttling agresivo
    let lastAuthChange = 0;
    let lastEventType = '';
    const THROTTLE_MS = 3000; // 3 segundos de throttling más agresivo
    const TOKEN_REFRESH_THROTTLE = 10000; // 10 segundos para TOKEN_REFRESHED

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const now = Date.now();

        // Throttling especial para TOKEN_REFRESHED
        if (event === 'TOKEN_REFRESHED') {
          if (now - lastAuthChange < TOKEN_REFRESH_THROTTLE) {
            console.log('🕒 Token refresh throttled agresivamente, ignorando');
            return;
          }
        } else {
          // Throttling general para otros eventos
          if (now - lastAuthChange < THROTTLE_MS) {
            console.log('🕒 Auth change throttled, ignorando evento:', event);
            return;
          }
        }

        // Evitar procesamiento duplicado del mismo evento
        if (event === lastEventType && now - lastAuthChange < THROTTLE_MS * 2) {
          console.log('🕒 Evento duplicado ignorado:', event);
          return;
        }

        lastAuthChange = now;
        lastEventType = event;

        if (!isComponentMounted) return;

        console.log('🔄 Auth state change procesado:', event, session?.user?.email);

        if (event === 'SIGNED_OUT') {
          console.log('❌ Usuario deslogueado - investigando causa');
          setUser(null);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed exitosamente - manteniendo estado actual');
          // Solo actualizar si no hay usuario actual
          if (session?.user && !user) {
            setUser(session.user);
          }
          // NO llamar setLoading(false) en TOKEN_REFRESHED
          return;
        } else if (session?.user) {
          console.log('✅ Usuario logueado correctamente');
          setUser(session.user);
          setError(null);
        } else {
          console.log('ℹ️ No hay sesión activa');
          setUser(null);
        }
        setLoading(false);
      }
    );

    authSubscription = subscription;

    return () => {
      isComponentMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Función para limpiar cache y sesión
  const clearAuthCache = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
      console.log('🧹 Cache de autenticación limpiado');
    } catch (err) {
      console.log('⚠️ Error limpiando cache:', err);
    }
  };

  // Función de login con Supabase Auth directo
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Iniciando login con Supabase Auth...');

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      // Verificar metadatos del usuario (opcional)
      // En Supabase, los metadatos están en user_metadata
      const userMetadata = data.user.user_metadata || {};
      console.log('🔍 Metadatos del usuario:', userMetadata);

      // DESACTIVADO: Validación de usuario activo - permitir todos los logins
      // if (userMetadata.activo === false) {
      //   await supabase.auth.signOut();
      //   throw new Error('Usuario desactivado. Contacta al administrador');
      // }

      console.log('✅ Login exitoso:', {
        email: data.user.email,
        username: userMetadata.username,
        nivel: userMetadata.nivel
      });

      // ⭐ CONFIGURAR CONTEXTO DE AUDITORÍA
      // Esto hace que TODOS los triggers de Supabase capturen quién hace cada operación
      const userForAudit = {
        id: data.user.id,
        email: data.user.email,
        role: userMetadata.nivel || 'user',
        nivel: userMetadata.nivel,
        branch: userMetadata.sucursal || 'la_plata',
        sucursal: userMetadata.sucursal
      };

      await setAuditContext(userForAudit);

      // Registrar evento de login
      await logLoginEvent(userForAudit);

      return data.user;
    } catch (err) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      console.error('❌ Error en login:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función de logout con Supabase Auth
  const logout = async () => {
    try {
      console.log('🚪 Iniciando logout...');

      // Registrar evento de logout antes de cerrar sesión
      if (user) {
        const userMetadata = user.user_metadata || {};
        await logLogoutEvent({
          email: user.email,
          role: userMetadata.nivel,
          nivel: userMetadata.nivel,
          branch: userMetadata.sucursal,
          sucursal: userMetadata.sucursal
        });
      }

      // Limpiar contexto de auditoría
      await clearAuditContext();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Error en logout:', error);
        throw error;
      }

      // El estado se limpia automáticamente por onAuthStateChange
      console.log('✅ Logout completado correctamente');
    } catch (err) {
      console.error('❌ Error en logout:', err);
      // Forzar limpieza local aunque falle el logout remoto
      setUser(null);
      setError(null);
      // Intentar limpiar auditoría de todas formas
      await clearAuditContext().catch(() => {});
    }
  };

  // Verificar si el usuario tiene acceso a una sección
  const hasAccess = (section) => {
    // Si el usuario está autenticado, tiene acceso a todo
    return !!user;
  };

  // Obtener secciones permitidas para el usuario actual
  const getAllowedSections = () => {
    if (!user) return [];

    // Usuarios autenticados tienen acceso a todas las secciones
    return ['ventas', 'soporte', 'administracion', 'contabilidad', 'compras'];
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