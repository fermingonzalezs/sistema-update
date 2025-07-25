// src/modules/soporte/hooks/useMovimientosRepuestosEquipos.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de movimientos de repuestos por equipo
export const movimientosRepuestosEquiposService = {
  // Obtener todos los movimientos
  async getAll(filtros = {}) {
    console.log('📡 Obteniendo movimientos de repuestos por equipo...');
    
    let query = supabase
      .from('movimientos_repuestos_equipos')
      .select('*')
      .order('fecha_movimiento', { ascending: false });

    // Aplicar filtros
    if (filtros.serial_equipo) {
      query = query.ilike('serial_equipo', `%${filtros.serial_equipo}%`);
    }
    if (filtros.motivo) {
      query = query.eq('motivo', filtros.motivo);
    }
    if (filtros.fecha_desde) {
      query = query.gte('fecha_movimiento', filtros.fecha_desde);
    }
    if (filtros.fecha_hasta) {
      query = query.lte('fecha_movimiento', filtros.fecha_hasta);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error obteniendo movimientos:', error);
      throw error;
    }
    
    console.log(`✅ ${data.length} movimientos obtenidos`);
    return data;
  },

  // Crear nuevo movimiento
  async crear(movimientoData) {
    console.log(`📦 Creando movimiento para equipo: ${movimientoData.serial_equipo}`);
    
    try {
      // Validar que las entradas y salidas tengan máximo 5 elementos cada una
      if (movimientoData.entradas.length > 5) {
        throw new Error('Máximo 5 entradas permitidas');
      }
      if (movimientoData.salidas.length > 5) {
        throw new Error('Máximo 5 salidas permitidas');
      }

      // Obtener información de precios de los repuestos
      const todosRepuestosIds = [
        ...movimientoData.entradas.map(e => e.repuesto_id),
        ...movimientoData.salidas.map(s => s.repuesto_id)
      ].filter(Boolean);

      let repuestosInfo = [];
      if (todosRepuestosIds.length > 0) {
        const { data: repuestos, error: errorRepuestos } = await supabase
          .from('repuestos')
          .select('id, item, precio_venta')
          .in('id', todosRepuestosIds);

        if (errorRepuestos) throw errorRepuestos;
        repuestosInfo = repuestos;
      }

      // Calcular totales
      let totalEntradas = 0;
      let totalSalidas = 0;

      const entradasConPrecio = movimientoData.entradas.map(entrada => {
        const repuesto = repuestosInfo.find(r => r.id === entrada.repuesto_id);
        const precioVenta = repuesto ? repuesto.precio_venta : 0;
        const subtotal = entrada.cantidad * precioVenta;
        totalEntradas += subtotal;
        
        return {
          ...entrada,
          precio_venta: precioVenta,
          subtotal
        };
      });

      const salidasConPrecio = movimientoData.salidas.map(salida => {
        const repuesto = repuestosInfo.find(r => r.id === salida.repuesto_id);
        const precioVenta = repuesto ? repuesto.precio_venta : 0;
        const subtotal = salida.cantidad * precioVenta;
        totalSalidas += subtotal;
        
        return {
          ...salida,
          precio_venta: precioVenta,
          subtotal
        };
      });

      const resultadoFinal = totalEntradas - totalSalidas;

      // Insertar el movimiento
      const { data, error } = await supabase
        .from('movimientos_repuestos_equipos')
        .insert([{
          serial_equipo: movimientoData.serial_equipo,
          motivo: movimientoData.motivo,
          descripcion: movimientoData.descripcion || '',
          entradas: JSON.stringify(entradasConPrecio),
          salidas: JSON.stringify(salidasConPrecio),
          total_entradas: totalEntradas,
          total_salidas: totalSalidas,
          resultado_final: resultadoFinal,
          usuario: movimientoData.usuario || 'admin'
        }])
        .select();

      if (error) throw error;

      // Actualizar stock de repuestos
      for (const entrada of movimientoData.entradas) {
        if (entrada.repuesto_id && entrada.cantidad > 0) {
          await this.actualizarStockRepuesto(entrada.repuesto_id, entrada.cantidad, 'entrada');
        }
      }

      for (const salida of movimientoData.salidas) {
        if (salida.repuesto_id && salida.cantidad > 0) {
          await this.actualizarStockRepuesto(salida.repuesto_id, salida.cantidad, 'salida');
        }
      }

      console.log('✅ Movimiento creado exitosamente');
      return data[0];
    } catch (error) {
      console.error('❌ Error creando movimiento:', error);
      throw error;
    }
  },

  // Actualizar stock de repuesto
  async actualizarStockRepuesto(repuestoId, cantidad, tipo) {
    try {
      const { data: repuesto, error: errorGet } = await supabase
        .from('repuestos')
        .select('cantidad')
        .eq('id', repuestoId)
        .single();

      if (errorGet) throw errorGet;

      const stockActual = repuesto.cantidad || 0;
      const nuevoStock = tipo === 'entrada' 
        ? stockActual + cantidad 
        : stockActual - cantidad;

      if (nuevoStock < 0) {
        throw new Error(`Stock insuficiente para repuesto ID ${repuestoId}`);
      }

      const { error: errorUpdate } = await supabase
        .from('repuestos')
        .update({ 
          cantidad: nuevoStock,
          disponible: nuevoStock > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', repuestoId);

      if (errorUpdate) throw errorUpdate;

    } catch (error) {
      console.error(`❌ Error actualizando stock del repuesto ${repuestoId}:`, error);
      throw error;
    }
  },

  // Obtener movimientos por serial
  async getBySerial(serial) {
    console.log(`🔍 Obteniendo movimientos del equipo: ${serial}`);
    
    const { data, error } = await supabase
      .from('movimientos_repuestos_equipos')
      .select('*')
      .ilike('serial_equipo', `%${serial}%`)
      .order('fecha_movimiento', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo movimientos por serial:', error);
      throw error;
    }
    
    return data;
  },

  // Obtener estadísticas
  async getEstadisticas(fechaDesde, fechaHasta) {
    console.log('📊 Calculando estadísticas de movimientos...');
    
    let query = supabase
      .from('movimientos_repuestos_equipos')
      .select('motivo, total_entradas, total_salidas, resultado_final, fecha_movimiento');

    if (fechaDesde) {
      query = query.gte('fecha_movimiento', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('fecha_movimiento', fechaHasta);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    const estadisticas = {
      totalMovimientos: data.length,
      upgrades: data.filter(m => m.motivo === 'UPGRADE').length,
      reparaciones: data.filter(m => m.motivo === 'REPARACION').length,
      totalEntradas: data.reduce((sum, m) => sum + (m.total_entradas || 0), 0),
      totalSalidas: data.reduce((sum, m) => sum + (m.total_salidas || 0), 0),
      resultadoTotal: data.reduce((sum, m) => sum + (m.resultado_final || 0), 0)
    };
    
    return estadisticas;
  }
};

// 🎣 HOOK: Lógica de React para movimientos de repuestos por equipo
export const useMovimientosRepuestosEquipos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener movimientos
  const obtenerMovimientos = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await movimientosRepuestosEquiposService.getAll(filtros);
      setMovimientos(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo movimientos:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear movimiento
  const crearMovimiento = useCallback(async (movimientoData) => {
    try {
      setError(null);
      const movimiento = await movimientosRepuestosEquiposService.crear(movimientoData);
      
      // Actualizar lista local
      setMovimientos(prev => [movimiento, ...prev]);
      
      return movimiento;
    } catch (err) {
      setError(err.message);
      console.error('Error creando movimiento:', err);
      throw err;
    }
  }, []);

  // Obtener estadísticas
  const obtenerEstadisticas = useCallback(async (fechaDesde, fechaHasta) => {
    try {
      setError(null);
      return await movimientosRepuestosEquiposService.getEstadisticas(fechaDesde, fechaHasta);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Buscar por serial
  const buscarPorSerial = useCallback(async (serial) => {
    try {
      setError(null);
      return await movimientosRepuestosEquiposService.getBySerial(serial);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    movimientos,
    loading,
    error,
    obtenerMovimientos,
    crearMovimiento,
    obtenerEstadisticas,
    buscarPorSerial
  };
};