import React, { useEffect, useState, useMemo } from 'react';
import { formatearFechaDisplay } from '../../../shared/config/timezone';
import { useOutletContext } from 'react-router-dom';
import { Plane, Plus, Eye, Truck, X, AlertCircle, TrendingUp, Package, DollarSign, Trash2, ChevronDown, ChevronRight, Home, Check, CheckCircle, Circle, Loader, ArrowRight, ArrowLeft, Weight } from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { supabase } from '../../../lib/supabase';
import { useImportaciones } from '../hooks/useImportaciones';
import { useProveedores } from '../hooks/useProveedores';
import { useClientes } from '../../ventas/hooks/useClientes';
import NuevaImportacionModal from './NuevaImportacionModal';
import NuevoTipoModal from './NuevoTipoModal';
import NuevoCourierClienteModal from './NuevoCourierClienteModal';
import RecepcionModal from './RecepcionModal';
import DetalleRecibo from './DetalleRecibo';
import FechaDepositoUSAModal from './FechaDepositoUSAModal';
import IngresosSection from './IngresosSection';
import { calculosImportacion } from '../utils/calculosImportacion';
import {
  ESTADOS_IMPORTACION,
  LABELS_ESTADOS,
  COLORES_ESTADOS,
  obtenerSiguienteEstado,
  obtenerIconoSiguienteEstado,
  obtenerLabelSiguienteEstado,
  obtenerEstadoAnterior,
  obtenerIconoEstadoAnterior,
  obtenerLabelEstadoAnterior
} from '../constants/estadosImportacion';
import { METODOS_PAGO } from '../../../shared/constants/paymentMethods';

