// src/components/ClienteSelector.jsx - VERSIÓN CON PORTAL CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, User, Plus, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { useClientes } from '../hooks/useClientes.js';
import { clienteMatchesSearch } from '../utils/stringUtils';
import ClienteModal from './ClienteModal';


const ClienteSelector = ({ selectedCliente, onSelectCliente, required = false, theme = 'light' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { clientes, loading, fetchClientes, createCliente, searchClientes } = useClientes();

  // Estilos según tema
  const isGlass = theme === 'glass';
  const inputBg = isGlass ? 'bg-slate-900/50' : (required && !selectedCliente ? 'bg-red-50' : 'bg-white');
  const inputBorder = isGlass ? 'border-slate-700' : (required && !selectedCliente ? 'border-red-300' : 'border-slate-200');
  const inputText = isGlass ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400';
  const inputFocus = isGlass ? 'focus:ring-emerald-500/50 focus:border-emerald-500' : 'focus:ring-emerald-500 focus:border-emerald-500';

  const dropdownBg = isGlass ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300';
  const itemHover = isGlass ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100';
  const itemBorder = isGlass ? 'border-slate-700' : 'border-slate-200';
  const textColor = isGlass ? 'text-slate-200' : 'text-slate-800';
  const subTextColor = isGlass ? 'text-slate-400' : 'text-slate-600';

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredClientes(clientes);
    }
  }, [clientes, searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length === 0) {
        setFilteredClientes(clientes);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !showModal) {
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

  const handleCreateCliente = async (clienteData) => {
    setCreatingClient(true);
    try {
      const nuevoCliente = await createCliente(clienteData);
      handleSelectCliente(nuevoCliente);
      setShowModal(false);
      return nuevoCliente;
    } catch (error) {
      console.error('Error creando cliente:', error);
      alert('Error creando cliente: ' + error.message);
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
          <User className={`h-5 w-5 ${isGlass ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => !showModal && setIsOpen(true)}
          placeholder="Buscar cliente por nombre, teléfono, email..."
          className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 transition-all focus:outline-none ${inputBg} ${inputBorder} ${inputText} ${inputFocus}`}
          disabled={creatingClient}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Search className={`h-5 w-5 ${isGlass ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>
      </div>

      {required && !selectedCliente && !creatingClient && (
        <p className="text-red-500 text-sm mt-1 ml-1 font-medium">Debe seleccionar un cliente</p>
      )}

      {creatingClient && (
        <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500 mr-2"></div>
          Creando cliente... Por favor espere.
        </div>
      )}

      {/* DROPDOWN */}
      {isOpen && !showModal && (
        <div className={`absolute z-40 mt-2 w-full rounded-xl shadow-xl max-h-80 overflow-y-auto backdrop-blur-md ${dropdownBg}`}>
          <button
            type="button"
            onClick={handleOpenModal}
            className={`w-full px-4 py-3 text-left border-b flex items-center space-x-3 text-emerald-500 transition-colors ${itemHover} ${itemBorder}`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Crear nuevo cliente</span>
          </button>

          {searchLoading ? (
            <div className={`px-4 py-8 text-center ${subTextColor}`}>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
              Buscando clientes...
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className={`px-4 py-8 text-center ${subTextColor}`}>
              <User className={`w-8 h-8 mx-auto mb-2 ${isGlass ? 'text-slate-600' : 'text-slate-300'}`} />
              <p>No se encontraron clientes</p>
              {searchTerm && (
                <p className="text-sm">Intenta con otros términos o crea un nuevo cliente</p>
              )}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-1">
              {filteredClientes.map((cliente) => {
                const procedencia = formatProcedencia(cliente.procedencia);

                return (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => handleSelectCliente(cliente)}
                    className={`w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors ${itemHover} ${itemBorder}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-bold ${textColor}`}>
                            {cliente.nombre} {cliente.apellido}
                          </h4>
                          {cliente.procedencia && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${procedencia.color}`}>
                              {procedencia.icon} {procedencia.label}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {cliente.telefono && (
                            <div className={`flex items-center space-x-1 text-xs ${subTextColor}`}>
                              <Phone className="w-3 h-3" />
                              <span>{cliente.telefono}</span>
                            </div>
                          )}
                          {cliente.email && (
                            <div className={`flex items-center space-x-1 text-xs ${subTextColor}`}>
                              <Mail className="w-3 h-3" />
                              <span>{cliente.email}</span>
                            </div>
                          )}
                          {cliente.profesion && (
                            <div className={`flex items-center space-x-1 text-xs ${subTextColor}`}>
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