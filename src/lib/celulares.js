// src/lib/celulares.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from './supabase.js';

// 📊 SERVICE: Operaciones de inventario de celulares
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
};

// 🎣 HOOK: Lógica de React para celulares
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