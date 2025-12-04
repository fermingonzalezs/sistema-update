import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📋 Cargar proveedores
  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('proveedores')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (err) throw err;
      setProveedores(data || []);
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ➕ Crear nuevo proveedor
  const crearProveedor = useCallback(async (proveedorData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('proveedores')
        .insert([{
          nombre: proveedorData.nombre.trim(),
          email: proveedorData.email?.trim() || null,
          telefono: proveedorData.telefono?.trim() || null,
          pais: proveedorData.pais?.trim() || null,
          direccion: proveedorData.direccion?.trim() || null,
          notas: proveedorData.notas?.trim() || null,
          activo: true
        }])
        .select()
        .single();

      if (err) throw err;
      setProveedores(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar proveedores al montar
  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  return {
    proveedores,
    loading,
    error,
    fetchProveedores,
    crearProveedor
  };
};
