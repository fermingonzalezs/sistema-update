// src/lib/inventario.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from './supabase.js';

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