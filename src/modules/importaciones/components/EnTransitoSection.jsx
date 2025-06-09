// src/components/EnTransitoSection.jsx
import React, { useState, useEffect } from 'react';
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

  const loadEnTransito = async () => {
    await fetchByEstado('en_transito');
  };

  const handleEditSeguimiento = (itemId, numeroActual) => {
    setEditingSeguimiento(prev => ({
      ...prev,
      [itemId]: true
    }));
    setNuevosSeguimientos(prev => ({
      ...prev,
      [itemId]: numeroActual || ''
    }));
  };

  const handleSaveSeguimiento = async (itemId) => {
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
  };

  const handleCancelEditSeguimiento = (itemId) => {
    setEditingSeguimiento(prev => ({
      ...prev,
      [itemId]: false
    }));
    setNuevosSeguimientos(prev => ({
      ...prev,
      [itemId]: ''
    }));
  };

  const handleFinalizarImportacion = async () => {
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

  const getDiasEnTransito = (fechaAprobacion) => {
    if (!fechaAprobacion) return 0;
    const hoy = new Date();
    const fecha = new Date(fechaAprobacion);
    const diffTime = Math.abs(hoy - fecha);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEstadoColor = (dias) => {
    if (dias > 21) return 'text-red-600 bg-red-50 border-red-200';
    if (dias > 14) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 flex items-center">
        <div className="flex items-center space-x-3">
          <Truck className="w-10 h-10 text-white opacity-80" />
          <div>
            <h2 className="text-4xl font-bold text-white">En Tránsito</h2>
            <p className="text-white/80 text-xl mt-2">Seguimiento de envíos desde USA</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">En Tránsito</p>
              <p className="text-2xl font-bold text-blue-900">{filteredEnTransito.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">Monto en Tránsito</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(filteredEnTransito.reduce((sum, item) => sum + (item.total_cotizado || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <Weight className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">Peso Total</p>
              <p className="text-2xl font-bold text-blue-900">
                {filteredEnTransito.reduce((sum, item) => sum + (item.peso_estimado_kg || 0), 0).toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">Demoras (+21 días)</p>
              <p className="text-2xl font-bold text-blue-900">
                {filteredEnTransito.filter(item => getDiasEnTransito(item.fecha_aprobacion) > 21).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por descripción, proveedor, seguimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Lista de items en tránsito */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">
            {loading ? 'Cargando...' : `${filteredEnTransito.length} items en tránsito`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando items en tránsito...</p>
          </div>
        ) : filteredEnTransito.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No hay items en tránsito</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Los items aparecerán aquí cuando se marquen como en tránsito'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEnTransito.map((item) => {
              const diasEnTransito = getDiasEnTransito(item.fecha_aprobacion);
              const isEditingSeguimiento = editingSeguimiento[item.id];

              return (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header del item */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {item.descripcion}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getEstadoColor(diasEnTransito)}`}>
                            {diasEnTransito} días en tránsito
                          </span>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            En Tránsito
                          </span>
                        </div>
                      </div>

                      {/* Número de seguimiento */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-800">Número de Seguimiento</span>
                          </div>
                          
                          {!isEditingSeguimiento ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-mono bg-white px-3 py-1 rounded border">
                                {item.numero_seguimiento || 'No asignado'}
                              </span>
                              <button
                                onClick={() => handleEditSeguimiento(item.id, item.numero_seguimiento)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
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
                                className="px-3 py-1 border border-gray-300 rounded font-mono"
                                placeholder="Número de seguimiento"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveSeguimiento(item.id)}
                              />
                              <button
                                onClick={() => handleSaveSeguimiento(item.id)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelEditSeguimiento(item.id)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
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
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600">Total cotizado:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(item.total_cotizado)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Weight className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-600">Peso estimado:</span>
                            <span className="font-medium">{item.peso_estimado_kg} kg</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-600">Aprobado:</span>
                            <span className="font-medium">{formatFecha(item.fecha_aprobacion)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-gray-600">En tránsito:</span>
                            <span className="font-medium">{diasEnTransito} días</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {item.link_producto && (
                            <a
                              href={item.link_producto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Ver producto</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setShowFinalizarModal(item)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Finalizar</span>
                          </button>
                        </div>
                      </div>

                      {/* Alertas por demora */}
                      {diasEnTransito > 21 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              ⚠️ Envío demorado: {diasEnTransito} días en tránsito. Considere contactar al proveedor.
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {diasEnTransito > 14 && diasEnTransito <= 21 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-yellow-600">
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
            className="bg-white rounded-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Package className="w-6 h-6 text-green-600" />
                <span>Finalizar Importación</span>
              </h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">{showFinalizarModal.descripcion}</h4>
                <p className="text-sm text-gray-600">
                  Cliente: {showFinalizarModal.clientes?.nombre} {showFinalizarModal.clientes?.apellido}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Peso real al llegar a Argentina"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Estimado: {showFinalizarModal.peso_estimado_kg} kg
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Costo total real"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cotizado: {formatCurrency(showFinalizarModal.total_cotizado)}
                  </p>
                </div>

                {datosFinales.costosFinales && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">
                      Diferencia: {' '}
                      <span className={parseFloat(datosFinales.costosFinales) > showFinalizarModal.total_cotizado ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(parseFloat(datosFinales.costosFinales) - showFinalizarModal.total_cotizado)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowFinalizarModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizarImportacion}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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