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
import Tarjeta from '../../../shared/components/layout/Tarjeta.jsx';

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
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'cotizacion':
        return 'bg-slate-100 text-slate-800';
      case 'pendiente_compra':
        return 'bg-slate-100 text-slate-800';
      case 'en_transito':
        return 'bg-slate-100 text-slate-800';
      case 'finalizada':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="">
      {/* Header eliminado para ganar espacio */}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
         
          <Tarjeta
            icon={FileText}
            titulo="Cotizaciones"
            valor={estadisticas.cotizaciones}
          />
    
          <Tarjeta
            icon={Package}
            titulo="Pendientes"
            valor={estadisticas.pendientes}
          />

       

          <Tarjeta
            icon={Truck}
            titulo="En Tránsito"
            valor={estadisticas.enTransito}
          />

        
          <Tarjeta
            icon={DollarSign}
            titulo="Monto Total"
            valor={formatCurrency(parseInt(estadisticas.montoTotal))}          />

        </div>
      )}

      {/* Búsqueda y Acciones */}
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por descripción, proveedor, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <button
              onClick={() => {
                setEditingCotizacion(null);
                setShowModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cotización</span>
            </button>
          </div>
        </div>
      </div>
      {/* Lista de cotizaciones */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">
            {loading ? 'Cargando...' : `${filteredCotizaciones.length} cotizaciones`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Cargando cotizaciones...</p>
          </div>
        ) : filteredCotizaciones.length === 0 ? (
          <div className="p-8 text-center">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No se encontraron cotizaciones</p>
            <p className="text-sm text-slate-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primera cotización'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredCotizaciones.map((cotizacion) => (
              <div key={cotizacion.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header de la cotización */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {cotizacion.descripcion}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-slate-600">
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
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-slate-600">Precio compra:</span>
                          <span className="font-medium">{formatCurrency(cotizacion.precio_compra_usd)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Weight className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">Peso estimado:</span>
                          <span className="font-medium">{cotizacion.peso_estimado_kg} kg</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Percent className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">Impuestos USA:</span>
                          <span className="font-medium">{cotizacion.impuestos_usa_porcentaje}%</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Truck className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">Envío USD:</span>
                          <span className="font-medium">
                            {formatCurrency(cotizacion.envio_usa_fijo + cotizacion.envio_arg_fijo)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">Precio/kg:</span>
                          <span className="font-medium">{formatCurrency(cotizacion.precio_por_kg)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-slate-600">Total:</span>
                          <span className="font-bold text-lg text-emerald-600">
                            {formatCurrency(cotizacion.total_cotizado)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Link del producto y fecha */}
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center space-x-4">
                        {cotizacion.link_producto && (
                          <a
                            href={cotizacion.link_producto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 transition-colors"
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
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="Aprobar cotización"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCotizacion(cotizacion);
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded transition-colors"
                      title="Editar cotización"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCotizacion(cotizacion)}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded transition-colors"
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