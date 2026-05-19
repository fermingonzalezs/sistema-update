import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, User, Mail, Phone, Calendar, MapPin, Briefcase, FileText } from 'lucide-react';
import ClienteSelector from './ClienteSelector';
import ProfesionSelector from '../../../shared/components/ui/ProfesionSelector';

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
  const [clienteReferidor, setClienteReferidor] = useState(null);

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
      // Si tiene referido_por, buscar el cliente referidor
      if (cliente.referido_por && clientesParaReferido.length > 0) {
        const referidor = clientesParaReferido.find(c => c.id === cliente.referido_por);
        setClienteReferidor(referidor || null);
      } else {
        setClienteReferidor(null);
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
      setClienteReferidor(null);
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

  // Usar Portal para evitar conflictos de z-index
  return ReactDOM.createPortal(
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-end sm:items-center justify-center z-[9999] sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded border border-slate-300 flex flex-col max-h-[95vh] sm:max-h-[90vh] rounded-t-xl sm:rounded">

        {/* Header */}
        <div className="bg-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 rounded-t-xl sm:rounded-t">
          <div className="flex items-center gap-2 text-white">
            <User className="w-5 h-5" />
            <h2 className="text-base font-semibold">{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form — scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-4">

            {/* Nombre y Apellido — siempre 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.nombre ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="Nombre"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => handleChange('apellido', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.apellido ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="Apellido"
                />
                {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="ejemplo@email.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.telefono ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="+54 221 123-4567"
                />
                {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
              </div>
            </div>

            {/* Cumpleaños y Procedencia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />Cumpleaños
                </label>
                <input
                  type="date"
                  value={formData.cumpleanos}
                  onChange={(e) => handleChange('cumpleanos', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />Procedencia
                </label>
                <select
                  value={formData.procedencia}
                  onChange={(e) => handleChange('procedencia', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Seleccionar...</option>
                  {procedenciaOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label} {option.icon}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Referidor */}
            {formData.procedencia === 'referidos' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">¿Quién lo refirió? *</label>
                <ClienteSelector
                  selectedCliente={clienteReferidor}
                  onSelectCliente={(c) => { setClienteReferidor(c); handleChange('referido_por', c?.id || null); }}
                  required={true}
                />
                {errors.referido_por && <p className="text-red-500 text-xs mt-1">{errors.referido_por}</p>}
              </div>
            )}

            {/* Profesión */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Briefcase className="w-3.5 h-3.5 inline mr-1" />Profesión
              </label>
              <ProfesionSelector value={formData.profesion} onChange={(val) => handleChange('profesion', val)} />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <FileText className="w-3.5 h-3.5 inline mr-1" />Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          {/* Footer sticky */}
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-200 flex gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ClienteModal;