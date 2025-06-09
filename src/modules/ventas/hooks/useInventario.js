// src/lib/inventario.js - Service + Hook completo ACTUALIZADO
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de inventario de computadoras
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
    
    // Validaciones básicas
    if (!computadora.serial?.trim()) {
      throw new Error('El número de serie es obligatorio')
    }
    
    if (!computadora.modelo?.trim()) {
      throw new Error('El modelo es obligatorio')
    }
    
    // Validar que no exista el serial
    const existing = await this.findBySerial(computadora.serial.trim())
    if (existing) {
      throw new Error(`Ya existe una computadora con serial: ${computadora.serial}`)
    }
    
    const { data, error } = await supabase
      .from('inventario')
      .insert([{
        // Información básica
        serial: computadora.serial.trim(),
        modelo: computadora.modelo.trim(),
        
        // Precios - asegurar que sean números
        precio_costo_usd: parseFloat(computadora.precio_costo_usd) || 0,
        envios_repuestos: parseFloat(computadora.envios_repuestos) || 0,
        precio_venta_usd: parseFloat(computadora.precio_venta_usd) || 0,
        // precio_costo_total se calcula automáticamente en la DB
        
        // Estado y ubicación
        sucursal: computadora.sucursal || 'la_plata',
        condicion: computadora.condicion || 'usado',
        
        // Especificaciones principales
        procesador: computadora.procesador || '',
        slots: computadora.slots || '2',
        tipo_ram: computadora.tipo_ram || 'DDR4',
        ram: computadora.ram || '',
        ssd: computadora.ssd || '',
        hdd: computadora.hdd || '',
        so: computadora.so || 'WIN11',
        pantalla: computadora.pantalla || '',
        resolucion: computadora.resolucion || 'FHD',
        placa_video: computadora.placa_video || '',
        vram: computadora.vram || '',
        
        // Características físicas
        teclado_retro: computadora.teclado_retro || 'SI',
        idioma_teclado: computadora.idioma_teclado || 'Español',
        color: computadora.color || '',
        
        // Batería
        bateria: computadora.bateria || '',
        duracion: computadora.duracion || '',
        
        // Garantía
        garantia_update: computadora.garantia_update || '6 meses',
        garantia_oficial: computadora.garantia_oficial || '',
        fallas: computadora.fallas || 'Ninguna',
        
        // Control
        disponible: computadora.disponible !== false,
        
        // Fecha de ingreso
        ingreso: computadora.ingreso || new Date().toISOString().split('T')[0]
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
    
    // Preparar updates con validación de tipos
    const cleanUpdates = { ...updates };

    // Validar y convertir números si vienen en updates
    if (updates.precio_costo_usd !== undefined) {
      cleanUpdates.precio_costo_usd = parseFloat(updates.precio_costo_usd) || 0;
    }
    if (updates.envios_repuestos !== undefined) {
      cleanUpdates.envios_repuestos = parseFloat(updates.envios_repuestos) || 0;
    }
    if (updates.precio_venta_usd !== undefined) {
      cleanUpdates.precio_venta_usd = parseFloat(updates.precio_venta_usd) || 0;
    }
    
    // No incluir precio_costo_total ya que se calcula automáticamente
    delete cleanUpdates.precio_costo_total;

    const { data, error } = await supabase
      .from('inventario')
      .update({
        ...cleanUpdates,
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

  // Eliminar computadora (eliminación física)
  async delete(id) {
    console.log(`🗑️ Eliminando computadora ID: ${id}`)
    
    // Opción 1: Eliminación física (borrar completamente)
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id)
    
    // Opción 2: Eliminación lógica (solo marcar como no disponible)
    // const { error } = await supabase
    //   .from('inventario')
    //   .update({ disponible: false })
    //   .eq('id', id)
    
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
      .eq('serial', serial.trim())
      .maybeSingle()
    
    if (error) {
      console.error('❌ Error buscando por serial:', error)
      throw error
    }
    
    return data
  },

  // Obtener por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Buscar computadoras por sucursal
  async getBySucursal(sucursal) {
    console.log(`🏢 Buscando computadoras en sucursal: ${sucursal}`)
    
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('sucursal', sucursal)
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error buscando por sucursal:', error)
      throw error
    }
    
    return data
  },

  // Buscar por condición
  async getByCondicion(condicion) {
    console.log(`🔍 Buscando computadoras con condición: ${condicion}`)
    
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('condicion', condicion)
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error buscando por condición:', error)
      throw error
    }
    
    return data
  },

  // Buscar por procesador
  async getByProcesador(procesador) {
    console.log(`💻 Buscando computadoras con procesador: ${procesador}`)
    
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .ilike('procesador', `%${procesador}%`)
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error buscando por procesador:', error)
      throw error
    }
    
    return data
  },

  // Obtener estadísticas del inventario
  async getEstadisticas() {
    console.log('📊 Obteniendo estadísticas del inventario...')
    
    const { data, error } = await supabase
      .from('inventario')
      .select('sucursal, condicion, procesador, precio_venta_usd, precio_costo_total')
      .eq('disponible', true)
    
    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw error
    }
    
    // Calcular estadísticas
    const estadisticas = {
      totalComputadoras: data.length,
      valorInventarioVenta: data.reduce((sum, item) => sum + (parseFloat(item.precio_venta_usd) || 0), 0),
      valorInventarioCosto: data.reduce((sum, item) => sum + (parseFloat(item.precio_costo_total) || 0), 0),
      sucursales: {},
      condiciones: {},
      procesadores: {}
    }
    
    // Agrupar por categorías
    data.forEach(item => {
      // Por sucursal
      if (!estadisticas.sucursales[item.sucursal]) {
        estadisticas.sucursales[item.sucursal] = { cantidad: 0, valorVenta: 0, valorCosto: 0 }
      }
      estadisticas.sucursales[item.sucursal].cantidad++
      estadisticas.sucursales[item.sucursal].valorVenta += parseFloat(item.precio_venta_usd) || 0
      estadisticas.sucursales[item.sucursal].valorCosto += parseFloat(item.precio_costo_total) || 0
      
      // Por condición
      if (!estadisticas.condiciones[item.condicion]) {
        estadisticas.condiciones[item.condicion] = { cantidad: 0, valorVenta: 0 }
      }
      estadisticas.condiciones[item.condicion].cantidad++
      estadisticas.condiciones[item.condicion].valorVenta += parseFloat(item.precio_venta_usd) || 0
      
      // Por procesador (marcas principales)
      const procesadorMarca = item.procesador?.toLowerCase()
      let marca = 'Otros'
      if (procesadorMarca?.includes('intel')) marca = 'Intel'
      else if (procesadorMarca?.includes('amd')) marca = 'AMD'
      else if (procesadorMarca?.includes('apple')) marca = 'Apple'
      
      if (!estadisticas.procesadores[marca]) {
        estadisticas.procesadores[marca] = { cantidad: 0, valorVenta: 0 }
      }
      estadisticas.procesadores[marca].cantidad++
      estadisticas.procesadores[marca].valorVenta += parseFloat(item.precio_venta_usd) || 0
    })
    
    // Calcular margen total
    estadisticas.margenTotal = estadisticas.valorInventarioVenta - estadisticas.valorInventarioCosto
    estadisticas.porcentajeMargen = estadisticas.valorInventarioCosto > 0 
      ? ((estadisticas.margenTotal / estadisticas.valorInventarioCosto) * 100).toFixed(2)
      : 0
    
    return estadisticas
  },

  // Marcar como vendida (eliminación lógica)
  async marcarComoVendida(id) {
    console.log(`💰 Marcando computadora como vendida ID: ${id}`)
    
    const { data, error } = await supabase
      .from('inventario')
      .update({ 
        disponible: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('❌ Error marcando como vendida:', error)
      throw error
    }
    
    console.log('✅ Computadora marcada como vendida')
    return data[0]
  }
};

