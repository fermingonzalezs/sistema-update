// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

// 🔑 Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Faltan variables de entorno de Supabase. Verifica tu archivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 📊 Servicios para manejar el inventario de computadoras
export const inventarioService = {
  // Obtener todas las computadoras disponibles
  async getAll() {
    console.log('📡 Obteniendo todas las computadoras...')
    
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error obteniendo datos:', error)
      throw error
    }
    
    console.log(`✅ ${data.length} computadoras obtenidas`)
    return data
  },

  // Crear nueva computadora
  async create(computadora) {
    console.log('💾 Creando computadora:', computadora.serial)
    
    // Validar que no exista el serial
    const existing = await this.findBySerial(computadora.serial)
    if (existing) {
      throw new Error(`Ya existe una computadora con serial: ${computadora.serial}`)
    }
    
    const { data, error } = await supabase
      .from('inventario')
      .insert([{
        ...computadora,
        // Asegurar tipos correctos
        precio_compra_usd: parseFloat(computadora.precio_compra_usd) || 0,
        precio_repuestos_usd: parseFloat(computadora.precio_repuestos_usd) || 0,
        precio_compra_total: parseFloat(computadora.precio_compra_total) || 0,
        precio_venta_usd: parseFloat(computadora.precio_venta_usd) || 0,
        porcentaje_de_bateria: parseInt(computadora.porcentaje_de_bateria) || 0,
        disponible: computadora.disponible !== false
      }])
      .select()
    
    if (error) {
      console.error('❌ Error creando:', error)
      throw error
    }
    
    console.log('✅ Computadora creada exitosamente')
    return data[0]
  },

  // Actualizar computadora
  async update(id, updates) {
    console.log(`🔄 Actualizando computadora ID: ${id}`)
    
    const { data, error } = await supabase
      .from('inventario')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('❌ Error actualizando:', error)
      throw error
    }
    
    console.log('✅ Computadora actualizada')
    return data[0]
  },

  // Eliminar computadora
  async delete(id) {
    console.log(`🗑️ Eliminando computadora ID: ${id}`)
    
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error eliminando:', error)
      throw error
    }
    
    console.log('✅ Computadora eliminada')
    return true
  },

  // Buscar por serial
  async findBySerial(serial) {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('serial', serial)
      .maybeSingle()
    
    if (error) {
      console.error('❌ Error buscando por serial:', error)
      throw error
    }
    
    return data
  }
}

// 📱 Servicios para manejar el inventario de celulares
export const celularesService = {
  // Obtener todos los celulares disponibles
  async getAll() {
    console.log('📡 Obteniendo todos los celulares...')
    
    const { data, error } = await supabase
      .from('celulares')
      .select('*')
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error obteniendo celulares:', error)
      throw error
    }
    
    console.log(`✅ ${data.length} celulares obtenidos`)
    return data
  },

  // Crear nuevo celular
  async create(celular) {
    console.log('💾 Creando celular:', celular.serial)
    
    // Validar que no exista el serial
    const existing = await this.findBySerial(celular.serial)
    if (existing) {
      throw new Error(`Ya existe un celular con serial: ${celular.serial}`)
    }
    
    const { data, error } = await supabase
      .from('celulares')
      .insert([{
        ...celular,
        // Asegurar tipos correctos
        precio_compra_usd: parseFloat(celular.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(celular.precio_venta_usd) || 0,
        ciclos: parseInt(celular.ciclos) || 0,
        disponible: celular.disponible !== false
      }])
      .select()
    
    if (error) {
      console.error('❌ Error creando celular:', error)
      throw error
    }
    
    console.log('✅ Celular creado exitosamente')
    return data[0]
  },

  // Actualizar celular
  async update(id, updates) {
    console.log(`🔄 Actualizando celular ID: ${id}`)
    
    const { data, error } = await supabase
      .from('celulares')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('❌ Error actualizando celular:', error)
      throw error
    }
    
    console.log('✅ Celular actualizado')
    return data[0]
  },

  // Eliminar celular
  async delete(id) {
    console.log(`🗑️ Eliminando celular ID: ${id}`)
    
    const { error } = await supabase
      .from('celulares')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error eliminando celular:', error)
      throw error
    }
    
    console.log('✅ Celular eliminado')
    return true
  },

  // Buscar por serial
  async findBySerial(serial) {
    const { data, error } = await supabase
      .from('celulares')
      .select('*')
      .eq('serial', serial)
      .maybeSingle()
    
    if (error) {
      console.error('❌ Error buscando celular por serial:', error)
      throw error
    }
    
    return data
  }
}

