// src/components/CotizacionesSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check,
  ExternalLink,
  User,
  Package,
  DollarSign,
  Weight,
  Percent,
  Truck,
  TrendingUp,
  FileText,
  Eye
} from 'lucide-react';
import { useImportaciones } from '../lib/importaciones.js';
import CotizacionModal from './CotizacionModal';

const CotizacionesSection = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCotizacion, setEditingCotizacion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);
  const [filteredCotizaciones, setFilteredCotizaciones] = useState([]);

  const {
    importaciones,
    loading,
    error,
    fetchByEstado,
    createCotizacion,
    updateImportacion,
    aprobarCotizacion,
    deleteImportacion,
    getEstadisticas
  } = useImportaciones();

  useEffect(() => {
    loadCotizaciones();
    loadEstadisticas();
  }, []);

  useEffect(() => {
    // Filtrar cotizaciones por término de búsqueda
    if (searchTerm.length >= 2) {
      const filtered = importaciones.filter(cotizacion =>
        cotizacion.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cotizacion.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cotizacion.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cotizacion.clientes?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCotizaciones(filtered);
    } else {
      setFilteredCotizaciones(importaciones);
    }
  }, [searchTerm, importaciones]);

  const loadCotizaciones = async () => {
    await fetchByEstado('cotizacion');
  };

  const loadEstadisticas = async () => {
    const stats = await getEstadisticas();
    setEstadisticas(stats);
  };

  const handleCreateCotizacion = async (cotizacionData) => {
    try {
      await createCotizacion(cotizacionData);
      setShowModal(false);
      loadEstadisticas();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCotizacion = async (cotizacionData) => {
    try {
      await updateImportacion(editingCotizacion.id, cotizacionData);
      setEditingCotizacion(null);
      setShowModal(false);
      loadEstadisticas();
    } catch (error) {
      throw error;
    }
  };

  const handleAprobarCotizacion = async (cotizacion) => {
    if (window.confirm(`¿Aprobar la cotización "${cotizacion.descripcion}"? Pasará a pendientes de compra.`)) {
      try {
        await aprobarCotizacion(cotizacion.id);
        loadEstadisticas();
        alert('✅ Cotización aprobada exitosamente!');
      } catch (error) {
        alert('❌ Error al aprobar cotización: ' + error.message);
      }
    }
  };

  const handleDeleteCotizacion = async (cotizacion) => {
    if (window.confirm(`¿Estás seguro de eliminar la cotización "${cotizacion.descripcion}"?`)) {
      try {
        await deleteImportacion(cotizacion.id);
        loadEstadisticas();
        alert('✅ Cotización eliminada exitosamente!');
      } catch (error) {
        alert('❌ Error al eliminar cotización: ' + error.message);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'cotizacion':
        return 'bg-blue-100 text-blue-800';
      case 'pendiente_compra':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_transito':
        return 'bg-purple-100 text-purple-800';
      case 'finalizada':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calculator className="w-10 h-10 text-white opacity-80" />
          <div>
            <h2 className="text-4xl font-bold text-white">Cotizaciones</h2>
            <p className="text-white/80 text-xl mt-2">Gestión de cotizaciones de importaciones</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingCotizacion(null);
            setShowModal(true);
          }}
          className="bg-white text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-medium transition-colors shadow"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800">Cotizaciones</p>
                <p className="text-2xl font-bold text-blue-900">{estadisticas.cotizaciones}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800">Pendientes</p>
                <p className="text-2xl font-bold text-blue-900">{estadisticas.pendientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800">En Tránsito</p>
                <p className="text-2xl font-bold text-blue-900">{estadisticas.enTransito}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800">Monto Total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(estadisticas.montoTotal)}
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
            placeholder="Buscar por descripción, proveedor, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Lista de cotizaciones */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">
            {loading ? 'Cargando...' : `${filteredCotizaciones.length} cotizaciones`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando cotizaciones...</p>
          </div>
        ) : filteredCotizaciones.length === 0 ? (
          <div className="p-8 text-center">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No se encontraron cotizaciones</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primera cotización'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCotizaciones.map((cotizacion) => (
              <div key={cotizacion.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header de la cotización */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {cotizacion.descripcion}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>
                              {cotizacion.clientes?.nombre} {cotizacion.clientes?.apellido}
                            </span>
                          </div>
                          {cotizacion.proveedor_nombre && (
                            <div className="flex items-center space-x-1">
                              <Package className="w-4 h-4" />
                              <span>{cotizacion.proveedor_nombre}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadge(cotizacion.estado)}`}>
                        Cotización
                      </span>
                    </div>

                    {/* Detalles de la cotización */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">Precio compra:</span>
                          <span className="font-medium">{formatCurrency(cotizacion.precio_compra_usd)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Weight className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-600">Peso estimado:</span>
                          <span className="font-medium">{cotizacion.peso_estimado_kg} kg</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Percent className="w-4 h-4 text-orange-600" />
                          <span className="text-gray-600">Impuestos USA:</span>
                          <span className="font-medium">{cotizacion.impuestos_usa_porcentaje}%</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Truck className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-600">Envío USD:</span>
                          <span className="font-medium">
                            {formatCurrency(cotizacion.envio_usa_fijo + cotizacion.envio_arg_fijo)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-teal-600" />
                          <span className="text-gray-600">Precio/kg:</span>
                          <span className="font-medium">{formatCurrency(cotizacion.precio_por_kg)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-lg text-green-600">
                            {formatCurrency(cotizacion.total_cotizado)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Link del producto y fecha */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {cotizacion.link_producto && (
                          <a
                            href={cotizacion.link_producto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Ver producto</span>
                          </a>
                        )}
                        <span>Creado: {formatFecha(cotizacion.fecha_creacion)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleAprobarCotizacion(cotizacion)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Aprobar cotización"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCotizacion(cotizacion);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar cotización"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCotizacion(cotizacion)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar cotización"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CotizacionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCotizacion(null);
        }}
        onSave={editingCotizacion ? handleUpdateCotizacion : handleCreateCotizacion}
        cotizacion={editingCotizacion}
      />
    </div>
  );
};

export default CotizacionesSection;