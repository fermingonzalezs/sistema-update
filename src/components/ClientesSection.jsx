// src/components/ClientesSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  MapPin,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { useClientes } from '../lib/clientes.js';
import ClienteModal from './ClienteModal';

const ClientesSection = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);

  const {
    clientes,
    loading,
    error,
    fetchClientes,
    searchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getEstadisticas
  } = useClientes();

  useEffect(() => {
    fetchClientes();
    loadEstadisticas();
  }, [fetchClientes]);

  const loadEstadisticas = async () => {
    const stats = await getEstadisticas();
    setEstadisticas(stats);
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      await searchClientes(term);
    } else if (term.length === 0) {
      await fetchClientes();
    }
  };

  const handleCreateCliente = async (clienteData) => {
    try {
      await createCliente(clienteData);
      setShowModal(false);
      loadEstadisticas();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCliente = async (clienteData) => {
    try {
      await updateCliente(editingCliente.id, clienteData);
      setEditingCliente(null);
      setShowModal(false);
      loadEstadisticas();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteCliente = async (cliente) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${cliente.nombre} ${cliente.apellido}?`)) {
      try {
        await deleteCliente(cliente.id);
        loadEstadisticas();
      } catch (error) {
        alert('Error al eliminar cliente: ' + error.message);
      }
    }
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

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
        </div>
        <button
          onClick={() => {
            setEditingCliente(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Estadísticas simples */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-800">{estadisticas.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Nuevos este mes</p>
                <p className="text-2xl font-bold text-gray-800">{estadisticas.nuevosEsteMs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Próximos cumpleaños</p>
                <p className="text-2xl font-bold text-gray-800">
                  {estadisticas.proximosCumpleanos?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">
            {loading ? 'Cargando...' : `${clientes.length} clientes`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No se encontraron clientes</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer cliente'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {clientes.map((cliente) => {
              const procedencia = formatProcedencia(cliente.procedencia);
              
              return (
                <div key={cliente.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {cliente.nombre} {cliente.apellido}
                        </h4>
                        {cliente.procedencia && (
                          <span className={`px-2 py-1 rounded-full text-xs ${procedencia.color}`}>
                            {procedencia.icon} {procedencia.label}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          {cliente.telefono && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{cliente.telefono}</span>
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>{cliente.email}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          {cliente.profesion && (
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{cliente.profesion}</span>
                            </div>
                          )}
                          {cliente.cumpleanos && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Cumple: {formatFecha(cliente.cumpleanos)}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500">
                          <p>Creado: {formatFecha(cliente.fecha_creacion)}</p>
                          {cliente.notas && (
                            <p className="mt-1 italic">"{cliente.notas}"</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingCliente(cliente);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar cliente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCliente(cliente)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <ClienteModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCliente(null);
        }}
        onSave={editingCliente ? handleUpdateCliente : handleCreateCliente}
        cliente={editingCliente}
      />
    </div>
  );
};

export default ClientesSection;