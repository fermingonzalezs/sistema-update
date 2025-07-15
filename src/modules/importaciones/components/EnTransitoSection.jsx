// src/components/EnTransitoSection.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  Package, 
  User,
  DollarSign,
  Weight,
  Calendar,
  ExternalLink,
  MapPin,
  Clock,
  Edit,
  Check,
  AlertCircle
} from 'lucide-react';
import { useImportaciones } from '../lib/importaciones.js';
import Tarjeta from '../../../shared/components/layout/Tarjeta.jsx';
import { formatearMonto } from '../../../shared/utils/formatters.js';

const EnTransitoSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEnTransito, setFilteredEnTransito] = useState([]);
  const [editingSeguimiento, setEditingSeguimiento] = useState({});
  const [nuevosSeguimientos, setNuevosSeguimientos] = useState({});
  const [showFinalizarModal, setShowFinalizarModal] = useState(null);
  const [datosFinales, setDatosFinales] = useState({ pesoReal: '', costosFinales: '' });

  const {
    importaciones,
    loading,
    error,
    fetchByEstado,
    updateImportacion,
    finalizarImportacion
  } = useImportaciones();

  useEffect(() => {
    loadEnTransito();
  }, []);

  useEffect(() => {
    // Filtrar items en tránsito por término de búsqueda
    if (searchTerm.length >= 2) {
      const filtered = importaciones.filter(item =>
        item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_seguimiento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientes?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEnTransito(filtered);
    } else {
      setFilteredEnTransito(importaciones);
    }
  }, [searchTerm, importaciones]);

  const loadEnTransito = useCallback(async () => {
    await fetchByEstado('en_transito');
  }, [fetchByEstado]);

  const handleEditSeguimiento = useCallback((itemId, numeroActual) => {
    setEditingSeguimiento(prev => ({
      ...prev,
      [itemId]: true
    }));
    setNuevosSeguimientos(prev => ({
      ...prev,
      [itemId]: numeroActual || ''
    }));
  }, []);

  const handleSaveSeguimiento = useCallback(async (itemId) => {
    const nuevoNumero = nuevosSeguimientos[itemId]?.trim();
    
    if (!nuevoNumero) {
      alert('El número de seguimiento no puede estar vacío');
      return;
    }

    try {
      await updateImportacion(itemId, { numero_seguimiento: nuevoNumero });
      setEditingSeguimiento(prev => ({
        ...prev,
        [itemId]: false
      }));
      alert('✅ Número de seguimiento actualizado!');
    } catch (error) {
      alert('❌ Error al actualizar: ' + error.message);
    }
  }, [nuevosSeguimientos, updateImportacion]);

  const handleCancelEditSeguimiento = useCallback((itemId) => {
    setEditingSeguimiento(prev => ({
      ...prev,
      [itemId]: false
    }));
    setNuevosSeguimientos(prev => ({
      ...prev,
      [itemId]: ''
    }));
  }, []);

  const handleFinalizarImportacion = useCallback(async () => {
    if (!showFinalizarModal) return;

    const { pesoReal, costosFinales } = datosFinales;
    
    if (!pesoReal || !costosFinales) {
      alert('Debe completar el peso real y costos finales');
      return;
    }

    if (parseFloat(pesoReal) <= 0 || parseFloat(costosFinales) <= 0) {
      alert('Los valores deben ser mayores a 0');
      return;
    }

    try {
      await finalizarImportacion(showFinalizarModal.id, parseFloat(pesoReal), parseFloat(costosFinales));
      setShowFinalizarModal(null);
      setDatosFinales({ pesoReal: '', costosFinales: '' });
      alert('✅ Importación finalizada exitosamente!');
    } catch (error) {
      alert('❌ Error al finalizar importación: ' + error.message);
    }
  }, [showFinalizarModal, datosFinales, finalizarImportacion]);

  const formatCurrency = useCallback((amount) => formatearMonto(amount, 'USD'), []);

  const formatFecha = useCallback((fecha) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-AR');
  }, []);

  const getDiasEnTransito = useCallback((fechaAprobacion) => {
    if (!fechaAprobacion) return 0;
    const hoy = new Date();
    const fecha = new Date(fechaAprobacion);
    const diffTime = Math.abs(hoy - fecha);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const getEstadoColor = useCallback((dias) => {
    if (dias > 21) return 'text-slate-600 bg-slate-200 border-slate-200';
    if (dias > 14) return 'text-slate-600 bg-slate-100 border-slate-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }, []);

  return (
    <div className="">
      {/* Header Estandarizado */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Truck className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">En Tránsito</h2>
                <p className="text-slate-300 mt-1">Importaciones en camino hacia Argentina</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Tarjeta
          icon={Truck}
          titulo="En Tránsito"
          valor={filteredEnTransito.length}
        />

        <Tarjeta
          icon={DollarSign}
          titulo="Monto en Tránsito"
          valor={useMemo(() => formatCurrency(filteredEnTransito.reduce((sum, item) => sum + (item.total_cotizado || 0), 0)), [filteredEnTransito, formatCurrency])}
        />

        <Tarjeta  
          icon={Weight}
          titulo="Peso Total"
          valor={useMemo(() => `${filteredEnTransito.reduce((sum, item) => sum + (item.peso_estimado_kg || 0), 0).toFixed(1)} kg`, [filteredEnTransito])}
        />

        <Tarjeta
          icon={AlertCircle}
          titulo="Demorados (+21 días)"
          valor={useMemo(() => filteredEnTransito.filter(item => getDiasEnTransito(item.fecha_aprobacion) > 21).length, [filteredEnTransito, getDiasEnTransito])}
        />
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por descripción, proveedor, seguimiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Lista de items en tránsito */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">
            {loading ? 'Cargando...' : `${filteredEnTransito.length} items en tránsito`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Cargando items en tránsito...</p>
          </div>
        ) : filteredEnTransito.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No hay items en tránsito</p>
            <p className="text-sm text-slate-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Los items aparecerán aquí cuando se marquen como en tránsito'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredEnTransito.map((item) => {
              const diasEnTransito = getDiasEnTransito(item.fecha_aprobacion);
              const isEditingSeguimiento = editingSeguimiento[item.id];

              return (
                <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header del item */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">
                            {item.descripcion}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{item.clientes?.nombre} {item.clientes?.apellido}</span>
                            </div>
                            {item.proveedor_nombre && (
                              <div className="flex items-center space-x-1">
                                <Package className="w-4 h-4" />
                                <span>{item.proveedor_nombre}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded text-sm font-medium border ${getEstadoColor(diasEnTransito)}`}>
                            {diasEnTransito} días en tránsito
                          </span>
                          <span className="px-3 py-1 rounded text-sm font-medium bg-slate-100 text-slate-800">
                            En Tránsito
                          </span>
                        </div>
                      </div>

                      {/* Número de seguimiento */}
                      <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-slate-800">Número de Seguimiento</span>
                          </div>
                          
                          {!isEditingSeguimiento ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-mono bg-white px-3 py-1 rounded border border-slate-200">
                                {item.numero_seguimiento || 'No asignado'}
                              </span>
                              <button
                                onClick={() => handleEditSeguimiento(item.id, item.numero_seguimiento)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Editar número de seguimiento"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={nuevosSeguimientos[item.id] || ''}
                                onChange={(e) => setNuevosSeguimientos(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))}
                                className="px-3 py-1 border border-slate-200 rounded font-mono focus:ring-2 focus:ring-emerald-600"
                                placeholder="Número de seguimiento"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveSeguimiento(item.id)}
                              />
                              <button
                                onClick={() => handleSaveSeguimiento(item.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelEditSeguimiento(item.id)}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                title="Cancelar"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detalles del item */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="text-slate-600">Total cotizado:</span>
                            <span className="font-bold text-emerald-600">
                              {formatCurrency(item.total_cotizado)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Weight className="w-4 h-4 text-slate-600" />
                            <span className="text-slate-600">Peso estimado:</span>
                            <span className="font-medium text-slate-800">{item.peso_estimado_kg} kg</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-600" />
                            <span className="text-slate-600">Aprobado:</span>
                            <span className="font-medium text-slate-800">{formatFecha(item.fecha_aprobacion)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="w-4 h-4 text-slate-600" />
                            <span className="text-slate-600">En tránsito:</span>
                            <span className="font-medium text-slate-800">{diasEnTransito} días</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {item.link_producto && (
                            <a
                              href={item.link_producto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 text-sm transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Ver producto</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setShowFinalizarModal(item)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Finalizar</span>
                          </button>
                        </div>
                      </div>

                      {/* Alertas por demora */}
                      {diasEnTransito > 21 && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-3">
                          <div className="flex items-center space-x-2 text-slate-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              ⚠️ Envío demorado: {diasEnTransito} días en tránsito. Considere contactar al proveedor.
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {diasEnTransito > 14 && diasEnTransito <= 21 && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-3">
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              📦 Envío en curso: {diasEnTransito} días en tránsito. Tiempo normal de entrega.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para finalizar importación */}
      {showFinalizarModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowFinalizarModal(null)}
        >
          <div 
            className="bg-white rounded border border-slate-200 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Package className="w-6 h-6 text-emerald-600" />
                <span>Finalizar Importación</span>
              </h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-slate-800 mb-2">{showFinalizarModal.descripcion}</h4>
                <p className="text-sm text-slate-600">
                  Cliente: {showFinalizarModal.clientes?.nombre} {showFinalizarModal.clientes?.apellido}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    <Weight className="w-4 h-4 inline mr-1" />
                    Peso Real (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={datosFinales.pesoReal}
                    onChange={(e) => setDatosFinales(prev => ({
                      ...prev,
                      pesoReal: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
                    placeholder="Peso real al llegar a Argentina"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Estimado: {showFinalizarModal.peso_estimado_kg} kg
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Costos Finales (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={datosFinales.costosFinales}
                    onChange={(e) => setDatosFinales(prev => ({
                      ...prev,
                      costosFinales: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
                    placeholder="Costo total real"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Cotizado: {formatCurrency(showFinalizarModal.total_cotizado)}
                  </p>
                </div>

                {datosFinales.costosFinales && (
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <p className="text-sm font-medium text-slate-800">
                      Diferencia: {' '}
                      <span className={parseFloat(datosFinales.costosFinales) > showFinalizarModal.total_cotizado ? 'text-slate-600' : 'text-emerald-600'}>
                        {formatCurrency(parseFloat(datosFinales.costosFinales) - showFinalizarModal.total_cotizado)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowFinalizarModal(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizarImportacion}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                  disabled={!datosFinales.pesoReal || !datosFinales.costosFinales}
                >
                  Finalizar Importación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnTransitoSection;