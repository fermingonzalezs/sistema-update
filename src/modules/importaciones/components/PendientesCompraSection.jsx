// src/components/PendientesCompraSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Truck, 
  User,
  Package,
  DollarSign,
  Weight,
  Calendar,
  ExternalLink,
  Check,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useImportaciones } from '../lib/importaciones.js';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto } from '../../../shared/utils/formatters.js';

const PendientesCompraSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPendientes, setFilteredPendientes] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showNumeroSeguimiento, setShowNumeroSeguimiento] = useState({});
  const [numerosSeguimiento, setNumerosSeguimiento] = useState({});

  const {
    importaciones,
    loading,
    error,
    fetchByEstado,
    marcarEnTransito
  } = useImportaciones();

  useEffect(() => {
    loadPendientes();
  }, []);

  useEffect(() => {
    // Filtrar pendientes por término de búsqueda
    if (searchTerm.length >= 2) {
      const filtered = importaciones.filter(pendiente =>
        pendiente.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pendiente.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pendiente.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pendiente.clientes?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPendientes(filtered);
    } else {
      setFilteredPendientes(importaciones);
    }
  }, [searchTerm, importaciones]);

  const loadPendientes = async () => {
    await fetchByEstado('pendiente_compra');
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredPendientes.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPendientes.map(item => item.id));
    }
  };

  const handleMarcarEnTransito = async (pendiente) => {
    const numeroSeguimiento = numerosSeguimiento[pendiente.id] || '';
    
    if (!numeroSeguimiento.trim()) {
      alert('Debe ingresar un número de seguimiento');
      return;
    }

    try {
      await marcarEnTransito(pendiente.id, numeroSeguimiento.trim());
      setShowNumeroSeguimiento(prev => ({
        ...prev,
        [pendiente.id]: false
      }));
      setNumerosSeguimiento(prev => ({
        ...prev,
        [pendiente.id]: ''
      }));
      alert('✅ Item marcado como en tránsito!');
    } catch (error) {
      alert('❌ Error al marcar en tránsito: ' + error.message);
    }
  };

  const handleMarcarMultiplesEnTransito = async () => {
    if (selectedItems.length === 0) {
      alert('Debe seleccionar al menos un item');
      return;
    }

    const numeroSeguimiento = prompt('Ingrese el número de seguimiento para todos los items seleccionados:');
    
    if (!numeroSeguimiento?.trim()) {
      return;
    }

    try {
      const promises = selectedItems.map(itemId => 
        marcarEnTransito(itemId, numeroSeguimiento.trim())
      );
      
      await Promise.all(promises);
      setSelectedItems([]);
      alert(`✅ ${selectedItems.length} items marcados como en tránsito!`);
    } catch (error) {
      alert('❌ Error al marcar items en tránsito: ' + error.message);
    }
  };

  

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const calcularTotalSeleccionados = () => {
    return selectedItems.reduce((total, itemId) => {
      const item = filteredPendientes.find(p => p.id === itemId);
      return total + (item?.total_cotizado || 0);
    }, 0);
  };

  const getDiasEsperando = (fechaAprobacion) => {
    if (!fechaAprobacion) return 0;
    const hoy = new Date();
    const fecha = new Date(fechaAprobacion);
    const diffTime = Math.abs(hoy - fecha);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgenciaColor = (dias) => {
    if (dias > 7) return 'text-slate-600 bg-slate-200';
    if (dias > 3) return 'text-slate-600 bg-slate-100';
    return 'text-emerald-600 bg-emerald-50';
  };

  return (
    <div className="">
      {/* Header Estandarizado */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Pendientes de Compra</h2>
                <p className="text-slate-300 mt-1">Cotizaciones aprobadas pendientes de compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Tarjeta  
          icon={ClipboardList}
          titulo="Pendientes"
          valor={filteredPendientes.length}
        />

        <Tarjeta  
          icon={DollarSign}
          titulo="Monto Total"
          valor={formatearMonto(filteredPendientes.reduce((sum, item) => sum + (item.total_cotizado || 0), 0), 'USD')}
        />

        <Tarjeta
          icon={Weight}
          titulo="Peso Total"
          valor={`${filteredPendientes.reduce((sum, item) => sum + (item.peso_estimado_kg || 0), 0).toFixed(1)} kg`}
        />

        <Tarjeta
          icon={AlertCircle}
          titulo="Urgentes (+7 días)"
          valor={filteredPendientes.filter(item => getDiasEsperando(item.fecha_aprobacion) > 7).length}
        />
      </div>

      {/* Búsqueda y controles */}
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por descripción, proveedor, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pendientes */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">
            {loading ? 'Cargando...' : `${filteredPendientes.length} items pendientes de compra`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Cargando pendientes...</p>
          </div>
        ) : filteredPendientes.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No hay items pendientes de compra</p>
            <p className="text-sm text-slate-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Los items aparecerán aquí cuando se aprueben cotizaciones'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredPendientes.map((pendiente) => {
              const diasEsperando = getDiasEsperando(pendiente.fecha_aprobacion);
              const isSelected = selectedItems.includes(pendiente.id);
              const showSeguimiento = showNumeroSeguimiento[pendiente.id];

              return (
                <div key={pendiente.id} className={`p-6 transition-colors ${isSelected ? 'bg-emerald-50 border-l-4 border-emerald-600' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <div className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(pendiente.id)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex-1">
                      {/* Header del item */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">
                            {pendiente.descripcion}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{pendiente.clientes?.nombre} {pendiente.clientes?.apellido}</span>
                            </div>
                            {pendiente.proveedor_nombre && (
                              <div className="flex items-center space-x-1">
                                <Package className="w-4 h-4" />
                                <span>{pendiente.proveedor_nombre}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenciaColor(diasEsperando)}`}>
                            {diasEsperando === 0 ? 'Hoy' : `${diasEsperando} días esperando`}
                          </span>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                            Pendiente
                          </span>
                        </div>
                      </div>

                      {/* Detalles del item */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="text-slate-600">Total:</span>
                            <span className="font-bold text-emerald-600">
                              {formatearMonto(pendiente.total_cotizado, 'USD')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Weight className="w-4 h-4 text-slate-600" />
                            <span className="text-slate-600">Peso:</span>
                            <span className="font-medium">{pendiente.peso_estimado_kg} kg</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-600" />
                            <span className="text-slate-600">Aprobado:</span>
                            <span className="font-medium">{formatFecha(pendiente.fecha_aprobacion)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="text-slate-600">Precio compra:</span>
                            <span className="font-medium">{formatearMonto(pendiente.precio_compra_usd, 'USD')}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {pendiente.link_producto && (
                            <a
                              href={pendiente.link_producto}
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
                          {!showSeguimiento ? (
                            <button
                              onClick={() => setShowNumeroSeguimiento(prev => ({
                                ...prev,
                                [pendiente.id]: true
                              }))}
                              className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors flex items-center space-x-1"
                            >
                              <Truck className="w-4 h-4" />
                              <span>Marcar en Tránsito</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder="Número de seguimiento"
                                value={numerosSeguimiento[pendiente.id] || ''}
                                onChange={(e) => setNumerosSeguimiento(prev => ({
                                  ...prev,
                                  [pendiente.id]: e.target.value
                                }))}
                                className="px-2 py-1 border border-slate-300 rounded text-sm w-40 focus:ring-2 focus:ring-emerald-600"
                                onKeyDown={(e) => e.key === 'Enter' && handleMarcarEnTransito(pendiente)}
                              />
                              <button
                                onClick={() => handleMarcarEnTransito(pendiente)}
                                className="bg-emerald-600 text-white px-2 py-1 rounded text-sm hover:bg-emerald-700 transition-colors"
                                title="Confirmar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowNumeroSeguimiento(prev => ({
                                  ...prev,
                                  [pendiente.id]: false
                                }))}
                                className="bg-slate-500 text-white px-2 py-1 rounded text-sm hover:bg-slate-600 transition-colors"
                                title="Cancelar"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {diasEsperando > 7 && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-3">
                          <div className="flex items-center space-x-2 text-slate-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Item urgente: Lleva {diasEsperando} días esperando ser comprado
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
    </div>
  );
};

export default PendientesCompraSection;