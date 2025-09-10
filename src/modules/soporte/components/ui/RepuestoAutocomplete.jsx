import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const RepuestoAutocomplete = ({ 
  onSelect, 
  placeholder = "Buscar repuesto...", 
  categoriaSeleccionada = '', 
  onCategoriaChange,
  onAgregarNuevo 
}) => {
  const [query, setQuery] = useState('')
  const [repuestos, setRepuestos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false)
  const [nuevoRepuesto, setNuevoRepuesto] = useState({
    item: '',
    categoria: categoriaSeleccionada || '',
    precio_compra: '',
    precio_venta: '',
    cantidad: 0
  })

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias()
  }, [])

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('repuestos')
        .select('categoria')
        .not('categoria', 'is', null)
        .not('categoria', 'eq', '')

      if (error) throw error

      const categoriasUnicas = [...new Set(data.map(item => item.categoria))].sort()
      setCategorias(categoriasUnicas)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  const buscarRepuestos = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setRepuestos([])
      return
    }

    setLoading(true)
    try {
      let query = supabase
        .from('repuestos')
        .select('*')
        .ilike('item', `%${searchQuery}%`)
        .eq('disponible', true)

      // Filtrar por categoría si está seleccionada
      if (categoriaSeleccionada) {
        query = query.eq('categoria', categoriaSeleccionada)
      }

      const { data, error } = await query
        .order('item')
        .limit(15)

      if (error) throw error

      setRepuestos(data || [])
      setShowDropdown(true)
    } catch (error) {
      console.error('Error buscando repuestos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarRepuestos(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, categoriaSeleccionada])

  const handleSelectRepuesto = (repuesto) => {
    setQuery(repuesto.item)
    setShowDropdown(false)
    setMostrarFormularioNuevo(false)
    onSelect(repuesto)
  }

  const handleMostrarFormularioNuevo = () => {
    setMostrarFormularioNuevo(true)
    setShowDropdown(false)
    setNuevoRepuesto(prev => ({
      ...prev,
      item: query,
      categoria: categoriaSeleccionada || ''
    }))
  }

  const handleCancelarNuevo = () => {
    setMostrarFormularioNuevo(false)
    setNuevoRepuesto({
      item: '',
      categoria: categoriaSeleccionada || '',
      precio_compra: '',
      precio_venta: '',
      cantidad: 0
    })
    setQuery('')
  }

  const handleGuardarNuevo = async () => {
    if (!nuevoRepuesto.item || !nuevoRepuesto.categoria) {
      alert('Por favor completa al menos el nombre y la categoría')
      return
    }

    try {
      const { data, error } = await supabase
        .from('repuestos')
        .insert([{
          item: nuevoRepuesto.item,
          categoria: nuevoRepuesto.categoria,
          precio_compra: parseFloat(nuevoRepuesto.precio_compra) || 0,
          precio_venta: parseFloat(nuevoRepuesto.precio_venta) || 0,
          cantidad: parseInt(nuevoRepuesto.cantidad) || 0,
          disponible: true
        }])
        .select()
        .single()

      if (error) throw error

      // Actualizar categorías si es nueva
      if (!categorias.includes(nuevoRepuesto.categoria)) {
        setCategorias(prev => [...prev, nuevoRepuesto.categoria].sort())
      }

      // Seleccionar el repuesto recién creado
      handleSelectRepuesto(data)
      
      // Notificar al componente padre
      if (onAgregarNuevo) {
        onAgregarNuevo(data)
      }

      setMostrarFormularioNuevo(false)
      setNuevoRepuesto({
        item: '',
        categoria: categoriaSeleccionada || '',
        precio_compra: '',
        precio_venta: '',
        cantidad: 0
      })
    } catch (error) {
      console.error('Error guardando repuesto:', error)
      alert('Error al guardar el repuesto')
    }
  }

  const getStockColor = (cantidad) => {
    if (cantidad <= 0) return 'text-red-600'
    if (cantidad <= 5) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (mostrarFormularioNuevo) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Agregar Nuevo Repuesto</h4>
          <button
            onClick={handleCancelarNuevo}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del repuesto *</label>
            <input
              type="text"
              value={nuevoRepuesto.item}
              onChange={(e) => setNuevoRepuesto(prev => ({ ...prev, item: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ej: Memoria RAM DDR4 8GB"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría *</label>
            <select
              value={nuevoRepuesto.categoria}
              onChange={(e) => setNuevoRepuesto(prev => ({ ...prev, categoria: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Compra (USD)</label>
            <input
              type="number"
              step="0.01"
              value={nuevoRepuesto.precio_compra}
              onChange={(e) => setNuevoRepuesto(prev => ({ ...prev, precio_compra: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Venta (USD)</label>
            <input
              type="number"
              step="0.01"
              value={nuevoRepuesto.precio_venta}
              onChange={(e) => setNuevoRepuesto(prev => ({ ...prev, precio_venta: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Inicial</label>
            <input
              type="number"
              value={nuevoRepuesto.cantidad}
              onChange={(e) => setNuevoRepuesto(prev => ({ ...prev, cantidad: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancelarNuevo}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardarNuevo}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Guardar Repuesto
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Selector de categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría (opcional)</label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => onCategoriaChange && onCategoriaChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(categoria => (
            <option key={categoria} value={categoria}>{categoria}</option>
          ))}
        </select>
      </div>

      {/* Buscador de repuestos */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length >= 2) {
                setShowDropdown(true)
              } else {
                setShowDropdown(false)
              }
            }}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 200)
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
            placeholder={placeholder}
          />
          
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {repuestos.length > 0 ? (
              <>
                {repuestos.map((repuesto) => (
                  <div
                    key={repuesto.id}
                    onClick={() => handleSelectRepuesto(repuesto)}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{repuesto.item}</div>
                        <div className="text-sm text-gray-500">{repuesto.categoria}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-gray-600">
                          ${repuesto.precio_venta}
                        </span>
                        <span className={`text-xs ${getStockColor(repuesto.cantidad)}`}>
                          Stock: {repuesto.cantidad}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <div
                    onClick={handleMostrarFormularioNuevo}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 text-blue-600"
                  >
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Agregar nuevo repuesto
                    </div>
                  </div>
                </div>
              </>
            ) : query.length >= 2 && !loading ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                <div>No se encontraron repuestos</div>
                <div
                  onClick={handleMostrarFormularioNuevo}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 mt-1"
                >
                  → Agregar "{query}" como nuevo repuesto
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default RepuestoAutocomplete