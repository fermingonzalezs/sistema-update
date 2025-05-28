import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Settings,
  User,
  Monitor,
  Trash2,
  Eye
} from 'lucide-react';
import { useReparaciones } from '../lib/supabase.js'; // Importar el hook

const ReparacionesSection = () => {
  // Usar el hook de reparaciones en lugar del estado local
  const { 
    reparaciones, 
    loading, 
    error, 
    fetchReparaciones, 
    crearReparacion, 
    cambiarEstado, 
    eliminarReparacion 
  } = useReparaciones();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    equipo_tipo: 'Notebook',
    equipo_marca: '',
    equipo_modelo: '',
    equipo_serial: '',
    problema_reportado: '',
    diagnostico: '',
    presupuesto: '',
    costo_repuestos: '',
    tiempo_estimado: '',
    tecnico_asignado: '',
    prioridad: 'media',
    observaciones: ''
  });

  // Estados de reparación
  const estados = [
    { id: 'ingresado', label: 'Ingresado', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { id: 'diagnosticando', label: 'Diagnosticando', color: 'bg-yellow-100 text-yellow-800', icon: Search },
    { id: 'presupuestado', label: 'Presupuestado', color: 'bg-purple-100 text-purple-800', icon: FileText },
    { id: 'aprobado', label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { id: 'reparando', label: 'Reparando', color: 'bg-orange-100 text-orange-800', icon: Settings },
    { id: 'terminado', label: 'Terminado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    { id: 'entregado', label: 'Entregado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    { id: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

  // Cargar reparaciones al iniciar el componente
  useEffect(() => {
    fetchReparaciones();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.cliente_nombre || !formData.cliente_telefono || !formData.problema_reportado) {
      alert('Por favor completa los campos obligatorios (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      // Usar el servicio de Supabase para crear la reparación
      await crearReparacion(formData);

      // Limpiar formulario después del éxito
      setFormData({
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_email: '',
        equipo_tipo: 'Notebook',
        equipo_marca: '',
        equipo_modelo: '',
        equipo_serial: '',
        problema_reportado: '',
        diagnostico: '',
        presupuesto: '',
        costo_repuestos: '',
        tiempo_estimado: '',
        tecnico_asignado: '',
        prioridad: 'media',
        observaciones: ''
      });

      alert('✅ Reparación creada exitosamente!');
    } catch (error) {
      console.error('Error creando reparación:', error);
      alert(`❌ Error al crear la reparación: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCambiarEstado = async (reparacionId, nuevoEstado) => {
    try {
      await cambiarEstado(reparacionId, nuevoEstado);
      alert('✅ Estado actualizado exitosamente!');
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert(`❌ Error al actualizar el estado: ${error.message}`);
    }
  };

  const handleEliminarReparacion = async (reparacionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta reparación?')) {
      return;
    }

    try {
      await eliminarReparacion(reparacionId);
      alert('✅ Reparación eliminada exitosamente!');
    } catch (error) {
      console.error('Error eliminando reparación:', error);
      alert(`❌ Error al eliminar la reparación: ${error.message}`);
    }
  };

  const getEstadoInfo = (estadoId) => {
    return estados.find(e => e.id === estadoId) || estados[0];
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reparaciones</h2>
          <p className="text-gray-600">Gestión completa de reparaciones</p>
        </div>
      </div>

      {/* Mostrar errores si los hay */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700 font-medium">Error:</p>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Formulario de nueva reparación */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Nueva Reparación</h3>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Información del Cliente */}
              <div className="md:col-span-3">
                <h4 className="text-md font-medium text-gray-700 mb-4">Información del Cliente</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  name="cliente_nombre"
                  value={formData.cliente_nombre}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="cliente_telefono"
                  value={formData.cliente_telefono}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="cliente_email"
                  value={formData.cliente_email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Información del Equipo */}
              <div className="md:col-span-3">
                <h4 className="text-md font-medium text-gray-700 mb-4 mt-6">Información del Equipo</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Equipo
                </label>
                <select
                  name="equipo_tipo"
                  value={formData.equipo_tipo}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Notebook">Notebook</option>
                  <option value="iPhone">iPhone</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  name="equipo_marca"
                  value={formData.equipo_marca}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  name="equipo_modelo"
                  value={formData.equipo_modelo}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial
                </label>
                <input
                  type="text"
                  name="equipo_serial"
                  value={formData.equipo_serial}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Detalles de la Reparación */}
              <div className="md:col-span-3">
                <h4 className="text-md font-medium text-gray-700 mb-4 mt-6">Detalles de la Reparación</h4>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problema Reportado *
                </label>
                <textarea
                  name="problema_reportado"
                  value={formData.problema_reportado}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Describe detalladamente el problema reportado por el cliente..."
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico (opcional)
                </label>
                <textarea
                  name="diagnostico"
                  value={formData.diagnostico}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Diagnóstico técnico del problema..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presupuesto (USD)
                </label>
                <input
                  type="number"
                  name="presupuesto"
                  value={formData.presupuesto}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo Repuestos (USD)
                </label>
                <input
                  type="number"
                  name="costo_repuestos"
                  value={formData.costo_repuestos}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo Estimado
                </label>
                <input
                  type="text"
                  name="tiempo_estimado"
                  value={formData.tiempo_estimado}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="ej: 2-3 días"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Técnico Asignado
                </label>
                <input
                  type="text"
                  name="tecnico_asignado"
                  value={formData.tecnico_asignado}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Nombre del técnico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Reparación'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de reparaciones */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Lista de Reparaciones ({reparaciones.length})
            </h3>
            <button
              onClick={fetchReparaciones}
              disabled={loading}
              className="text-orange-600 hover:text-orange-800 font-medium disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-6 text-center">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Cargando reparaciones desde Supabase...</span>
            </div>
          </div>
        )}

        {!loading && reparaciones.length === 0 && (
          <div className="p-8 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay reparaciones</h4>
            <p className="text-gray-500">Las reparaciones aparecerán aquí cuando se agreguen</p>
          </div>
        )}

        {!loading && reparaciones.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problema</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presupuesto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reparaciones.map((reparacion) => {
                  const estadoInfo = getEstadoInfo(reparacion.estado);

                  return (
                    <tr key={reparacion.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                        {reparacion.numero}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{reparacion.cliente_nombre}</p>
                          <p className="text-xs text-gray-500">{reparacion.cliente_telefono}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{reparacion.equipo_marca} {reparacion.equipo_modelo}</p>
                          <p className="text-xs text-gray-500">{reparacion.equipo_tipo}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={reparacion.problema_reportado}>
                          {reparacion.problema_reportado}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={reparacion.estado}
                          onChange={(e) => handleCambiarEstado(reparacion.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${estadoInfo.color} focus:ring-2 focus:ring-orange-500`}
                        >
                          {estados.map(estado => (
                            <option key={estado.id} value={estado.id}>{estado.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {reparacion.tecnico_asignado || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {reparacion.presupuesto ? `${reparacion.presupuesto}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(reparacion.fecha_ingreso).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reparacion.prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                          reparacion.prioridad === 'alta' ? 'bg-orange-100 text-orange-800' :
                          reparacion.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {reparacion.prioridad?.toUpperCase() || 'MEDIA'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEliminarReparacion(reparacion.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReparacionesSection;