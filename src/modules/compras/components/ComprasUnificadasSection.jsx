import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, X, TrendingDown, DollarSign, Package, Eye, Edit, Trash2 } from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { useCompras } from '../hooks/useComprasDirectas';
import { useProveedores } from '../hooks/useProveedores';

const METODOS_PAGO = [
  { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
  { value: 'dolares_billete', label: '💸 Dólares Billete' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'criptomonedas', label: '₿ Criptomonedas' },
  { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
  { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' }
];

const ComprasSection = () => {
  // Hook para gestionar compras directas/nacionales
  const {
    compras,
    loading,
    error,
    cargarCompras,
    crearCompra,
    actualizarCompra,
    eliminarCompra
  } = useCompras();

  // Hook para gestionar proveedores
  const { proveedores } = useProveedores();

  // Estados locales
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Form para nueva compra
  const [formNuevaCompra, setFormNuevaCompra] = useState({
    tipo_compra: 'nacional',
    proveedor: '',
    moneda: 'USD',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    descripcion: '',
    observaciones: '',
    logistica_empresa: '',
    numero_seguimiento: '',
    peso_estimado_kg: '',
    fecha_estimada_ingreso: '',
    link_producto: '',
    items: []
  });

  // Form para nuevo item
  const [formNuevoItem, setFormNuevoItem] = useState({
    item: '',
    cantidad: 1,
    precio_unitario: 0,
    peso_estimado_unitario: 0
  });


  // Filtrar compras - Mostrar todas incluyendo importaciones en_camino
  const comprasFiltradas = useMemo(() => {
    return compras.filter(compra => {
      if (filtroTipo !== 'todas' && compra.tipo_compra !== filtroTipo) return false;
      if (filtroProveedor && compra.proveedor !== filtroProveedor) return false;
      if (filtroFechaDesde && compra.fecha < filtroFechaDesde) return false;
      if (filtroFechaHasta && compra.fecha > filtroFechaHasta) return false;
      return true;
    });
  }, [compras, filtroTipo, filtroProveedor, filtroFechaDesde, filtroFechaHasta]);

  // Calcular stats
  const stats = useMemo(() => {
    const total = compras.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    return {
      totalCompras: compras.length,
      totalInvertido: total
    };
  }, [compras]);

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-AR');
  };

  const limpiarFiltros = () => {
    setFiltroTipo('todas');
    setFiltroProveedor('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  const resetForm = () => {
    setFormNuevaCompra({
      tipo_compra: 'nacional',
      proveedor: '',
      moneda: 'USD',
      fecha: new Date().toISOString().split('T')[0],
      metodo_pago: 'transferencia',
      descripcion: '',
      observaciones: '',
      logistica_empresa: '',
      numero_seguimiento: '',
      peso_estimado_kg: '',
      fecha_estimada_ingreso: '',
      link_producto: '',
      items: []
    });
    setFormNuevoItem({
      item: '',
      cantidad: 1,
      precio_unitario: 0,
      peso_estimado_unitario: 0
    });
  };

  // Agregar item a la lista
  const agregarItem = () => {
    if (!formNuevoItem.item.trim() || !formNuevoItem.cantidad || !formNuevoItem.precio_unitario) {
      alert('Completa todos los campos del item');
      return;
    }
    setFormNuevaCompra(prev => ({
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

  // Eliminar item
  const eliminarItem = (id) => {
    setFormNuevaCompra(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Calcular total
  const calcularTotalItems = () => {
    return formNuevaCompra.items.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
    }, 0);
  };

  const handleCrearCompra = async () => {
    if (!formNuevaCompra.proveedor || !formNuevaCompra.items || formNuevaCompra.items.length === 0) {
      alert('Por favor agrega al menos un item a la compra');
      return;
    }

    setIsSubmitting(true);

    try {
      // Guardar cada item como una compra separada
      for (const item of formNuevaCompra.items) {
        const compraData = {
          tipo_compra: formNuevaCompra.tipo_compra,
          proveedor: formNuevaCompra.proveedor,
          item: item.item,
          cantidad: item.cantidad,
          monto: item.cantidad * item.precio_unitario,
          moneda: formNuevaCompra.moneda,
          fecha: formNuevaCompra.fecha,
          caja_pago: formNuevaCompra.metodo_pago,
          descripcion: formNuevaCompra.descripcion,
          observaciones: formNuevaCompra.observaciones,
          logistica_empresa: formNuevaCompra.logistica_empresa,
          numero_seguimiento: formNuevaCompra.numero_seguimiento,
          peso_estimado_kg: item.peso_estimado_unitario || 0,
          fecha_estimada_ingreso: formNuevaCompra.fecha_estimada_ingreso,
          link_producto: formNuevaCompra.link_producto,
          estado: 'en_camino'
        };

        const result = await crearCompra(compraData);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      setShowNewModal(false);
      resetForm();
      alert('Compra guardada exitosamente');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar items para edición
  const cargarItemsParaEdicion = (compra) => {
    const itemsDelProveedor = compras.filter(
      c => c.proveedor === compra.proveedor && c.fecha === compra.fecha && c.tipo_compra === compra.tipo_compra
    );
    setEditItems(itemsDelProveedor.map(item => ({
      ...item,
      tempId: item.id,
      precio_unitario: item.monto / (item.cantidad || 1),
      peso_estimado_unitario: item.peso_estimado_kg
    })));
  };

  // Editar item en tabla
  const editarItemEnTabla = (tempId, campo, valor) => {
    setEditItems(prev => prev.map(item =>
      item.tempId === tempId ? { ...item, [campo]: valor } : item
    ));
  };

  // Eliminar item de edición
  const eliminarItemEdicion = (tempId) => {
    setEditItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  const handleActualizarCompra = async () => {
    if (!selectedCompra || editItems.length === 0) {
      alert('Error: Debe haber al menos un producto');
      return;
    }

    setIsSubmitting(true);
    try {
      // Obtener los items originales para comparar
      const itemsOriginales = compras.filter(
        c => c.proveedor === selectedCompra.proveedor && c.fecha === selectedCompra.fecha && c.tipo_compra === selectedCompra.tipo_compra
      );

      // Eliminar items que fueron removidos
      for (const itemOriginal of itemsOriginales) {
        const sigue = editItems.find(e => e.id === itemOriginal.id);
        if (!sigue) {
          await eliminarCompra(itemOriginal.id);
        }
      }

      // Actualizar items existentes
      for (const item of editItems) {
        if (item.id) {
          const itemData = {
            item: item.item,
            cantidad: item.cantidad,
            monto: (item.cantidad || 1) * (item.precio_unitario || 0),
            caja_pago: formNuevaCompra.caja_pago || formNuevaCompra.metodo_pago,
            peso_estimado_kg: item.peso_estimado_unitario,
            observaciones: formNuevaCompra.observaciones
          };

          await actualizarCompra(item.id, itemData);
        }
      }

      setShowEditModal(false);
      setSelectedCompra(null);
      setEditItems([]);
      resetForm();
      alert('Compra actualizada exitosamente');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarCompra = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta compra?')) return;

    setIsSubmitting(true);
    const result = await eliminarCompra(id);
    setIsSubmitting(false);

    if (!result.success) {
      alert('Error: ' + result.error);
    }
  };

  const abrirEditar = (compra) => {
    setSelectedCompra(compra);
    setFormNuevaCompra({
      tipo_compra: compra.tipo_compra || 'nacional',
      proveedor: compra.proveedor,
      moneda: compra.moneda || 'USD',
      fecha: compra.fecha,
      metodo_pago: compra.caja_pago || compra.metodo_pago || 'transferencia',
      descripcion: compra.descripcion || '',
      observaciones: compra.observaciones || '',
      logistica_empresa: compra.logistica_empresa || '',
      numero_seguimiento: compra.numero_seguimiento || '',
      peso_estimado_kg: compra.peso_estimado_kg || '',
      fecha_estimada_ingreso: compra.fecha_estimada_ingreso || '',
      link_producto: compra.link_producto || '',
      items: []
    });
    cargarItemsParaEdicion(compra);
    setShowEditModal(true);
  };

  const abrirVer = (compra) => {
    setSelectedCompra(compra);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-semibold">Compras</h2>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowNewModal(true);
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Compra
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tarjeta icon={Package} titulo="Total Compras" valor={stats.totalCompras} />
        <Tarjeta icon={DollarSign} titulo="Total Invertido" valor={`USD $${formatNumber(stats.totalInvertido)}`} />
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded border border-slate-200">
        <div className="bg-gray-50 p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              >
                <option value="todas">Todas</option>
                <option value="nacional">Nacionales</option>
                <option value="importacion">Importaciones</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <select
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              >
                <option value="">Todos</option>
                {compras && Array.isArray(compras) && [...new Set(compras.map(c => c.proveedor))].filter(Boolean).map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
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
          <p className="text-sm text-slate-600 mt-2">
            {loading ? 'Cargando compras...' : `Mostrando ${comprasFiltradas.length} de ${compras.length} compras`}
          </p>
        </div>

        {/* MENSAJE DE CARGA */}
        {loading && (
          <div className="bg-white rounded-b border border-slate-200 border-t-0 p-8 text-center text-slate-600">
            Cargando compras desde la base de datos...
          </div>
        )}

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="bg-red-50 rounded-b border border-red-200 border-t-0 p-4 text-red-800">
            Error cargando compras: {error}
          </div>
        )}

        {/* TABLA DE COMPRAS */}
        {!loading && !error && (
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Proveedor</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {comprasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    No hay compras que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                comprasFiltradas.map((compra, idx) => (
                  <tr key={compra.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-sm text-center text-slate-800">
                      {formatDate(compra.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        compra.tipo_compra === 'nacional'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {compra.tipo_compra === 'nacional' ? 'Nacional' : 'Importación'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-center text-slate-800">
                      {compra.proveedor}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {compra.item}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {compra.cantidad}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                      {compra.moneda} ${formatNumber(compra.monto)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => abrirVer(compra)}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => abrirEditar(compra)}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleEliminarCompra(compra.id)}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: NUEVA/EDITAR COMPRA */}
      {(showNewModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-semibold">
                {showEditModal ? 'Editar Compra' : 'Nueva Compra'}
              </h3>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-slate-300 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de Compra */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">Tipo de Compra</h4>
                </div>
                <div className="p-4">
                  <select
                    value={formNuevaCompra.tipo_compra}
                    onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, tipo_compra: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="nacional">Nacional</option>
                    <option value="importacion">Importación</option>
                  </select>
                </div>
              </div>

              {/* Datos Generales */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">Datos Generales</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
                      <select
                        value={formNuevaCompra.proveedor}
                        onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, proveedor: e.target.value })}
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
                        value={formNuevaCompra.fecha}
                        onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, fecha: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                      <select
                        value={formNuevaCompra.moneda}
                        onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, moneda: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
                      <select
                        value={formNuevaCompra.metodo_pago}
                        onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, metodo_pago: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {METODOS_PAGO.map(metodo => (
                          <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                      <textarea
                        value={formNuevaCompra.observaciones || ''}
                        onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, observaciones: e.target.value })}
                        rows="1"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items - Mostrar diferentes UI para crear vs editar */}
              {!showEditModal ? (
                // CREAR: Permitir agregar items
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                    <h4 className="font-semibold text-slate-800 uppercase">Agregar Items</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Producto/Descripción *</label>
                        <input
                          type="text"
                          value={formNuevoItem.item}
                          onChange={(e) => setFormNuevoItem({ ...formNuevoItem, item: e.target.value })}
                          placeholder="Ej: iPhone 15 Pro"
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
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario ({formNuevaCompra.moneda}) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formNuevoItem.precio_unitario}
                          onChange={(e) => setFormNuevoItem({ ...formNuevoItem, precio_unitario: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      {formNuevaCompra.tipo_compra === 'importacion' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Peso Est. Unitario (kg)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formNuevoItem.peso_estimado_unitario}
                            onChange={(e) => setFormNuevoItem({ ...formNuevoItem, peso_estimado_unitario: parseFloat(e.target.value) || 0 })}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={agregarItem}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium transition-colors"
                    >
                      + Agregar Item
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Tabla de Items */}
              {(showEditModal ? editItems : formNuevaCompra.items).length > 0 && (
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                    <h4 className="font-semibold text-slate-800 uppercase">Items</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Producto</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unitario</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(showEditModal ? editItems : formNuevaCompra.items).map((item, idx) => (
                          <tr key={item.id || item.tempId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-4 py-3 text-sm text-center">
                              {showEditModal ? (
                                <input
                                  type="text"
                                  value={item.item || ''}
                                  onChange={(e) => editarItemEnTabla(item.tempId, 'item', e.target.value)}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              ) : (
                                item.item
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {showEditModal ? (
                                <input
                                  type="number"
                                  value={item.cantidad || 1}
                                  onChange={(e) => editarItemEnTabla(item.tempId, 'cantidad', parseInt(e.target.value) || 1)}
                                  className="w-20 border border-slate-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mx-auto"
                                />
                              ) : (
                                item.cantidad
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {showEditModal ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.precio_unitario || 0}
                                  onChange={(e) => editarItemEnTabla(item.tempId, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                  className="w-24 border border-slate-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mx-auto"
                                />
                              ) : (
                                `${formNuevaCompra.moneda} $${formatNumber(item.precio_unitario)}`
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">
                              {formNuevaCompra.moneda} ${formatNumber((item.cantidad || 1) * (item.precio_unitario || 0))}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => showEditModal ? eliminarItemEdicion(item.tempId) : eliminarItem(item.id)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
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
                            {formNuevaCompra.moneda} ${formatNumber(
                              (showEditModal ? editItems : formNuevaCompra.items).reduce((sum, item) => sum + ((item.cantidad || 1) * (item.precio_unitario || 0)), 0)
                            )}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Campos de Importación (Solo si es importación) */}
              {formNuevaCompra.tipo_compra === 'importacion' && (
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                    <h4 className="font-semibold text-slate-800 uppercase">Datos de Importación</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Logística</label>
                        <input
                          type="text"
                          value={formNuevaCompra.logistica_empresa || ''}
                          onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, logistica_empresa: e.target.value })}
                          placeholder="FedEx, DHL, etc."
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Número de Seguimiento</label>
                        <input
                          type="text"
                          value={formNuevaCompra.numero_seguimiento || ''}
                          onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, numero_seguimiento: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Peso Estimado (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formNuevaCompra.peso_estimado_kg || ''}
                          onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, peso_estimado_kg: parseFloat(e.target.value) || null })}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Estimada Ingreso</label>
                        <input
                          type="date"
                          value={formNuevaCompra.fecha_estimada_ingreso || ''}
                          onChange={(e) => setFormNuevaCompra({ ...formNuevaCompra, fecha_estimada_ingreso: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end border-t pt-4">
                <button
                  onClick={() => {
                    setShowNewModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={showEditModal ? handleActualizarCompra : handleCrearCompra}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : showEditModal ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLES */}
      {showViewModal && selectedCompra && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-semibold">Detalles de Compra</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCompra(null);
                }}
                className="text-slate-300 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información General */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 uppercase text-sm">Información General</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tipo</label>
                    <p className="text-sm font-medium">{selectedCompra.tipo_compra === 'nacional' ? 'Nacional' : 'Importación'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Fecha</label>
                    <p className="text-sm font-medium">{formatDate(selectedCompra.fecha)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Proveedor</label>
                    <p className="text-sm font-medium">{selectedCompra.proveedor}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                    <p className="text-sm font-medium">
                      {METODOS_PAGO.find(m => m.value === selectedCompra.metodo_pago)?.label || selectedCompra.metodo_pago}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Estado</label>
                    <p className="text-sm font-medium">{selectedCompra.estado}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Moneda</label>
                    <p className="text-sm font-medium">{selectedCompra.moneda}</p>
                  </div>
                </div>
              </div>

              {/* Detalle de Producto */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-800 mb-3 uppercase text-sm">Productos Comprados</h4>
                <table className="w-full border border-slate-200 rounded overflow-hidden">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Unitario</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {selectedCompra.item}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">
                        {selectedCompra.cantidad}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">
                        {selectedCompra.moneda} ${formatNumber(selectedCompra.monto / selectedCompra.cantidad)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                        {selectedCompra.moneda} ${formatNumber(selectedCompra.monto)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-100 border-t border-slate-200">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                        SUBTOTAL:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                        {selectedCompra.moneda} ${formatNumber(selectedCompra.monto)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Información de Importación */}
              {selectedCompra.tipo_compra === 'importacion' && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-slate-800 mb-3 uppercase text-sm">Datos de Importación</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCompra.logistica_empresa && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Empresa Logística</label>
                        <p className="text-sm">{selectedCompra.logistica_empresa}</p>
                      </div>
                    )}
                    {selectedCompra.numero_seguimiento && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Número de Seguimiento</label>
                        <p className="text-sm">{selectedCompra.numero_seguimiento}</p>
                      </div>
                    )}
                    {selectedCompra.peso_estimado_kg && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Peso Estimado</label>
                        <p className="text-sm">{selectedCompra.peso_estimado_kg} kg</p>
                      </div>
                    )}
                    {selectedCompra.peso_real_kg && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Peso Real</label>
                        <p className="text-sm">{selectedCompra.peso_real_kg} kg</p>
                      </div>
                    )}
                    {selectedCompra.fecha_estimada_ingreso && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Fecha Estimada Ingreso</label>
                        <p className="text-sm">{formatDate(selectedCompra.fecha_estimada_ingreso)}</p>
                      </div>
                    )}
                    {selectedCompra.fecha_ingreso_real && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Fecha Real Ingreso</label>
                        <p className="text-sm">{formatDate(selectedCompra.fecha_ingreso_real)}</p>
                      </div>
                    )}
                    {selectedCompra.impuestos_porcentaje > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">% Impuestos</label>
                        <p className="text-sm">{selectedCompra.impuestos_porcentaje}%</p>
                      </div>
                    )}
                    {selectedCompra.costos_logistica_usd > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Costos Logística</label>
                        <p className="text-sm">USD ${formatNumber(selectedCompra.costos_logistica_usd)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {selectedCompra.observaciones && (
                <div className="border-t pt-6">
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Observaciones</label>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">{selectedCompra.observaciones}</p>
                </div>
              )}

              {/* Link de Producto */}
              {selectedCompra.link_producto && (
                <div className="border-t pt-6">
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Link del Producto</label>
                  <a
                    href={selectedCompra.link_producto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 hover:text-emerald-700 break-all"
                  >
                    {selectedCompra.link_producto}
                  </a>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end border-t pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCompra(null);
                  }}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    abrirEditar(selectedCompra);
                    setShowViewModal(false);
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasSection;
