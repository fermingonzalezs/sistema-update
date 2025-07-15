import { useState, useCallback } from 'react';
import importacionesService from '../services/importacionesService';

// Hook principal mejorado con responsabilidades específicas
export const useImportaciones = () => {
  const [importaciones, setImportaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch genérico con manejo mejorado de errores
  const fetchImportaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getAll();
      setImportaciones(data);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar importaciones';
      setError(errorMessage);
      console.error('Error en fetchImportaciones:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch por estado con caché local
  const fetchByEstado = useCallback(async (estado) => {
    setLoading(true);
    setError(null);
    try {
      const data = await importacionesService.getByEstado(estado);
      setImportaciones(data);
      return data;
    } catch (err) {
      const errorMessage = err.message || `Error al cargar ${estado}`;
      setError(errorMessage);
      console.error(`Error en fetchByEstado(${estado}):`, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Operaciones CRUD optimizadas
  const createCotizacion = useCallback(async (cotizacionData) => {
    setError(null);
    try {
      const nueva = await importacionesService.createCotizacion(cotizacionData);
      // Actualizar estado local optimísticamente
      setImportaciones(prev => [nueva, ...prev]);
      return nueva;
    } catch (err) {
      const errorMessage = err.message || 'Error al crear cotización';
      setError(errorMessage);
      console.error('Error en createCotizacion:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const updateImportacion = useCallback(async (id, updateData) => {
    setError(null);
    try {
      const updated = await importacionesService.update(id, updateData);
      // Actualizar estado local
      setImportaciones(prev => prev.map(imp => imp.id === id ? updated : imp));
      return updated;
    } catch (err) {
      const errorMessage = err.message || 'Error al actualizar importación';
      setError(errorMessage);
      console.error('Error en updateImportacion:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteImportacion = useCallback(async (id) => {
    setError(null);
    try {
      await importacionesService.delete(id);
      // Remover del estado local
      setImportaciones(prev => prev.filter(imp => imp.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Error al eliminar importación';
      setError(errorMessage);
      console.error('Error en deleteImportacion:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Operaciones de estado específicas
  const aprobarCotizacion = useCallback(async (id) => {
    setError(null);
    try {
      const result = await importacionesService.aprobarCotizacion(id);
      // Actualizar estado o remover si cambió de categoría
      setImportaciones(prev => prev.map(imp => imp.id === id ? result : imp));
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Error al aprobar cotización';
      setError(errorMessage);
      console.error('Error en aprobarCotizacion:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const marcarEnTransito = useCallback(async (id, numeroSeguimiento) => {
    setError(null);
    try {
      const result = await importacionesService.marcarEnTransito(id, numeroSeguimiento);
      setImportaciones(prev => prev.map(imp => imp.id === id ? result : imp));
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Error al marcar en tránsito';
      setError(errorMessage);
      console.error('Error en marcarEnTransito:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const finalizarImportacion = useCallback(async (id, pesoReal, costosFinales) => {
    setError(null);
    try {
      const result = await importacionesService.finalizarImportacion(id, pesoReal, costosFinales);
      setImportaciones(prev => prev.map(imp => imp.id === id ? result : imp));
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Error al finalizar importación';
      setError(errorMessage);
      console.error('Error en finalizarImportacion:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Estadísticas
  const getEstadisticas = useCallback(async () => {
    try {
      return await importacionesService.getEstadisticas();
    } catch (err) {
      console.error('Error en getEstadisticas:', err);
      return null;
    }
  }, []);

  return {
    // Estados
    importaciones,
    loading,
    error,
    
    // Acciones
    fetchImportaciones,
    fetchByEstado,
    createCotizacion,
    updateImportacion,
    deleteImportacion,
    aprobarCotizacion,
    marcarEnTransito,
    finalizarImportacion,
    getEstadisticas,
    clearError
  };
};

// Hook específico para proveedores (separado para mejor organización)
export const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Aquí asumo que existe un servicio de proveedores
      // const data = await proveedoresService.getAll();
      const data = []; // Placeholder
      setProveedores(data);
      return data;
    } catch (err) {
      setError(err.message || 'Error al cargar proveedores');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createProveedor = useCallback(async (nombre) => {
    setError(null);
    try {
      // const nuevo = await proveedoresService.create(nombre);
      const nuevo = { id: Date.now(), nombre }; // Placeholder
      setProveedores(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      setError(err.message || 'Error al crear proveedor');
      throw err;
    }
  }, []);

  return {
    proveedores,
    loading,
    error,
    fetchProveedores,
    createProveedor
  };
};