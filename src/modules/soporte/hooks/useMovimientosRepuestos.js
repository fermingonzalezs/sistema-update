// src/modules/soporte/hooks/useMovimientosRepuestos.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de movimientos de repuestos
export const movimientosRepuestosService = {
  // Obtener todos los movimientos
  async getAll(filtros = {}) {
    console.log('📡 Obteniendo movimientos de repuestos...');
    
    let query = supabase
      .from('movimientos_repuestos')
      .select(`
        *,
        repuestos (
          id,
          nombre_producto,
          categoria
        )
      `)
      .order('fecha_movimiento', { ascending: false });

    // Aplicar filtros
    if (filtros.repuesto_id) {
      query = query.eq('repuesto_id', filtros.repuesto_id);
    }
    if (filtros.tipo_movimiento) {
      query = query.eq('tipo_movimiento', filtros.tipo_movimiento);
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

  // Registrar entrada de repuestos
  async registrarEntrada(movimientoData) {
    console.log(`📦 Registrando entrada de ${movimientoData.cantidad} unidades de repuesto ID: ${movimientoData.repuesto_id}`);
    
    try {
      // Iniciar transacción
      const { data: repuesto, error: errorRepuesto } = await supabase
        .from('repuestos')
        .select('cantidad_la_plata, cantidad_mitre')
        .eq('id', movimientoData.repuesto_id)
        .single();

      if (errorRepuesto) throw errorRepuesto;

      const stockAnterior = (repuesto.cantidad_la_plata || 0) + (repuesto.cantidad_mitre || 0);
      const stockNuevo = stockAnterior + movimientoData.cantidad;

      // Registrar el movimiento
      const { data: movimiento, error: errorMovimiento } = await supabase
        .from('movimientos_repuestos')
        .insert([{
          repuesto_id: movimientoData.repuesto_id,
          tipo_movimiento: 'entrada',
          cantidad: movimientoData.cantidad,
          motivo: movimientoData.motivo || 'Entrada de inventario',
          usuario: movimientoData.usuario || 'admin',
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          observaciones: movimientoData.observaciones || '',
          fecha_movimiento: new Date().toISOString()
        }])
        .select();

      if (errorMovimiento) throw errorMovimiento;

      // Actualizar stock del repuesto
      const { error: errorUpdate } = await supabase
        .from('repuestos')
        .update({ 
          cantidad_la_plata: stockNuevo,
          cantidad_mitre: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', movimientoData.repuesto_id);

      if (errorUpdate) throw errorUpdate;

      console.log('✅ Entrada registrada exitosamente');
      return movimiento[0];
    } catch (error) {
      console.error('❌ Error registrando entrada:', error);
      throw error;
    }
  },

  // Registrar salida de repuestos
  async registrarSalida(movimientoData) {
    console.log(`📤 Registrando salida de ${movimientoData.cantidad} unidades de repuesto ID: ${movimientoData.repuesto_id}`);
    
    try {
      // Verificar stock disponible
      const { data: repuesto, error: errorRepuesto } = await supabase
        .from('repuestos')
        .select('cantidad_la_plata, cantidad_mitre, nombre_producto')
        .eq('id', movimientoData.repuesto_id)
        .single();

      if (errorRepuesto) throw errorRepuesto;

      const stockAnterior = (repuesto.cantidad_la_plata || 0) + (repuesto.cantidad_mitre || 0);
      
      if (stockAnterior < movimientoData.cantidad) {
        throw new Error(`Stock insuficiente. Disponible: ${stockAnterior}, Solicitado: ${movimientoData.cantidad}`);
      }

      const stockNuevo = stockAnterior - movimientoData.cantidad;

      // Registrar el movimiento
      const { data: movimiento, error: errorMovimiento } = await supabase
        .from('movimientos_repuestos')
        .insert([{
          repuesto_id: movimientoData.repuesto_id,
          tipo_movimiento: 'salida',
          cantidad: movimientoData.cantidad,
          reparacion_id: movimientoData.reparacion_id || null,
          motivo: movimientoData.motivo || 'Uso en reparación',
          usuario: movimientoData.usuario || 'admin',
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          observaciones: movimientoData.observaciones || '',
          fecha_movimiento: new Date().toISOString()
        }])
        .select();

      if (errorMovimiento) throw errorMovimiento;

      // Actualizar stock del repuesto
      const { error: errorUpdate } = await supabase
        .from('repuestos')
        .update({ 
          cantidad_la_plata: stockNuevo,
          cantidad_mitre: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', movimientoData.repuesto_id);

      if (errorUpdate) throw errorUpdate;

      console.log('✅ Salida registrada exitosamente');
      return movimiento[0];
    } catch (error) {
      console.error('❌ Error registrando salida:', error);
      throw error;
    }
  },

  // Obtener movimientos por repuesto
  async getByRepuesto(repuestoId) {
    console.log(`🔍 Obteniendo movimientos del repuesto ID: ${repuestoId}`);
    
    const { data, error } = await supabase
      .from('movimientos_repuestos')
      .select('*')
      .eq('repuesto_id', repuestoId)
      .order('fecha_movimiento', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo movimientos por repuesto:', error);
      throw error;
    }
    
    return data;
  },

  // Obtener movimientos por reparación
  async getByReparacion(reparacionId) {
    console.log(`🔧 Obteniendo movimientos de la reparación ID: ${reparacionId}`);
    
    const { data, error } = await supabase
      .from('movimientos_repuestos')
      .select('*')
      .eq('reparacion_id', reparacionId)
      .order('fecha_movimiento', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo movimientos por reparación:', error);
      throw error;
    }
    
    return data;
  },

  // Aplicar repuestos usados en una reparación (desde presupuesto)
  async aplicarRepuestosReparacion(reparacionId, repuestosUsados, usuario = 'admin') {
    console.log(`🔧 Aplicando repuestos usados en reparación ID: ${reparacionId}`);
    
    try {
      const movimientos = [];
      
      for (const repuesto of repuestosUsados) {
        const movimiento = await this.registrarSalida({
          repuesto_id: repuesto.id,
          cantidad: repuesto.cantidad,
          reparacion_id: reparacionId,
          motivo: `Uso en reparación - ${repuesto.nombre}`,
          usuario,
          observaciones: `Aplicado desde presupuesto de reparación`
        });
        
        movimientos.push(movimiento);
      }
      
      console.log(`✅ ${movimientos.length} movimientos aplicados a la reparación`);
      return movimientos;
    } catch (error) {
      console.error('❌ Error aplicando repuestos a reparación:', error);
      throw error;
    }
  },

  // Obtener estadísticas de movimientos
  async getEstadisticas(fechaDesde, fechaHasta) {
    console.log('📊 Calculando estadísticas de movimientos...');
    
    let query = supabase
      .from('movimientos_repuestos')
      .select('tipo_movimiento, cantidad, fecha_movimiento');

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
      entradas: data.filter(m => m.tipo_movimiento === 'entrada').length,
      salidas: data.filter(m => m.tipo_movimiento === 'salida').length,
      cantidadEntradas: data
        .filter(m => m.tipo_movimiento === 'entrada')
        .reduce((sum, m) => sum + m.cantidad, 0),
      cantidadSalidas: data
        .filter(m => m.tipo_movimiento === 'salida')
        .reduce((sum, m) => sum + m.cantidad, 0)
    };

    estadisticas.saldoNeto = estadisticas.cantidadEntradas - estadisticas.cantidadSalidas;
    
    return estadisticas;
  }
};

// 🎣 HOOK: Lógica de React para movimientos de repuestos
export const useMovimientosRepuestos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener movimientos
  const obtenerMovimientos = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await movimientosRepuestosService.getAll(filtros);
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

  // Registrar entrada
  const registrarEntrada = useCallback(async (movimientoData) => {
    try {
      setError(null);
      const movimiento = await movimientosRepuestosService.registrarEntrada(movimientoData);
      
      // Actualizar lista local
      setMovimientos(prev => [movimiento, ...prev]);
      
      return movimiento;
    } catch (err) {
      setError(err.message);
      console.error('Error registrando entrada:', err);
      throw err;
    }
  }, []);

  // Registrar salida
  const registrarSalida = useCallback(async (movimientoData) => {
    try {
      setError(null);
      const movimiento = await movimientosRepuestosService.registrarSalida(movimientoData);
      
      // Actualizar lista local
      setMovimientos(prev => [movimiento, ...prev]);
      
      return movimiento;
    } catch (err) {
      setError(err.message);
      console.error('Error registrando salida:', err);
      throw err;
    }
  }, []);

  // Obtener estadísticas
  const obtenerEstadisticas = useCallback(async (fechaDesde, fechaHasta) => {
    try {
      setError(null);
      return await movimientosRepuestosService.getEstadisticas(fechaDesde, fechaHasta);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Aplicar repuestos a reparación
  const aplicarRepuestosReparacion = useCallback(async (reparacionId, repuestosUsados, usuario = 'admin') => {
    try {
      setError(null);
      const movimientos = await movimientosRepuestosService.aplicarRepuestosReparacion(
        reparacionId, 
        repuestosUsados, 
        usuario
      );
      
      // Actualizar lista local
      setMovimientos(prev => [...movimientos, ...prev]);
      
      return movimientos;
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
    registrarEntrada,
    registrarSalida,
    obtenerEstadisticas,
    aplicarRepuestosReparacion
  };
};