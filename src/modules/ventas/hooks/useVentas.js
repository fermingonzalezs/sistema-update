// src/lib/ventas.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { otrosService } from '../hooks/useOtros.js';

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
          modelo_producto,
          cantidad,
          precio_unitario,
          precio_total,
          precio_costo,
          margen_item
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
  async createTransaction(datosCliente, carritoItems) {
    console.log('💾 Creando transacción con', carritoItems.length, 'items')
    
    // Generar número de transacción único
    const numeroTransaccion = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    // Calcular totales
    const totalVenta = carritoItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0)
    const totalCosto = carritoItems.reduce((sum, item) => {
      const costo = item.tipo === 'computadora' 
        ? (item.producto.precio_compra_total || item.producto.precio_compra_usd || 0)
        : (item.producto.precio_compra_usd || 0)
      return sum + (costo * item.cantidad)
    }, 0)
    const margenTotal = totalVenta - totalCosto

    try {
      // Crear la transacción principal con soporte para doble método de pago
      const transaccionData = {
        numero_transaccion: numeroTransaccion,
        cliente_id: datosCliente.cliente_id || null,
        cliente_nombre: datosCliente.cliente_nombre,
        cliente_email: datosCliente.cliente_email,
        cliente_telefono: datosCliente.cliente_telefono,
        metodo_pago: datosCliente.metodo_pago_1 || datosCliente.metodo_pago,
        monto_pago_1: datosCliente.monto_pago_1 || totalVenta,
        total_venta: totalVenta,
        total_costo: totalCosto,
        margen_total: margenTotal,
        observaciones: datosCliente.observaciones,
        vendedor: datosCliente.vendedor,
        sucursal: datosCliente.sucursal
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

      // Crear los items de la venta
      const ventaItems = carritoItems.map(item => {
        const precioCosto = item.tipo === 'computadora' 
          ? (item.producto.precio_compra_total || item.producto.precio_compra_usd || 0)
          : (item.producto.precio_compra_usd || 0)
        
        const precioTotal = item.precio_unitario * item.cantidad
        const margenItem = precioTotal - (precioCosto * item.cantidad)

        return {
          transaccion_id: transaccion.id,
          tipo_producto: item.tipo,
          producto_id: item.producto.id,
          serial_producto: item.producto.serial || `${item.tipo}-${item.producto.id}`,
          modelo_producto: item.producto.modelo || item.producto.nombre_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          precio_total: precioTotal,
          precio_costo: precioCosto,
          margen_item: margenItem
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
      throw error
    }
  },

  // Marcar producto como vendido
  async marcarProductoVendido(tipoProducto, productoId) {
    const tabla = tipoProducto === 'computadora' ? 'inventario' : 'celulares'
    
    const { error } = await supabase
      .from(tabla)
      .update({ disponible: false })
      .eq('id', productoId)
    
    if (error) {
      console.error('❌ Error marcando producto como vendido:', error)
      throw error
    }
    
    console.log(`✅ Producto marcado como vendido en ${tabla}`)
  },

  // Obtener estadísticas de ventas
  async getEstadisticas() {
    const { data, error } = await supabase
      .from('transacciones')
      .select('total_venta, total_costo, margen_total, fecha_venta')
    
    if (error) throw error
    
    const totalTransacciones = data.length
    const totalIngresos = data.reduce((sum, txn) => sum + parseFloat(txn.total_venta), 0)
    const totalCostos = data.reduce((sum, txn) => sum + parseFloat(txn.total_costo || 0), 0)
    const totalGanancias = data.reduce((sum, txn) => sum + parseFloat(txn.margen_total || 0), 0)
    
    // Obtener estadísticas por tipo de producto
    const { data: itemsData, error: itemsError } = await supabase
      .from('venta_items')
      .select('tipo_producto, cantidad')
    
    if (itemsError) throw itemsError
    
    const ventasComputadoras = itemsData.filter(item => item.tipo_producto === 'computadora').length
    const ventasCelulares = itemsData.filter(item => item.tipo_producto === 'celular').length
    const ventasOtros = itemsData.filter(item => item.tipo_producto === 'otro')
      .reduce((sum, item) => sum + item.cantidad, 0)
    
    return {
      totalVentas: totalTransacciones,
      totalIngresos,
      totalCostos,
      totalGanancias,
      ventasComputadoras,
      ventasCelulares,
      ventasOtros
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

  const registrarVenta = async (ventaData, tipoProducto, productoId) => {
    try {
      setError(null)
      // Esta función mantiene compatibilidad con ventas individuales
      // pero ahora usaremos procesarCarrito para múltiples items
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
      
      // Crear la transacción con todos los items
      const nuevaTransaccion = await ventasService.createTransaction(datosCliente, carrito)
      
      // Actualizar inventario según el tipo de cada item
      for (const item of carrito) {
        if (item.tipo === 'otro') {
          // Para productos "otros", reducir cantidad
          await otrosService.reducirCantidad(item.producto.id, item.cantidad)
        } else {
          // Para computadoras y celulares, marcar como no disponible
          await ventasService.marcarProductoVendido(item.tipo, item.producto.id)
        }
      }
      
      setVentas(prev => [nuevaTransaccion, ...prev])
      console.log('✅ Transacción procesada exitosamente:', nuevaTransaccion.numero_transaccion)
      return nuevaTransaccion
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