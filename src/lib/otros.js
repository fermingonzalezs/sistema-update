// src/lib/otros.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from './supabase.js';

// 📊 SERVICE: Operaciones de otros productos
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
};

// 🎣 HOOK: Lógica de React para otros productos
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