// 🎣 HOOK: Lógica de React para inventario
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
    console.log(`🔄 Hook: Actualizando computadora ID: ${id}`, updates);
    
    try {
      setError(null)
      
      // Validar parámetros
      if (!id) {
        throw new Error('ID de computadora es requerido');
      }
      
      if (!updates || typeof updates !== 'object') {
        throw new Error('Datos de actualización son requeridos');
      }
      
      const updated = await inventarioService.update(id, updates)
      
      // Actualizar el estado local
      setComputers(prev => prev.map(comp => 
        comp.id === id ? { ...comp, ...updated } : comp
      ))
      
      console.log('✅ Hook: Computadora actualizada exitosamente');
      return updated
    } catch (err) {
      console.error('❌ Hook: Error actualizando computadora:', err);
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

  // Nuevas funciones del hook
  const getComputersBySucursal = async (sucursal) => {
    try {
      setError(null)
      const data = await inventarioService.getBySucursal(sucursal)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const getEstadisticas = async () => {
    try {
      setError(null)
      const stats = await inventarioService.getEstadisticas()
      return stats
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const marcarComoVendida = async (id) => {
    try {
      setError(null)
      const updated = await inventarioService.marcarComoVendida(id)
      setComputers(prev => prev.filter(comp => comp.id !== id))
      return updated
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
    deleteComputer,
    getComputersBySucursal,
    getEstadisticas,
    marcarComoVendida
  }
}