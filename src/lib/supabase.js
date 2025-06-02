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



// Agregar al final de supabase.js, antes de las exportaciones finales:

// 💰 Servicios para Conciliación de Caja
// En supabase.js, actualizar el servicio conciliacionCajaService:

export const conciliacionCajaService = {
  // ... mantener métodos existentes ...

  async crearAsientoAjuste(cuentaId, diferencia, descripcion) {
    console.log('📝 Creando asiento de ajuste de caja...');

    if (diferencia === 0) return null;

    // Obtener siguiente número de asiento
    const { data: ultimoAsiento } = await supabase
      .from('asientos_contables')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1);

    const numeroAsiento = (ultimoAsiento?.[0]?.numero || 0) + 1;

    // Crear el asiento principal
    const { data: asiento, error: errorAsiento } = await supabase
      .from('asientos_contables')
      .insert([{
        numero: numeroAsiento,
        fecha: new Date().toISOString().split('T')[0],
        descripcion: descripcion,
        total_debe: Math.abs(diferencia),
        total_haber: Math.abs(diferencia),
        estado: 'registrado',
        usuario: 'admin'
      }])
      .select()
      .single();

    if (errorAsiento) throw errorAsiento;

    // Para crear los movimientos necesitas cuentas específicas
    // Por ahora, vamos a crear un movimiento simple en la cuenta de caja
    const movimiento = {
      asiento_id: asiento.id,
      cuenta_id: cuentaId,
      debe: diferencia > 0 ? diferencia : 0,
      haber: diferencia < 0 ? Math.abs(diferencia) : 0
    };

    const { error: errorMovimiento } = await supabase
      .from('movimientos_contables')
      .insert([movimiento]);

    if (errorMovimiento) throw errorMovimiento;

    console.log('✅ Asiento de ajuste creado:', numeroAsiento);
    return asiento;
  },

  async guardarConciliacion(conciliacionData) {
    console.log('💾 Guardando conciliación de caja...');

    // Guardar la conciliación
    const { data, error } = await supabase
      .from('conciliaciones_caja')
      .insert([{
        cuenta_caja_id: conciliacionData.cuentaId,
        fecha_conciliacion: conciliacionData.fecha,
        saldo_contable: conciliacionData.saldoContable,
        saldo_fisico: conciliacionData.saldoFisico,
        diferencia: conciliacionData.diferencia,
        observaciones: conciliacionData.observaciones,
        usuario_concilio: conciliacionData.usuario || 'admin',
        estado: conciliacionData.diferencia === 0 ? 'conciliado' : 'con_diferencia'
      }])
      .select();

    if (error) throw error;

    // Si hay diferencia, crear asiento de ajuste
    if (conciliacionData.diferencia !== 0) {
      const descripcionAjuste = conciliacionData.diferencia > 0 
        ? `Sobrante de caja - Conciliación ${conciliacionData.fecha}`
        : `Faltante de caja - Conciliación ${conciliacionData.fecha}`;
      
      await this.crearAsientoAjuste(
        conciliacionData.cuentaId, 
        conciliacionData.diferencia, 
        descripcionAjuste
      );
    }

    return data[0];
  }
};

