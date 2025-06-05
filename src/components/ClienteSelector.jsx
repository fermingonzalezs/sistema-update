// src/components/ClienteSelector.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Plus, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { useClientes } from '../lib/clientes.js';
import ClienteModal from './ClienteModal';

const ClienteSelector = ({ selectedCliente, onSelectCliente, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false); // ✅ NUEVO: Estado para tracking
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { clientes, loading, fetchClientes, createCliente, searchClientes } = useClientes();

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchClientes(searchTerm);
    } else if (searchTerm.length === 0) {
      setFilteredClientes(clientes);
    }
  }, [searchTerm, searchClientes, clientes]);

  useEffect(() => {
    setFilteredClientes(clientes);
  }, [clientes]);

  // Cerrar dropdown al hacer clic fuera, PERO NO si se está creando cliente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) && 
          !creatingClient) { // ✅ No cerrar si se está creando cliente
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [creatingClient]); // ✅ Dependencia agregada

  const handleSelectCliente = (cliente) => {
    onSelectCliente(cliente);
    setSearchTerm(`${cliente.nombre} ${cliente.apellido}`);
    setIsOpen(false);
  };

  const handleCreateCliente = async (clienteData) => {
    setCreatingClient(true); // ✅ Marcar que se está creando
    
    try {
      console.log('🔄 Creando cliente desde selector...', clienteData);
      const nuevoCliente = await createCliente(clienteData);
      console.log('✅ Cliente creado exitosamente:', nuevoCliente);
      
      // ✅ SELECCIONAR INMEDIATAMENTE el cliente recién creado
      handleSelectCliente(nuevoCliente);
      
      // ✅ CERRAR MODAL solo después del éxito
      setShowModal(false);
      
      // ✅ Mostrar mensaje de éxito SIN BLOQUEAR
      setTimeout(() => {
        alert('✅ Cliente creado y seleccionado exitosamente!');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error creando cliente:', error);
      
      // ✅ MANTENER MODAL ABIERTO en caso de error
      alert('❌ Error creando cliente: ' + error.message);
      
      // ✅ NO lanzar error para evitar cierre inesperado
      // throw error; // ❌ REMOVIDO
      
    } finally {
      setCreatingClient(false); // ✅ Siempre limpiar el estado
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!isOpen && !creatingClient) setIsOpen(true); // ✅ No abrir si se está creando cliente
    
    // Si se borra el input, deseleccionar cliente
    if (value === '') {
      onSelectCliente(null);
    }
  };

  const handleOpenModal = () => {
    setCreatingClient(true);
    setShowModal(true);
    setIsOpen(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCreatingClient(false); // ✅ Limpiar estado al cerrar
  };

  const formatProcedencia = (procedencia) => {
    const procedenciaMap = {
      'instagram': { label: 'Instagram', icon: '📸', color: 'bg-pink-100 text-pink-800' },
      'facebook': { label: 'Facebook', icon: '👥', color: 'bg-blue-100 text-blue-800' },
      'whatsapp': { label: 'WhatsApp', icon: '💬', color: 'bg-green-100 text-green-800' },
      'conocidos': { label: 'Conocidos', icon: '👋', color: 'bg-purple-100 text-purple-800' },
      'otro': { label: 'Otro', icon: '❓', color: 'bg-gray-100 text-gray-800' }
    };
    return procedenciaMap[procedencia] || procedenciaMap.otro;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => !creatingClient && setIsOpen(true)} // ✅ No abrir si se está creando
          placeholder="Buscar cliente por nombre, teléfono, email..."
          className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            required && !selectedCliente ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          disabled={creatingClient} // ✅ Deshabilitar mientras se crea cliente
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {required && !selectedCliente && !creatingClient && (
        <p className="text-red-500 text-sm mt-1">Debe seleccionar un cliente</p>
      )}

      {/* ✅ INDICADOR de creación en progreso */}
      {creatingClient && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          🔄 Creando cliente... Por favor espere.
        </div>
      )}

      {/* Dropdown - Solo mostrar si NO se está creando cliente */}
      {isOpen && !creatingClient && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* Botón para crear nuevo cliente */}
          <button
            onClick={handleOpenModal}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 flex items-center space-x-3 text-blue-600"
            disabled={creatingClient}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Crear nuevo cliente</span>
          </button>

          {/* Lista de clientes */}
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Buscando clientes...
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron clientes</p>
              {searchTerm && (
                <p className="text-sm">Intenta con otros términos o crea un nuevo cliente</p>
              )}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {filteredClientes.map((cliente) => {
                const procedencia = formatProcedencia(cliente.procedencia);
                
                return (
                  <button
                    key={cliente.id}
                    onClick={() => handleSelectCliente(cliente)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    disabled={creatingClient}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </h4>
                          {cliente.procedencia && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${procedencia.color}`}>
                              {procedencia.icon} {procedencia.label}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {cliente.telefono && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{cliente.telefono}</span>
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span>{cliente.email}</span>
                            </div>
                          )}
                          {cliente.profesion && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Briefcase className="w-3 h-3" />
                              <span>{cliente.profesion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal para crear cliente */}
      <ClienteModal
        isOpen={showModal}
        onClose={handleCloseModal} // ✅ Usar handler mejorado
        onSave={handleCreateCliente}
      />
    </div>
  );
};

export default ClienteSelector;