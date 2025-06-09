// Moved from src/lib/importaciones.js
// Hook y lógica de importaciones migrados
import importacionesService from '../services/importacionesService';
import proveedoresService from '../services/proveedoresService';
import { useState, useCallback } from 'react';


// HOOK: useImportaciones
const useImportaciones = () => {
  const [importaciones, setImportaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchImportaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getAll();
      setImportaciones(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByEstado = useCallback(async (estado) => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getByEstado(estado);
      setImportaciones(data);
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
      const nuevaCotizacion = await importacionesService.createCotizacion(cotizacionData);
      setImportaciones(prev => [nuevaCotizacion, ...prev]);
      return nuevaCotizacion;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateImportacion = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const importacionActualizada = await importacionesService.update(id, updateData);
      setImportaciones(prev => prev.map(imp => imp.id === id ? importacionActualizada : imp));
      return importacionActualizada;
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
      setImportaciones(prev => prev.map(imp => imp.id === id ? result : imp));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const marcarEnTransito = useCallback(async (id, numeroSeguimiento) => {
    try {
      const result = await importacionesService.marcarEnTransito(id, numeroSeguimiento);
      setImportaciones(prev => prev.map(imp => imp.id === id ? result : imp));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const finalizarImportacion = useCallback(async (id, pesoReal, costosFinales) => {
    try {
      const result = await importacionesService.finalizarImportacion(id, pesoReal, costosFinales);
      setImportaciones(prev => prev.map(imp => imp.id === id ? result : imp));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteImportacion = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await importacionesService.delete(id);
      setImportaciones(prev => prev.filter(imp => imp.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticas = useCallback(async () => {
    try {
      return await importacionesService.getEstadisticas();
    } catch (err) {
      return null;
    }
  }, []);

  return {
    importaciones,
    loading,
    error,
    fetchImportaciones,
    fetchByEstado,
    createCotizacion,
    updateImportacion,
    aprobarCotizacion,
    marcarEnTransito,
    finalizarImportacion,
    deleteImportacion,
    getEstadisticas
  };
};

// HOOK: useProveedores
const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await proveedoresService.getAll();
      setProveedores(data);
      return data;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createProveedor = useCallback(async (nombre) => {
    try {
      const nuevoProveedor = await proveedoresService.create(nombre);
      if (nuevoProveedor) {
        setProveedores(prev => [nuevoProveedor, ...prev]);
      }
      return nuevoProveedor;
    } catch (err) {
      return null;
    }
  }, []);

  return {
    proveedores,
    loading,
    fetchProveedores,
    createProveedor
  };
};

export { useImportaciones, useProveedores };
