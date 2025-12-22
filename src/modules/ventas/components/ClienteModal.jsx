// src/components/ClienteModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Briefcase, FileText } from 'lucide-react';

const ClienteModal = ({ isOpen, onClose, onSave, cliente = null, clientesParaReferido = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cumpleanos: '',
    procedencia: '',
    profesion: '',
    notas: '',
    referido_por: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchReferido, setSearchReferido] = useState('');

  const procedenciaOptions = [
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'facebook', label: 'Facebook', icon: '👥' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'referidos', label: 'Referidos', icon: '🤝' },
    { value: 'conocidos', label: 'Conocidos', icon: '👋' },
    { value: 'otro', label: 'Otro', icon: '❓' }
  ];

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        cumpleanos: cliente.cumpleanos || '',
        procedencia: cliente.procedencia || '',
        profesion: cliente.profesion || '',
        notas: cliente.notas || '',
        referido_por: cliente.referido_por || null
      });
      // Si tiene referido_por, buscar el nombre del cliente referidor
      if (cliente.referido_por && clientesParaReferido.length > 0) {
        const referidor = clientesParaReferido.find(c => c.id === cliente.referido_por);
        if (referidor) {
          setSearchReferido(`${referidor.nombre} ${referidor.apellido}`);
        }
      } else {
        setSearchReferido('');
      }
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        cumpleanos: '',
        procedencia: '',
        profesion: '',
        notas: '',
        referido_por: null
      });
      setSearchReferido('');
    }
    setErrors({});
  }, [cliente, isOpen, clientesParaReferido]);

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

    // Validar que si procedencia es 'referidos', se debe seleccionar quién lo refirió
    if (formData.procedencia === 'referidos' && !formData.referido_por) {
      newErrors.referido_por = 'Debe seleccionar quién refirió a este cliente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando cliente:', error);
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

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center space-x-2">
            <User className="w-6 h-6 text-emerald-600" />
            <span>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
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
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.nombre ? 'border-red-500' : 'border-slate-200'
                  }`}
                placeholder="Ingresa el nombre"
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
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.apellido ? 'border-red-500' : 'border-slate-200'
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
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.email ? 'border-red-500' : 'border-slate-200'
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
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.telefono ? 'border-red-500' : 'border-slate-200'
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
                <Calendar className="w-4 h-4 inline mr-1" />
                Cumpleaños
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
                    {option.label} {option.icon}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Cliente Referidor - Solo visible cuando procedencia es 'referidos' */}
          {formData.procedencia === 'referidos' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🤝 ¿Quién lo refirió? *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchReferido}
                  onChange={(e) => setSearchReferido(e.target.value)}
                  placeholder="Buscar cliente que lo refirió..."
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.referido_por ? 'border-red-500' : 'border-slate-200'
                    }`}
                />
                {formData.referido_por && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between">
                    <span className="text-emerald-800 text-sm">
                      ✅ {clientesParaReferido.find(c => c.id === formData.referido_por)?.nombre} {clientesParaReferido.find(c => c.id === formData.referido_por)?.apellido}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('referido_por', null);
                        setSearchReferido('');
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                )}
                {searchReferido && !formData.referido_por && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-300 rounded shadow-lg max-h-40 overflow-y-auto">
                    {clientesParaReferido
                      .filter(c =>
                        `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchReferido.toLowerCase()) ||
                        c.telefono?.includes(searchReferido)
                      )
                      .slice(0, 5)
                      .map(clienteRef => (
                        <button
                          key={clienteRef.id}
                          type="button"
                          onClick={() => {
                            handleChange('referido_por', clienteRef.id);
                            setSearchReferido(`${clienteRef.nombre} ${clienteRef.apellido}`);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
                        >
                          <span className="font-medium">{clienteRef.nombre} {clienteRef.apellido}</span>
                          {clienteRef.telefono && (
                            <span className="text-slate-500 text-sm ml-2">({clienteRef.telefono})</span>
                          )}
                        </button>
                      ))
                    }
                    {clientesParaReferido.filter(c =>
                      `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchReferido.toLowerCase())
                    ).length === 0 && (
                        <div className="px-3 py-2 text-slate-500 text-sm">No se encontraron clientes</div>
                      )}
                  </div>
                )}
              </div>
              {errors.referido_por && (
                <p className="text-red-500 text-sm mt-1">{errors.referido_por}</p>
              )}
            </div>
          )}

          {/* Profesión */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notas
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
              onClick={onClose}
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
              {loading ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModal;