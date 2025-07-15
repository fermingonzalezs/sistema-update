import { useState, useCallback } from 'react';
import importacionesService from '../services/importacionesService';

export const useCotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCotizaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getByEstado('cotizacion');
      setCotizaciones(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCotizacion = useCallback(async (cotizacionData) => {
    setLoading(true);
    setError(null);
    try {
      const nueva = await importacionesService.createCotizacion(cotizacionData);
      setCotizaciones(prev => [nueva, ...prev]);
      return nueva;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCotizacion = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await importacionesService.update(id, updateData);
      setCotizaciones(prev => prev.map(cot => cot.id === id ? updated : cot));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const aprobarCotizacion = useCallback(async (id) => {
    try {
      const result = await importacionesService.aprobarCotizacion(id);
      setCotizaciones(prev => prev.filter(cot => cot.id !== id));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteCotizacion = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await importacionesService.delete(id);
      setCotizaciones(prev => prev.filter(cot => cot.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cotizaciones,
    loading,
    error,
    fetchCotizaciones,
    createCotizacion,
    updateCotizacion,
    aprobarCotizacion,
    deleteCotizacion
  };
};