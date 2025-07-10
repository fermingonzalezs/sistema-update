// src/components/ClienteSelector.jsx - VERSIÓN CON PORTAL CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, User, Plus, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { useClientes } from '../hooks/useClientes.js';

// ✅ MODAL CON PORTAL - Para evitar conflictos de z-index
const ClienteModalPortal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cumpleanos: '',
    procedencia: '',
    profesion: '',
    notas: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const procedenciaOptions = [
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'facebook', label: 'Facebook', icon: '👥' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'conocidos', label: 'Conocidos', icon: '👋' },
    { value: 'otro', label: 'Otro', icon: '❓' }
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        cumpleanos: '',
        procedencia: '',
        profesion: '',
        notas: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefono && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ Prevenir propagación
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('🔄 Guardando cliente desde portal...', formData);
      await onSave(formData);
      console.log('✅ Cliente guardado exitosamente desde portal');
    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
      alert('Error guardando cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleClose = (e) => {
    e?.stopPropagation(); // ✅ Prevenir propagación
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }} // ✅ Z-index muy alto
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // ✅ Prevenir cierre al hacer clic dentro
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <User className="w-6 h-6 text-emerald-600" />
            <span>Nuevo Cliente</span>
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.nombre ? 'border-red-500' : 'border-slate-200'
                }`}
                placeholder="Ingresa el nombre"
                autoFocus
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Apellido *
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.apellido ? 'border-red-500' : 'border-slate-200'
                }`}
                placeholder="Ingresa el apellido"
              />
              {errors.apellido && (
                <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>
              )}
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.email ? 'border-red-500' : 'border-slate-200'
                }`}
                placeholder="ejemplo@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.telefono ? 'border-red-500' : 'border-slate-200'
                }`}
                placeholder="+54 221 123-4567"
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
              )}
            </div>
          </div>

          {/* Cumpleaños y Procedencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                📅 Cumpleaños
              </label>
              <input
                type="date"
                value={formData.cumpleanos}
                onChange={(e) => handleChange('cumpleanos', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Procedencia
              </label>
              <select
                value={formData.procedencia}
                onChange={(e) => handleChange('procedencia', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Seleccionar...</option>
                {procedenciaOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Profesión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Profesión
            </label>
            <input
              type="text"
              value={formData.profesion}
              onChange={(e) => handleChange('profesion', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: Ingeniero, Docente, Médico..."
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Notas adicionales sobre el cliente..."
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ✅ USAR PORTAL para renderizar fuera del tree principal
  return ReactDOM.createPortal(modalContent, document.body);
};

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


  // Debounce para búsqueda de clientes
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setSearchLoading(true);
        try {
          const resultados = await searchClientes(searchTerm);
          setFilteredClientes(resultados);
        } finally {
          setSearchLoading(false);
        }
      } else if (searchTerm.length === 0) {
        setFilteredClientes(clientes);
        setSearchLoading(false);
      } else {
        // Si tiene 1 carácter, mostrar lista vacía
        setFilteredClientes([]);
        setSearchLoading(false);
      }
    }, 300);
    
    return () => {
      clearTimeout(handler);
      setSearchLoading(false);
    };
  }, [searchTerm, searchClientes]);

  // Inicializar filteredClientes con todos los clientes cuando estos cambien
  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredClientes(clientes);
    }
  }, [clientes, searchTerm]);

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
      
    } catch (error) {
      console.error('❌ Error creando cliente:', error);
      alert('❌ Error creando cliente: ' + error.message);
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
          className={`w-full pl-10 pr-10 py-3 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            required && !selectedCliente ? 'border-red-300 bg-red-50' : 'border-slate-200'
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
        <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg max-h-80 overflow-y-auto">
          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-200 flex items-center space-x-3 text-emerald-600 transition-colors"
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
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
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
      <ClienteModalPortal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleCreateCliente}
      />
    </div>
  );
};

export default ClienteSelector;