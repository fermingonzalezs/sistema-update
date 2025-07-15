import { useState, useCallback } from 'react';
import importacionesService from '../services/importacionesService';

export const useHistorialImportaciones = () => {
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getByEstado('finalizada');
      setHistorial(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const stats = await importacionesService.getEstadisticas();
      setEstadisticas(stats);
      return stats;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const fetchCompleteData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historialData, statsData] = await Promise.all([
        importacionesService.getByEstado('finalizada'),
        importacionesService.getEstadisticas()
      ]);
      setHistorial(historialData);
      setEstadisticas(statsData);
      return { historial: historialData, estadisticas: statsData };
    } catch (err) {
      setError(err.message);
      return { historial: [], estadisticas: null };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    historial,
    estadisticas,
    loading,
    error,
    fetchHistorial,
    fetchEstadisticas,
    fetchCompleteData
  };
};