import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const useVendedores = () => {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendedores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('id, nombre, apellido')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;

      setVendedores(data || []);
      return data || [];
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo vendedores:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vendedores,
    loading,
    error,
    fetchVendedores
  };
};