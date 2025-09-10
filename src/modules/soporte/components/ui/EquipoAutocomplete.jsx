import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const EquipoAutocomplete = ({ onSelect, placeholder = "Buscar equipo por serial...", selectedEquipo = null }) => {
  const [query, setQuery] = useState('')
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [equipoNoListado, setEquipoNoListado] = useState(false)
  const [equipoPersonalizado, setEquipoPersonalizado] = useState({ serial: '', descripcion: '' })

  const buscarEquipos = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setEquipos([])
      return
    }

    setLoading(true)
    try {
      const equiposEncontrados = []

      // Buscar en inventario (computadoras)
      const { data: inventario } = await supabase
        .from('inventario')
        .select('id, serial, marca, modelo, procesador, condicion, disponible')
        .ilike('serial', `%${searchQuery}%`)
        .limit(10)

      if (inventario) {
        inventario.forEach(item => {
          equiposEncontrados.push({
            id: item.id,
            serial: item.serial,
            descripcion: `${item.marca} ${item.modelo} - ${item.procesador}`,
            condicion: item.condicion,
            disponible: item.disponible,
            tabla: 'inventario',
            tipo: 'Computadora'
          })
        })
      }

      // Buscar en celulares
      const { data: celulares } = await supabase
        .from('celulares')
        .select('id, serial, marca, modelo, color, capacidad, condicion, disponible')
        .ilike('serial', `%${searchQuery}%`)
        .limit(10)

      if (celulares) {
        celulares.forEach(item => {
          equiposEncontrados.push({
            id: item.id,
            serial: item.serial,
            descripcion: `${item.marca} ${item.modelo} ${item.color} ${item.capacidad}`,
            condicion: item.condicion,
            disponible: item.disponible,
            tabla: 'celulares',
            tipo: 'Celular'
          })
        })
      }

      // Buscar en reparaciones por número
      const { data: reparaciones } = await supabase
        .from('reparaciones')
        .select('id, numero, cliente_nombre, equipo_tipo, equipo_modelo, estado')
        .or(`numero.ilike.%${searchQuery}%,equipo_modelo.ilike.%${searchQuery}%`)
        .limit(10)

      if (reparaciones) {
        reparaciones.forEach(item => {
          equiposEncontrados.push({
            id: item.id,
            serial: item.numero,
            descripcion: `${item.equipo_tipo} ${item.equipo_modelo} - ${item.cliente_nombre}`,
            condicion: item.estado,
            disponible: true,
            tabla: 'reparaciones',
            tipo: 'Reparación'
          })
        })
      }

      setEquipos(equiposEncontrados)
      setShowDropdown(true)
    } catch (error) {
      console.error('Error buscando equipos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarEquipos(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectEquipo = (equipo) => {
    setQuery(`${equipo.serial} - ${equipo.descripcion}`)
    setShowDropdown(false)
    setEquipoNoListado(false)
    onSelect(equipo)
  }

  const handleEquipoNoListado = () => {
    setEquipoNoListado(true)
    setShowDropdown(false)
    setQuery('')
  }

  const handleEquipoPersonalizadoSubmit = () => {
    if (equipoPersonalizado.serial && equipoPersonalizado.descripcion) {
      const equipoCustom = {
        id: `custom_${Date.now()}`,
        serial: equipoPersonalizado.serial,
        descripcion: equipoPersonalizado.descripcion,
        condicion: 'personalizado',
        disponible: true,
        tabla: 'personalizado',
        tipo: 'Personalizado'
      }
      onSelect(equipoCustom)
      setEquipoNoListado(false)
      setQuery(`${equipoCustom.serial} - ${equipoCustom.descripcion}`)
      setEquipoPersonalizado({ serial: '', descripcion: '' })
    }
  }

  const getEstadoColor = (condicion, disponible) => {
    if (!disponible) return 'text-red-600'
    switch (condicion) {
      case 'nuevo': return 'text-green-600'
      case 'usado': return 'text-blue-600'
      case 'reparacion': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  if (equipoNoListado) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Equipo no listado</h4>
          <button
            onClick={() => {
              setEquipoNoListado(false)
              setQuery('')
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Volver a búsqueda
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Serial/Identificador</label>
            <input
              type="text"
              value={equipoPersonalizado.serial}
              onChange={(e) => setEquipoPersonalizado(prev => ({ ...prev, serial: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ej: ABC123456"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción del equipo</label>
            <input
              type="text"
              value={equipoPersonalizado.descripcion}
              onChange={(e) => setEquipoPersonalizado(prev => ({ ...prev, descripcion: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ej: HP Pavilion 15-dk1xxx"
            />
          </div>
          
          <button
            onClick={handleEquipoPersonalizadoSubmit}
            disabled={!equipoPersonalizado.serial || !equipoPersonalizado.descripcion}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirmar Equipo
          </button>
        </div>
      </div>
    )
  }

  return (
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
            // Delay para permitir clicks en dropdown
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
          {equipos.length > 0 ? (
            <>
              {equipos.map((equipo) => (
                <div
                  key={`${equipo.tabla}-${equipo.id}`}
                  onClick={() => handleSelectEquipo(equipo)}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{equipo.serial}</div>
                      <div className="text-sm text-gray-500">{equipo.descripcion}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{equipo.tipo}</span>
                      <span className={`text-xs mt-1 ${getEstadoColor(equipo.condicion, equipo.disponible)}`}>
                        {equipo.condicion}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="border-t border-gray-200 mt-1 pt-1">
                <div
                  onClick={handleEquipoNoListado}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 text-blue-600"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Equipo no listado
                  </div>
                </div>
              </div>
            </>
          ) : query.length >= 2 && !loading ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              <div>No se encontraron equipos</div>
              <div
                onClick={handleEquipoNoListado}
                className="cursor-pointer text-blue-600 hover:text-blue-800 mt-1"
              >
                → Agregar equipo no listado
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default EquipoAutocomplete