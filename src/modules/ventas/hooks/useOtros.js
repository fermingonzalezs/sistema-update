// src/lib/otros.js - Service + Hook completo ACTUALIZADO
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de otros productos
export const otrosService = {
  // Obtener todos los productos otros disponibles
  async getAll() {
    console.log('📡 Obteniendo todos los productos otros...')
    
    const { data, error } = await supabase
      .from('otros')
      .select('*')
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
        nombre_producto: producto.nombre_producto?.trim() || producto.descripcion_producto?.trim(),
        descripcion: producto.descripcion?.trim() || '',
        categoria: producto.categoria || 'otros',
        
        // Precios - asegurar que sean números
        precio_compra_usd: parseFloat(producto.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(producto.precio_venta_usd) || 0,
        
        // Cantidades por sucursal
        cantidad_la_plata: parseInt(producto.cantidad_la_plata) || (producto.sucursal === 'la_plata' ? parseInt(producto.cantidad) || 1 : 0),
        cantidad_mitre: parseInt(producto.cantidad_mitre) || (producto.sucursal === 'mitre' ? parseInt(producto.cantidad) || 1 : 0),
        
        // Información adicional
        garantia: producto.garantia || '',
        observaciones: producto.observaciones || producto.fallas || 'Ninguna'
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
    if (updates.cantidad_la_plata !== undefined) {
      cleanUpdates.cantidad_la_plata = parseInt(updates.cantidad_la_plata) || 0;
    }
    if (updates.cantidad_mitre !== undefined) {
      cleanUpdates.cantidad_mitre = parseInt(updates.cantidad_mitre) || 0;
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
  async reducirCantidad(id, cantidadVendida, sucursal = 'la_plata') {
    const producto = await this.getById(id)
    if (!producto) throw new Error('Producto no encontrado')
    
    const campoSucursal = sucursal === 'mitre' ? 'cantidad_mitre' : 'cantidad_la_plata'
    const cantidadActual = producto[campoSucursal] || 0
    const nuevaCantidad = cantidadActual - cantidadVendida
    
    if (nuevaCantidad < 0) {
      throw new Error('No hay suficiente stock en esta sucursal')
    }
    
    return await this.update(id, { [campoSucursal]: nuevaCantidad })
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

  // Buscar productos por sucursal (productos que tienen stock en esa sucursal)
  async getBySucursal(sucursal) {
    console.log(`🏢 Buscando productos en sucursal: ${sucursal}`)
    
    const campoSucursal = sucursal === 'mitre' ? 'cantidad_mitre' : 'cantidad_la_plata'
    
    const { data, error } = await supabase
      .from('otros')
      .select('*')
      .gt(campoSucursal, 0)
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
      .select('categoria, cantidad_la_plata, cantidad_mitre, precio_venta_usd')
    
    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw error
    }
    
    // Calcular estadísticas
    const estadisticas = {
      totalProductos: data.length,
      totalUnidades: data.reduce((sum, item) => sum + (item.cantidad_la_plata || 0) + (item.cantidad_mitre || 0), 0),
      totalUnidadesLaPlata: data.reduce((sum, item) => sum + (item.cantidad_la_plata || 0), 0),
      totalUnidadesMitre: data.reduce((sum, item) => sum + (item.cantidad_mitre || 0), 0),
      valorInventario: data.reduce((sum, item) => sum + (item.precio_venta_usd * ((item.cantidad_la_plata || 0) + (item.cantidad_mitre || 0))), 0),
      categorias: {}
    }
    
    // Agrupar por categoría
    data.forEach(item => {
      const totalUnidades = (item.cantidad_la_plata || 0) + (item.cantidad_mitre || 0)
      
      // Por categoría
      if (!estadisticas.categorias[item.categoria]) {
        estadisticas.categorias[item.categoria] = { productos: 0, unidades: 0, unidadesLaPlata: 0, unidadesMitre: 0, valor: 0 }
      }
      estadisticas.categorias[item.categoria].productos++
      estadisticas.categorias[item.categoria].unidades += totalUnidades
      estadisticas.categorias[item.categoria].unidadesLaPlata += item.cantidad_la_plata || 0
      estadisticas.categorias[item.categoria].unidadesMitre += item.cantidad_mitre || 0
      estadisticas.categorias[item.categoria].valor += item.precio_venta_usd * totalUnidades
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

  // Cargar datos automáticamente al montar el componente
  useEffect(() => {
    fetchOtros()
  }, [])

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