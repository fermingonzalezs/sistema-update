import { useState, useCallback } from 'react';
import importacionesService from '../services/importacionesService';

export const useEnTransito = () => {
  const [enTransito, setEnTransito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEnTransito = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getByEstado('en_transito');
      setEnTransito(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarEnTransito = useCallback(async (id, numeroSeguimiento) => {
    try {
      const result = await importacionesService.marcarEnTransito(id, numeroSeguimiento);
      setEnTransito(prev => [result, ...prev]);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const actualizarSeguimiento = useCallback(async (id, numeroSeguimiento) => {
    setLoading(true);
    setError(null);
    try {
      const result = await importacionesService.update(id, { numero_seguimiento: numeroSeguimiento });
      setEnTransito(prev => prev.map(item => item.id === id ? result : item));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizarImportacion = useCallback(async (id, pesoReal, costosFinales) => {
    try {
      const result = await importacionesService.finalizarImportacion(id, pesoReal, costosFinales);
      setEnTransito(prev => prev.filter(item => item.id !== id));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    enTransito,
    loading,
    error,
    fetchEnTransito,
    marcarEnTransito,
    actualizarSeguimiento,
    finalizarImportacion
  };
};