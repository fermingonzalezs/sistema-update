import React, { useState, useMemo } from 'react';
import { Plane, Plus, Eye, Edit, Truck, X, AlertCircle, TrendingUp, Package, DollarSign, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { useImportaciones } from '../hooks/useCompras';
import { useProveedores } from '../hooks/useProveedores';

const METODOS_PAGO = [
  { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
  { value: 'dolares_billete', label: '💸 Dólares Billete' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'criptomonedas', label: '₿ Criptomonedas' },
  { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
  { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' }
];

const ImportacionesComprasSection = () => {
  const {
    importaciones,
    loading: loadingImportaciones,
    error: errorImportaciones,
    crearImportacion,
    actualizarImportacion,
    eliminarImportacion,
    recepcionarImportacion
  } = useImportaciones();

  const { proveedores } = useProveedores();

  // Estados para modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [expandedRecibos, setExpandedRecibos] = useState(new Set());

  // Estados para datos
  const [reciboToReceive, setReciboToReceive] = useState(null);
  const [receiveFormData, setReceiveFormData] = useState({
    fechaRecepcion: new Date().toISOString().split('T')[0],
    pesoConCaja: 0,
    pesoSinCaja: 0,
    precioPorKg: 0,
    pagoCourier: 0,
    costoPickingShipping: 0
  });

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');

  // Formulario nueva importación
  const [formNueva, setFormNueva] = useState({
    proveedor: '',
    moneda: 'USD',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    numero_seguimiento: '',
    logistica_empresa: '',
    fecha_estimada_ingreso: '',
    observaciones: '',
    caja_pago: '',
    items: []
  });

  const [formNuevoItem, setFormNuevoItem] = useState({
    item: '',
    cantidad: 1,
    precio_unitario: 0,
    peso_estimado_unitario: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Las importaciones ya vienen agrupadas con sus items desde el hook
  const recibos = useMemo(() => {
    return importaciones.map(imp => ({
      id: imp.id,
      proveedor: imp.proveedor,
      fecha: imp.fecha,
      estado: imp.estado,
      numero_seguimiento: imp.numero_seguimiento,
      logistica_empresa: imp.logistica_empresa,
      fecha_estimada_ingreso: imp.fecha_estimada_ingreso,
      items: imp.importaciones_items || []
    })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [importaciones]);

  // Filtrar recibos
  const recibosFiltrados = useMemo(() => {
    return recibos.filter(recibo => {
      if (filtroEstado !== 'todos' && recibo.estado !== filtroEstado) return false;
      if (filtroProveedor !== 'todos' && recibo.proveedor !== filtroProveedor) return false;
      return true;
    });
  }, [filtroEstado, filtroProveedor, recibos]);

  // Stats
  const stats = useMemo(() => {
    const enCamino = recibos.filter(r => r.estado === 'en_camino').length;
    const recibido = recibos.filter(r => r.estado === 'recibido').length;
    const totalInvertido = recibos.reduce((sum, recibo) => {
      const reciboCost = recibo.items.reduce((itemSum, item) => itemSum + (item.monto || 0), 0);
      return sum + reciboCost;
    }, 0);

    return { enCamino, recibido, totalInvertido };
  }, [recibos]);

  // Proveedores únicos
  const proveedoresEnUso = useMemo(() => {
    return ['todos', ...new Set(recibos.map(r => r.proveedor))];
  }, [recibos]);

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
  };

  // Funciones de formulario
  const agregarItem = () => {
    if (!formNuevoItem.item.trim() || !formNuevoItem.cantidad || !formNuevoItem.precio_unitario || !formNuevoItem.peso_estimado_unitario) {
      alert('Completa todos los campos del item (incluye peso unitario)');
      return;
    }
    setFormNueva(prev => ({
      ...prev,
      items: [...prev.items, { ...formNuevoItem, id: Date.now() }]
    }));
    setFormNuevoItem({
      item: '',
      cantidad: 1,
      precio_unitario: 0,
      peso_estimado_unitario: 0
    });
  };

  const eliminarItem = (id) => {
    setFormNueva(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calcularTotalItems = () => {
    return formNueva.items.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
    }, 0);
  };

  const calcularPesoTotal = () => {
    return formNueva.items.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) * parseFloat(item.peso_estimado_unitario || 0));
    }, 0);
  };

  const guardarImportacion = async () => {
    if (!formNueva.proveedor.trim() || !formNueva.items || formNueva.items.length === 0) {
      alert('Por favor agrega al menos un item a la importación');
      return;
    }

    console.log('DEBUG guardarImportacion - formNueva.items:', formNueva.items);

    setIsSubmitting(true);
    try {
      const resultado = await crearImportacion(formNueva, formNueva.items);

      if (!resultado.success) {
        throw new Error(resultado.error);
      }

      setShowNewModal(false);
      resetFormulario();
      alert('Importación guardada exitosamente');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormulario = () => {
    setFormNueva({
      proveedor: '',
      moneda: 'USD',
      fecha: new Date().toISOString().split('T')[0],
      metodo_pago: 'transferencia',
      numero_seguimiento: '',
      logistica_empresa: '',
      fecha_estimada_ingreso: '',
      observaciones: '',
      caja_pago: '',
      items: []
    });
    setFormNuevoItem({
      item: '',
      cantidad: 1,
      precio_unitario: 0,
      peso_estimado_unitario: 0
    });
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroProveedor('todos');
  };

  const toggleRecibo = (reciboId) => {
    const newExpanded = new Set(expandedRecibos);
    if (newExpanded.has(reciboId)) {
      newExpanded.delete(reciboId);
    } else {
      newExpanded.add(reciboId);
    }
    setExpandedRecibos(newExpanded);
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
                <p className="text-slate-300 mt-1">Gestión de importaciones y recepción de mercadería</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Importación
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tarjeta
          icon={TrendingUp}
          titulo="En Camino"
          valor={stats.enCamino}
        />
        <Tarjeta
          icon={Package}
          titulo="Ingresadas"
          valor={stats.recibido}
        />
        <Tarjeta
          icon={DollarSign}
          titulo="Total Comprado"
          valor={`USD $${formatNumber(stats.totalInvertido)}`}
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todas</option>
              <option value="en_camino">En Camino</option>
              <option value="ingresado">Ingresadas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {proveedoresEnUso.map(prov => (
                <option key={prov} value={prov}>
                  {prov === 'todos' ? 'Todos' : prov}
                </option>
              ))}
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

      {/* TABLA */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {recibosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
            <p>No hay importaciones registradas</p>
            <p className="text-sm text-slate-500 mt-1">Haz clic en "Nueva Importación" para agregar una</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Fecha Compra</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Proveedor</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recibosFiltrados.map((recibo, idx) => (
                <tr key={recibo.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-3 text-sm text-center text-slate-800">
                    {new Date(recibo.fecha).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-800">
                    {recibo.proveedor}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600">
                    {recibo.items.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">
                    USD ${formatNumber(recibo.items.reduce((sum, i) => sum + (i.monto || 0), 0))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      recibo.estado === 'en_camino'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {recibo.estado === 'en_camino' ? 'EN CAMINO' : 'INGRESADO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => toggleRecibo(recibo.id)}
                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setReciboToReceive(recibo);
                          setReceiveFormData({
                            fechaRecepcion: new Date().toISOString().split('T')[0],
                            pesoConCaja: 0,
                            pesoSinCaja: 0,
                            precioPorKg: 0,
                            pagoCourier: 0,
                            costoPickingShipping: 0
                          });
                          setShowReceiveModal(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                        title="Recepcionar"
                        disabled={recibo.estado === 'ingresado'}
                      >
                        <Truck size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('¿Eliminar esta importación y todos sus items?')) return;
                          try {
                            setIsSubmitting(true);
                            const resultado = await eliminarImportacion(recibo.id);
                            if (!resultado.success) {
                              throw new Error(resultado.error);
                            }
                            alert('Importación eliminada');
                          } catch (err) {
                            alert('Error: ' + err.message);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: DETALLES DE IMPORTACIÓN */}
      {expandedRecibos.size > 0 && recibosFiltrados.find(r => expandedRecibos.has(r.id)) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-semibold">Detalles de Importación</h3>
              <button onClick={() => setExpandedRecibos(new Set())} className="text-slate-300 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {Array.from(expandedRecibos).map(reciboId => {
                const recibo = recibosFiltrados.find(r => r.id === reciboId);
                if (!recibo) return null;

                return (
                  <div key={reciboId}>
                    {/* Información General */}
                    <div className="pb-6">
                      <h4 className="font-semibold text-slate-800 mb-3 uppercase text-sm">Información General</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Proveedor</label>
                          <p className="font-medium text-slate-800">{recibo.proveedor}</p>
                        </div>
                        <div className="text-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Fecha de Compra</label>
                          <p className="font-medium text-slate-800">{new Date(recibo.fecha).toLocaleDateString('es-AR')}</p>
                        </div>
                        <div className="text-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Número de Seguimiento</label>
                          <p className="font-medium text-slate-800">{recibo.numero_seguimiento || '-'}</p>
                        </div>
                        <div className="text-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                          <p className="font-medium text-slate-800">
                            {recibo.metodo_pago
                              ? METODOS_PAGO.find(m => m.value === recibo.metodo_pago)?.label || recibo.metodo_pago
                              : '-'}
                          </p>
                        </div>
                        <div className="text-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Empresa Logística</label>
                          <p className="font-medium text-slate-800">{recibo.logistica_empresa || '-'}</p>
                        </div>
                        <div className="text-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase">F. Est. Ingreso</label>
                          <p className="font-medium text-slate-800">
                            {recibo.fecha_estimada_ingreso ? new Date(recibo.fecha_estimada_ingreso).toLocaleDateString('es-AR') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Observaciones */}
                    {recibo.observaciones && (
                      <div className="border-t pt-6">
                        <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Observaciones</label>
                        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">{recibo.observaciones}</p>
                      </div>
                    )}

                    {/* Tabla de Productos */}
                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-slate-800 mb-3 uppercase text-sm">Productos Importados</h4>
                      <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-slate-800 text-white">
                            <tr>
                              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Producto</th>
                              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unitario</th>
                              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Subtotal</th>
                              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Unit. (kg)</th>
                              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Total (kg)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {recibo.items.map((item, idx) => {
                              // Usar datos guardados (unitarios)
                              const precioUnitario = parseFloat(item.precio_unitario) || (item.monto && item.cantidad ? item.monto / item.cantidad : 0);
                              const pesoUnitario = parseFloat(item.peso_unitario_kg) || 0;
                              const pesoTotal = parseFloat(item.peso_estimado_kg) || 0;
                              return (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                  <td className="px-4 py-3 text-sm text-center text-slate-800">{item.item}</td>
                                  <td className="px-4 py-3 text-sm text-center text-slate-600">{item.cantidad}</td>
                                  <td className="px-4 py-3 text-sm text-center text-slate-600">USD ${formatNumber(precioUnitario)}</td>
                                  <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">USD ${formatNumber(item.monto || 0)}</td>
                                  <td className="px-4 py-3 text-sm text-center text-slate-600">{formatNumber(pesoUnitario)}</td>
                                  <td className="px-4 py-3 text-sm text-center text-slate-600">{formatNumber(pesoTotal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-slate-800 text-white border-t border-slate-200">
                            <tr>
                              <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-right">
                                TOTAL:
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-center">
                                USD ${formatNumber(recibo.items.reduce((sum, i) => sum + (i.monto || 0), 0))}
                              </td>
                              <td colSpan="2"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setExpandedRecibos(new Set())}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA IMPORTACIÓN */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-semibold">Nueva Importación</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-300 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos Generales */}
              <div className="space-y-3">
                <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">Datos Generales</h4>
                </div>
                <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
                      <select
                        value={formNueva.proveedor}
                        onChange={(e) => setFormNueva({ ...formNueva, proveedor: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Seleccionar proveedor</option>
                        {proveedores.map(prov => (
                          <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                      <input
                        type="date"
                        value={formNueva.fecha}
                        onChange={(e) => setFormNueva({ ...formNueva, fecha: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Número de Seguimiento</label>
                      <input
                        type="text"
                        value={formNueva.numero_seguimiento}
                        onChange={(e) => setFormNueva({ ...formNueva, numero_seguimiento: e.target.value })}
                        placeholder="Ej: SZ123456789CN"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago *</label>
                      <select
                        value={formNueva.metodo_pago}
                        onChange={(e) => setFormNueva({ ...formNueva, metodo_pago: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {METODOS_PAGO.map(metodo => (
                          <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Logística</label>
                      <input
                        type="text"
                        value={formNueva.logistica_empresa}
                        onChange={(e) => setFormNueva({ ...formNueva, logistica_empresa: e.target.value })}
                        placeholder="DHL, FedEx, etc."
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">F. Estimada de Ingreso</label>
                      <input
                        type="date"
                        value={formNueva.fecha_estimada_ingreso}
                        onChange={(e) => setFormNueva({ ...formNueva, fecha_estimada_ingreso: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                      <textarea
                        value={formNueva.observaciones}
                        onChange={(e) => setFormNueva({ ...formNueva, observaciones: e.target.value })}
                        rows="1"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Agregar Items */}
              <div className="space-y-3">
                <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">Agregar Productos</h4>
                </div>
                <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Producto/Descripción *</label>
                      <input
                        type="text"
                        value={formNuevoItem.item}
                        onChange={(e) => setFormNuevoItem({ ...formNuevoItem, item: e.target.value })}
                        placeholder="Ej: iPhones 15 Pro"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
                      <input
                        type="number"
                        value={formNuevoItem.cantidad}
                        onChange={(e) => setFormNuevoItem({ ...formNuevoItem, cantidad: parseInt(e.target.value) || 1 })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario (USD) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formNuevoItem.precio_unitario}
                        onChange={(e) => setFormNuevoItem({ ...formNuevoItem, precio_unitario: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Peso Est. Unit. (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formNuevoItem.peso_estimado_unitario}
                        onChange={(e) => setFormNuevoItem({ ...formNuevoItem, peso_estimado_unitario: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={agregarItem}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium transition-colors"
                  >
                    + Agregar Producto
                  </button>
                </div>
              </div>

              {/* Tabla de Items */}
              {formNueva.items.length > 0 && (
                <div className="space-y-3">
                  <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                    <h4 className="font-semibold text-slate-800 uppercase">Productos Agregados</h4>
                  </div>
                  <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unitario</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {formNueva.items.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-4 py-3 text-sm text-slate-800">{item.item}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-600">{item.cantidad}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-600">USD ${formatNumber(item.precio_unitario)}</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">USD ${formatNumber(item.cantidad * item.precio_unitario)}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => eliminarItem(item.id)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t border-slate-200">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                            TOTAL:
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                            USD ${formatNumber(calcularTotalItems())}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarImportacion}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Importación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECEPCIÓN */}
      {showReceiveModal && reciboToReceive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-semibold">Recepcionar Importación</h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-slate-300 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Resumen de Items */}
              <div className="space-y-3">
                <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">Items de la Importación</h4>
                </div>
                <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Precio Unit.</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Monto</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Peso Unit.</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Peso Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reciboToReceive.items.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-2 text-slate-800">{item.item}</td>
                          <td className="px-4 py-2 text-center text-slate-600">{item.cantidad}</td>
                          <td className="px-4 py-2 text-center text-slate-600">USD ${formatNumber(item.precio_unitario || 0)}</td>
                          <td className="px-4 py-2 text-center font-medium text-slate-800">USD ${formatNumber(item.monto || 0)}</td>
                          <td className="px-4 py-2 text-center text-slate-600">{formatNumber(item.peso_unitario_kg || 0)} kg</td>
                          <td className="px-4 py-2 text-center text-slate-600">{formatNumber(item.peso_estimado_kg || 0)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t border-slate-200">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-sm font-semibold text-right text-slate-800">TOTAL:</td>
                        <td className="px-4 py-2 text-sm font-semibold text-center text-slate-800">USD ${formatNumber(reciboToReceive.items.reduce((sum, i) => sum + (i.monto || 0), 0))}</td>
                        <td colSpan="2" className="px-4 py-2 text-sm font-semibold text-center text-slate-800">{formatNumber(reciboToReceive.items.reduce((sum, i) => sum + (i.peso_estimado_kg || 0), 0))} kg</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Datos de Recepción */}
              <div className="space-y-3">
                <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">Datos de Recepción</h4>
                </div>
                <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Recepción *</label>
                      <input type="date" value={receiveFormData.fechaRecepcion} onChange={(e) => setReceiveFormData({...receiveFormData, fechaRecepcion: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Peso Total con Caja (kg) *</label>
                      <input type="number" step="0.01" value={receiveFormData.pesoConCaja || ''} onChange={(e) => setReceiveFormData({...receiveFormData, pesoConCaja: e.target.value ? parseFloat(e.target.value) : 0})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Peso sin Caja (kg) *</label>
                      <input type="number" step="0.01" value={receiveFormData.pesoSinCaja || ''} onChange={(e) => setReceiveFormData({...receiveFormData, pesoSinCaja: e.target.value ? parseFloat(e.target.value) : 0})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                      <p className="text-xs text-slate-500 mt-1">Est: {formatNumber(reciboToReceive.items.reduce((sum, item) => sum + (parseFloat(item.peso_estimado_kg) || 0), 0))} kg</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Precio por KG (USD) *</label>
                      <input type="number" step="0.01" value={receiveFormData.precioPorKg || ''} onChange={(e) => setReceiveFormData({...receiveFormData, precioPorKg: e.target.value ? parseFloat(e.target.value) : 0})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Pago Courier (USD) *</label>
                      <input type="number" step="0.01" value={receiveFormData.pagoCourier || ''} onChange={(e) => setReceiveFormData({...receiveFormData, pagoCourier: e.target.value ? parseFloat(e.target.value) : 0})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                      <p className="text-xs text-slate-500 mt-1">Est: USD ${formatNumber((receiveFormData.pesoConCaja || 0) * (receiveFormData.precioPorKg || 0))}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Costo Picking/Shipping (USD) *</label>
                      <input type="number" step="0.01" value={receiveFormData.costoPickingShipping || ''} onChange={(e) => setReceiveFormData({...receiveFormData, costoPickingShipping: e.target.value ? parseFloat(e.target.value) : 0})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Costos Adicionales */}
              <div className="space-y-3">
                <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">Distribución de Costos Adicionales</h4>
                </div>
                <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                    <span>Costo Total Adicional:</span>
                    <span className="font-semibold text-slate-800">USD ${formatNumber((receiveFormData.pagoCourier || 0) + (receiveFormData.costoPickingShipping || 0))}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Por Producto:</p>
                    <div className="space-y-1 ml-2">
                      {reciboToReceive.items.map((item) => {
                        // Calcular el monto total de productos para la distribución proporcional
                        const totalMontoProductos = reciboToReceive.items.reduce((sum, i) => sum + (i.monto || 0), 0);
                        const totalCostos = (receiveFormData.pagoCourier || 0) + (receiveFormData.costoPickingShipping || 0);

                        // Distribuir costos proporcionalmente al monto de cada producto
                        const costoPorProducto = totalMontoProductos > 0
                          ? (item.monto / totalMontoProductos) * totalCostos
                          : 0;

                        return (
                          <div key={item.id} className="flex justify-between text-slate-600">
                            <span>{item.item}:</span>
                            <span className="font-medium">USD ${formatNumber(costoPorProducto)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Validar campos obligatorios
                    if (!receiveFormData.fechaRecepcion) {
                      alert('Por favor ingresa la fecha de recepción');
                      return;
                    }
                    if (!receiveFormData.pesoConCaja || receiveFormData.pesoConCaja <= 0) {
                      alert('Por favor ingresa un peso válido con caja');
                      return;
                    }
                    if (!receiveFormData.pesoSinCaja || receiveFormData.pesoSinCaja <= 0) {
                      alert('Por favor ingresa un peso válido sin caja');
                      return;
                    }
                    if (!receiveFormData.precioPorKg || receiveFormData.precioPorKg <= 0) {
                      alert('Por favor ingresa un precio válido por KG');
                      return;
                    }
                    if (receiveFormData.pagoCourier < 0) {
                      alert('El pago courier no puede ser negativo');
                      return;
                    }
                    if (receiveFormData.costoPickingShipping < 0) {
                      alert('El costo de picking/shipping no puede ser negativo');
                      return;
                    }

                    setIsSubmitting(true);
                    try {
                      const resultado = await recepcionarImportacion(reciboToReceive.id, receiveFormData);

                      if (!resultado.success) {
                        throw new Error(resultado.error);
                      }

                      setShowReceiveModal(false);
                      setReceiveFormData({
                        fechaRecepcion: new Date().toISOString().split('T')[0],
                        pesoConCaja: 0,
                        pesoSinCaja: 0,
                        precioPorKg: 0,
                        pagoCourier: 0,
                        costoPickingShipping: 0
                      });
                      alert('Importación recepcionada exitosamente');
                    } catch (err) {
                      alert('Error: ' + err.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recepcionando...' : 'Confirmar Recepción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportacionesComprasSection;