// 📦 Servicios para Recuento de Stock
export const recuentoStockService = {
  async getInventarioCompleto() {
    const [computadoras, celulares, otros] = await Promise.all([
      supabase.from('inventario').select('*').eq('disponible', true),
      supabase.from('celulares').select('*').eq('disponible', true),
      supabase.from('otros').select('*').eq('disponible', true)
    ]);

    if (computadoras.error) throw computadoras.error;
    if (celulares.error) throw celulares.error;
    if (otros.error) throw otros.error;

    const inventario = [
      ...computadoras.data.map(item => ({ ...item, tipo: 'computadora' })),
      ...celulares.data.map(item => ({ ...item, tipo: 'celular' })),
      ...otros.data.map(item => ({ ...item, tipo: 'otro' }))
    ];

    return inventario;
  },

  async guardarRecuento(recuentoData) {
    const { data, error } = await supabase
      .from('recuentos_stock')
      .insert([{
        fecha_recuento: recuentoData.fecha,
        tipo_recuento: recuentoData.tipo,
        productos_contados: recuentoData.productosContados,
        diferencias_encontradas: recuentoData.diferencias,
        observaciones: recuentoData.observaciones,
        usuario_recuento: recuentoData.usuario || 'admin',
        estado: recuentoData.diferencias.length > 0 ? 'con_diferencias' : 'sin_diferencias'
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getRecuentosAnteriores(limite = 10) {
    const { data, error } = await supabase
      .from('recuentos_stock')
      .select('*')
      .order('fecha_recuento', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data;
  },

  async actualizarStockSistema(ajustes) {
    for (const ajuste of ajustes) {
      const tabla = ajuste.tipo === 'computadora' ? 'inventario' : 
                   ajuste.tipo === 'celular' ? 'celulares' : 'otros';

      if (ajuste.tipo === 'otro') {
        // Para productos "otros", actualizar cantidad
        const { error } = await supabase
          .from(tabla)
          .update({ cantidad: ajuste.stockReal })
          .eq('id', ajuste.id);
        
        if (error) throw error;
      } else {
        // Para computadoras y celulares, cambiar disponibilidad
        const { error } = await supabase
          .from(tabla)
          .update({ disponible: ajuste.stockReal > 0 })
          .eq('id', ajuste.id);
        
        if (error) throw error;
      }
    }
    return true;
  }
};

// 🎣 Hook para Conciliación de Caja
export function useConciliacionCaja() {
  const [cuentasCaja, setCuentasCaja] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCuentasCaja = async () => {
    try {
      setError(null);
      const data = await conciliacionCajaService.getCuentasCaja();
      setCuentasCaja(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const guardarConciliacion = async (conciliacionData) => {
    try {
      setError(null);
      return await conciliacionCajaService.guardarConciliacion(conciliacionData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    cuentasCaja,
    loading,
    error,
    fetchCuentasCaja,
    guardarConciliacion
  };
}

// 🎣 Hook para Recuento de Stock
export function useRecuentoStock() {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recuentoStockService.getInventarioCompleto();
      setInventario(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarRecuento = async (recuentoData) => {
    try {
      setError(null);
      return await recuentoStockService.guardarRecuento(recuentoData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const aplicarAjustes = async (ajustes) => {
    try {
      setError(null);
      await recuentoStockService.actualizarStockSistema(ajustes);
      fetchInventario(); // Refrescar inventario
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    inventario,
    loading,
    error,
    fetchInventario,
    guardarRecuento,
    aplicarAjustes
  };
}


// 📋 Servicios para Listas de Precios
export const listasPreciosService = {
  async getListas() {
    const { data, error } = await supabase
      .from('listas_precios')
      .select(`
        *,
        lista_productos (
          id,
          producto_id,
          tipo_producto,
          precio_personalizado,
          orden,
          inventario (id, modelo, precio_venta_usd, disponible),
          celulares (id, modelo, precio_venta_usd, disponible),
          otros (id, descripcion_producto, precio_venta_usd, disponible)
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async crearLista(listaData) {
    const { data, error } = await supabase
      .from('listas_precios')
      .insert([{
        nombre: listaData.nombre,
        descripcion: listaData.descripcion,
        mensaje_inicial: listaData.mensajeInicial,
        mensaje_final: listaData.mensajeFinal,
        activa: true
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async eliminarLista(id) {
    const { error } = await supabase
      .from('listas_precios')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async agregarProductoALista(listaId, productoData) {
    const { data, error } = await supabase
      .from('lista_productos')
      .insert([{
        lista_id: listaId,
        producto_id: productoData.productoId,
        tipo_producto: productoData.tipo,
        precio_personalizado: productoData.precioPersonalizado,
        orden: productoData.orden || 0
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async eliminarProductoDeLista(listaProductoId) {
    const { error } = await supabase
      .from('lista_productos')
      .delete()
      .eq('id', listaProductoId);
    if (error) throw error;
    return true;
  }
};


// Agregar al final de supabase.js, antes de las exportaciones finales:

// 📄 Servicios para Presupuestos de Reparación
export const presupuestosReparacionService = {
  async getServicios() {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .select('*')
      .eq('activo', true)
      .order('categoria', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getRepuestos() {
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('disponible', true)
      .gt('cantidad', 0)
      .order('categoria', { ascending: true });
    if (error) throw error;
    return data;
  },

  async crearServicio(servicio) {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .insert([{
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        categoria: servicio.categoria,
        precio: parseFloat(servicio.precio),
        activo: true
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async guardarPresupuesto(presupuestoData) {
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .insert([{
        numero_presupuesto: presupuestoData.numero,
        cliente_nombre: presupuestoData.cliente.nombre,
        cliente_telefono: presupuestoData.cliente.telefono,
        cliente_dni: presupuestoData.cliente.dni,
        cliente_direccion: presupuestoData.cliente.direccion,
        equipo_tipo: presupuestoData.equipo.tipo,
        equipo_serial: presupuestoData.equipo.serial,
        equipo_backup: presupuestoData.equipo.backup,
        equipo_accesorios: presupuestoData.equipo.accesorios,
        falla_reportada: presupuestoData.falla,
        diagnostico: presupuestoData.diagnostico,
        accion_requerida: presupuestoData.accion,
        items_presupuesto: JSON.stringify(presupuestoData.items),
        subtotal: presupuestoData.subtotal,
        descuentos: presupuestoData.descuentos,
        total: presupuestoData.total,
        garantia_dias: presupuestoData.garantia || 30,
        observaciones: presupuestoData.observaciones,
        estado: 'pendiente'
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getPresupuestos() {
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getNextNumeroPresupuesto() {
    const año = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .select('numero_presupuesto')
      .ilike('numero_presupuesto', `PRES-${año}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error obteniendo número:', error);
      return `PRES-${año}-001`;
    }

    const siguienteNumero = (data?.length || 0) + 1;
    const numeroFormateado = String(siguienteNumero).padStart(3, '0');
    
    return `PRES-${año}-${numeroFormateado}`;
  }
};

// 🎣 Hook para Presupuestos de Reparación
export function usePresupuestosReparacion() {
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [serviciosData, repuestosData, presupuestosData] = await Promise.all([
        presupuestosReparacionService.getServicios(),
        presupuestosReparacionService.getRepuestos(),
        presupuestosReparacionService.getPresupuestos()
      ]);

      setServicios(serviciosData);
      setRepuestos(repuestosData);
      setPresupuestos(presupuestosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearServicio = async (servicio) => {
    try {
      setError(null);
      const nuevo = await presupuestosReparacionService.crearServicio(servicio);
      setServicios(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const guardarPresupuesto = async (presupuestoData) => {
    try {
      setError(null);
      const numero = await presupuestosReparacionService.getNextNumeroPresupuesto();
      const nuevo = await presupuestosReparacionService.guardarPresupuesto({
        ...presupuestoData,
        numero
      });
      setPresupuestos(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    servicios,
    repuestos,
    presupuestos,
    loading,
    error,
    fetchDatos,
    crearServicio,
    guardarPresupuesto
  };
}


// 📷 Servicios para manejar las FOTOS de productos
// Agregar al final de tu supabase.js

export const fotosService = {
  // 📋 Obtener fotos de un producto
  async getFotosByProducto(productoId, tipoProducto) {
    console.log('📋 Obteniendo fotos de:', tipoProducto, productoId);
    
    const { data, error } = await supabase
      .from('fotos_productos')
      .select('*')
      .eq('producto_id', productoId)
      .eq('tipo_producto', tipoProducto)
      .order('orden', { ascending: true });
    
    if (error) {
      console.error('❌ Error obteniendo fotos:', error);
      throw error;
    }
    
    return data || [];
  },

  // 📷 Subir una foto
  async subirFoto(archivo, productoId, tipoProducto, descripcion = '', esPrincipal = false) {
    console.log('📷 Subiendo foto para:', tipoProducto, productoId);
    
    try {
      // Validaciones básicas
      if (!archivo || !archivo.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }
      
      if (archivo.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar 5MB');
      }
      
      // Verificar límite de fotos
      const fotosExistentes = await this.getFotosByProducto(productoId, tipoProducto);
      if (fotosExistentes.length >= 5) {
        throw new Error('No se pueden subir más de 5 fotos por producto');
      }
      
      // Generar nombre único
      const timestamp = Date.now();
      const extension = archivo.name.split('.').pop();
      const nombreArchivo = `${tipoProducto}_${productoId}_${timestamp}.${extension}`;
      const rutaCompleta = `productos/${tipoProducto}s/${nombreArchivo}`;
      
      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-productos')
        .upload(rutaCompleta, archivo, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        throw uploadError;
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('fotos-productos')
        .getPublicUrl(rutaCompleta);
      
      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública');
      }
      
      // Si es la primera foto o se marca como principal, desmarcar otras
      if (esPrincipal || fotosExistentes.length === 0) {
        await this.desmarcarFotoPrincipal(productoId, tipoProducto);
        esPrincipal = true;
      }
      
      // Calcular siguiente orden
      const siguienteOrden = Math.max(0, ...fotosExistentes.map(f => f.orden || 0)) + 1;
      
      // Guardar en base de datos
      const { data: fotoData, error: dbError } = await supabase
        .from('fotos_productos')
        .insert([{
          producto_id: productoId,
          tipo_producto: tipoProducto,
          url_foto: urlData.publicUrl,
          nombre_archivo: nombreArchivo,
          tamaño_archivo: archivo.size,
          orden: siguienteOrden,
          es_principal: esPrincipal,
          descripcion: descripcion
        }])
        .select()
        .single();
      
      if (dbError) {
        // Si falla la BD, eliminar archivo
        await supabase.storage
          .from('fotos-productos')
          .remove([rutaCompleta]);
        throw dbError;
      }
      
      console.log('✅ Foto subida exitosamente:', nombreArchivo);
      return fotoData;
      
    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      throw error;
    }
  },
  
  // 🗑️ Eliminar una foto
  async eliminarFoto(fotoId) {
    console.log('🗑️ Eliminando foto ID:', fotoId);
    
    try {
      // Obtener datos de la foto
      const { data: foto, error: fotoError } = await supabase
        .from('fotos_productos')
        .select('*')
        .eq('id', fotoId)
        .single();
      
      if (fotoError || !foto) {
        throw new Error('Foto no encontrada');
      }
      
      // Eliminar archivo del storage
      const rutaArchivo = `productos/${foto.tipo_producto}s/${foto.nombre_archivo}`;
      const { error: storageError } = await supabase.storage
        .from('fotos-productos')
        .remove([rutaArchivo]);
      
      if (storageError) {
        console.warn('⚠️ Error eliminando archivo:', storageError);
      }
      
      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('fotos_productos')
        .delete()
        .eq('id', fotoId);
      
      if (dbError) {
        throw dbError;
      }
      
      // Si era principal, marcar otra como principal
      if (foto.es_principal) {
        await this.marcarPrimeraComoPrincipal(foto.producto_id, foto.tipo_producto);
      }
      
      console.log('✅ Foto eliminada exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando foto:', error);
      throw error;
    }
  },
  
  // ⭐ Marcar foto como principal
  async marcarComoPrincipal(fotoId) {
    console.log('⭐ Marcando foto como principal:', fotoId);
    
    try {
      // Obtener datos de la foto
      const { data: foto, error: fotoError } = await supabase
        .from('fotos_productos')
        .select('*')
        .eq('id', fotoId)
        .single();
      
      if (fotoError || !foto) {
        throw new Error('Foto no encontrada');
      }
      
      // Desmarcar otras fotos principales
      await this.desmarcarFotoPrincipal(foto.producto_id, foto.tipo_producto);
      
      // Marcar esta como principal
      const { error: updateError } = await supabase
        .from('fotos_productos')
        .update({ es_principal: true })
        .eq('id', fotoId);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('✅ Foto marcada como principal');
      return true;
      
    } catch (error) {
      console.error('❌ Error marcando foto como principal:', error);
      throw error;
    }
  },
  
  // 📝 Actualizar descripción
  async actualizarDescripcion(fotoId, nuevaDescripcion) {
    console.log('📝 Actualizando descripción de foto:', fotoId);
    
    const { data, error } = await supabase
      .from('fotos_productos')
      .update({ descripcion: nuevaDescripcion })
      .eq('id', fotoId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error actualizando descripción:', error);
      throw error;
    }
    
    return data;
  },
  
  // 🔄 Reordenar fotos
  async reordenarFotos(productoId, tipoProducto, nuevosOrdenes) {
    console.log('🔄 Reordenando fotos:', productoId, tipoProducto);
    
    try {
      for (const { id, orden } of nuevosOrdenes) {
        const { error } = await supabase
          .from('fotos_productos')
          .update({ orden })
          .eq('id', id);
        
        if (error) throw error;
      }
      
      console.log('✅ Fotos reordenadas exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error reordenando fotos:', error);
      throw error;
    }
  },
  
  // 📊 Obtener estadísticas básicas
  async getEstadisticasFotos() {
    console.log('📊 Obteniendo estadísticas de fotos...');
    
    try {
      // Obtener todos los productos de las 3 tablas
      const [computadoras, celulares, otros] = await Promise.all([
        supabase.from('inventario').select('id').eq('disponible', true),
        supabase.from('celulares').select('id').eq('disponible', true),
        supabase.from('otros').select('id').eq('disponible', true)
      ]);
      
      // Obtener fotos agrupadas por tipo
      const { data: fotosData, error: fotosError } = await supabase
        .from('fotos_productos')
        .select('producto_id, tipo_producto, es_principal');
      
      if (fotosError) throw fotosError;
      
      const totalComputadoras = computadoras.data?.length || 0;
      const totalCelulares = celulares.data?.length || 0;
      const totalOtros = otros.data?.length || 0;
      const totalProductos = totalComputadoras + totalCelulares + totalOtros;
      
      // Calcular estadísticas por tipo
      const computadorasConFotos = new Set();
      const celularesConFotos = new Set();
      const otrosConFotos = new Set();
      let productosConPrincipal = 0;
      
      fotosData?.forEach(foto => {
        if (foto.tipo_producto === 'computadora') {
          computadorasConFotos.add(foto.producto_id);
        } else if (foto.tipo_producto === 'celular') {
          celularesConFotos.add(foto.producto_id);
        } else if (foto.tipo_producto === 'otro') {
          otrosConFotos.add(foto.producto_id);
        }
        
        if (foto.es_principal) {
          productosConPrincipal++;
        }
      });
      
      const totalConFotos = computadorasConFotos.size + celularesConFotos.size + otrosConFotos.size;
      const totalSinFotos = totalProductos - totalConFotos;
      
      return {
        totalProductos,
        conFotos: totalConFotos,
        sinFotos: totalSinFotos,
        conPrincipal: productosConPrincipal,
        porcentajeCompleto: totalProductos > 0 ? Math.round((productosConPrincipal / totalProductos) * 100) : 0,
        porTipo: {
          computadora: {
            total: totalComputadoras,
            conFotos: computadorasConFotos.size,
            sinFotos: totalComputadoras - computadorasConFotos.size
          },
          celular: {
            total: totalCelulares,
            conFotos: celularesConFotos.size,
            sinFotos: totalCelulares - celularesConFotos.size
          },
          otro: {
            total: totalOtros,
            conFotos: otrosConFotos.size,
            sinFotos: totalOtros - otrosConFotos.size
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  },
  
  // 🔍 Buscar productos sin fotos suficientes
  async getProductosSinFotosSuficientes(minimoFotos = 2) {
    console.log('🔍 Buscando productos con menos de', minimoFotos, 'fotos...');
    
    try {
      const { data, error } = await supabase
        .from('productos_con_fotos')
        .select('*')
        .lt('total_fotos', minimoFotos);
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error buscando productos sin fotos:', error);
      throw error;
    }
  },
  
  // 🛠️ Funciones auxiliares
  async desmarcarFotoPrincipal(productoId, tipoProducto) {
    const { error } = await supabase
      .from('fotos_productos')
      .update({ es_principal: false })
      .eq('producto_id', productoId)
      .eq('tipo_producto', tipoProducto)
      .eq('es_principal', true);
    
    if (error) {
      console.warn('⚠️ Error desmarcando foto principal:', error);
    }
  },
  
  async marcarPrimeraComoPrincipal(productoId, tipoProducto) {
    const fotos = await this.getFotosByProducto(productoId, tipoProducto);
    if (fotos.length > 0) {
      await this.marcarComoPrincipal(fotos[0].id);
    }
  }
};

// 🎣 Hook personalizado para React - Fotos
export function useFotos() {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  const fetchFotos = async (productoId, tipoProducto) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fotosService.getFotosByProducto(productoId, tipoProducto);
      setFotos(data);
    } catch (err) {
      console.error('Error en useFotos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subirFoto = async (archivo, productoId, tipoProducto, descripcion, esPrincipal) => {
    try {
      setError(null);
      const nuevaFoto = await fotosService.subirFoto(archivo, productoId, tipoProducto, descripcion, esPrincipal);
      setFotos(prev => [...prev, nuevaFoto].sort((a, b) => a.orden - b.orden));
      return nuevaFoto;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const eliminarFoto = async (fotoId) => {
    try {
      setError(null);
      await fotosService.eliminarFoto(fotoId);
      setFotos(prev => prev.filter(foto => foto.id !== fotoId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const marcarComoPrincipal = async (fotoId) => {
    try {
      setError(null);
      await fotosService.marcarComoPrincipal(fotoId);
      setFotos(prev => prev.map(foto => ({
        ...foto,
        es_principal: foto.id === fotoId
      })));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const actualizarDescripcion = async (fotoId, nuevaDescripcion) => {
    try {
      setError(null);
      await fotosService.actualizarDescripcion(fotoId, nuevaDescripcion);
      setFotos(prev => prev.map(foto => 
        foto.id === fotoId 
          ? { ...foto, descripcion: nuevaDescripcion }
          : foto
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const fetchEstadisticas = async () => {
    try {
      setError(null);
      const stats = await fotosService.getEstadisticasFotos();
      setEstadisticas(stats);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    fotos,
    loading,
    error,
    estadisticas,
    fetchFotos,
    subirFoto,
    eliminarFoto,
    marcarComoPrincipal,
    actualizarDescripcion,
    fetchEstadisticas
  };
}


// 💰 Servicios para Gastos Operativos
// 💰 Servicios para Gastos Operativos
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

// 🎣 Hook personalizado para React - Gastos Operativos
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