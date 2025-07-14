// Hook unificado para manejo de cotizaciones y conversiones
// src/shared/hooks/useCurrency.js

import { useState, useEffect, useCallback } from 'react';
import { cotizacionService } from '../services/cotizacionService';
import { formatearMonto } from '../utils/formatters';
import { convertirARSaUSD, convertirUSDaARS } from '../utils/currency';

export const useCurrency = () => {
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Obtiene la cotización actual
   */
  const obtenerCotizacion = useCallback(async (forzarActualizacion = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const cotizacionActual = forzarActualizacion 
        ? await cotizacionService.forzarActualizacion()
        : await cotizacionService.obtenerCotizacionActual();
        
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

  /**
   * Obtiene cotización para una fecha específica
   */
  const obtenerCotizacionPorFecha = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    
    try {
      const cotizacionFecha = await cotizacionService.obtenerCotizacionPorFecha(fecha);
      return cotizacionFecha;
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo cotización por fecha:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Convierte USD a ARS usando cotización actual
   */
  const convertirUSDaARSLocal = useCallback((montoUSD) => {
    if (!cotizacion || !montoUSD) return 0;
    const valorCotizacion = cotizacion.valor || cotizacion.promedio;
    return convertirUSDaARS(montoUSD, valorCotizacion);
  }, [cotizacion]);

  /**
   * Convierte ARS a USD usando cotización actual
   */
  const convertirARSaUSDLocal = useCallback((montoARS) => {
    if (!cotizacion || !montoARS) return 0;
    const valorCotizacion = cotizacion.valor || cotizacion.promedio;
    return convertirARSaUSD(montoARS, valorCotizacion);
  }, [cotizacion]);

  /**
   * Convierte USD a ARS con resultado completo
   */
  const convertirUSDaARSCompleto = useCallback(async (montoUSD, cotizacionEspecifica = null) => {
    try {
      return await cotizacionService.convertirUSDaARS(montoUSD, cotizacionEspecifica);
    } catch (err) {
      console.error('Error en conversión USD→ARS:', err);
      throw err;
    }
  }, []);

  /**
   * Convierte ARS a USD con resultado completo
   */
  const convertirARSaUSDCompleto = useCallback(async (montoARS, cotizacionEspecifica = null) => {
    try {
      return await cotizacionService.convertirARSaUSD(montoARS, cotizacionEspecifica);
    } catch (err) {
      console.error('Error en conversión ARS→USD:', err);
      throw err;
    }
  }, []);

  /**
   * Formatea monto con símbolo de moneda
   */
  const formatearMontoConSimbolo = useCallback((monto, moneda = 'USD', mostrarSimbolo = true) => {
    return formatearMonto(monto, moneda, mostrarSimbolo);
  }, []);

  /**
   * Obtiene estado actual de la cotización
   */
  const estadoCotizacion = useCallback(() => {
    return cotizacionService.obtenerEstadoCotizacion();
  }, []);

  /**
   * Prepara movimiento contable con conversión automática
   */
  const prepararMovimiento = useCallback(async (movimientoData, cuenta) => {
    try {
      return await cotizacionService.prepararMovimientoAutomatico(movimientoData, cuenta);
    } catch (err) {
      console.error('Error preparando movimiento:', err);
      throw err;
    }
  }, []);

  /**
   * Obtiene historial de cotizaciones
   */
  const obtenerHistorial = useCallback(async (dias = 30) => {
    try {
      return await cotizacionService.obtenerHistorialCotizaciones(dias);
    } catch (err) {
      console.error('Error obteniendo historial:', err);
      return [];
    }
  }, []);

  // Obtener cotización al inicializar
  useEffect(() => {
    obtenerCotizacion();
  }, [obtenerCotizacion]);

  // Información de cotización actual
  const cotizacionInfo = cotizacion ? {
    valor: cotizacion.valor || cotizacion.promedio,
    compra: cotizacion.compra,
    venta: cotizacion.venta,
    fuente: cotizacion.fuente,
    fecha: cotizacion.fecha,
    timestamp: cotizacion.timestamp,
    esEmergencia: cotizacion.error || false
  } : null;

  return {
    // Estados
    cotizacion: cotizacionInfo,
    loading,
    error,
    lastUpdate,
    
    // Acciones
    obtenerCotizacion,
    obtenerCotizacionPorFecha,
    forzarActualizacion: () => obtenerCotizacion(true),
    
    // Conversiones simples (para UI)
    convertirUSDaARS: convertirUSDaARSLocal,
    convertirARSaUSD: convertirARSaUSDLocal,
    
    // Conversiones completas (con metadata)
    convertirUSDaARSCompleto,
    convertirARSaUSDCompleto,
    
    // Utilidades
    formatearMonto: formatearMontoConSimbolo,
    estadoCotizacion,
    prepararMovimiento,
    obtenerHistorial,
    
    // Información adicional
    disponible: !!cotizacion,
    esEmergencia: cotizacion?.error || false,
    minutosDesdeActualizacion: lastUpdate ? 
      Math.floor((Date.now() - lastUpdate.getTime()) / 60000) : null
  };
};

export default useCurrency;