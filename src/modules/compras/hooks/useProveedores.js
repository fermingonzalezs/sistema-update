import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los proveedores
  const fetchProveedores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (supabaseError) throw supabaseError;

      setProveedores(data || []);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar proveedores al montar el componente
  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  // Crear nuevo proveedor
  const crearProveedor = useCallback(async (datosProveedor) => {
    try {
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('proveedores')
        .insert([datosProveedor])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setProveedores(prev => [...prev, data]);

      return { success: true, data };
    } catch (err) {
      console.error('Error creando proveedor:', err);
      const errorMsg = err.message || 'Error al crear proveedor';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Actualizar proveedor
  const actualizarProveedor = useCallback(async (id, datosActualizados) => {
    try {
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('proveedores')
        .update(datosActualizados)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setProveedores(prev =>
        prev.map(p => p.id === id ? data : p)
      );

      return { success: true, data };
    } catch (err) {
      console.error('Error actualizando proveedor:', err);
      const errorMsg = err.message || 'Error al actualizar proveedor';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Eliminar proveedor
  const eliminarProveedor = useCallback(async (id) => {
    try {
      setError(null);

      const { error: supabaseError } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      setProveedores(prev => prev.filter(p => p.id !== id));

      return { success: true };
    } catch (err) {
      console.error('Error eliminando proveedor:', err);
      const errorMsg = err.message || 'Error al eliminar proveedor';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  return {
    proveedores,
    loading,
    error,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    refetch: fetchProveedores
  };
};
