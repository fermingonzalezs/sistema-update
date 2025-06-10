// Hook para Gastos Operativos - Versión Nueva y Limpia
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export const useGastosOperativos = () => {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener gastos con filtros
  const fetchGastos = async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('gastos_operativos')
        .select('*')
        .order('fecha_gasto', { ascending: false });

      // Aplicar filtros
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
      
      if (error) throw error;
      
      console.log(`📊 ${data.length} gastos cargados`);
      setGastos(data || []);
      
    } catch (err) {
      console.error('❌ Error cargando gastos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo gasto
  const crearGasto = async (gastoData) => {
    try {
      setError(null);
      
      console.log('💾 Creando gasto:', gastoData);
      
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
          moneda: gastoData.moneda || 'USD',
          cotizacion_manual: gastoData.cotizacion_manual ? parseFloat(gastoData.cotizacion_manual) : null,
          cuenta_pago_id: gastoData.cuenta_pago_id || null,
          metodo_pago: gastoData.metodo_pago || 'efectivo',
          estado: gastoData.estado || 'pagado',
          observaciones: gastoData.observaciones || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Gasto creado exitosamente:', data);
      
      // Actualizar lista local
      setGastos(prev => [data, ...prev]);
      
      return data;
      
    } catch (err) {
      console.error('❌ Error creando gasto:', err);
      setError(err.message);
      throw err;
    }
  };

  // Actualizar gasto
  const actualizarGasto = async (id, updates) => {
    try {
      setError(null);
      
      console.log(`🔄 Actualizando gasto ${id}:`, updates);
      
      const { data, error } = await supabase
        .from('gastos_operativos')
        .update({
          ...updates,
          monto: updates.monto ? parseFloat(updates.monto) : undefined,
          cotizacion_manual: updates.cotizacion_manual ? parseFloat(updates.cotizacion_manual) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Gasto actualizado exitosamente:', data);
      
      // Actualizar lista local
      setGastos(prev => prev.map(gasto => 
        gasto.id === id ? data : gasto
      ));
      
      return data;
      
    } catch (err) {
      console.error('❌ Error actualizando gasto:', err);
      setError(err.message);
      throw err;
    }
  };

  // Eliminar gasto
  const eliminarGasto = async (id) => {
    try {
      setError(null);
      
      console.log(`🗑️ Eliminando gasto ${id}`);
      
      const { error } = await supabase
        .from('gastos_operativos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log('✅ Gasto eliminado exitosamente');
      
      // Actualizar lista local
      setGastos(prev => prev.filter(gasto => gasto.id !== id));
      
    } catch (err) {
      console.error('❌ Error eliminando gasto:', err);
      setError(err.message);
      throw err;
    }
  };

  // Obtener estadísticas
  const obtenerEstadisticas = () => {
    const totalUSD = gastos
      .filter(g => g.moneda === 'USD')
      .reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
    
    const totalARS = gastos
      .filter(g => g.moneda === 'ARS')
      .reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
    
    const totalGastos = gastos.length;
    
    const porCategoria = gastos.reduce((acc, gasto) => {
      const categoria = gasto.categoria || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = { cantidad: 0, totalUSD: 0, totalARS: 0 };
      }
      acc[categoria].cantidad++;
      if (gasto.moneda === 'USD') {
        acc[categoria].totalUSD += parseFloat(gasto.monto || 0);
      } else {
        acc[categoria].totalARS += parseFloat(gasto.monto || 0);
      }
      return acc;
    }, {});

    return {
      totalUSD,
      totalARS,
      totalGastos,
      porCategoria
    };
  };

  return {
    gastos,
    loading,
    error,
    fetchGastos,
    crearGasto,
    actualizarGasto,
    eliminarGasto,
    obtenerEstadisticas
  };
};