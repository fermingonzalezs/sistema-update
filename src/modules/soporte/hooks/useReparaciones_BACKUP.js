// src/lib/reparaciones.js - Service + Hook completo
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de reparaciones
export const reparacionesService = {
  // Guardar presupuesto en la reparación
  async guardarPresupuesto(id, presupuestoData) {
    console.log(`💾 Guardando presupuesto para reparación ID: ${id}`)
    
    const { error } = await supabase
      .from('reparaciones')
      .update({
        presupuesto_json: presupuestoData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error guardando presupuesto:', error)
      throw error
    }
    
    console.log('✅ Presupuesto guardado exitosamente')
    return true
  },
  
  // Obtener presupuesto de una reparación
  async obtenerPresupuesto(id) {
    console.log(`🔍 Obteniendo presupuesto para reparación ID: ${id}`)
    
    const { data, error } = await supabase
      .from('reparaciones')
      .select('presupuesto_json')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('❌ Error obteniendo presupuesto:', error)
      throw error
    }
    
    return data.presupuesto_json
  },
  
  // Eliminar presupuesto de una reparación
  async eliminarPresupuesto(id) {
    console.log(`🗑️ Eliminando presupuesto para reparación ID: ${id}`)
    
    const { error } = await supabase
      .from('reparaciones')
      .update({
        presupuesto_json: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error eliminando presupuesto:', error)
      throw error
    }
    
    console.log('✅ Presupuesto eliminado exitosamente')
    return true
  },
  
  // Verificar si una reparación tiene presupuesto
  async tienePresupuesto(id) {
    const { data, error } = await supabase
      .from('reparaciones')
      .select('presupuesto_json')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    return data.presupuesto_json !== null
  },
  
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
  }
};

// 🎣 HOOK: Lógica de React para reparaciones
export const useReparaciones = () => {
  const [reparaciones, setReparaciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [presupuesto, setPresupuesto] = useState(null)

  // Obtener todas las reparaciones
  const obtenerReparaciones = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reparacionesService.getAll()
      setReparaciones(data)
    } catch (err) {
      setError(err.message)
      console.error('Error obteniendo reparaciones:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nueva reparación
  const crearReparacion = useCallback(async (data) => {
    try {
      const nuevaReparacion = await reparacionesService.create(data)
      setReparaciones(prev => [nuevaReparacion, ...prev])
      return nuevaReparacion
    } catch (err) {
      setError(err.message)
      console.error('Error creando reparación:', err)
      throw err
    }
  }, [])

  // Actualizar reparación
  const actualizarReparacion = useCallback(async (id, updates) => {
    try {
      const reparacionActualizada = await reparacionesService.update(id, updates)
      setReparaciones(prev => 
        prev.map(r => r.id === id ? reparacionActualizada : r)
      )
      return reparacionActualizada
    } catch (err) {
      setError(err.message)
      console.error('Error actualizando reparación:', err)
      throw err
    }
  }, [])

  // Eliminar reparación
  const eliminarReparacion = useCallback(async (id) => {
    try {
      await reparacionesService.delete(id)
      setReparaciones(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err.message)
      console.error('Error eliminando reparación:', err)
      throw err
    }
  }, [])

  // Buscar por cliente
  const buscarPorCliente = useCallback(async (nombre) => {
    try {
      const resultados = await reparacionesService.buscarPorCliente(nombre)
      setReparaciones(resultados)
      return resultados
    } catch (err) {
      setError(err.message)
      console.error('Error buscando por cliente:', err)
      throw err
    }
  }, [])

  // Buscar por número
  const buscarPorNumero = useCallback(async (numero) => {
    try {
      const resultado = await reparacionesService.buscarPorNumero(numero)
      setReparaciones(resultado ? [resultado] : [])
      return resultado
    } catch (err) {
      setError(err.message)
      console.error('Error buscando por número:', err)
      throw err
    }
  }, [])

  // Cambiar estado de reparación
  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    try {
      const reparacionActualizada = await reparacionesService.cambiarEstado(id, nuevoEstado)
      setReparaciones(prev => 
        prev.map(r => r.id === id ? reparacionActualizada : r)
      )
      return reparacionActualizada
    } catch (err) {
      setError(err.message)
      console.error('Error cambiando estado:', err)
      throw err
    }
  }, [])

  // Obtener estadísticas
  const obtenerEstadisticas = useCallback(async () => {
    try {
      return await reparacionesService.getEstadisticas()
    } catch (err) {
      setError(err.message)
      console.error('Error obteniendo estadísticas:', err)
      throw err
    }
  }, [])

  // Funciones de presupuesto
  const guardarPresupuesto = useCallback(async (id, presupuestoData) => {
    try {
      await reparacionesService.guardarPresupuesto(id, presupuestoData)
      return true
    } catch (error) {
      console.error('Error guardando presupuesto:', error)
      throw error
    }
  }, [])

  const obtenerPresupuesto = useCallback(async (id) => {
    try {
      const data = await reparacionesService.obtenerPresupuesto(id)
      setPresupuesto(data)
      return data
    } catch (error) {
      console.error('Error obteniendo presupuesto:', error)
      throw error
    }
  }, [])

  const eliminarPresupuesto = useCallback(async (id) => {
    try {
      await reparacionesService.eliminarPresupuesto(id)
      setPresupuesto(null)
      return true
    } catch (error) {
      console.error('Error eliminando presupuesto:', error)
      throw error
    }
  }, [])

  const tienePresupuesto = useCallback(async (id) => {
    try {
      return await reparacionesService.tienePresupuesto(id)
    } catch (error) {
      console.error('Error verificando presupuesto:', error)
      throw error
    }
  }, [])

  return {
    reparaciones,
    loading,
    error,
    presupuesto,
    obtenerReparaciones,
    crearReparacion,
    actualizarReparacion,
    eliminarReparacion,
    buscarPorCliente,
    buscarPorNumero,
    cambiarEstado,
    obtenerEstadisticas,
    guardarPresupuesto,
    obtenerPresupuesto,
    eliminarPresupuesto,
    tienePresupuesto
  }
}