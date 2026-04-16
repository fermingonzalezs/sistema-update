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
        // Forzar refresh del token para obtener el metadata más actualizado
        const { data: refreshData } = await supabase.auth.refreshSession();
        const session = refreshData?.session || (await supabase.auth.getSession()).data?.session;

        if (!isComponentMounted) return;

        if (session?.user) {
          setUser(session.user);
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
    const THROTTLE_MS = 3000;
    const TOKEN_REFRESH_THROTTLE = 10000;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const now = Date.now();

        // Throttling especial para TOKEN_REFRESHED
        if (event === 'TOKEN_REFRESHED') {
          if (now - lastAuthChange < TOKEN_REFRESH_THROTTLE) return;
        } else {
          if (now - lastAuthChange < THROTTLE_MS) return;
        }

        // Evitar procesamiento duplicado del mismo evento
        if (event === lastEventType && now - lastAuthChange < THROTTLE_MS * 2) return;

        lastAuthChange = now;
        lastEventType = event;

        if (!isComponentMounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user && !user) {
            setUser(session.user);
          }
          return;
        } else if (session?.user) {
          setUser(session.user);
          setError(null);
        } else {
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
    } catch (err) {
      console.error('Error limpiando cache de autenticación:', err);
    }
  };

  // Función de login con Supabase Auth directo
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
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

      const userMetadata = data.user.user_metadata || {};

      // Validación de usuario activo
      if (userMetadata.activo === false) {
        await supabase.auth.signOut();
        throw new Error('Usuario desactivado. Contactá al administrador.');
      }

      // Configurar contexto de auditoría
      const userForAudit = {
        id: data.user.id,
        email: data.user.email,
        role: userMetadata.nivel || 'user',
        nivel: userMetadata.nivel,
        branch: userMetadata.sucursal || 'la_plata',
        sucursal: userMetadata.sucursal
      };

      await setAuditContext(userForAudit);
      await logLoginEvent(userForAudit);

      return data.user;
    } catch (err) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      console.error('Error en login:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función de logout con Supabase Auth
  const logout = async () => {
    try {
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

      await clearAuditContext();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error en logout:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error en logout:', err);
      setUser(null);
      setError(null);
      await clearAuditContext().catch(() => {});
    }
  };

  // Mapeo de roles a secciones permitidas
  const ROLE_SECTIONS = {
    admin: ['ventas', 'soporte', 'administracion', 'contabilidad', 'compras', 'ingreso-equipos', 'revendedores'],
    ventas: ['ventas', 'ingreso-equipos', 'compras', 'recuento-stock'],
    soporte: ['soporte', 'revendedores'],
    contabilidad: ['contabilidad', 'administracion', 'compras', 'ingreso-equipos', 'recuento-stock'],
    compras: ['compras', 'ingreso-equipos'],
    revendedor: ['revendedores'],
  };

  // Verificar si el usuario tiene acceso a una sección
  const hasAccess = (section) => {
    if (!user) return false;
    const nivel = user.user_metadata?.nivel || 'user';
    if (nivel === 'admin') return true;
    const allowed = ROLE_SECTIONS[nivel] || [];
    return allowed.includes(section);
  };

  // Obtener secciones permitidas para el usuario actual
  const getAllowedSections = () => {
    if (!user) return [];
    const nivel = user.user_metadata?.nivel || 'user';
    return ROLE_SECTIONS[nivel] || [];
  };

  const updateNombre = async (nuevoNombre) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { nombre: nuevoNombre.trim() }
    });
    if (error) throw error;
    if (data?.user) setUser(data.user);
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasAccess,
    getAllowedSections,
    updateNombre,
    isAuthenticated: !!user
  };
};
