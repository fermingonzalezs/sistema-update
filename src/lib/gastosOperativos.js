// src/lib/gastosOperativos.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from './supabase.js';

// 📊 SERVICE: Operaciones de gastos operativos
export const gastosOperativosService = {
  // Obtener todos los gastos con filtros opcionales
  async getGastos(filtros = {}) {
    console.log('📡 Obteniendo gastos operativos...');
    
    let query = supabase
      .from('gastos_operativos')
      .select('*')
      .order('fecha_gasto', { ascending: false });

    if (filtros.fechaDesde) {
      query = query.gte('fecha_gasto', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      query = query.lte('fecha_gasto', filtros.fechaHasta);
    }
    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error obteniendo gastos:', error);
      throw error;
    }
    
    console.log(`✅ ${data.length} gastos obtenidos`);
    return data;
  },

  // Crear nuevo gasto
  async create(gastoData) {
    console.log('💾 Creando gasto operativo:', gastoData.descripcion);
    
    const { data, error } = await supabase
      .from('gastos_operativos')
      .insert([{
        fecha_gasto: gastoData.fecha_gasto,
        categoria: gastoData.categoria,
        subcategoria: gastoData.subcategoria || null,
        descripcion: gastoData.descripcion,
        proveedor_nombre: gastoData.proveedor_nombre || null,
        numero_comprobante: gastoData.numero_comprobante || null,
        monto: parseFloat(gastoData.monto),
        metodo_pago: gastoData.metodo_pago || 'efectivo',
        estado: gastoData.estado || 'pagado',
        observaciones: gastoData.observaciones || null
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creando gasto:', error);
      throw error;
    }
    
    console.log('✅ Gasto creado exitosamente');
    return data;
  },

  // Actualizar gasto
  async update(id, updates) {
    console.log(`🔄 Actualizando gasto ID: ${id}`);
    
    const { data, error } = await supabase
      .from('gastos_operativos')
      .update({
        ...updates,
        monto: updates.monto ? parseFloat(updates.monto) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error actualizando gasto:', error);
      throw error;
    }
    
    console.log('✅ Gasto actualizado');
    return data;
  },

  // Eliminar gasto
  async delete(id) {
    console.log(`🗑️ Eliminando gasto ID: ${id}`);
    
    const { error } = await supabase
      .from('gastos_operativos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error eliminando gasto:', error);
      throw error;
    }
    
    console.log('✅ Gasto eliminado');
    return true;
  },

  // Obtener total de gastos por período
  async getTotalGastos(fechaDesde, fechaHasta, categoria = null) {
    console.log('💰 Calculando total de gastos...');
    
    let query = supabase
      .from('gastos_operativos')
      .select('monto');

    if (fechaDesde) {
      query = query.gte('fecha_gasto', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('fecha_gasto', fechaHasta);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error calculando total:', error);
      throw error;
    }

    const total = data.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
    return {
      total,
      cantidad: data.length
    };
  },

  // Obtener resumen por categoría
  async getResumenPorCategoria(fechaDesde, fechaHasta) {
    console.log('📊 Obteniendo resumen por categoría...');
    
    let query = supabase
      .from('gastos_operativos')
      .select('categoria, monto');

    if (fechaDesde) {
      query = query.gte('fecha_gasto', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('fecha_gasto', fechaHasta);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error obteniendo resumen:', error);
      throw error;
    }

    // Agrupar por categoría
    const resumen = data.reduce((acc, gasto) => {
      const categoria = gasto.categoria;
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          total: 0,
          cantidad: 0
        };
      }
      acc[categoria].total += parseFloat(gasto.monto);
      acc[categoria].cantidad += 1;
      return acc;
    }, {});

    return Object.values(resumen);
  }
};

// 🎣 HOOK: Lógica de React para gastos operativos
export function useGastosOperativos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGastos = async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await gastosOperativosService.getGastos(filtros);
      setGastos(data);
    } catch (err) {
      console.error('Error en useGastosOperativos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearGasto = async (gastoData) => {
    try {
      setError(null);
      const nuevoGasto = await gastosOperativosService.create(gastoData);
      setGastos(prev => [nuevoGasto, ...prev]);
      return nuevoGasto;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const actualizarGasto = async (id, updates) => {
    try {
      setError(null);
      const gastoActualizado = await gastosOperativosService.update(id, updates);
      setGastos(prev => prev.map(gasto => 
        gasto.id === id ? gastoActualizado : gasto
      ));
      return gastoActualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const eliminarGasto = async (id) => {
    try {
      setError(null);
      await gastosOperativosService.delete(id);
      setGastos(prev => prev.filter(gasto => gasto.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    gastos,
    loading,
    error,
    fetchGastos,
    crearGasto,
    actualizarGasto,
    eliminarGasto
  };
}