const ImportacionesSection = () => {
  const { isSidebarCollapsed } = useOutletContext() || { isSidebarCollapsed: false };
  const {
    recibos,
    loading,
    error,
    fetchRecibos,
    marcarEnDepositoUSA,
    avanzarEstado,
    deleteRecibo,
    actualizarRecibo,
    actualizarItem,
    eliminarItem,
    agregarItemsARecibo,
    recalcularCostos
  } = useImportaciones();

  const { proveedores } = useProveedores();
  const { clientes, fetchClientes } = useClientes();

  // Tabs
  const [vistaActiva, setVistaActiva] = useState('pedidos');

  // Estados para modales
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [tipoCourierModal, setTipoCourierModal] = useState(null);
  const [showCourierClienteModal, setShowCourierClienteModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [expandedRecibo, setExpandedRecibo] = useState(null);
  const [reciboToReceive, setReciboToReceive] = useState(null);
  const [showFechaDepositoModal, setShowFechaDepositoModal] = useState(false);
  const [reciboToMarkDeposito, setReciboToMarkDeposito] = useState(null);
  const [isMarkingDeposito, setIsMarkingDeposito] = useState(false);
  const [dropdownEstadoAbierto, setDropdownEstadoAbierto] = useState(null);
  const [actualizandoContabilizado, setActualizandoContabilizado] = useState({});

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroOrden, setFiltroOrden] = useState('fecha_compra_desc');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroDestino, setFiltroDestino] = useState('todos');

  useEffect(() => {
    fetchRecibos();
    fetchClientes();
  }, [fetchRecibos, fetchClientes]);

  // Filtrar recibos
  const recibosFiltrados = useMemo(() => {
    return recibos.filter(recibo => {
      if (filtroEstado !== 'todos' && recibo.estado !== filtroEstado) return false;
      if (filtroProveedor !== 'todos' && recibo.proveedor_id !== filtroProveedor) return false;
      if (filtroFechaDesde && recibo.fecha_compra < filtroFechaDesde) return false;
      if (filtroFechaHasta && recibo.fecha_compra > filtroFechaHasta) return false;
      if (filtroTipo !== 'todos' && recibo.tipo !== filtroTipo) return false;
      if (filtroDestino !== 'todos' && recibo.destino !== filtroDestino) return false;
      if (filtroProducto.trim()) {
        const busqueda = filtroProducto.trim().toLowerCase();
        const tieneProducto = (recibo.importaciones_items || []).some(item =>
          (item.item || '').toLowerCase().includes(busqueda)
        );
        if (!tieneProducto) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (filtroOrden) {
        case 'fecha_compra_desc':
          return new Date(b.fecha_compra) - new Date(a.fecha_compra);
        case 'fecha_compra_asc':
          return new Date(a.fecha_compra) - new Date(b.fecha_compra);
        case 'numero_pedido_desc':
          return (b.numero_recibo || '').localeCompare(a.numero_recibo || '');
        case 'numero_pedido_asc':
          return (a.numero_recibo || '').localeCompare(b.numero_recibo || '');
        case 'fecha_ingreso_desc':
          // Si no tiene fecha, los ponemos al final
          if (!a.fecha_recepcion_argentina) return 1;
          if (!b.fecha_recepcion_argentina) return -1;
          return new Date(b.fecha_recepcion_argentina) - new Date(a.fecha_recepcion_argentina);
        case 'fecha_ingreso_asc':
          if (!a.fecha_recepcion_argentina) return 1;
          if (!b.fecha_recepcion_argentina) return -1;
          return new Date(a.fecha_recepcion_argentina) - new Date(b.fecha_recepcion_argentina);
        default:
          return 0;
      }
    });
  }, [recibos, filtroEstado, filtroProveedor, filtroFechaDesde, filtroFechaHasta, filtroOrden, filtroProducto]);

  // Stats
  const stats = useMemo(() => {
    const enTransitoUSA = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_TRANSITO_USA).length;
    const enDepositoUSA = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_DEPOSITO_USA).length;
    const enVueloInternacional = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL).length;
    const enDepositoARG = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_DEPOSITO_ARG).length;
    const recepcionadas = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.RECEPCIONADO).length;
    const totalInvertido = recibos.reduce((sum, recibo) => {
      return sum + (recibo.importaciones_items || []).reduce((itemSum, item) => itemSum + (item.precio_total_usd || 0), 0);
    }, 0);

    return { enTransitoUSA, enDepositoUSA, enVueloInternacional, enDepositoARG, recepcionadas, totalInvertido };
  }, [recibos]);

  // Proveedores únicos
  const proveedoresEnUso = useMemo(() => {
    return ['todos', ...new Set(recibos.map(r => r.proveedor_id))];
  }, [recibos]);

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
  };

  const formatMetodoPago = (metodo) => {
    const metodoPago = METODOS_PAGO.find(m => m.value === metodo);
    return metodoPago ? metodoPago.label : metodo;
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroProveedor('todos');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroOrden('fecha_compra_desc');
    setFiltroProducto('');
    setFiltroTipo('todos');
    setFiltroDestino('todos');
  };

  // Avanzar al siguiente estado
  const handleAvanzarEstado = async (recibo) => {
    const siguienteEstado = obtenerSiguienteEstado(recibo.estado);

    if (!siguienteEstado) {
      return; // Ya está en el último estado
    }

    // Si el siguiente estado requiere modal con datos adicionales
    if (siguienteEstado === ESTADOS_IMPORTACION.EN_DEPOSITO_USA) {
      setReciboToMarkDeposito(recibo);
      setShowFechaDepositoModal(true);
    } else if (siguienteEstado === ESTADOS_IMPORTACION.RECEPCIONADO) {
      setReciboToReceive(recibo);
      setShowReceiveModal(true);
    } else {
      // Estados intermedios (EN_VUELO_INTERNACIONAL, EN_DEPOSITO_ARG): confirmar antes de actualizar
      if (window.confirm(`¿Estás seguro de avanzar al estado "${LABELS_ESTADOS[siguienteEstado]}"?`)) {
        try {
          await avanzarEstado(recibo.id, siguienteEstado);
          await fetchRecibos();
        } catch (err) {
          alert(`Error al avanzar estado: ${err.message}`);
        }
      }
    }
  };

  // Retroceder al estado anterior
  const handleRetrocederEstado = async (recibo) => {
    const estadoAnterior = obtenerEstadoAnterior(recibo.estado);

    if (!estadoAnterior) {
      return; // Ya está en el primer estado
    }

    // Confirmar antes de retroceder
    if (window.confirm(`¿Estás seguro de volver al estado "${LABELS_ESTADOS[estadoAnterior]}"?`)) {
      try {
        await avanzarEstado(recibo.id, estadoAnterior);
        await fetchRecibos();
      } catch (err) {
        alert(`Error al retroceder estado: ${err.message}`);
      }
    }
  };

  // Cambiar a cualquier estado desde el dropdown
  const handleCambiarEstado = async (recibo, nuevoEstado) => {
    setDropdownEstadoAbierto(null);
    if (nuevoEstado === recibo.estado) return;

    if (nuevoEstado === ESTADOS_IMPORTACION.EN_DEPOSITO_USA) {
      setReciboToMarkDeposito(recibo);
      setShowFechaDepositoModal(true);
    } else if (nuevoEstado === ESTADOS_IMPORTACION.RECEPCIONADO) {
      setReciboToReceive(recibo);
      setShowReceiveModal(true);
    } else {
      if (window.confirm(`¿Cambiar al estado "${LABELS_ESTADOS[nuevoEstado]}"?`)) {
        try {
          await avanzarEstado(recibo.id, nuevoEstado);
          await fetchRecibos();
        } catch (err) {
          alert(`Error al cambiar estado: ${err.message}`);
        }
      }
    }
  };

  const toggleContabilizado = async (reciboId, valorActual) => {
    try {
      setActualizandoContabilizado(prev => ({ ...prev, [reciboId]: true }));
      const { error } = await supabase.from('importaciones_recibos').update({ contabilizado: !valorActual }).eq('id', reciboId);
      if (error) throw error;
      const recibo = recibos.find(r => r.id === reciboId);
      if (recibo) recibo.contabilizado = !valorActual;
    } catch (err) {
      console.error('Error al actualizar contabilizado:', err);
      alert('Error al actualizar el estado de contabilizado');
    } finally {
      setActualizandoContabilizado(prev => ({ ...prev, [reciboId]: false }));
    }
  };

  const getEstadoColor = (estado) => {
    return COLORES_ESTADOS[estado] || 'bg-slate-100 text-slate-800';
  };

  const getEstadoLabel = (estado) => {
    return LABELS_ESTADOS[estado] || estado;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Plane className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-semibold">Importaciones</h2>
                <p className="text-slate-300 mt-1">Gestión de importaciones y servicios de courier</p>
              </div>
            </div>
            {vistaActiva === 'pedidos' && (
              <button
                onClick={() => setShowTipoModal(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
              >
                <Plus size={18} />
                Nuevo
              </button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white px-6 py-3 flex gap-2 border-b border-slate-200">
          {[
            { key: 'pedidos', label: 'Pedidos' },
            { key: 'ingresos', label: 'Ingresos' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setVistaActiva(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                vistaActiva === tab.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VISTA INGRESOS */}
      {vistaActiva === 'ingresos' && (
        <div className="bg-white rounded border border-slate-200">
          <IngresosSection />
        </div>
      )}

      {/* VISTA PEDIDOS — solo visible en tab pedidos */}
      {vistaActiva === 'pedidos' && (<>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Tarjeta
          icon={TrendingUp}
          titulo="En Tránsito USA"
          valor={stats.enTransitoUSA}
        />
        <Tarjeta
          icon={Package}
          titulo="En Depósito USA"
          valor={stats.enDepositoUSA}
        />
        <Tarjeta
          icon={Plane}
          titulo="En Vuelo INT"
          valor={stats.enVueloInternacional}
        />
        <Tarjeta
          icon={Home}
          titulo="En Depósito ARG"
          valor={stats.enDepositoARG}
        />
        <Tarjeta
          icon={Check}
          titulo="Recepcionadas"
          valor={stats.recepcionadas}
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Orden</label>
            <select
              value={filtroOrden}
              onChange={(e) => setFiltroOrden(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="fecha_compra_desc">Fecha Compra (Mas recientes)</option>
              <option value="fecha_compra_asc">Fecha Compra (Mas antiguos)</option>
              <option value="numero_pedido_desc">Número Pedido (Mayor a menor)</option>
              <option value="numero_pedido_asc">Número Pedido (Menor a mayor)</option>
              <option value="fecha_ingreso_desc">Fecha Ingreso (Mas recientes)</option>
              <option value="fecha_ingreso_asc">Fecha Ingreso (Mas antiguos)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value={ESTADOS_IMPORTACION.EN_TRANSITO_USA}>En Tránsito USA</option>
              <option value={ESTADOS_IMPORTACION.EN_DEPOSITO_USA}>En Depósito USA</option>
              <option value={ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL}>En Vuelo Internacional</option>
              <option value={ESTADOS_IMPORTACION.EN_DEPOSITO_ARG}>En Depósito ARG</option>
              <option value={ESTADOS_IMPORTACION.RECEPCIONADO}>Recepcionadas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              {proveedoresEnUso
                .filter(id => id !== 'todos')
                .map(proveedorId => {
                  const proveedor = proveedores.find(p => p.id === proveedorId);
                  return proveedor ? (
                    <option key={proveedorId} value={proveedorId}>
                      {proveedor.nombre}
                    </option>
                  ) : null;
                })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Producto</label>
            <input
              type="text"
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value="importacion">Importaciones</option>
              <option value="courier_empresa">Courier (empresa)</option>
              <option value="courier_cliente">Courier (cliente)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Destino</label>
            <select
              value={filtroDestino}
              onChange={(e) => setFiltroDestino(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value="reventa">Reventa</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm font-medium transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* ESTADOS DE CARGA Y ERROR */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Cargando importaciones...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="text-red-700">Error: {error}</div>
        </div>
      )}

      {/* TABLA DE RECIBOS */}
      {!loading && !error && (
        <div className="bg-white rounded border border-slate-200">
          {recibosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
              <p>No hay importaciones registradas</p>
              <p className="text-sm text-slate-500 mt-1">Haz clic en "Nueva Importación" para agregar una</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
                <table style={{ minWidth: '1280px', width: '100%', tableLayout: 'fixed' }}>
                  <thead className="bg-slate-800 text-white sticky top-0 z-10">
                    <tr>
                      <th className="py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '30px' }}>Cont.</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '70px' }}>Tipo</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '80px' }}>F. Compra</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '85px' }}>F. Recep.</th>
                      <th className="px-2 py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '160px' }}>Descripción</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800 overflow-hidden" style={{ width: '75px' }}>Prov.</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800 overflow-hidden" style={{ width: '35px' }}>Its.</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800 overflow-hidden" style={{ width: '60px' }}>Peso</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800 overflow-hidden" style={{ width: '75px' }}>FOB</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800 overflow-hidden" style={{ width: '75px' }}>C. Fin.</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800 overflow-hidden" style={{ width: '75px' }}>Courier</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '75px' }}>Total</th>
                      <th className="px-2 py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '200px' }}>Estado</th>
                      <th className="px-1 py-3 text-center text-xs font-medium uppercase bg-slate-800" style={{ width: '185px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recibosFiltrados.map((recibo, idx) => (
                      <tr key={recibo.id} className={`transition-colors ${recibo.contabilizado ? 'bg-emerald-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleContabilizado(recibo.id, recibo.contabilizado)}
                            disabled={actualizandoContabilizado[recibo.id]}
                            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
                            title={recibo.contabilizado ? 'Marcar como no contabilizado' : 'Marcar como contabilizado'}
                          >
                            {actualizandoContabilizado[recibo.id] ? (
                              <Loader className="w-4 h-4 text-slate-400 animate-spin" />
                            ) : recibo.contabilizado ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-1 py-3 text-center">
                          <div className="flex flex-col gap-0.5 items-center">
                            {recibo.tipo === 'courier_cliente' && (
                              <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium leading-tight">COURIER<br/>CLIENTE</span>
                            )}
                            {recibo.tipo === 'courier_empresa' && (
                              <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-medium leading-tight">COURIER<br/>EMPRESA</span>
                            )}
                            {(!recibo.tipo || recibo.tipo === 'importacion') && (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-medium">IMPORT</span>
                            )}
                          </div>
                        </td>
                        <td className="px-1 py-3 text-[15px] text-center text-slate-600 whitespace-nowrap">
                          {formatearFechaDisplay(recibo.fecha_compra)}
                        </td>
                        <td className="px-1 py-3 text-[15px] text-center text-slate-600 whitespace-nowrap">
                          {recibo.fecha_recepcion_argentina
                            ? formatearFechaDisplay(recibo.fecha_recepcion_argentina)
                            : '-'
                          }
                        </td>
                        <td className="px-2 py-3 text-[15px] text-slate-600 overflow-hidden" title={recibo.observaciones || '-'}>
                          <span className="block truncate">{recibo.observaciones || '-'}</span>
                        </td>
                        <td className="px-1 py-3 text-[15px] text-center text-slate-600 overflow-hidden" title={recibo.proveedores?.nombre || '-'}>
                          <span className="block truncate">{recibo.proveedores?.nombre || '-'}</span>
                        </td>
                        <td className="px-0 py-3 text-[15px] text-center text-slate-600">
                          {(() => {
                            const items = recibo.importaciones_items || [];
                            const total = items.length;
                            const ingresados = items.filter(i => i.caja_id).length;
                            if (total === 0) return 0;
                            if (ingresados === 0) return total;
                            if (ingresados === total) return total;
                            return (
                              <span title={`${ingresados} de ${total} items ingresados`}>
                                <span className="text-emerald-700 font-semibold">{ingresados}</span>
                                <span className="text-slate-400">/{total}</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-1 py-3 text-[15px] text-center text-slate-800 whitespace-nowrap">
                          {recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO && recibo.peso_total_con_caja_kg ? (
                            <span className="font-semibold">{parseFloat(recibo.peso_total_con_caja_kg).toFixed(2)} kg</span>
                          ) : (
                            (() => {
                              const pesoEstimado = (recibo.importaciones_items || []).reduce(
                                (sum, item) => sum + (parseFloat(item.peso_estimado_total_kg) || (parseFloat(item.peso_estimado_unitario_kg) || 0) * (item.cantidad || 0)),
                                0
                              );
                              return pesoEstimado > 0 ? (
                                <span className="text-slate-500" title="Peso estimado">~{pesoEstimado.toFixed(2)} kg</span>
                              ) : '-';
                            })()
                          )}
                        </td>
                        {(() => {
                          const fob = (recibo.importaciones_items || []).reduce((sum, i) => sum + (i.precio_total_usd || 0), 0);
                          const costoFinancieroItems = (recibo.importaciones_items || []).reduce((sum, i) => sum + (parseFloat(i.costo_financiero_usd) || 0), 0);
                          const tieneCostoFinanciero = (recibo.importaciones_items || []).some(i => i.costo_financiero_usd != null);
                          const costoCourier = recibo.costo_total_importacion_usd != null ? parseFloat(recibo.costo_total_importacion_usd) : null;
                          const total = fob + costoFinancieroItems + (costoCourier || 0);
                          return (
                            <>
                              <td className="px-1 py-3 text-[15px] text-center font-semibold text-slate-800 whitespace-nowrap">
                                U$ {formatNumber(fob)}
                              </td>
                              <td className="px-1 py-3 text-[15px] text-center font-semibold text-slate-800 whitespace-nowrap">
                                {tieneCostoFinanciero
                                  ? `U$ ${formatNumber(costoFinancieroItems)}`
                                  : <span className="text-slate-400">-</span>
                                }
                              </td>
                              <td className="px-1 py-3 text-[15px] text-center font-semibold text-slate-800 whitespace-nowrap">
                                {costoCourier !== null
                                  ? `U$ ${formatNumber(costoCourier)}`
                                  : <span className="text-slate-400">-</span>
                                }
                              </td>
                              <td className="px-1 py-3 text-[15px] text-center font-semibold text-emerald-700 whitespace-nowrap">
                                U$ {formatNumber(total)}
                              </td>
                            </>
                          );
                        })()}
                        <td className="px-1 py-3 text-center whitespace-nowrap">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownEstadoAbierto(dropdownEstadoAbierto === recibo.id ? null : recibo.id);
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold cursor-pointer w-[155px] ${getEstadoColor(recibo.estado)}`}
                              style={{ fontSize: '12px' }}
                            >
                              <span className="truncate flex-1 text-center">{getEstadoLabel(recibo.estado)}</span>
                              <ChevronDown size={10} className="shrink-0" />
                            </button>
                            {dropdownEstadoAbierto === recibo.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setDropdownEstadoAbierto(null)}
                                />
                                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded shadow-lg min-w-[210px]">
                                  {Object.values(ESTADOS_IMPORTACION).map((estado) => (
                                    <button
                                      key={estado}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCambiarEstado(recibo, estado);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 ${recibo.estado === estado ? 'bg-slate-50' : ''}`}
                                    >
                                      {recibo.estado === estado && <Check size={12} className="text-emerald-600 shrink-0" />}
                                      {recibo.estado !== estado && <span className="w-3 shrink-0" />}
                                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getEstadoColor(estado)}`}>
                                        {getEstadoLabel(estado)}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-1 py-3 text-center whitespace-nowrap">
                          <div className="flex justify-center gap-1">
                            {/* Botón para retroceder al estado anterior */}
                            {recibo.estado !== ESTADOS_IMPORTACION.EN_TRANSITO_USA && (() => {
                              const estadoAnterior = obtenerEstadoAnterior(recibo.estado);
                              if (!estadoAnterior) return null;

                              const IconoAnterior = {
                                'TrendingUp': TrendingUp,
                                'Package': Package,
                                'Plane': Plane,
                                'Home': Home,
                                'ArrowLeft': ArrowLeft
                              }[obtenerIconoEstadoAnterior(recibo.estado)] || ArrowLeft;

                              const labelAnterior = obtenerLabelEstadoAnterior(recibo.estado);

                              return (
                                <button
                                  onClick={() => handleRetrocederEstado(recibo)}
                                  className="text-amber-600 hover:text-amber-700 transition-colors"
                                  title={`Volver a: ${labelAnterior}`}
                                >
                                  <IconoAnterior size={18} />
                                </button>
                              );
                            })()}

                            {/* Botón para avanzar al siguiente estado */}
                            {recibo.estado !== ESTADOS_IMPORTACION.RECEPCIONADO && (() => {
                              const siguienteEstado = obtenerSiguienteEstado(recibo.estado);
                              if (!siguienteEstado) return null;

                              const IconoSiguiente = {
                                'Package': Package,
                                'Plane': Plane,
                                'Home': Home,
                                'Check': Check,
                                'ArrowRight': ArrowRight
                              }[obtenerIconoSiguienteEstado(recibo.estado)] || ArrowRight;

                              const labelSiguiente = obtenerLabelSiguienteEstado(recibo.estado);

                              return (
                                <button
                                  onClick={() => handleAvanzarEstado(recibo)}
                                  className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                  title={`Avanzar a: ${labelSiguiente}`}
                                >
                                  <IconoSiguiente size={18} />
                                </button>
                              );
                            })()}

                            <button
                              onClick={() => setExpandedRecibo(recibo)}
                              className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="Ver detalles"
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              onClick={async () => {
                                if (window.confirm('¿Eliminar esta importación?')) {
                                  try {
                                    await deleteRecibo(recibo.id);
                                    alert('✅ Importación eliminada');
                                  } catch (err) {
                                    alert('Error: ' + err.message);
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-700 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          )}
        </div>
      )}

      </>)}

      {/* MODALES */}
      {showTipoModal && (
        <NuevoTipoModal
          onClose={() => setShowTipoModal(false)}
          onSelectImportacion={() => {
            setShowTipoModal(false);
            setTipoCourierModal(null);
            setShowNewModal(true);
          }}
          onSelectCourierCliente={() => {
            setShowTipoModal(false);
            setShowCourierClienteModal(true);
          }}
          onSelectCourierEmpresa={() => {
            setShowTipoModal(false);
            setTipoCourierModal('courier_empresa');
            setShowNewModal(true);
          }}
        />
      )}

      {showCourierClienteModal && (
        <NuevoCourierClienteModal
          onClose={() => setShowCourierClienteModal(false)}
          onSuccess={() => {
            setShowCourierClienteModal(false);
            fetchRecibos();
          }}
        />
      )}

      {showNewModal && (
        <NuevaImportacionModal
          tipoCourier={tipoCourierModal}
          onClose={() => { setShowNewModal(false); setTipoCourierModal(null); }}
          onSuccess={() => {
            setShowNewModal(false);
            setTipoCourierModal(null);
            fetchRecibos();
          }}
        />
      )}

      {showReceiveModal && reciboToReceive && (
        <RecepcionModal
          recibo={reciboToReceive}
          onClose={() => {
            setShowReceiveModal(false);
            setReciboToReceive(null);
          }}
          onSuccess={() => {
            setShowReceiveModal(false);
            setReciboToReceive(null);
            fetchRecibos();
          }}
        />
      )}

      {expandedRecibo && (
        <DetalleRecibo
          recibo={expandedRecibo}
          onClose={() => setExpandedRecibo(null)}
          proveedores={proveedores}
          clientes={clientes}
          onActualizarRecibo={actualizarRecibo}
          onActualizarItem={actualizarItem}
          onEliminarItem={eliminarItem}
          onAgregarItems={agregarItemsARecibo}
          onRecalcularCostos={recalcularCostos}
          onRefresh={async () => {
            const updatedRecibos = await fetchRecibos();
            // Update the expandedRecibo with fresh data
            const updatedRecibo = updatedRecibos.find(r => r.id === expandedRecibo.id);
            if (updatedRecibo) {
              setExpandedRecibo(updatedRecibo);
            }
          }}
        />
      )}

      {showFechaDepositoModal && reciboToMarkDeposito && (
        <FechaDepositoUSAModal
          recibo={reciboToMarkDeposito}
          isSubmitting={isMarkingDeposito}
          onClose={() => {
            setShowFechaDepositoModal(false);
            setReciboToMarkDeposito(null);
          }}
          onConfirm={async (fecha) => {
            setIsMarkingDeposito(true);
            try {
              await marcarEnDepositoUSA(reciboToMarkDeposito.id, fecha);
              alert('✅ Recibo actualizado');
              setShowFechaDepositoModal(false);
              setReciboToMarkDeposito(null);
              fetchRecibos();
            } catch (err) {
              alert('Error: ' + err.message);
            } finally {
              setIsMarkingDeposito(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ImportacionesSection;