// 🔧 Servicios para manejar OTROS productos
export const otrosService = {
  // Obtener todos los productos otros disponibles
  async getAll() {
    console.log('📡 Obteniendo todos los productos otros...')
    
    const { data, error } = await supabase
      .from('otros')
      .select('*')
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error obteniendo otros:', error)
      throw error
    }
    
    console.log(`✅ ${data.length} productos otros obtenidos`)
    return data
  },

  // Crear nuevo producto otro
  async create(producto) {
    console.log('💾 Creando producto otro:', producto.descripcion_producto)
    
    const { data, error } = await supabase
      .from('otros')
      .insert([{
        ...producto,
        precio_compra_usd: parseFloat(producto.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(producto.precio_venta_usd) || 0,
        cantidad: parseInt(producto.cantidad) || 1,
        disponible: producto.disponible !== false
      }])
      .select()
    
    if (error) {
      console.error('❌ Error creando producto otro:', error)
      throw error
    }
    
    console.log('✅ Producto otro creado exitosamente')
    return data[0]
  },

  // Actualizar producto otro
  async update(id, updates) {
    console.log(`🔄 Actualizando producto otro ID: ${id}`)
    
    const { data, error } = await supabase
      .from('otros')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('❌ Error actualizando producto otro:', error)
      throw error
    }
    
    console.log('✅ Producto otro actualizado')
    return data[0]
  },

  // Eliminar producto otro
  async delete(id) {
    console.log(`🗑️ Eliminando producto otro ID: ${id}`)
    
    const { error } = await supabase
      .from('otros')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error eliminando producto otro:', error)
      throw error
    }
    
    console.log('✅ Producto otro eliminado')
    return true
  },

  // Reducir cantidad cuando se vende
  async reducirCantidad(id, cantidadVendida) {
    const producto = await this.getById(id)
    if (!producto) throw new Error('Producto no encontrado')
    
    const nuevaCantidad = producto.cantidad - cantidadVendida
    
    if (nuevaCantidad <= 0) {
      // Si no queda stock, marcar como no disponible
      return await this.update(id, { cantidad: 0, disponible: false })
    } else {
      // Solo reducir la cantidad
      return await this.update(id, { cantidad: nuevaCantidad })
    }
  },

  // Obtener por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('otros')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
}

