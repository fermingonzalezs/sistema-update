// src/components/ClienteSelector.jsx - VERSIÓN CON PORTAL CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, User, Plus, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { useClientes } from '../hooks/useClientes.js';
import { clienteMatchesSearch } from '../utils/stringUtils';
import ClienteModal from './ClienteModal';


const ClienteSelector = ({ selectedCliente, onSelectCliente, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { clientes, loading, fetchClientes, createCliente, searchClientes } = useClientes();

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);


  // Inicializar filteredClientes con todos los clientes cuando estos cambien
  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredClientes(clientes);
    }
  }, [clientes, searchTerm]);

  // Debounce para búsqueda de clientes con normalización (sin acentos, espacios, mayúsculas)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length === 0) {
        // Mostrar todos los clientes cuando no hay búsqueda
        setFilteredClientes(clientes);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);

      // Filtrado client-side con normalización de acentos, espacios y mayúsculas
      const filtered = clientes.filter(cliente =>
        clienteMatchesSearch(cliente, searchTerm)
      );

      setFilteredClientes(filtered);
      setSearchLoading(false);
    }, 300);

    return () => {
      clearTimeout(handler);
      setSearchLoading(false);
    };
  }, [searchTerm, clientes]);

  // ✅ CERRAR DROPDOWN - Sin interferir con el modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !showModal) { // ✅ Solo cerrar si no hay modal
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  const handleSelectCliente = (cliente) => {
    onSelectCliente(cliente);
    setSearchTerm(`${cliente.nombre} ${cliente.apellido}`);
    setIsOpen(false);
  };

  // ✅ HANDLER DE CREACIÓN SIMPLIFICADO
  const handleCreateCliente = async (clienteData) => {
    setCreatingClient(true);

    try {
      console.log('🔄 Creando cliente desde selector...', clienteData);
      const nuevoCliente = await createCliente(clienteData);
      console.log('✅ Cliente creado exitosamente:', nuevoCliente);

      // ✅ SELECCIONAR INMEDIATAMENTE
      handleSelectCliente(nuevoCliente);

      // ✅ CERRAR MODAL
      setShowModal(false);

      // ✅ RETORNAR CLIENTE PARA CREAR REFERIDOS
      return nuevoCliente;

    } catch (error) {
      console.error('❌ Error creando cliente:', error);
      alert('❌ Error creando cliente: ' + error.message);
      throw error;
    } finally {
      setCreatingClient(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!isOpen && !showModal) {
      setIsOpen(true);
    }

    if (value === '') {
      onSelectCliente(null);
    }
  };

  const handleOpenModal = (e) => {
    e?.stopPropagation();
    setShowModal(true);
    setIsOpen(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCreatingClient(false);
  };

  const formatProcedencia = (procedencia) => {
    const procedenciaMap = {
      'instagram': { label: 'Instagram', icon: '📸', color: 'bg-slate-100 text-slate-600' },
      'facebook': { label: 'Facebook', icon: '👥', color: 'bg-slate-100 text-slate-600' },
      'whatsapp': { label: 'WhatsApp', icon: '💬', color: 'bg-emerald-100 text-emerald-600' },
      'conocidos': { label: 'Conocidos', icon: '👋', color: 'bg-slate-100 text-slate-600' },
      'otro': { label: 'Otro', icon: '❓', color: 'bg-slate-100 text-slate-600' }
    };
    return procedenciaMap[procedencia] || procedenciaMap.otro;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User className="h-5 w-5 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => !showModal && setIsOpen(true)}
          placeholder="Buscar cliente por nombre, teléfono, email..."
          className={`w-full pl-10 pr-10 py-2 border rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${required && !selectedCliente ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          disabled={creatingClient}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      {required && !selectedCliente && !creatingClient && (
        <p className="text-red-500 text-sm mt-1">Debe seleccionar un cliente</p>
      )}

      {creatingClient && (
        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800">
          🔄 Creando cliente... Por favor espere.
        </div>
      )}

      {/* DROPDOWN */}
      {isOpen && !showModal && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-slate-300 rounded shadow-lg max-h-80 overflow-y-auto">
          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full px-4 py-3 text-left hover:bg-slate-100 border-b border-slate-300 flex items-center space-x-3 text-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Crear nuevo cliente</span>
          </button>

          {searchLoading ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
              Buscando clientes...
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
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
                    type="button"
                    onClick={() => handleSelectCliente(cliente)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-100 border-b border-slate-200 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-slate-800">
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
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{cliente.telefono}</span>
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span>{cliente.email}</span>
                            </div>
                          )}
                          {cliente.profesion && (
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
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

      {/* ✅ MODAL CON PORTAL - Renderizado fuera del componente */}
      <ClienteModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleCreateCliente}
        clientesParaReferido={clientes}
      />
    </div>
  );
};

export default ClienteSelector;