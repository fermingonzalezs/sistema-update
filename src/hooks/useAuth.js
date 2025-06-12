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

  // Función de login
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      // Llamar a la función de verificación en Supabase
      const { data, error: supabaseError } = await supabase
        .rpc('verificar_login', {
          p_username: username,
          p_password: password
        });

      if (supabaseError) {
        throw new Error(`Error de base de datos: ${supabaseError.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      const userData = data[0];
      
      if (!userData.activo) {
        throw new Error('Usuario desactivado. Contacta al administrador');
      }

      // Guardar datos del usuario
      const userInfo = {
        id: userData.id,
        username: userData.username,
        nombre: userData.nombre,
        nivel: userData.nivel,
        loginTime: new Date().toISOString()
      };

      setUser(userInfo);
      localStorage.setItem('auth_user', JSON.stringify(userInfo));
      
      return userInfo;
    } catch (err) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('auth_user');
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
        'gestion-fotos', 'copys', 'clientes'
      ],
      soporte: [
        'carga-equipos', 'reparaciones', 'repuestos', 
        'recuento-repuestos', 'presupuestos-reparacion', 'testeo-equipos'
      ],
      contabilidad: [
        'plan-cuentas', 'libro-diario', 'reporte-movimientos',
        'libro-mayor', 'conciliacion-caja', 'gastos-operativos',
        'cuentas-corrientes'
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