import { useState, useCallback } from 'react';
import importacionesService from '../services/importacionesService';

export const useImportaciones = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📋 Cargar todos los recibos
  const fetchRecibos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getAll();
      setRecibos(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 📋 Cargar recibo por ID
  const fetchRecibo = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getById(id);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 📋 Cargar por estado
  const fetchPorEstado = useCallback(async (estado) => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getByEstado(estado);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ➕ Crear nuevo recibo
  const crearRecibo = useCallback(async (reciboData, items) => {
    setLoading(true);
    setError(null);
    try {
      const nuevoRecibo = await importacionesService.crearRecibo(reciboData, items);
      setRecibos(prev => [nuevoRecibo, ...prev]);
      return nuevoRecibo;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✏️ Actualizar recibo
  const actualizarRecibo = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await importacionesService.updateRecibo(id, updateData);
      setRecibos(prev => prev.map(r => r.id === id ? actualizado : r));
      return actualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 📦 Marcar como llegó a depósito USA
  const marcarEnDepositoUSA = useCallback(async (id, fechaIngreso) => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await importacionesService.marcarEnDepositoUSA(id, fechaIngreso);
      setRecibos(prev => prev.map(r => r.id === id ? actualizado : r));
      return actualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🇦🇷 Recepcionar en Argentina
  const recepcionarEnArgentina = useCallback(async (id, datosRecepcion) => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await importacionesService.recepcionarEnArgentina(id, datosRecepcion);
      setRecibos(prev => prev.map(r => r.id === id ? actualizado : r));
      return actualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🗑️ Eliminar recibo
  const deleteRecibo = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await importacionesService.deleteRecibo(id);
      setRecibos(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 📊 Obtener estadísticas
  const getEstadisticas = useCallback(async () => {
    try {
      return await importacionesService.getEstadisticas();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // 🛒 Pasar importación a compras
  const pasarACompras = useCallback(async (reciboEditado, itemsEditados, reciboOriginal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await importacionesService.pasarACompras(reciboEditado, itemsEditados, reciboOriginal);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recibos,
    loading,
    error,
    fetchRecibos,
    fetchRecibo,
    fetchPorEstado,
    crearRecibo,
    actualizarRecibo,
    marcarEnDepositoUSA,
    recepcionarEnArgentina,
    deleteRecibo,
    getEstadisticas,
    pasarACompras
  };
};