// 🔧 Servicios para manejar las REPARACIONES
export const reparacionesService = {
  // 📋 Obtener todas las reparaciones
  async getAll() {
    console.log('📡 Obteniendo todas las reparaciones...')
    
    const { data, error } = await supabase
      .from('reparaciones')
      .select('*')
      .order('fecha_ingreso', { ascending: false }) // Las más recientes primero
    
    if (error) {
      console.error('❌ Error obteniendo reparaciones:', error)
      throw error
    }
    
    console.log(`✅ ${data.length} reparaciones obtenidas`)
    return data
  },

  // 🆕 Crear nueva reparación
  async create(reparacionData) {
    console.log('💾 Creando nueva reparación para:', reparacionData.cliente_nombre)
    
    // Generar número único de reparación
    const numeroReparacion = await this.generarNumeroReparacion()
    
    const { data, error } = await supabase
      .from('reparaciones')
      .insert([{
        ...reparacionData,
        numero: numeroReparacion,
        fecha_ingreso: new Date().toISOString().split('T')[0], // Solo la fecha, sin hora
        estado: 'ingresado', // Estado inicial siempre es "ingresado"
        // Asegurar tipos correctos para números
        presupuesto: parseFloat(reparacionData.presupuesto) || null,
        costo_repuestos: parseFloat(reparacionData.costo_repuestos) || null
      }])
      .select() // Importante: esto devuelve los datos insertados
    
    if (error) {
      console.error('❌ Error creando reparación:', error)
      throw error
    }
    
    console.log('✅ Reparación creada exitosamente:', numeroReparacion)
    return data[0] // Devolver la primera (y única) reparación creada
  },

  // 🔄 Actualizar una reparación existente
  async update(id, updates) {
    console.log(`🔄 Actualizando reparación ID: ${id}`)
    
    const { data, error } = await supabase
      .from('reparaciones')
      .update({
        ...updates,
        updated_at: new Date().toISOString() // Actualizar timestamp
      })
      .eq('id', id) // Donde el ID sea igual al que pasamos
      .select() // Devolver los datos actualizados
    
    if (error) {
      console.error('❌ Error actualizando reparación:', error)
      throw error
    }
    
    console.log('✅ Reparación actualizada exitosamente')
    return data[0]
  },

  // 🗑️ Eliminar una reparación
  async delete(id) {
    console.log(`🗑️ Eliminando reparación ID: ${id}`)
    
    const { error } = await supabase
      .from('reparaciones')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error eliminando reparación:', error)
      throw error
    }
    
    console.log('✅ Reparación eliminada exitosamente')
    return true
  },

  // 🔍 Buscar reparaciones por cliente
  async buscarPorCliente(nombreCliente) {
    console.log('🔍 Buscando reparaciones del cliente:', nombreCliente)
    
    const { data, error } = await supabase
      .from('reparaciones')
      .select('*')
      .ilike('cliente_nombre', `%${nombreCliente}%`) // Búsqueda que no distingue mayúsculas
      .order('fecha_ingreso', { ascending: false })
    
    if (error) {
      console.error('❌ Error buscando por cliente:', error)
      throw error
    }
    
    return data
  },

  // 🔍 Buscar por número de reparación
  async buscarPorNumero(numero) {
    console.log('🔍 Buscando reparación número:', numero)
    
    const { data, error } = await supabase
      .from('reparaciones')
      .select('*')
      .eq('numero', numero)
      .maybeSingle() // Devuelve null si no encuentra nada, en lugar de array vacío
    
    if (error) {
      console.error('❌ Error buscando por número:', error)
      throw error
    }
    
    return data
  },

  // 📊 Cambiar estado de una reparación
  async cambiarEstado(id, nuevoEstado) {
    console.log(`📊 Cambiando estado de reparación ${id} a: ${nuevoEstado}`)
    
    // Lista de estados válidos
    const estadosValidos = [
      'ingresado', 'diagnosticando', 'presupuestado', 
      'aprobado', 'reparando', 'terminado', 'entregado', 'cancelado'
    ]
    
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}`)
    }
    
    return await this.update(id, { estado: nuevoEstado })
  },

  // 📈 Obtener estadísticas de reparaciones
  async getEstadisticas() {
    console.log('📈 Calculando estadísticas de reparaciones...')
    
    const { data, error } = await supabase
      .from('reparaciones')
      .select('estado, presupuesto, fecha_ingreso')
    
    if (error) throw error
    
    // Contar por estado
    const estadisticas = {
      total: data.length,
      ingresadas: data.filter(r => r.estado === 'ingresado').length,
      enProceso: data.filter(r => ['diagnosticando', 'presupuestado', 'aprobado', 'reparando'].includes(r.estado)).length,
      terminadas: data.filter(r => r.estado === 'terminado').length,
      entregadas: data.filter(r => r.estado === 'entregado').length,
      canceladas: data.filter(r => r.estado === 'cancelado').length,
      // Calcular ingresos totales (solo reparaciones con presupuesto)
      ingresosEstimados: data
        .filter(r => r.presupuesto && ['terminado', 'entregado'].includes(r.estado))
        .reduce((sum, r) => sum + parseFloat(r.presupuesto), 0),
      // Reparaciones de este mes
      esteMes: data.filter(r => {
        const fechaReparacion = new Date(r.fecha_ingreso)
        const ahora = new Date()
        return fechaReparacion.getMonth() === ahora.getMonth() && 
               fechaReparacion.getFullYear() === ahora.getFullYear()
      }).length
    }
    
    console.log('✅ Estadísticas calculadas:', estadisticas)
    return estadisticas
  },

  // 🔢 Generar número único de reparación
  async generarNumeroReparacion() {
    const año = new Date().getFullYear()
    
    // Contar cuántas reparaciones hay este año
    const { data, error } = await supabase
      .from('reparaciones')
      .select('numero')
      .ilike('numero', `REP-${año}-%`) // Buscar todas las que empiecen con REP-2025-
    
    if (error) {
      console.error('Error contando reparaciones del año:', error)
      // Si hay error, usar timestamp como fallback
      return `REP-${año}-${Date.now()}`
    }
    
    const siguienteNumero = (data?.length || 0) + 1
    const numeroFormateado = String(siguienteNumero).padStart(3, '0') // 001, 002, etc.
    
    return `REP-${año}-${numeroFormateado}`
  },

  // 📱 Obtener reparaciones por técnico
  async getPorTecnico(nombreTecnico) {
    console.log('🔍 Buscando reparaciones del técnico:', nombreTecnico)
    
    const { data, error } = await supabase
      .from('reparaciones')
      .select('*')
      .eq('tecnico_asignado', nombreTecnico)
      .order('fecha_ingreso', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 🚨 Obtener reparaciones por prioridad
  async getPorPrioridad(prioridad) {
    console.log('🚨 Buscando reparaciones con prioridad:', prioridad)
    
    const { data, error } = await supabase
      .from('reparaciones')
      .select('*')
      .eq('prioridad', prioridad)
      .order('fecha_ingreso', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// 💰 Servicios para manejar las ventas (actualizado para transacciones)
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
      // Crear la transacción principal
      const { data: transaccion, error: errorTransaccion } = await supabase
        .from('transacciones')
        .insert([{
          numero_transaccion: numeroTransaccion,
          cliente_nombre: datosCliente.cliente_nombre,
          cliente_email: datosCliente.cliente_email,
          cliente_telefono: datosCliente.cliente_telefono,
          metodo_pago: datosCliente.metodo_pago,
          total_venta: totalVenta,
          total_costo: totalCosto,
          margen_total: margenTotal,
          observaciones: datosCliente.observaciones,
          vendedor: datosCliente.vendedor,
          sucursal: datosCliente.sucursal
        }])
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
          modelo_producto: item.producto.modelo || item.producto.descripcion_producto,
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
}

// 🎣 Hook personalizado para React - Computadoras
export function useInventario() {
  const [computers, setComputers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchComputers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await inventarioService.getAll()
      setComputers(data)
    } catch (err) {
      console.error('Error en useInventario:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addComputer = async (computer) => {
    try {
      setError(null)
      const newComputer = await inventarioService.create(computer)
      setComputers(prev => [newComputer, ...prev])
      return newComputer
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateComputer = async (id, updates) => {
    try {
      setError(null)
      const updated = await inventarioService.update(id, updates)
      setComputers(prev => prev.map(comp => 
        comp.id === id ? updated : comp
      ))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteComputer = async (id) => {
    try {
      setError(null)
      await inventarioService.delete(id)
      setComputers(prev => prev.filter(comp => comp.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    computers,
    loading,
    error,
    fetchComputers,
    addComputer,
    updateComputer,
    deleteComputer
  }
}

// 🎣 Hook personalizado para React - Celulares
export function useCelulares() {
  const [celulares, setCelulares] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCelulares = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await celularesService.getAll()
      setCelulares(data)
    } catch (err) {
      console.error('Error en useCelulares:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addCelular = async (celular) => {
    try {
      setError(null)
      const newCelular = await celularesService.create(celular)
      setCelulares(prev => [newCelular, ...prev])
      return newCelular
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateCelular = async (id, updates) => {
    try {
      setError(null)
      const updated = await celularesService.update(id, updates)
      setCelulares(prev => prev.map(cel => 
        cel.id === id ? updated : cel
      ))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteCelular = async (id) => {
    try {
      setError(null)
      await celularesService.delete(id)
      setCelulares(prev => prev.filter(cel => cel.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    celulares,
    loading,
    error,
    fetchCelulares,
    addCelular,
    updateCelular,
    deleteCelular
  }
}

// 🎣 Hook personalizado para React - Otros
export function useOtros() {
  const [otros, setOtros] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOtros = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await otrosService.getAll()
      setOtros(data)
    } catch (err) {
      console.error('Error en useOtros:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addOtro = async (producto) => {
    try {
      setError(null)
      const newOtro = await otrosService.create(producto)
      setOtros(prev => [newOtro, ...prev])
      return newOtro
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateOtro = async (id, updates) => {
    try {
      setError(null)
      const updated = await otrosService.update(id, updates)
      setOtros(prev => prev.map(item => 
        item.id === id ? updated : item
      ))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteOtro = async (id) => {
    try {
      setError(null)
      await otrosService.delete(id)
      setOtros(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    otros,
    loading,
    error,
    fetchOtros,
    addOtro,
    updateOtro,
    deleteOtro
  }
}

// 🎣 Hook personalizado para React - Reparaciones
export function useReparaciones() {
  const [reparaciones, setReparaciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar todas las reparaciones
  const fetchReparaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reparacionesService.getAll()
      setReparaciones(data)
    } catch (err) {
      console.error('Error en useReparaciones:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva reparación
  const crearReparacion = async (reparacionData) => {
    try {
      setError(null)
      const nuevaReparacion = await reparacionesService.create(reparacionData)
      setReparaciones(prev => [nuevaReparacion, ...prev]) // Agregar al inicio
      return nuevaReparacion
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Actualizar reparación existente
  const actualizarReparacion = async (id, updates) => {
    try {
      setError(null)
      const reparacionActualizada = await reparacionesService.update(id, updates)
      setReparaciones(prev => prev.map(rep => 
        rep.id === id ? reparacionActualizada : rep
      ))
      return reparacionActualizada
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Eliminar reparación  
  const eliminarReparacion = async (id) => {
    try {
      setError(null)
      await reparacionesService.delete(id)
      setReparaciones(prev => prev.filter(rep => rep.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Cambiar estado de reparación
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      setError(null)
      const reparacionActualizada = await reparacionesService.cambiarEstado(id, nuevoEstado)
      setReparaciones(prev => prev.map(rep => 
        rep.id === id ? reparacionActualizada : rep
      ))
      return reparacionActualizada
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    reparaciones,
    loading,
    error,
    fetchReparaciones,
    crearReparacion,
    actualizarReparacion,
    eliminarReparacion,
    cambiarEstado
  }
}

// 🎣 Hook personalizado para React - Ventas (actualizado para transacciones)
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

// 🛒 Hook para el carrito de compras
export function useCarrito() {
  const [carrito, setCarrito] = useState([])

  const agregarAlCarrito = (producto, tipo, cantidad = 1) => {
    const itemExistente = carrito.find(
      item => item.producto.id === producto.id && item.tipo === tipo
    )

    if (itemExistente) {
      // Si ya existe, aumentar cantidad
      setCarrito(prev => prev.map(item =>
        item.producto.id === producto.id && item.tipo === tipo
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ))
    } else {
      // Agregar nuevo item
      const nuevoItem = {
        id: `${tipo}-${producto.id}`,
        producto,
        tipo, // 'computadora', 'celular', 'otro'
        cantidad,
        precio_unitario: producto.precio_venta_usd || producto.precio_venta || 0
      }
      setCarrito(prev => [...prev, nuevoItem])
    }
  }

  const removerDelCarrito = (itemId) => {
    setCarrito(prev => prev.filter(item => item.id !== itemId))
  }

  const actualizarCantidad = (itemId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      removerDelCarrito(itemId)
    } else {
      setCarrito(prev => prev.map(item =>
        item.id === itemId ? { ...item, cantidad: nuevaCantidad } : item
      ))
    }
  }

  const limpiarCarrito = () => {
    setCarrito([])
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => 
      total + (item.precio_unitario * item.cantidad), 0
    )
  }

  const calcularCantidadTotal = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0)
  }

  return {
    carrito,
    agregarAlCarrito,
    removerDelCarrito,
    actualizarCantidad,
    limpiarCarrito,
    calcularTotal,
    calcularCantidadTotal
  }
}

// 📊 Servicios para Plan de Cuentas
export const planCuentasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
      .eq('activa', true)
      .order('codigo');
    if (error) throw error;
    return data;
  },

  async create(cuenta) {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .insert([cuenta])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from('plan_cuentas')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// 📚 Servicios para Asientos Contables
export const asientosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('asientos_contables')
      .select(`
        *,
        movimientos_contables (
          *,
          plan_cuentas (codigo, nombre)
        )
      `)
      .order('numero', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(asientoData) {
    // Crear asiento y movimientos en transacción
    const { data: asiento, error: errorAsiento } = await supabase
      .from('asientos_contables')
      .insert([{
        numero: await this.getNextNumero(),
        fecha: asientoData.fecha,
        descripcion: asientoData.descripcion,
        total_debe: asientoData.movimientos.reduce((sum, mov) => sum + parseFloat(mov.debe || 0), 0),
        total_haber: asientoData.movimientos.reduce((sum, mov) => sum + parseFloat(mov.haber || 0), 0),
        estado: 'registrado'
      }])
      .select()
      .single();
    
    if (errorAsiento) throw errorAsiento;
    
    const movimientos = asientoData.movimientos.map(mov => ({
      asiento_id: asiento.id,
      cuenta_id: mov.cuenta_id,
      debe: parseFloat(mov.debe || 0),
      haber: parseFloat(mov.haber || 0)
    }));
    
    const { error: errorMovimientos } = await supabase
      .from('movimientos_contables')
      .insert(movimientos);
    
    if (errorMovimientos) throw errorMovimientos;
    return asiento;
  },

  async getNextNumero() {
    const { data } = await supabase
      .from('asientos_contables')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1);
    return (data?.[0]?.numero || 0) + 1;
  }
};