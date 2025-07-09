// src/lib/otros.js - Service + Hook completo ACTUALIZADO
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

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
    console.log('💾 Creando producto otro:', producto.nombre_producto)
    
    // Validación básica
    if (!producto.nombre_producto?.trim()) {
      throw new Error('El nombre del producto es obligatorio')
    }
    
    if (!producto.categoria) {
      throw new Error('La categoría es obligatoria')
    }

    const { data, error } = await supabase
      .from('otros')
      .insert([{
        // Información básica
        nombre_producto: producto.nombre_producto.trim(),
        descripcion: producto.descripcion?.trim() || '',
        cantidad: parseInt(producto.cantidad) || 1,
        
        // Precios - asegurar que sean números
        precio_compra_usd: parseFloat(producto.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(producto.precio_venta_usd) || 0,
        precio_venta_pesos: parseFloat(producto.precio_venta_pesos) || 0,
        
        // Clasificación y estado
        categoria: producto.categoria || 'otros',
        condicion: producto.condicion || 'nueva',
        sucursal: producto.sucursal || 'la_plata',
        
        // Información adicional
        garantia: producto.garantia || '',
        fallas: producto.fallas || 'Ninguna',
        
        // Control
        disponible: producto.disponible !== false,
        
        // Fecha de ingreso
        ingreso: producto.ingreso || new Date().toISOString().split('T')[0]
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
    
    // Preparar updates con validación de tipos
    const cleanUpdates = {
      ...updates
    };

    // Validar y convertir números si vienen en updates
    if (updates.precio_compra_usd !== undefined) {
      cleanUpdates.precio_compra_usd = parseFloat(updates.precio_compra_usd) || 0;
    }
    if (updates.precio_venta_usd !== undefined) {
      cleanUpdates.precio_venta_usd = parseFloat(updates.precio_venta_usd) || 0;
    }
    if (updates.precio_venta_pesos !== undefined) {
      cleanUpdates.precio_venta_pesos = parseFloat(updates.precio_venta_pesos) || 0;
    }
    if (updates.cantidad !== undefined) {
      cleanUpdates.cantidad = parseInt(updates.cantidad) || 1;
    }

    const { data, error } = await supabase
      .from('otros')
      .update({
        ...cleanUpdates,
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

  // Eliminar producto otro (eliminación lógica)
  async delete(id) {
    console.log(`🗑️ Eliminando producto otro ID: ${id}`)
    
    // Opción 1: Eliminación física (borrar completamente)
    const { error } = await supabase
      .from('otros')
      .delete()
      .eq('id', id)
    
    // Opción 2: Eliminación lógica (solo marcar como no disponible)
    // const { error } = await supabase
    //   .from('otros')
    //   .update({ disponible: false })
    //   .eq('id', id)
    
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
  },

  // Buscar productos por categoría
  async getByCategoria(categoria) {
    console.log(`🔍 Buscando productos de categoría: ${categoria}`)
    
    const { data, error } = await supabase
      .from('otros')
      .select('*')
      .eq('categoria', categoria)
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error buscando por categoría:', error)
      throw error
    }
    
    return data
  },

  // Buscar productos por sucursal
  async getBySucursal(sucursal) {
    console.log(`🏢 Buscando productos en sucursal: ${sucursal}`)
    
    const { data, error } = await supabase
      .from('otros')
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

  // Obtener estadísticas del inventario
  async getEstadisticas() {
    console.log('📊 Obteniendo estadísticas del inventario...')
    
    const { data, error } = await supabase
      .from('otros')
      .select('categoria, condicion, cantidad, precio_venta_usd')
      .eq('disponible', true)
    
    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw error
    }
    
    // Calcular estadísticas
    const estadisticas = {
      totalProductos: data.length,
      totalUnidades: data.reduce((sum, item) => sum + item.cantidad, 0),
      valorInventario: data.reduce((sum, item) => sum + (item.precio_venta_usd * item.cantidad), 0),
      categorias: {},
      condiciones: {}
    }
    
    // Agrupar por categoría y condición
    data.forEach(item => {
      // Por categoría
      if (!estadisticas.categorias[item.categoria]) {
        estadisticas.categorias[item.categoria] = { productos: 0, unidades: 0, valor: 0 }
      }
      estadisticas.categorias[item.categoria].productos++
      estadisticas.categorias[item.categoria].unidades += item.cantidad
      estadisticas.categorias[item.categoria].valor += item.precio_venta_usd * item.cantidad
      
      // Por condición
      if (!estadisticas.condiciones[item.condicion]) {
        estadisticas.condiciones[item.condicion] = { productos: 0, unidades: 0 }
      }
      estadisticas.condiciones[item.condicion].productos++
      estadisticas.condiciones[item.condicion].unidades += item.cantidad
    })
    
    return estadisticas
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

  // Nuevas funciones del hook
  const getOtrosByCategoria = async (categoria) => {
    try {
      setError(null)
      const data = await otrosService.getByCategoria(categoria)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const getEstadisticas = async () => {
    try {
      setError(null)
      const stats = await otrosService.getEstadisticas()
      return stats
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
    deleteOtro,
    getOtrosByCategoria,
    getEstadisticas
  }
}