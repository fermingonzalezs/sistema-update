// components/BuscadorCuentasImputables.jsx
// Buscador de Cuentas Imputables para Libro Diario - UPDATE WW SRL
// Filtrar y buscar solo cuentas que pueden recibir asientos contables

import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, ChevronDown, AlertCircle, Hash, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const BuscadorCuentasImputables = ({
  cuentaSeleccionada,
  onCuentaChange,
  required = false,
  className = "",
  placeholder = "Buscar cuenta imputable..."
}) => {
  const [cuentasImputables, setCuentasImputables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar cuentas imputables
  useEffect(() => {
    const cargarCuentasImputables = async () => {
      try {
        setLoading(true);
        setError('');
        
        const { data, error } = await supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre, moneda_original, requiere_cotizacion')
          .eq('activa', true)
          .eq('imputable', true)  // Solo cuentas imputables
          .order('codigo');

        if (error) {
          throw error;
        }

        setCuentasImputables(data || []);
        setFilteredCuentas(data || []);
        
      } catch (err) {
        console.error('Error cargando cuentas imputables:', err);
        setError('Error al cargar cuentas');
      } finally {
        setLoading(false);
      }
    };

    cargarCuentasImputables();
  }, []);

  // Filtrar cuentas según término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCuentas(cuentasImputables);
      return;
    }

    const termino = searchTerm.toLowerCase();
    const filtered = cuentasImputables.filter(cuenta => 
      cuenta.codigo.toLowerCase().includes(termino) ||
      cuenta.nombre.toLowerCase().includes(termino)
    );
    
    setFilteredCuentas(filtered);
  }, [searchTerm, cuentasImputables]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCuentaSelect = (cuenta) => {
    onCuentaChange(cuenta);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
    if (e.key === 'Enter' && filteredCuentas.length === 1) {
      handleCuentaSelect(filteredCuentas[0]);
    }
  };

  const formatCuentaDisplay = (cuenta) => {
    if (!cuenta) return '';
    return `${cuenta.codigo} - ${cuenta.nombre}`;
  };

  const getMonedaLabel = (cuenta) => {
    if (cuenta.requiere_cotizacion) {
      return 'ARS';
    }
    return cuenta.moneda_original || 'USD';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="block text-sm font-medium text-slate-800 mb-2">
        Cuenta {required && '*'}
      </label>
      
      {/* Input principal */}
      <div 
        className={`relative border border-slate-200 rounded cursor-pointer transition-colors ${
          isOpen ? 'ring-2 ring-emerald-600 border-emerald-600' : 'hover:border-slate-300'
        }`}
        onClick={handleInputClick}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center flex-1">
            <Search size={16} className="text-slate-400 mr-3" />
            
            {cuentaSeleccionada ? (
              <div className="flex items-center space-x-3 flex-1">
                <code className="text-sm font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded">
                  {cuentaSeleccionada.codigo}
                </code>
                <span className="text-slate-800 font-medium">
                  {cuentaSeleccionada.nombre}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  getMonedaLabel(cuentaSeleccionada) === 'ARS' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {getMonedaLabel(cuentaSeleccionada)}
                </span>
              </div>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
          
          <ChevronDown 
            size={16} 
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-80 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por código o nombre..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de cuentas */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-600">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full mr-2"></div>
                Cargando cuentas...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600 flex items-center justify-center">
                <AlertCircle size={16} className="mr-2" />
                {error}
              </div>
            ) : filteredCuentas.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                {searchTerm ? 'No se encontraron cuentas' : 'No hay cuentas imputables disponibles'}
              </div>
            ) : (
              filteredCuentas.map((cuenta) => (
                <div
                  key={cuenta.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-b-0 ${
                    cuentaSeleccionada?.id === cuenta.id ? 'bg-emerald-50' : ''
                  }`}
                  onClick={() => handleCuentaSelect(cuenta)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <Hash size={14} className="text-slate-400" />
                        <code className="text-sm font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded">
                          {cuenta.codigo}
                        </code>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FileText size={14} className="text-slate-400" />
                          <span className="text-slate-800 font-medium">
                            {cuenta.nombre}
                          </span>
                        </div>
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        getMonedaLabel(cuenta) === 'ARS' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getMonedaLabel(cuenta)}
                      </span>
                    </div>
                    
                    {cuentaSeleccionada?.id === cuenta.id && (
                      <Check size={16} className="text-emerald-600 ml-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con información */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>{filteredCuentas.length} cuenta{filteredCuentas.length !== 1 ? 's' : ''} imputable{filteredCuentas.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  USD
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                  ARS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isOpen && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <AlertCircle size={14} className="mr-1" />
          {error}
        </div>
      )}
      
      {/* Información de ayuda */}
      {required && !cuentaSeleccionada && (
        <div className="mt-2 text-sm text-slate-600">
          Selecciona una cuenta imputable para continuar
        </div>
      )}
    </div>
  );
};

export default BuscadorCuentasImputables;