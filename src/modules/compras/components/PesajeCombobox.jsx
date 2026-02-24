import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Weight } from 'lucide-react';
import { usePesajes } from '../hooks/usePesajes';
import NuevoPesajeModal from './NuevoPesajeModal';

/**
 * Combobox de pesajes: busca por nombre, autocompleta el peso,
 * o permite crear un nuevo registro desde un modal.
 *
 * Props:
 *  - value: string (nombre del item actual)
 *  - onSelect: ({ nombre, peso_kg }) => void
 */
const PesajeCombobox = ({ value, onSelect }) => {
  const { pesajes } = usePesajes();

  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef(null);

  // Sincronizar cuando el padre resetea el valor
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtrados = query.trim().length === 0
    ? pesajes
    : pesajes.filter(p =>
        p.nombre.toLowerCase().includes(query.trim().toLowerCase())
      );

  const handleSelect = (pesaje) => {
    setQuery(pesaje.nombre);
    setOpen(false);
    onSelect({ nombre: pesaje.nombre, peso_kg: pesaje.peso_kg });
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    // Sincronizar nombre con el padre (peso_kg null para no sobrescribir el peso actual)
    onSelect({ nombre: e.target.value, peso_kg: null });
  };

  const handleModalSuccess = (nuevoPesaje) => {
    setShowModal(false);
    handleSelect(nuevoPesaje);
  };

  const exactMatch = pesajes.find(
    p => p.nombre.toLowerCase() === query.trim().toLowerCase()
  );
  const mostrarCrear = query.trim().length > 0 && !exactMatch;

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Input de búsqueda */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            placeholder="Buscar producto"
            className="w-full border border-slate-200 rounded pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto">
            {/* Resultados */}
            {filtrados.length > 0 ? (
              filtrados.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => handleSelect(p)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-emerald-50 text-left transition-colors"
                >
                  <span className="text-slate-800">{p.nombre}</span>
                  <span className="flex items-center gap-1 text-slate-500 text-xs">
                    <Weight size={12} />
                    {p.peso_kg} kg
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-400 italic">
                No hay coincidencias
              </div>
            )}

            {/* Opción para crear nuevo */}
            {mostrarCrear && (
              <div className="border-t border-slate-200">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setOpen(false); setShowModal(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                >
                  <Plus size={14} />
                  Crear "{query.trim()}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <NuevoPesajeModal
          nombreInicial={query.trim()}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
};

export default PesajeCombobox;
