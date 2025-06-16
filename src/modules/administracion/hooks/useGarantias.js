import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const useGarantias = () => {
  const [garantias, setGarantias] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📋 Obtener todas las garantías (productos vendidos)
  const fetchGarantias = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Obteniendo garantías...');
      
      let query = supabase
        .from('transacciones')
        .select(`
          id,
          numero_transaccion,
          cliente_nombre,
          cliente_telefono,
          cliente_email,
          fecha_venta,
          vendedor,
          metodo_pago,
          total_venta,
          venta_items (
            id,
            modelo_producto,
            serial_producto,
            tipo_producto,
            cantidad,
            precio_total,
            precio_unitario
          )
        `)
        .not('venta_items.serial_producto', 'is', null)
        .order('fecha_venta', { ascending: false });

      // Aplicar filtros si existen
      if (filtros.serial) {
        query = query.ilike('venta_items.serial_producto', `%${filtros.serial}%`);
      }
      if (filtros.cliente) {
        query = query.ilike('cliente_nombre', `%${filtros.cliente}%`);
      }
      if (filtros.fechaInicio) {
        query = query.gte('fecha_venta', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte('fecha_venta', filtros.fechaFin);
      }
      if (filtros.tipoProducto && filtros.tipoProducto !== 'todos') {
        query = query.eq('venta_items.tipo_producto', filtros.tipoProducto);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Procesar datos para calcular estado de garantía
      const garantiasProcesadas = [];
      
      data.forEach(transaccion => {
        if (transaccion.venta_items && transaccion.venta_items.length > 0) {
          transaccion.venta_items.forEach(item => {
            if (item.serial_producto) {
              const fechaVenta = new Date(transaccion.fecha_venta);
              const fechaVencimiento = new Date(fechaVenta);
              
              // Calcular días de garantía según tipo de producto y condición
              let diasGarantia;
              if (item.tipo_producto === 'computadora') {
                // Computadoras: nuevas 6 meses (180 días), usadas 3 meses (90 días)
                // Asumir que si no se especifica condición, son usadas
                diasGarantia = 90; // Por defecto 3 meses para computadoras usadas
                // TODO: Agregar campo 'condicion' a venta_items para distinguir nuevo/usado
              } else if (item.tipo_producto === 'celular') {
                diasGarantia = 30; // 1 mes para celulares
              } else {
                diasGarantia = 30; // 1 mes para otros productos
              }
              
              fechaVencimiento.setDate(fechaVencimiento.getDate() + diasGarantia);
              
              const hoy = new Date();
              const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
              
              let estadoGarantia;
              if (diasRestantes > 0) {
                estadoGarantia = 'Activa';
              } else {
                estadoGarantia = 'Vencida';
              }

              garantiasProcesadas.push({
                id: `${transaccion.id}-${item.id}`,
                transaccion_id: transaccion.id,
                numero_transaccion: transaccion.numero_transaccion,
                cliente_nombre: transaccion.cliente_nombre,
                cliente_telefono: transaccion.cliente_telefono,
                cliente_email: transaccion.cliente_email,
                fecha_venta: transaccion.fecha_venta,
                vendedor: transaccion.vendedor,
                metodo_pago: transaccion.metodo_pago,
                // Datos del producto
                modelo_producto: item.modelo_producto,
                serial_producto: item.serial_producto,
                tipo_producto: item.tipo_producto,
                cantidad: item.cantidad,
                precio_total: item.precio_total,
                precio_unitario: item.precio_unitario,
                // Datos de garantía calculados
                fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
                dias_restantes: diasRestantes,
                estado_garantia: estadoGarantia,
                plazo_garantia: diasGarantia.toString(),
                tipo_garantia: item.tipo_producto === 'computadora' ? 'Computadora (3 meses)' : 
                              item.tipo_producto === 'celular' ? 'Celular (1 mes)' : 'Otros (1 mes)'
              });
            }
          });
        }
      });

      console.log(`✅ ${garantiasProcesadas.length} garantías obtenidas`);
      setGarantias(garantiasProcesadas);
      
      return garantiasProcesadas;
      
    } catch (err) {
      console.error('❌ Error obteniendo garantías:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 📊 Obtener estadísticas de garantías
  const fetchEstadisticas = useCallback(async () => {
    try {
      console.log('📊 Calculando estadísticas de garantías...');
      
      const garantiasData = await fetchGarantias();
      
      const estadisticas = {
        totalGarantias: garantiasData.length,
        garantiasActivas: garantiasData.filter(g => g.estado_garantia === 'Activa').length,
        garantiasVencidas: garantiasData.filter(g => g.estado_garantia === 'Vencida').length,
        porTipoProducto: {
          computadora: garantiasData.filter(g => g.tipo_producto === 'computadora').length,
          celular: garantiasData.filter(g => g.tipo_producto === 'celular').length,
          otro: garantiasData.filter(g => g.tipo_producto === 'otro').length
        }
      };

      console.log('✅ Estadísticas calculadas:', estadisticas);
      setEstadisticas(estadisticas);
      
      return estadisticas;
      
    } catch (err) {
      console.error('❌ Error calculando estadísticas:', err);
      setError(err.message);
      return null;
    }
  }, [fetchGarantias]);

  // 🔍 Buscar garantía por serial
  const buscarPorSerial = useCallback(async (serial) => {
    return await fetchGarantias({ serial });
  }, [fetchGarantias]);

  // 🔍 Buscar garantías por cliente
  const buscarPorCliente = useCallback(async (cliente) => {
    return await fetchGarantias({ cliente });
  }, [fetchGarantias]);

  // 📧 Enviar garantía por email
  const enviarGarantiaPorEmail = useCallback(async (garantia, emailDestino) => {
    try {
      console.log('📧 Enviando garantía por email...', garantia.serial_producto);
      
      // Aquí implementarías el envío de email
      // Por ahora simulo el proceso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ Garantía enviada a ${emailDestino}`);
      return { success: true };
      
    } catch (err) {
      console.error('❌ Error enviando garantía:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 🔄 Refrescar datos
  const refrescarDatos = useCallback(async () => {
    await Promise.all([
      fetchGarantias(),
      fetchEstadisticas()
    ]);
  }, [fetchGarantias, fetchEstadisticas]);

  return {
    // Estados
    garantias,
    estadisticas,
    loading,
    error,

    // Funciones principales
    fetchGarantias,
    fetchEstadisticas,
    buscarPorSerial,
    buscarPorCliente,
    enviarGarantiaPorEmail,
    refrescarDatos
  };
};