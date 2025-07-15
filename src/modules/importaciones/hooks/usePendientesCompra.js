import { useState, useCallback } from 'react';
import importacionesService from '../services/importacionesService';

export const usePendientesCompra = () => {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPendientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getPendientesCompra();
      setPendientes(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarComprado = useCallback(async (id, numeroSeguimiento) => {
    try {
      const result = await importacionesService.marcarEnTransito(id, numeroSeguimiento);
      setPendientes(prev => prev.filter(item => item.id !== id));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const actualizarPendiente = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await importacionesService.update(id, updateData);
      setPendientes(prev => prev.map(item => item.id === id ? result : item));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pendientes,
    loading,
    error,
    fetchPendientes,
    marcarComprado,
    actualizarPendiente
  };
};