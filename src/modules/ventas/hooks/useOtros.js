// src/lib/otros.js - Service + Hook completo ACTUALIZADO
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  CONDICIONES,
  CONDICIONES_ARRAY,
  isValidCondicion,
  normalizeCondicion,
  UBICACIONES,
  UBICACIONES_ARRAY,
  isValidUbicacion,
  normalizeUbicacion
} from '../../../shared/constants/productConstants';

import {
  CATEGORIAS_OTROS,
  normalizeCategoria,
  isValidCategoria
} from '../../../shared/constants/categoryConstants';

// 📊 SERVICE: Operaciones de otros productos
export const otrosService = {
  // Obtener todos los productos otros disponibles
  async getAll() {
    console.log('📡 Obteniendo todos los productos otros...')

    const { data, error } = await supabase
      .from('otros')
      .select('*', { count: 'exact' })
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

    // Validación y normalización de categoría
    const categoriaNormalizada = normalizeCategoria(producto.categoria);
    if (!isValidCategoria(categoriaNormalizada)) {
      throw new Error(`Categoría inválida: ${producto.categoria}. Debe ser una de las categorías válidas`);
    }

    // Validación y normalización de condición si se proporciona
    let condicionNormalizada = CONDICIONES.USADO; // Default
    if (producto.condicion) {
      condicionNormalizada = normalizeCondicion(producto.condicion);
      if (!isValidCondicion(condicionNormalizada)) {
        throw new Error(`Condición inválida: ${producto.condicion}. Debe ser una de: ${CONDICIONES_ARRAY.join(', ')}`);
      }
    }

    // Validación y normalización de sucursal si se proporciona
    let sucursalNormalizada = UBICACIONES.LA_PLATA; // Default
    if (producto.sucursal) {
      sucursalNormalizada = normalizeUbicacion(producto.sucursal);
      if (!isValidUbicacion(sucursalNormalizada)) {
        throw new Error(`Ubicación inválida: ${producto.sucursal}. Debe ser una de: ${UBICACIONES_ARRAY.join(', ')}`);
      }
    }

    const { data, error } = await supabase
      .from('otros')
      .insert([{
        // Información básica
        nombre_producto: producto.nombre_producto?.trim() || producto.descripcion_producto?.trim(),
        descripcion: producto.descripcion?.trim() || '',
        marca: producto.marca || '',
        categoria: categoriaNormalizada,

        // Datos normalizados
        condicion: condicionNormalizada,

        // Precios - asegurar que sean números
        precio_compra_usd: parseFloat(producto.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(producto.precio_venta_usd) || 0,

        // Costos adicionales (envíos, reparaciones, etc.) - se usa para calcular costo_total_usd automáticamente
        costos_adicionales: parseFloat(producto.costos_adicionales) || 0,

        // Cantidades por sucursal - usar ubicaciones normalizadas
        // Usar ?? para permitir 0 como valor válido, solo usar fallback si es undefined/null
        cantidad_la_plata: producto.cantidad_la_plata !== undefined && producto.cantidad_la_plata !== null
          ? parseInt(producto.cantidad_la_plata) || 0
          : (sucursalNormalizada === UBICACIONES.LA_PLATA ? parseInt(producto.cantidad) || 1 : 0),
        cantidad_mitre: producto.cantidad_mitre !== undefined && producto.cantidad_mitre !== null
          ? parseInt(producto.cantidad_mitre) || 0
          : (sucursalNormalizada === UBICACIONES.MITRE ? parseInt(producto.cantidad) || 1 : 0),

        // Serial opcional - solo para productos únicos (cantidad = 1)
        serial: producto.serial?.trim() || null,

        // Información adicional
        color: producto.color || '',
        garantia: producto.garantia || '',
        observaciones: producto.observaciones || producto.fallas || '',

        // Proveedor
        proveedor_id: producto.proveedor_id || null,

        // Reserva / Consignación
        reservado_para: producto.reservado_para || null,
        reservado_por: producto.reservado_por || null,
        reservado_at: producto.reservado_at || null
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

    // Validar categoría si se actualiza
    if (updates.categoria !== undefined) {
      const categoriaNormalizada = normalizeCategoria(updates.categoria);
      if (!isValidCategoria(categoriaNormalizada)) {
        throw new Error(`Categoría inválida: ${updates.categoria}. Debe ser una de las categorías válidas`);
      }
      updates.categoria = categoriaNormalizada;
    }

    // Validar condición si se actualiza
    if (updates.condicion !== undefined) {
      const condicionNormalizada = normalizeCondicion(updates.condicion);
      if (!isValidCondicion(condicionNormalizada)) {
        throw new Error(`Condición inválida: ${updates.condicion}. Debe ser una de: ${CONDICIONES_ARRAY.join(', ')}`);
      }
      updates.condicion = condicionNormalizada;
    }

    // Validar sucursal/ubicación si se actualiza
    if (updates.sucursal !== undefined) {
      const ubicacionNormalizada = normalizeUbicacion(updates.sucursal);
      if (!isValidUbicacion(ubicacionNormalizada)) {
        throw new Error(`Ubicación inválida: ${updates.sucursal}. Debe ser una de: ${UBICACIONES_ARRAY.join(', ')}`);
      }
      updates.sucursal = ubicacionNormalizada;
    }

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
    if (updates.costos_adicionales !== undefined) {
      cleanUpdates.costos_adicionales = parseFloat(updates.costos_adicionales) || 0;
    }
    if (updates.cantidad_la_plata !== undefined) {
      cleanUpdates.cantidad_la_plata = parseInt(updates.cantidad_la_plata) || 0;
    }
    if (updates.cantidad_mitre !== undefined) {
      cleanUpdates.cantidad_mitre = parseInt(updates.cantidad_mitre) || 0;
    }
    if (updates.serial !== undefined) {
      cleanUpdates.serial = updates.serial?.trim() || null;
    }

    // ⚠️ Excluir costo_total_usd - se calcula automáticamente en BD
    delete cleanUpdates.costo_total_usd;

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
    console.log(`📦 Reduciendo stock: Producto ${id}, Cantidad: ${cantidadVendida}, Sucursal: ${sucursal}`);

    const producto = await this.getById(id)
    if (!producto) throw new Error('Producto no encontrado')

    const campoSucursal = sucursal === 'mitre' ? 'cantidad_mitre' : 'cantidad_la_plata'
    const otraSucursal = sucursal === 'mitre' ? 'la_plata' : 'mitre'
    const campoOtraSucursal = sucursal === 'mitre' ? 'cantidad_la_plata' : 'cantidad_mitre'

    const cantidadActual = producto[campoSucursal] || 0
    const cantidadOtraSucursal = producto[campoOtraSucursal] || 0
    const nuevaCantidad = cantidadActual - cantidadVendida

    let descuentoDeLaOtraSucursal = false
    let cantidadFinalLaPlata = producto.cantidad_la_plata || 0
    let cantidadFinalMitre = producto.cantidad_mitre || 0

    if (nuevaCantidad < 0) {
      // ⚠️ No hay suficiente stock en la sucursal seleccionada
      console.log(`⚠️ Stock insuficiente en ${sucursal}: ${cantidadActual}/${cantidadVendida}`)

      // 🔄 INTENTA DESCUENTO DE LA OTRA SUCURSAL
      if (cantidadOtraSucursal > 0) {
        console.log(`🔄 Intentando descontar de ${otraSucursal}: ${cantidadOtraSucursal} disponibles`)

        // Usar todo lo disponible de la sucursal actual
        const cantidadDeSucursalActual = cantidadActual
        const cantidadQueFaltaDeOtra = cantidadVendida - cantidadDeSucursalActual

        if (cantidadQueFaltaDeOtra <= cantidadOtraSucursal) {
          // ✅ SUFICIENTE STOCK EN LA OTRA SUCURSAL
          console.log(`✅ Descuento disponible en ${otraSucursal}: usando ${cantidadDeSucursalActual} de ${sucursal} + ${cantidadQueFaltaDeOtra} de ${otraSucursal}`)

          // Actualizar cantidades
          if (sucursal === 'la_plata') {
            cantidadFinalLaPlata = 0 // Usar todo lo de la plata
            cantidadFinalMitre = cantidadOtraSucursal - cantidadQueFaltaDeOtra
          } else {
            cantidadFinalMitre = 0 // Usar todo de mitre
            cantidadFinalLaPlata = cantidadOtraSucursal - cantidadQueFaltaDeOtra
          }

          descuentoDeLaOtraSucursal = true
        } else {
          // ❌ NO HAY SUFICIENTE NI EN LA OTRA SUCURSAL
          throw new Error(`Stock insuficiente: Solo hay ${cantidadActual} en ${sucursal} y ${cantidadOtraSucursal} en ${otraSucursal}. Total disponible: ${cantidadActual + cantidadOtraSucursal}, solicitado: ${cantidadVendida}`)
        }
      } else {
        // ❌ LA OTRA SUCURSAL TAMPOCO TIENE STOCK
        throw new Error(`Stock insuficiente: No hay stock disponible en ${sucursal}. La otra sucursal (${otraSucursal}) también está sin stock`)
      }
    } else {
      // ✅ HAY STOCK SUFICIENTE EN LA SUCURSAL SELECCIONADA
      // Actualizar la cantidad de la sucursal correspondiente
      if (sucursal === 'la_plata') {
        cantidadFinalLaPlata = nuevaCantidad
      } else {
        cantidadFinalMitre = nuevaCantidad
      }
    }

    // Actualizar la cantidad
    const productoActualizado = await this.update(id, {
      cantidad_la_plata: cantidadFinalLaPlata,
      cantidad_mitre: cantidadFinalMitre
    })

    // ✅ VERIFICAR SI EL PRODUCTO SE QUEDÓ SIN STOCK EN AMBAS SUCURSALES
    const stockTotal = cantidadFinalLaPlata + cantidadFinalMitre;

    console.log(`📊 Stock después de venta: La Plata: ${cantidadFinalLaPlata}, Mitre: ${cantidadFinalMitre}, Total: ${stockTotal}`);

    // Si no hay stock en ninguna sucursal, eliminar el producto
    if (stockTotal === 0) {
      console.log(`🗑️ Producto ${id} sin stock en ambas sucursales - Eliminando automáticamente`);
      await this.delete(id);
      console.log(`✅ Producto ${id} eliminado exitosamente por falta de stock`);

      return {
        ...productoActualizado,
        eliminado: true,
        motivo: 'Sin stock en ambas sucursales',
        descuentoDeOtraSucursal: descuentoDeLaOtraSucursal,
        otraSucursal: otraSucursal
      };
    }

    return {
      ...productoActualizado,
      descuentoDeOtraSucursal: descuentoDeLaOtraSucursal,
      otraSucursal: otraSucursal
    };
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

  // Crear producto custom específicamente para ventas
  async crearProductoCustom(datosCustom) {
    console.log('💾 Creando producto custom para venta:', datosCustom);

    // Validaciones específicas para productos custom
    if (!datosCustom.nombre_producto?.trim()) {
      throw new Error('El nombre del producto es obligatorio');
    }

    if (!datosCustom.serial?.trim()) {
      throw new Error('El serial es obligatorio');
    }

    if (!datosCustom.descripcion?.trim()) {
      throw new Error('La descripción es obligatoria');
    }

    if (!datosCustom.categoria?.trim()) {
      throw new Error('La categoría es obligatoria');
    }

    if (!datosCustom.precio_compra || datosCustom.precio_compra <= 0) {
      throw new Error('El precio de compra debe ser mayor a 0');
    }

    if (!datosCustom.precio_venta || datosCustom.precio_venta <= 0) {
      throw new Error('El precio de venta debe ser mayor a 0');
    }

    if (!datosCustom.cantidad || datosCustom.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    // Validar condición
    const condicionNormalizada = normalizeCondicion(datosCustom.condicion || 'usado');
    if (!isValidCondicion(condicionNormalizada)) {
      throw new Error(`Condición inválida: ${datosCustom.condicion}`);
    }

    // Determinar sucursal (por defecto la_plata si no se especifica)
    const sucursal = datosCustom.sucursal || 'la_plata';
    const cantidadProducto = parseInt(datosCustom.cantidad);

    // Preparar datos para inserción
    const productoData = {
      nombre_producto: datosCustom.nombre_producto.trim(),
      serial: datosCustom.serial.trim(),
      descripcion: datosCustom.descripcion.trim(),
      categoria: datosCustom.categoria.trim(),
      condicion: condicionNormalizada,
      precio_compra_usd: parseFloat(datosCustom.precio_compra),
      precio_venta_usd: parseFloat(datosCustom.precio_venta),
      cantidad_la_plata: sucursal === 'la_plata' ? cantidadProducto : 0,
      cantidad_mitre: sucursal === 'mitre' ? cantidadProducto : 0,
      garantia: '30 días', // Fijo según especificación
      observaciones: datosCustom.observaciones || null
    };

    console.log('📦 Datos preparados para producto custom:', productoData);

    // Usar el método create existente
    const nuevoProducto = await this.create(productoData);

    console.log('✅ Producto custom creado exitosamente:', nuevoProducto);
    return nuevoProducto;
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

  // Crear producto custom específicamente para ventas
  const crearProductoCustom = async (datosCustom) => {
    try {
      setError(null)
      const nuevoProducto = await otrosService.crearProductoCustom(datosCustom)
      setOtros(prev => [nuevoProducto, ...prev])
      return nuevoProducto
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
    getEstadisticas,
    crearProductoCustom,
    setOtros,
    setError
  }
}