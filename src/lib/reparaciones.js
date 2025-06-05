// src/lib/reparaciones.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from './supabase.js';

// 📊 SERVICE: Operaciones de reparaciones
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
  }
};

// 🎣 HOOK: Lógica de React para reparaciones
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