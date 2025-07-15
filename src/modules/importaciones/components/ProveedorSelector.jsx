// src/components/ProveedorSelector.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus } from 'lucide-react';
import { useProveedores } from '../lib/importaciones.js';

const ProveedorSelector = ({ selectedProveedor, onSelectProveedor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(selectedProveedor || '');
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { proveedores, loading, fetchProveedores, createProveedor } = useProveedores();

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  useEffect(() => {
    setSearchTerm(selectedProveedor || '');
  }, [selectedProveedor]);

  useEffect(() => {
    if (searchTerm.length >= 1) {
      const filtered = proveedores.filter(proveedor =>
        proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProveedores(filtered);
    } else {
      setFilteredProveedores(proveedores);
    }
  }, [searchTerm, proveedores]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProveedor = (nombreProveedor) => {
    onSelectProveedor(nombreProveedor);
    setSearchTerm(nombreProveedor);
    setIsOpen(false);
  };

  const handleAddNewProveedor = async () => {
    if (searchTerm.trim() && !proveedores.find(p => p.nombre.toLowerCase() === searchTerm.toLowerCase())) {
      try {
        await createProveedor(searchTerm.trim());
        onSelectProveedor(searchTerm.trim());
        setIsOpen(false);
      } catch (error) {
        console.error('Error creando proveedor:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSelectProveedor(value);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      // Si no hay coincidencia exacta, crear nuevo proveedor
      const existeProveedor = proveedores.find(p => 
        p.nombre.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (!existeProveedor) {
        handleAddNewProveedor();
      } else {
        handleSelectProveedor(existeProveedor.nombre);
      }
    }
  };

  const showAddOption = searchTerm.trim() && 
    !proveedores.find(p => p.nombre.toLowerCase() === searchTerm.toLowerCase()) &&
    filteredProveedores.length === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Package className="h-5 w-5 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar o escribir proveedor..."
          className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Opción para agregar nuevo proveedor */}
          {showAddOption && (
            <button
              type="button"
              onClick={handleAddNewProveedor}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-200 flex items-center space-x-3 text-emerald-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Agregar "{searchTerm}"</span>
            </button>
          )}

          {loading ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
              Cargando proveedores...
            </div>
          ) : filteredProveedores.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No se encontraron proveedores</p>
              {searchTerm && !showAddOption && (
                <p className="text-sm">Intenta con otros términos</p>
              )}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {filteredProveedores.map((proveedor) => (
                <button
                  key={proveedor.id}
                  type="button"
                  onClick={() => handleSelectProveedor(proveedor.nombre)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{proveedor.nombre}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProveedorSelector;