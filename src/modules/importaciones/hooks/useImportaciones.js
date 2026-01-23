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

  // ➡️ Avanzar a siguiente estado (para estados intermedios)
  const avanzarEstado = useCallback(async (id, nuevoEstado) => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await importacionesService.avanzarEstado(id, nuevoEstado);
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

  // ✏️ Actualizar un item individual
  const actualizarItem = useCallback(async (itemId, updateData) => {
    setError(null);
    try {
      const actualizado = await importacionesService.updateItem(itemId, updateData);
      return actualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // 🗑️ Eliminar un item
  const eliminarItem = useCallback(async (itemId) => {
    setError(null);
    try {
      await importacionesService.deleteItem(itemId);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ➕ Agregar items a un recibo existente
  const agregarItemsARecibo = useCallback(async (reciboId, items) => {
    setError(null);
    try {
      const nuevosItems = await importacionesService.addItemsToRecibo(reciboId, items);
      return nuevosItems;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // 🔄 Recalcular costos distribuidos
  const recalcularCostos = useCallback(async (reciboId) => {
    setError(null);
    try {
      const actualizado = await importacionesService.recalcularCostosDistribuidos(reciboId);
      setRecibos(prev => prev.map(r => r.id === reciboId ? actualizado : r));
      return actualizado;
    } catch (err) {
      setError(err.message);
      throw err;
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
    avanzarEstado,
    recepcionarEnArgentina,
    deleteRecibo,
    getEstadisticas,
    pasarACompras,
    actualizarItem,
    eliminarItem,
    agregarItemsARecibo,
    recalcularCostos
  };
};
