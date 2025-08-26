import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión actual de Supabase Auth al iniciar
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          setError(null);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
      
      // Limpiar cualquier sesión previa
      await clearAuthCache();
      
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

      // Verificar que el usuario está activo en metadatos
      // En Supabase, los metadatos están en user_metadata
      const userMetadata = data.user.user_metadata || {};
      console.log('🔍 Metadatos del usuario:', userMetadata);
      
      if (userMetadata.activo === false) {
        await supabase.auth.signOut();
        throw new Error('Usuario desactivado. Contacta al administrador');
      }

      console.log('✅ Login exitoso:', {
        email: data.user.email,
        username: userMetadata.username,
        nivel: userMetadata.nivel
      });
      
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
    return ['ventas', 'soporte', 'administracion', 'contabilidad'];
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