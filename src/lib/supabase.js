// src/lib/supabase.js - Archivo principal limpio
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

// 🔑 Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Faltan variables de entorno de Supabase. Verifica tu archivo .env')
}

// 📡 Cliente de Supabase (esto lo usan todos los servicios)
export const supabase = createClient(supabaseUrl, supabaseKey)

// 📦 SERVICIOS Y HOOKS - Importar y reexportar desde archivos modulares
export { inventarioService, useInventario } from '../modules/ventas/hooks/useInventario.js'
export { celularesService, useCelulares } from '../modules/ventas/hooks/useCelulares.js'
export { otrosService, useOtros } from '../modules/ventas/hooks/useOtros.js'
export { reparacionesService, useReparaciones } from '../modules/soporte/hooks/useReparaciones.js'
export { movimientosRepuestosService, useMovimientosRepuestos } from '../modules/soporte/hooks/useMovimientosRepuestos.js'
export { movimientosRepuestosEquiposService, useMovimientosRepuestosEquipos } from '../modules/soporte/hooks/useMovimientosRepuestosEquipos.js'
export { ventasService, useVentas } from '../modules/ventas/hooks/useVentas.js'
export { useVendedores } from '../modules/ventas/hooks/useVendedores.js'
export { clientesService, useClientes } from '../modules/ventas/hooks/useClientes.js'
// export { gastosOperativosService, useGastosOperativos } from '../modules/contabilidad/hooks/useGastosOperativos.js' // ELIMINADO
export { fotosService, useFotos } from '../modules/ventas/hooks/useFotos.js'
export { serviciosService, useServicios } from '../modules/soporte/hooks/useServicios.js'
export { cuentasCorrientesService, useCuentasCorrientes } from '../modules/contabilidad/hooks/useCuentasCorrientes.js'

// 🛒 Hook del carrito (mantener aquí porque es simple y no necesita archivo propio)
export function useCarrito() {
  const [carrito, setCarrito] = useState([])

  const agregarAlCarrito = (producto, tipo, cantidad = 1) => {
    // Validar que el tipo sea válido
    const tiposValidos = ['computadora', 'celular', 'otro'];
    const tipoValido = tiposValidos.includes(tipo) ? tipo : 'otro';
    
    if (tipo !== tipoValido) {
      console.warn(`⚠️ Tipo corregido en carrito: "${tipo}" → "${tipoValido}"`);
    }

    const itemExistente = carrito.find(
      item => item.producto.id === producto.id && item.tipo === tipoValido
    )

    if (itemExistente) {
      // Si ya existe, aumentar cantidad
      setCarrito(prev => prev.map(item =>
        item.producto.id === producto.id && item.tipo === tipoValido
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ))
    } else {
      // Agregar nuevo item
      const nuevoItem = {
        id: `${tipoValido}-${producto.id}`,
        producto,
        tipo: tipoValido, // 'computadora', 'celular', 'otro' validado
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