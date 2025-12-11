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
            copy,
            copy_documento,
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
              
              // Calcular días de garantía según tipo de producto y condición
              let diasGarantia;
              let garantiaTextoOriginal = '';
              
              if (item.tipo_producto === 'computadora') {
                // Buscar datos reales del inventario usando el serial
                try {
                  console.log(`🔍 Buscando en inventario - Serial: ${item.serial_producto}`);
                  
                  const { data: inventarioData, error: inventarioError } = await supabase
                    .from('inventario')
                    .select('garantia_update, condicion, marca, modelo')
                    .eq('serial', item.serial_producto)
                    .single();

                  if (inventarioError || !inventarioData) {
                    console.warn(`⚠️ No se encontró el equipo en inventario: ${item.serial_producto}`);
                    console.log(`📝 Usando copy como fallback: "${item.copy}"`);
                    
                    // Fallback: extraer condición del copy
                    const copyLower = item.copy?.toLowerCase() || '';
                    let condicionFromCopy = 'usado'; // Por defecto
                    
                    // Buscar condición al final del copy (patrón común)
                    if (copyLower.includes('- nuevo') || copyLower.endsWith('nuevo')) {
                      condicionFromCopy = 'nuevo';
                    } else if (copyLower.includes('- usado') || copyLower.endsWith('usado')) {
                      condicionFromCopy = 'usado';
                    } else if (copyLower.includes('- reparacion') || copyLower.includes('reparación')) {
                      condicionFromCopy = 'reparacion';
                    }
                    
                    console.log(`🔍 Condición extraída del copy: "${condicionFromCopy}"`);
                    
                    // Asignar garantía según la condición extraída
                    if (condicionFromCopy === 'nuevo') {
                      diasGarantia = 180;
                      garantiaTextoOriginal = '6 meses';
                      console.log(`✅ Producto NUEVO detectado en copy - Asignando 6 meses`);
                    } else {
                      diasGarantia = 90;
                      garantiaTextoOriginal = '3 meses';
                      console.log(`✅ Producto USADO detectado en copy - Asignando 3 meses`);
                    }
                  } else {
                    // Usar datos reales del inventario
                    garantiaTextoOriginal = inventarioData.garantia_update || '3 meses';
                    const condicionReal = inventarioData.condicion || 'usado';
                    
                    console.log(`✅ Datos del inventario - Serial: ${item.serial_producto}`);
                    console.log(`✅ Garantía inventario: "${garantiaTextoOriginal}"`);
                    console.log(`✅ Condición inventario: "${condicionReal}"`);
                    
                    // Convertir texto de garantía a días con mayor flexibilidad
                    const garantiaLower = garantiaTextoOriginal.toLowerCase().trim();
                    
                    // Buscar patrones numéricos más flexibles
                    if (garantiaLower.includes('18 meses') || garantiaLower.includes('1.5 años') || garantiaLower.includes('año y medio')) {
                      diasGarantia = 540; // 18 meses
                    } else if (garantiaLower.includes('12 meses') || garantiaLower.includes('1 año') || garantiaLower.includes('un año')) {
                      diasGarantia = 365; // 12 meses
                    } else if (garantiaLower.includes('6 meses') || garantiaLower.includes('seis meses') || garantiaLower.includes('medio año')) {
                      diasGarantia = 180; // 6 meses
                    } else if (garantiaLower.includes('3 meses') || garantiaLower.includes('tres meses')) {
                      // Si es producto nuevo pero dice 3 meses, usar 6 meses
                      if (condicionReal === 'nuevo') {
                        diasGarantia = 180; // 6 meses para productos nuevos
                        garantiaTextoOriginal = '6 meses'; // Actualizar el texto mostrado
                        console.log(`🔄 Producto NUEVO con 3 meses corregido a 6 meses para ${item.serial_producto}`);
                      } else {
                        diasGarantia = 90; // 3 meses para productos usados
                      }
                    } else if (garantiaLower.includes('2 meses') || garantiaLower.includes('dos meses')) {
                      diasGarantia = 60; // 2 meses
                    } else if (garantiaLower.includes('1 mes') || garantiaLower.includes('un mes')) {
                      diasGarantia = 30; // 1 mes
                    } else {
                      // Buscar números seguidos de 'mes' o 'año'
                      const mesMatch = garantiaLower.match(/(\d+)\s*(mes|meses)/);
                      const añoMatch = garantiaLower.match(/(\d+)\s*(año|años)/);
                      
                      if (mesMatch) {
                        const meses = parseInt(mesMatch[1]);
                        diasGarantia = meses * 30;
                      } else if (añoMatch) {
                        const años = parseInt(añoMatch[1]);
                        diasGarantia = años * 365;
                      } else {
                        // Para productos nuevos sin garantía específica, usar 6 meses por defecto
                        if (condicionReal === 'nuevo') {
                          diasGarantia = 180;
                          garantiaTextoOriginal = '6 meses';
                        } else {
                          diasGarantia = 90;
                          garantiaTextoOriginal = '3 meses';
                        }
                      }
                    }
                  }
                  
                  console.log(`📅 RESULTADO FINAL - Serial: ${item.serial_producto}`);
                  console.log(`📅 RESULTADO FINAL - Garantía: "${garantiaTextoOriginal}" = ${diasGarantia} días`);
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                } catch (error) {
                  console.error('❌ ERROR al consultar inventario - Serial:', item.serial_producto);
                  console.error('❌ ERROR completo:', error);
                  diasGarantia = 90; // Fallback
                  garantiaTextoOriginal = '3 meses';
                }
              } else if (item.tipo_producto === 'celular') {
                diasGarantia = 30; // 1 mes para celulares
                garantiaTextoOriginal = '1 mes';
              } else {
                diasGarantia = 30; // 1 mes para otros productos
                garantiaTextoOriginal = '1 mes';
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
                copy: item.copy,
                copy_documento: item.copy_documento,
                serial_producto: item.serial_producto,
                tipo_producto: item.tipo_producto,
                cantidad: item.cantidad,
                precio_total: item.precio_total,
                precio_unitario: item.precio_unitario,
                garantia: item.garantia,
                // Datos de garantía calculados
                fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
                dias_restantes: diasRestantes,
                estado_garantia: estadoGarantia,
                plazo_garantia: diasGarantia.toString(),
                tipo_garantia: item.tipo_producto === 'computadora' ? `Computadora (${garantiaTextoOriginal})` :
                              item.tipo_producto === 'celular' ? `Celular (${garantiaTextoOriginal})` : `Otros (${garantiaTextoOriginal})`
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