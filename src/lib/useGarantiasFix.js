import { useState, useCallback } from 'react';
import { supabase } from './supabase';
import { generarTipoGarantia, parsearGarantia } from './garantiaUtils';

export const useGarantias = () => {
  const [garantias, setGarantias] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [valorEquiposGarantizados, setValorEquiposGarantizados] = useState(0);
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
            copy,
            serial_producto,
            tipo_producto,
            cantidad,
            precio_total,
            precio_unitario,
            garantia
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
      
      // Usar for...of para poder usar await
      for (const transaccion of data) {
        if (transaccion.venta_items && transaccion.venta_items.length > 0) {
          for (const item of transaccion.venta_items) {
            if (item.serial_producto) {
              const fechaVenta = new Date(transaccion.fecha_venta);
              const fechaVencimiento = new Date(fechaVenta);

              // ✅ LEER GARANTÍA DIRECTAMENTE DESDE BD
              const garantiaTexto = item.garantia || '3 meses'; // Default a 3 meses si no existe
              const garantiaInfo = parsearGarantia(garantiaTexto);
              const diasGarantia = garantiaInfo.dias;

              fechaVencimiento.setDate(fechaVencimiento.getDate() + diasGarantia);

              const hoy = new Date();
              const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

              let estadoGarantia;
              if (diasRestantes > 0) {
                estadoGarantia = 'Activa';
              } else {
                estadoGarantia = 'Vencida';
              }

              // Función para extraer el nombre base del producto
              const getProductModel = (copy) => {
                if (!copy) return 'Producto';
                // Eliminar detalles comunes como capacidad, año, etc.
                const stopWords = ['gb', 'tb', 'ssd', 'ram', 'inch', 'hz', 'led', 'lcd', 'oled', 'qled', 'full', 'hd', '4k', '8k'];
                const copyLower = copy.toLowerCase();
                let cutIndex = -1;

                // Buscar por palabras clave
                for (const word of stopWords) {
                  const index = copyLower.indexOf(` ${word}`);
                  if (index !== -1) {
                    if (cutIndex === -1 || index < cutIndex) {
                      cutIndex = index;
                    }
                  }
                }

                // Buscar por año entre paréntesis, ej: (2020)
                const yearMatch = copy.match(/\s\(\d{4}\)/);
                if (yearMatch && yearMatch.index !== -1) {
                  if (cutIndex === -1 || yearMatch.index < cutIndex) {
                    cutIndex = yearMatch.index;
                  }
                }
                
                // Buscar por tamaño en pulgadas, ej: 13-inch o 13"
                const inchMatch = copy.match(/\s\d{1,2}(\.\d{1,2})?(-inch|"|”)/);
                if (inchMatch && inchMatch.index !== -1) {
                  if (cutIndex === -1 || inchMatch.index < cutIndex) {
                    cutIndex = inchMatch.index;
                  }
                }

                if (cutIndex !== -1) {
                  return copy.substring(0, cutIndex).trim();
                }

                return copy; // Si no se encuentra un patrón, devolver el copy original
              };

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
                modelo_producto: getProductModel(item.copy),
                copy_completo: item.copy, // Guardar el copy completo con condición incluida
                serial_producto: item.serial_producto,
                tipo_producto: item.tipo_producto,
                cantidad: item.cantidad,
                precio_total: item.precio_total,
                precio_unitario: item.precio_unitario,
                // Datos de garantía (desde BD)
                fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
                dias_restantes: diasRestantes,
                estado_garantia: estadoGarantia,
                plazo_garantia: diasGarantia.toString(),
                garantia_texto: garantiaTexto,
                tipo_garantia: generarTipoGarantia(item.tipo_producto, garantiaTexto)
              });
            }
          }
        }
      }

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

  const fetchValorEquiposGarantizados = useCallback(async () => {
    try {
      console.log('💰 Calculando valor de equipos garantizados...');
      
      const garantiasData = await fetchGarantias();
      
      const valorTotal = garantiasData
        .filter(g => g.estado_garantia === 'Activa')
        .reduce((acc, g) => acc + (g.precio_total || 0), 0);

      console.log('✅ Valor de equipos garantizados calculado:', valorTotal);
      setValorEquiposGarantizados(valorTotal);
      
      return valorTotal;
      
    } catch (err) {
      console.error('❌ Error calculando valor de equipos garantizados:', err);
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
      fetchEstadisticas(),
      fetchValorEquiposGarantizados()
    ]);
  }, [fetchGarantias, fetchEstadisticas, fetchValorEquiposGarantizados]);

  return {
    // Estados
    garantias,
    estadisticas,
    valorEquiposGarantizados,
    loading,
    error,

    // Funciones principales
    fetchGarantias,
    fetchEstadisticas,
    fetchValorEquiposGarantizados,
    buscarPorSerial,
    buscarPorCliente,
    enviarGarantiaPorEmail,
    refrescarDatos
  };
};