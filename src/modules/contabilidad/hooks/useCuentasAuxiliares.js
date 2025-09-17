// src/modules/contabilidad/hooks/useCuentasAuxiliares.js
import { useState, useEffect, useCallback } from 'react';
import { cuentasAuxiliaresService } from '../services/cuentasAuxiliaresService';

export function useCuentasAuxiliares() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalCuentas: 0,
    cuentasConItems: 0,
    cuentasSinItems: 0,
    totalGeneral: 0
  });

  // 📋 Obtener todas las cuentas auxiliares
  const fetchCuentas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cuentasAuxiliaresService.getAll();
      setCuentas(data);
    } catch (err) {
      console.error('Error en useCuentasAuxiliares.fetchCuentas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 👤 Obtener cuenta auxiliar por ID
  const getCuentaById = useCallback(async (id) => {
    try {
      setError(null);
      return await cuentasAuxiliaresService.getById(id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // 🆕 Crear nueva cuenta auxiliar
  const createCuenta = useCallback(async (cuentaData) => {
    try {
      setError(null);
      const nuevaCuenta = await cuentasAuxiliaresService.create(cuentaData);
      // Refrescar lista después de crear
      await fetchCuentas();
      return nuevaCuenta;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCuentas]);

  // ✏️ Actualizar cuenta auxiliar
  const updateCuenta = useCallback(async (id, cuentaData) => {
    try {
      setError(null);
      const cuentaActualizada = await cuentasAuxiliaresService.update(id, cuentaData);
      // Refrescar lista después de actualizar
      await fetchCuentas();
      return cuentaActualizada;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCuentas]);

  // 🗑️ Eliminar cuenta auxiliar
  const deleteCuenta = useCallback(async (id) => {
    try {
      setError(null);
      await cuentasAuxiliaresService.delete(id);
      // Refrescar lista después de eliminar
      await fetchCuentas();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCuentas]);

  // 📦 Agregar item a cuenta auxiliar
  const addItem = useCallback(async (cuentaId, item) => {
    try {
      setError(null);
      const cuentaActualizada = await cuentasAuxiliaresService.addItem(cuentaId, item);
      // Refrescar lista para mostrar cambios
      await fetchCuentas();
      return cuentaActualizada;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCuentas]);

  // ✏️ Actualizar item específico
  const updateItem = useCallback(async (cuentaId, itemId, itemData) => {
    try {
      setError(null);
      const cuentaActualizada = await cuentasAuxiliaresService.updateItem(cuentaId, itemId, itemData);
      // Refrescar lista para mostrar cambios
      await fetchCuentas();
      return cuentaActualizada;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCuentas]);

  // 🗑️ Eliminar item de cuenta auxiliar
  const removeItem = useCallback(async (cuentaId, itemId) => {
    try {
      setError(null);
      await cuentasAuxiliaresService.removeItem(cuentaId, itemId);
      // Refrescar lista para mostrar cambios
      await fetchCuentas();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCuentas]);

  // 📊 Obtener estadísticas
  const fetchEstadisticas = useCallback(async () => {
    try {
      setError(null);
      const stats = await cuentasAuxiliaresService.getEstadisticas();
      setEstadisticas(stats);
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // 🔄 Refrescar datos (cuentas y estadísticas)
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchCuentas(),
      fetchEstadisticas()
    ]);
  }, [fetchCuentas, fetchEstadisticas]);

  // Cargar datos iniciales
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    // Estado
    cuentas,
    loading,
    error,
    estadisticas,

    // Operaciones CRUD
    fetchCuentas,
    getCuentaById,
    createCuenta,
    updateCuenta,
    deleteCuenta,

    // Operaciones de items
    addItem,
    updateItem,
    removeItem,

    // Utilidades
    fetchEstadisticas,
    refresh
  };
}