import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const usePesajes = () => {
  const [pesajes, setPesajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPesajes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tabla_pesajes')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      setPesajes(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPesajes();
  }, [fetchPesajes]);

  const crearPesaje = async ({ nombre, peso_kg }) => {
    const { data, error } = await supabase
      .from('tabla_pesajes')
      .insert([{ nombre: nombre.trim(), peso_kg: parseFloat(peso_kg) }])
      .select()
      .single();
    if (error) throw error;
    setPesajes(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return data;
  };

  const actualizarPesaje = async (id, { nombre, peso_kg }) => {
    const { data, error } = await supabase
      .from('tabla_pesajes')
      .update({ nombre: nombre.trim(), peso_kg: parseFloat(peso_kg) })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setPesajes(prev => prev.map(p => p.id === id ? data : p).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return data;
  };

  const eliminarPesaje = async (id) => {
    const { error } = await supabase
      .from('tabla_pesajes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setPesajes(prev => prev.filter(p => p.id !== id));
  };

  return {
    pesajes,
    loading,
    error,
    crearPesaje,
    actualizarPesaje,
    eliminarPesaje,
    refetch: fetchPesajes,
  };
};
