import { useState, useEffect, useCallback } from 'react';
import { cotizacionService } from '../services/cotizacionService';

export const useCotizacion = () => {
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const obtenerCotizacion = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cotizacionActual = await cotizacionService.obtenerCotizacionActual();
      setCotizacion(cotizacionActual);
      setLastUpdate(new Date());
      return cotizacionActual;
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo cotización:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener cotización al inicializar
  useEffect(() => {
    obtenerCotizacion();
  }, [obtenerCotizacion]);

  // Función para convertir USD a ARS
  const convertirUSDaARS = useCallback((montoUSD) => {
    if (!cotizacion || !montoUSD) return 0;
    return parseFloat((montoUSD * cotizacion.promedio).toFixed(2));
  }, [cotizacion]);

  // Función para convertir ARS a USD
  const convertirARSaUSD = useCallback((montoARS) => {
    if (!cotizacion || !montoARS) return 0;
    return parseFloat((montoARS / cotizacion.promedio).toFixed(4));
  }, [cotizacion]);

  // Función para formatear montos con símbolo
  const formatearMonto = useCallback((monto, moneda = 'USD') => {
    if (!monto && monto !== 0) return '-';
    
    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: moneda === 'USD' ? 4 : 2
    });
    
    const simbolo = moneda === 'USD' ? 'U$' : '$';
    return `${simbolo}${formatter.format(monto)}`;
  }, []);

  return {
    cotizacion,
    loading,
    error,
    lastUpdate,
    obtenerCotizacion,
    convertirUSDaARS,
    convertirARSaUSD,
    formatearMonto
  };
};