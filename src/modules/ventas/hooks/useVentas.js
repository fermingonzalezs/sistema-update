// src/lib/ventas.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { otrosService } from '../hooks/useOtros.js';
import { generateCopy } from '../../../shared/utils/copyGenerator';

// 📊 SERVICE: Operaciones de ventas y transacciones
export const ventasService = {
  // Obtener todas las transacciones con sus items
  async getAll() {
    console.log('📡 Obteniendo todas las transacciones...')

    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        venta_items (
          id,
          tipo_producto,
          producto_id,
          serial_producto,
          copy,
          cantidad,
          precio_unitario,
          precio_total,
          precio_costo,
          margen_item,
          garantia
        )
      `)
      .order('fecha_venta', { ascending: false })
    
    if (error) {
      console.error('❌ Error obteniendo transacciones:', error)
      throw error
    }
    
    console.log(`✅ ${data.length} transacciones obtenidas`)
    return data
  },

  // Crear nueva transacción con múltiples items
  async createTransaction(datosCliente, carritoItems, fechaVenta = null) {
    console.log('💾 Creando transacción con', carritoItems.length, 'items')
    
    // Generar número de transacción único
    const numeroTransaccion = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    // Obtener el nombre del vendedor si se proporcionó un ID
    let nombreVendedor = datosCliente.vendedor || '';
    if (datosCliente.vendedor && !isNaN(datosCliente.vendedor)) {
      // Si vendedor es un número (ID), obtener el nombre
      try {
        const { data: vendedorData, error: vendedorError } = await supabase
          .from('vendedores')
          .select('nombre, apellido')
          .eq('id', datosCliente.vendedor)
          .single();
        
        if (!vendedorError && vendedorData) {
          nombreVendedor = `${vendedorData.nombre} ${vendedorData.apellido}`;
        }
      } catch (error) {
        console.warn('No se pudo obtener nombre del vendedor:', error);
        nombreVendedor = datosCliente.vendedor; // Usar el ID como fallback
      }
    }
    
    // Calcular totales
    const totalVenta = carritoItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0)
    const totalCosto = carritoItems.reduce((sum, item) => {
      let costo = 0
      if (item.tipo === 'computadora') {
        // Para computadoras, priorizar precio_costo_total, fallback a precio_costo_usd
        costo = item.producto.precio_costo_total || item.producto.precio_costo_usd || 0
      } else {
        // Para celulares y otros productos, usar costo_total_usd (que incluye costos adicionales)
        costo = item.producto.costo_total_usd || item.producto.precio_compra_usd || 0
      }
      return sum + (costo * item.cantidad)
    }, 0)

    // 💰 CALCULAR MONTO REAL COBRADO
    const montoCobrado = (datosCliente.monto_pago_1 || 0) + (datosCliente.monto_pago_2 || 0)
    const diferenciaPrecio = montoCobrado - totalVenta

    console.log(`💰 Análisis de precios:`, {
      totalVenta: totalVenta,
      montoCobrado: montoCobrado,
      diferenciaPrecio: diferenciaPrecio
    });

    // 🎯 AJUSTAR PRECIOS SI HAY DIFERENCIA
    let carritoAjustado = [...carritoItems]
    if (Math.abs(diferenciaPrecio) > 0.01) { // Solo si la diferencia es significativa (> 1 centavo)
      // Encontrar el item más caro del carrito
      const itemMasCaro = carritoAjustado.reduce((max, item) =>
        (item.precio_unitario * item.cantidad) > (max.precio_unitario * max.cantidad) ? item : max
      );

      console.log(`🎯 Aplicando diferencia de $${diferenciaPrecio} al item más caro:`, {
        producto: itemMasCaro.producto?.modelo || itemMasCaro.producto?.nombre_producto,
        precio_original: itemMasCaro.precio_unitario,
        cantidad: itemMasCaro.cantidad
      });

      // Crear una copia ajustada del carrito con el precio corregido
      carritoAjustado = carritoItems.map(item => {
        if (item === itemMasCaro) {
          const nuevoPrecioUnitario = item.precio_unitario + (diferenciaPrecio / item.cantidad)
          console.log(`💰 Precio ajustado: $${item.precio_unitario} → $${nuevoPrecioUnitario}`);
          return {
            ...item,
            precio_unitario: nuevoPrecioUnitario
          }
        }
        return item
      })
    }

    const margenTotal = montoCobrado - totalCosto

    let transaccionCreada = null; // Para hacer rollback si falla algo

    try {
      // Crear la transacción principal con soporte para doble método de pago
      const transaccionData = {
        numero_transaccion: numeroTransaccion,
        cliente_id: datosCliente.cliente_id || null,
        cliente_nombre: datosCliente.cliente_nombre,
        cliente_email: datosCliente.cliente_email,
        cliente_telefono: datosCliente.cliente_telefono,
        metodo_pago: datosCliente.metodo_pago_1 || datosCliente.metodo_pago,
        monto_pago_1: datosCliente.monto_pago_1 || montoCobrado,
        total_venta: montoCobrado,
        total_costo: totalCosto,
        margen_total: margenTotal,
        observaciones: datosCliente.observaciones,
        vendedor: nombreVendedor,
        sucursal: datosCliente.sucursal,
        fecha_venta: fechaVenta || new Date().toISOString()
      }

      // Agregar segundo método de pago si existe
      if (datosCliente.metodo_pago_2) {
        transaccionData.metodo_pago_2 = datosCliente.metodo_pago_2
        transaccionData.monto_pago_2 = datosCliente.monto_pago_2 || 0
      }

      const { data: transaccion, error: errorTransaccion } = await supabase
        .from('transacciones')
        .insert([transaccionData])
        .select()
        .single()

      if (errorTransaccion) throw errorTransaccion

      // Guardar referencia para rollback si es necesario
      transaccionCreada = transaccion;
      console.log('✅ Transacción creada, ID:', transaccion.id)

      // Crear los items de la venta usando el carrito ajustado
      const ventaItems = carritoAjustado.map(item => {
        console.log(`💾 DEBUG: Procesando item para BD:`, {
          id: item.id,
          tipo: item.tipo,
          precio_unitario_carrito: item.precio_unitario,
          cantidad: item.cantidad,
          producto: item.producto?.modelo || item.producto?.nombre_producto
        });

        let precioCosto = 0
        if (item.tipo === 'computadora') {
          // Para computadoras, priorizar precio_costo_total, fallback a precio_costo_usd
          precioCosto = item.producto.precio_costo_total || item.producto.precio_costo_usd || 0
        } else {
          // Para celulares y otros productos, usar costo_total_usd (que incluye costos adicionales)
          precioCosto = item.producto.costo_total_usd || item.producto.precio_compra_usd || 0
        }

        const precioUnitarioSeguro = item.precio_unitario || 0
        const precioTotal = precioUnitarioSeguro * item.cantidad
        const margenItem = precioTotal - (precioCosto * item.cantidad)

        console.log(`💾 DEBUG: Precios calculados:`, {
          precio_unitario_original: item.precio_unitario,
          precio_unitario_seguro: precioUnitarioSeguro,
          precio_total: precioTotal,
          precio_costo: precioCosto,
          margen_item: margenItem
        });


        // Generar copy completo del producto al momento de la venta
        let copyCompleto = '';
        try {
          // Determinar el tipo de copy según el producto
          let tipoCopy = 'otro_completo'; // Por defecto
          if (item.tipo === 'computadora') {
            tipoCopy = 'notebook_completo';
          } else if (item.tipo === 'celular') {
            tipoCopy = 'celular_completo';
          }
          
          copyCompleto = generateCopy(item.producto, { tipo: tipoCopy });
        } catch (error) {
          console.error('Error generando copy:', error);
          // Fallback al modelo/nombre si falla la generación
          copyCompleto = item.producto.modelo || item.producto.nombre_producto || 'Sin descripción';
        }

        // Determinar tipo_producto: usar categoría específica para productos "otros"
        // - 'computadora' para notebooks
        // - 'celular' para celulares
        // - Categorías normalizadas (MAYÚSCULAS) para productos otros: 'AUDIO', 'MONITORES', 'COMPONENTES', etc.
        let tipoProducto = 'otro'; // Default

        if (item.tipo === 'computadora') {
          tipoProducto = 'computadora';
        } else if (item.tipo === 'celular') {
          tipoProducto = 'celular';
        } else if (item.tipo === 'otro' && item.categoria) {
          // CRÍTICO: Para productos "otros", usar la categoría específica normalizada (MAYÚSCULAS)
          tipoProducto = item.categoria.toUpperCase();
        }

        console.log(`📊 Guardando item en BD:`, {
          item_tipo: item.tipo,
          item_categoria: item.categoria,
          tipo_producto_final: tipoProducto,
          producto: item.producto?.modelo || item.producto?.nombre_producto
        });

        // Capturar garantía del producto según su tipo
        let garantiaProducto = '3 meses'; // Default fallback
        if (item.tipo === 'computadora' && item.producto.garantia_update) {
          garantiaProducto = item.producto.garantia_update;
        } else if ((item.tipo === 'celular' || item.tipo === 'otro') && item.producto.garantia) {
          garantiaProducto = item.producto.garantia;
        }

        return {
          transaccion_id: transaccion.id,
          tipo_producto: tipoProducto, // Ahora incluye categorías específicas normalizadas (MAYÚSCULAS)
          producto_id: item.producto.id,
          serial_producto: item.producto.serial || `${item.tipo}-${item.producto.id}`,
          copy: copyCompleto,
          cantidad: item.cantidad,
          precio_unitario: precioUnitarioSeguro, // CRÍTICO: Usar precio validado
          precio_total: precioTotal,
          precio_costo: precioCosto,
          margen_item: margenItem,
          garantia: garantiaProducto // Garantía capturada del producto al momento de la venta
        }
      })

      const { data: items, error: errorItems } = await supabase
        .from('venta_items')
        .insert(ventaItems)
        .select()

      if (errorItems) throw errorItems

      console.log('✅ Transacción creada exitosamente:', numeroTransaccion)
      
      return {
        ...transaccion,
        venta_items: items
      }
    } catch (error) {
      console.error('❌ Error creando transacción:', error)

      // 🔄 ROLLBACK: Si ya se creó la transacción pero falló algo después, eliminarla
      if (transaccionCreada?.id) {
        console.warn('⚠️ Haciendo rollback: eliminando transacción ID', transaccionCreada.id)
        try {
          await supabase
            .from('transacciones')
            .delete()
            .eq('id', transaccionCreada.id)
          console.log('✅ Rollback completado: transacción eliminada')
        } catch (rollbackError) {
          console.error('❌ Error en rollback:', rollbackError)
          // Agregar información del rollback al error original
          error.message = `${error.message} (ADVERTENCIA: No se pudo hacer rollback de la transacción ${transaccionCreada.id})`
        }
      }

      throw error
    }
  },


  // ✅ Registrar movimiento en cuenta corriente
  async registrarMovimientoCuentaCorriente(movimientoData) {
    console.log('💳 Registrando movimiento de cuenta corriente:', movimientoData)
    
    try {
      // Insertar en tabla cuentas_corrientes
      const { data, error } = await supabase
        .from('cuentas_corrientes')
        .insert([{
          cliente_id: movimientoData.cliente_id,
          referencia_venta_id: null, // No usamos referencia a venta_items, solo el numero de transaccion
          tipo_movimiento: 'debe', // El cliente nos debe
          tipo_operacion: 'venta_fiado',
          concepto: movimientoData.concepto,
          monto: movimientoData.monto,
          fecha_operacion: new Date().toISOString().split('T')[0], // Solo fecha YYYY-MM-DD
          estado: 'pendiente',
          comprobante: movimientoData.numero_transaccion || null,
          observaciones: movimientoData.observaciones,
          created_by: 'Sistema'
        }])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error insertando en cuentas_corrientes:', error)
        throw error
      }
      
      console.log('✅ Movimiento de cuenta corriente registrado:', data)
      return data
    } catch (error) {
      console.error('❌ Error en registrarMovimientoCuentaCorriente:', error)
      throw error
    }
  },

  // Obtener estadísticas de ventas
  async getEstadisticas() {
    const { data, error } = await supabase
      .from('transacciones')
      .select('total_venta, total_costo, margen_total, fecha_venta, monto_pago_1, monto_pago_2')

    if (error) throw error

    const totalTransacciones = data.length
    const totalIngresos = data.reduce((sum, txn) => sum + (parseFloat(txn.monto_pago_1 || 0) + parseFloat(txn.monto_pago_2 || 0)), 0)
    const totalCostos = data.reduce((sum, txn) => sum + parseFloat(txn.total_costo || 0), 0)
    const totalGanancias = data.reduce((sum, txn) => sum + parseFloat(txn.margen_total || 0), 0)

    // Obtener estadísticas por tipo de producto (ahora incluye categorías específicas)
    const { data: itemsData, error: itemsError } = await supabase
      .from('venta_items')
      .select('tipo_producto, cantidad, precio_total')

    if (itemsError) throw itemsError

    const ventasComputadoras = itemsData.filter(item => item.tipo_producto === 'computadora').length
    const ventasCelulares = itemsData.filter(item => item.tipo_producto === 'celular').length

    // Para "otros", agrupar por categoría específica basándose en tipo_producto
    const ventasPorCategoria = {};
    let totalVentasOtros = 0;

    itemsData.forEach(item => {
      // Considerar como "otro" todo lo que no sea computadora o celular
      if (item.tipo_producto !== 'computadora' && item.tipo_producto !== 'celular') {
        const categoria = item.tipo_producto || 'otros_sin_categoria';
        if (!ventasPorCategoria[categoria]) {
          ventasPorCategoria[categoria] = {
            cantidad: 0,
            total: 0
          };
        }
        ventasPorCategoria[categoria].cantidad += item.cantidad;
        ventasPorCategoria[categoria].total += parseFloat(item.precio_total || 0);
        totalVentasOtros += item.cantidad;
      }
    });

    return {
      totalVentas: totalTransacciones,
      totalIngresos,
      totalCostos,
      totalGanancias,
      ventasComputadoras,
      ventasCelulares,
      ventasOtros: totalVentasOtros,
      ventasPorCategoria // Detalle de ventas por categoría específica
    }
  }
};

// 🎣 HOOK: Lógica de React para ventas
export function useVentas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchVentas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ventasService.getAll()
      setVentas(data)
    } catch (err) {
      console.error('Error en useVentas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const registrarVenta = async () => {
    try {
      setError(null)
      // Esta función está deprecada, usar procesarCarrito para nuevas ventas
      console.warn('registrarVenta está deprecado, usar procesarCarrito')
      throw new Error('Usar procesarCarrito para nuevas ventas')
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Nueva función para procesar carrito completo como transacción
  const procesarCarrito = async (carrito, datosCliente) => {
    try {
      setError(null)

      console.log('🛒 DEBUG: Carrito recibido en procesarCarrito:', carrito);
      carrito.forEach((item, index) => {
        console.log(`📦 Item ${index + 1}:`, {
          id: item.id,
          tipo: item.tipo,
          precio_unitario: item.precio_unitario,
          cantidad: item.cantidad,
          producto: item.producto?.modelo || item.producto?.nombre_producto
        });
      });

      // Crear la transacción con todos los items (ya tiene rollback interno)
      const nuevaTransaccion = await ventasService.createTransaction(datosCliente, carrito, datosCliente.fecha_venta)

      // Guardar IDs para posible rollback
      let cuentaCorrienteCreada = null;

      try {
        // ✅ PROCESAR CUENTA CORRIENTE si aplica
        let montoCuentaCorriente = 0

        // Calcular cuánto corresponde a cuenta corriente (solo el monto específico de cada método)
        if (datosCliente.metodo_pago_1 === 'cuenta_corriente') {
          montoCuentaCorriente += datosCliente.monto_pago_1 || 0
        }
        if (datosCliente.metodo_pago_2 === 'cuenta_corriente') {
          montoCuentaCorriente += datosCliente.monto_pago_2 || 0
        }

        // Registrar movimiento solo si hay monto en cuenta corriente
        if (montoCuentaCorriente > 0 && datosCliente.cliente_id) {
          cuentaCorrienteCreada = await ventasService.registrarMovimientoCuentaCorriente({
            cliente_id: datosCliente.cliente_id,
            transaccion_id: nuevaTransaccion.id,
            numero_transaccion: nuevaTransaccion.numero_transaccion,
            monto: montoCuentaCorriente,
            concepto: `Venta productos - ${nuevaTransaccion.numero_transaccion}`,
            observaciones: datosCliente.observaciones || 'Venta a cuenta corriente'
          })
          console.log(`✅ Movimiento de cuenta corriente registrado: $${montoCuentaCorriente}`)
        }

        // Actualizar inventario según el tipo de cada item
        for (const item of carrito) {
          console.log(`🔄 Eliminando ${item.tipo} del inventario:`, item.producto.id)

          if (item.tipo === 'otro') {
            // Para productos "otros", reducir cantidad en la sucursal correspondiente
            console.log(`📦 Reduciendo cantidad de producto "otro" ID ${item.producto.id} en ${item.cantidad} unidades (Sucursal: ${datosCliente.sucursal})`)
            const resultado = await otrosService.reducirCantidad(item.producto.id, item.cantidad, datosCliente.sucursal)

            // ✅ NOTIFICAR SI EL PRODUCTO FUE ELIMINADO AUTOMÁTICAMENTE
            if (resultado.eliminado) {
              console.log(`🗑️ PRODUCTO ELIMINADO AUTOMÁTICAMENTE: ${item.producto.nombre_producto || item.producto.id} - ${resultado.motivo}`)
            }
          } else {
            // Para computadoras y celulares, eliminar directamente del inventario
            console.log(`🗑️ Eliminando ${item.tipo} ID ${item.producto.id} del inventario permanentemente`)

            // Determinar la tabla correcta
            const tabla = item.tipo === 'computadora' ? 'inventario' : 'celulares'

            // Eliminar directamente del inventario
            const { error } = await supabase
              .from(tabla)
              .delete()
              .eq('id', item.producto.id)

            if (error) {
              console.error(`❌ Error eliminando ${item.tipo} del inventario:`, error)
              throw error
            }

            console.log(`✅ ${item.tipo} eliminado permanentemente de la tabla ${tabla}`)
          }
        }

        setVentas(prev => [nuevaTransaccion, ...prev])
        console.log('✅ Transacción procesada exitosamente:', nuevaTransaccion.numero_transaccion)
        return nuevaTransaccion

      } catch (inventarioError) {
        console.error('❌ Error procesando inventario o cuenta corriente:', inventarioError)

        // 🔄 ROLLBACK: Eliminar cuenta corriente si se creó
        if (cuentaCorrienteCreada?.id) {
          console.warn('⚠️ Haciendo rollback de cuenta corriente ID', cuentaCorrienteCreada.id)
          try {
            await supabase
              .from('cuentas_corrientes')
              .delete()
              .eq('id', cuentaCorrienteCreada.id)
            console.log('✅ Rollback de cuenta corriente completado')
          } catch (rollbackError) {
            console.error('❌ Error en rollback de cuenta corriente:', rollbackError)
          }
        }

        // 🔄 ROLLBACK: Eliminar venta_items y transacción
        console.warn('⚠️ Haciendo rollback completo de transacción ID', nuevaTransaccion.id)
        try {
          // Primero eliminar venta_items (por foreign key)
          await supabase
            .from('venta_items')
            .delete()
            .eq('transaccion_id', nuevaTransaccion.id)

          // Luego eliminar transacción
          await supabase
            .from('transacciones')
            .delete()
            .eq('id', nuevaTransaccion.id)

          console.log('✅ Rollback completo: transacción y venta_items eliminados')
        } catch (rollbackError) {
          console.error('❌ Error en rollback completo:', rollbackError)
        }

        throw inventarioError
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const obtenerEstadisticas = async () => {
    try {
      setError(null)
      return await ventasService.getEstadisticas()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    ventas,
    loading,
    error,
    fetchVentas,
    registrarVenta, // Mantener por compatibilidad
    procesarCarrito,
    obtenerEstadisticas
  }
}