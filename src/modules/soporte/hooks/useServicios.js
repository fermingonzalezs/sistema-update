import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const serviciosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return data;
  },
  async getByCategoria(categoria) {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .select('*')
      .eq('activo', true)
      .eq('categoria', categoria)
      .order('nombre');
    if (error) throw error;
    return data;
  },
  async create(servicioData) {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .insert([servicioData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id, updates) {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deactivate(id) {
    const { error } = await supabase
      .from('servicios_reparacion')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    return true;
  },
  async buscarPorNombre(termino) {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .select('*')
      .ilike('nombre', `%${termino}%`)
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return data;
  },
  async getCategorias() {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .select('categoria')
      .eq('activo', true);
    if (error) throw error;
    // Unicos y no nulos
    return [...new Set(data.map(s => s.categoria).filter(Boolean))];
  },
  async getEstadisticas() {
    const { data, error } = await supabase.rpc('servicios_stats');
    if (error) throw error;
    return data;
  }
};

export function useServicios() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServicios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviciosService.getAll();
      setServicios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await serviciosService.getCategorias();
      setCategorias(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearServicio = async (servicioData) => {
    setLoading(true);
    setError(null);
    try {
      const nuevo = await serviciosService.create(servicioData);
      setServicios(s => [...s, nuevo]);
      return nuevo;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const actualizarServicio = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await serviciosService.update(id, updates);
      setServicios(s => s.map(serv => serv.id === id ? actualizado : serv));
      return actualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const desactivarServicio = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await serviciosService.deactivate(id);
      setServicios(s => s.filter(serv => serv.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const buscarServicios = async (termino) => {
    setLoading(true);
    setError(null);
    try {
      const resultados = await serviciosService.buscarPorNombre(termino);
      setServicios(resultados);
      return resultados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
    fetchCategorias();
  }, [fetchServicios, fetchCategorias]);

  return {
    servicios,
    categorias,
    loading,
    error,
    fetchServicios,
    fetchCategorias,
    crearServicio,
    actualizarServicio,
    desactivarServicio,
    buscarServicios
  };
}
