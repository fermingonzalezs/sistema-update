import { useState, useCallback } from 'react';
import cajasService from '../services/cajasService';

export const useCajas = () => {
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCajas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cajasService.getAll();
      setCajas(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const crearCaja = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const nueva = await cajasService.crearCaja(data);
      await fetchCajas();
      return nueva;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCajas]);

  const actualizarCaja = useCallback(async (id, updateData) => {
    setError(null);
    try {
      const actualizada = await cajasService.actualizarCaja(id, updateData);
      setCajas(prev => prev.map(c => c.id === id ? { ...c, ...actualizada } : c));
      return actualizada;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteCaja = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await cajasService.deleteCaja(id);
      setCajas(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const asignarItems = useCallback(async (cajaId, itemIds) => {
    setError(null);
    try {
      await cajasService.asignarItems(cajaId, itemIds);
      await fetchCajas();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCajas]);

  const desasignarItems = useCallback(async (itemIds) => {
    setError(null);
    try {
      await cajasService.desasignarItems(itemIds);
      await fetchCajas();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCajas]);

  const recepcionarCaja = useCallback(async (cajaId, datosRecepcion) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cajasService.recepcionarCaja(cajaId, datosRecepcion);
      await fetchCajas();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCajas]);

  const crearIngreso = useCallback(async (datos) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cajasService.crearIngreso(datos);
      await fetchCajas();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCajas]);

  const editarIngreso = useCallback(async (cajaId, datosEdicion) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cajasService.editarIngreso(cajaId, datosEdicion);
      await fetchCajas();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCajas]);

  const eliminarIngreso = useCallback(async (cajaId) => {
    setLoading(true);
    setError(null);
    try {
      await cajasService.eliminarIngreso(cajaId);
      await fetchCajas();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCajas]);

  return {
    cajas,
    loading,
    error,
    fetchCajas,
    crearCaja,
    actualizarCaja,
    deleteCaja,
    asignarItems,
    desasignarItems,
    recepcionarCaja,
    crearIngreso,
    editarIngreso,
    eliminarIngreso
  };
};
