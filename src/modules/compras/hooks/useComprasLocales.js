import { useState, useEffect, useCallback } from 'react';
import { comprasLocalesService } from '../services/comprasLocalesService';

export const useComprasLocales = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Cargar todos los recibos con sus items
   */
  const fetchRecibos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const datos = await comprasLocalesService.getAllRecibos();
      setRecibos(datos);

      return datos;
    } catch (err) {
      console.error('Error cargando recibos:', err);
      const mensajeError = err.message || 'Error al cargar recibos';
      setError(mensajeError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar un recibo específico
   */
  const fetchRecibo = useCallback(async (id) => {
    try {
      const dato = await comprasLocalesService.getReciboConItems(id);
      return dato;
    } catch (err) {
      console.error('Error cargando recibo:', err);
      const mensajeError = err.message || 'Error al cargar recibo';
      setError(mensajeError);
      return null;
    }
  }, []);

  /**
   * Crear nuevo recibo con items
   */
  const crearRecibo = useCallback(async (reciboData, items = []) => {
    try {
      setError(null);

      const reciboCreado = await comprasLocalesService.crearRecibo(reciboData, items);

      setRecibos(prev => [reciboCreado, ...prev]);

      return {
        success: true,
        data: reciboCreado,
        message: `Recibo ${reciboCreado.numero_recibo} creado exitosamente`
      };
    } catch (err) {
      console.error('Error creando recibo:', err);
      const mensajeError = err.message || 'Error al crear recibo';
      setError(mensajeError);
      return {
        success: false,
        error: mensajeError
      };
    }
  }, []);

  /**
   * Actualizar recibo y sus items
   */
  const actualizarRecibo = useCallback(async (id, reciboData, items = []) => {
    try {
      setError(null);

      const reciboActualizado = await comprasLocalesService.updateRecibo(id, reciboData, items);

      setRecibos(prev =>
        prev.map(r => r.id === id ? reciboActualizado : r)
      );

      return {
        success: true,
        data: reciboActualizado,
        message: `Recibo ${reciboActualizado.numero_recibo} actualizado exitosamente`
      };
    } catch (err) {
      console.error('Error actualizando recibo:', err);
      const mensajeError = err.message || 'Error al actualizar recibo';
      setError(mensajeError);
      return {
        success: false,
        error: mensajeError
      };
    }
  }, []);

  /**
   * Procesar recibo (cambiar estado a procesado)
   */
  const procesarRecibo = useCallback(async (id) => {
    try {
      setError(null);

      const reciboProcesado = await comprasLocalesService.procesarRecibo(id);

      setRecibos(prev =>
        prev.map(r => r.id === id ? reciboProcesado : r)
      );

      return {
        success: true,
        data: reciboProcesado,
        message: `Recibo ${reciboProcesado.numero_recibo} procesado exitosamente`
      };
    } catch (err) {
      console.error('Error procesando recibo:', err);
      const mensajeError = err.message || 'Error al procesar recibo';
      setError(mensajeError);
      return {
        success: false,
        error: mensajeError
      };
    }
  }, []);

  /**
   * Eliminar recibo
   */
  const deleteRecibo = useCallback(async (id) => {
    try {
      setError(null);

      await comprasLocalesService.deleteRecibo(id);

      setRecibos(prev => prev.filter(r => r.id !== id));

      return {
        success: true,
        message: 'Recibo eliminado exitosamente'
      };
    } catch (err) {
      console.error('Error eliminando recibo:', err);
      const mensajeError = err.message || 'Error al eliminar recibo';
      setError(mensajeError);
      return {
        success: false,
        error: mensajeError
      };
    }
  }, []);

  /**
   * Cargar recibos al montar el componente
   */
  useEffect(() => {
    fetchRecibos();
  }, [fetchRecibos]);

  return {
    recibos,
    loading,
    error,
    fetchRecibos,
    fetchRecibo,
    crearRecibo,
    actualizarRecibo,
    procesarRecibo,
    deleteRecibo
  };
};
