import React, { useState, useMemo } from 'react';
import { Plus, CreditCard, Filter, X, Check, Edit2, Trash2, Building2 } from 'lucide-react';
import { useCuentasAPagar } from '../hooks/useCuentasAPagar';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { METODOS_PAGO } from '../../../shared/constants/paymentMethods';
import { obtenerFechaArgentina } from '../../../shared/config/timezone';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SUCURSALES = [
  { value: 'la_plata', label: 'La Plata' },
  { value: 'mitre', label: 'Mitre' }
];

const CATEGORIAS = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'salarios', label: 'Salarios' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'logistica', label: 'Logística' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otros', label: 'Otros' }
];

const SUCURSAL_LABELS = { la_plata: 'La Plata', mitre: 'Mitre' };
const CATEGORIA_LABELS = {
  alquiler: 'Alquiler', servicios: 'Servicios', salarios: 'Salarios',
  impuestos: 'Impuestos', proveedores: 'Proveedores', logistica: 'Logística',
  mantenimiento: 'Mantenimiento', otros: 'Otros'
};
const SUCURSAL_COLORES = { la_plata: '#10b981', mitre: '#475569' };

const inputCls = 'w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

const CuentasAPagarSection = () => {
  const { servicios, cuentas, loading, addServicio, updateServicio, addCuenta, updateCuenta, deleteCuenta, marcarPagada } = useCuentasAPagar();

  const [modalNuevoServicio, setModalNuevoServicio] = useState(false);
  const [modalEditarServicio, setModalEditarServicio] = useState(null);
  const [modalNuevaCuenta, setModalNuevaCuenta] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalPagar, setModalPagar] = useState(null);

  // Nueva cuenta: servicio seleccionado
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [monedaNueva, setMonedaNueva] = useState('USD');
  const [monedaEditar, setMonedaEditar] = useState('USD');

  const [filtroSucursal, setFiltroSucursal] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const hoy = obtenerFechaArgentina();

  const getEstadoReal = (cuenta) => {
    if (cuenta.estado === 'pagada') return 'pagada';
    if (cuenta.fecha_vencimiento && cuenta.fecha_vencimiento < hoy) return 'vencida';
    return 'pendiente';
  };

  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter(c => {
      const estadoReal = getEstadoReal(c);
      if (filtroSucursal !== 'todas' && c.sucursal !== filtroSucursal) return false;
      if (filtroEstado !== 'todos' && estadoReal !== filtroEstado) return false;
      if (filtroCategoria !== 'todas' && c.categoria !== filtroCategoria) return false;
      if (filtroDesde && c.fecha_vencimiento < filtroDesde) return false;
      if (filtroHasta && c.fecha_vencimiento > filtroHasta) return false;
      return true;
    });
  }, [cuentas, filtroSucursal, filtroEstado, filtroCategoria, filtroDesde, filtroHasta, hoy]);

  const stats = useMemo(() => {
    let totalPendienteUSD = 0;
    let vencidas = 0;
    let pagadoMes = 0;
    let cantidadPendientes = 0;
    const mesActual = hoy.substring(0, 7);
    cuentas.forEach(c => {
      const estadoReal = getEstadoReal(c);
      if (estadoReal !== 'pagada') {
        cantidadPendientes++;
        totalPendienteUSD += parseFloat(c.monto_usd || 0);
      }
      if (estadoReal === 'vencida') vencidas++;
      if (c.estado === 'pagada' && c.fecha_pago?.startsWith(mesActual)) {
        pagadoMes += parseFloat(c.monto_usd || 0);
      }
    });
    return { totalPendienteUSD, vencidas, pagadoMes, cantidadPendientes };
  }, [cuentas, hoy]);

  const datosGrafico = useMemo(() => {
    const meses = [];
    const [year, month] = hoy.split('-').map(Number);
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m <= 0) { m += 12; y--; }
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = new Date(y, m - 1).toLocaleDateString('es-AR', { month: 'short' });
      meses.push({ key, label, la_plata: 0, mitre: 0 });
    }
    cuentas.filter(c => c.estado === 'pagada' && c.fecha_pago).forEach(c => {
      const mesPago = c.fecha_pago.substring(0, 7);
      const mesData = meses.find(m => m.key === mesPago);
      if (mesData && mesData[c.sucursal] !== undefined) {
        mesData[c.sucursal] += parseFloat(c.monto_usd || 0);
      }
    });
    return meses;
  }, [cuentas, hoy]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatearUSD = (monto) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(parseFloat(monto || 0));

  const formatearARS = (monto) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(parseFloat(monto || 0));

  const getEstadoBadge = (estadoReal) => {
    switch (estadoReal) {
      case 'pendiente': return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Pendiente</span>;
      case 'vencida':   return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Vencida</span>;
      case 'pagada':    return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Pagada</span>;
      default: return null;
    }
  };

  const getSucursalBadge = (sucursal) => {
    const colores = { la_plata: 'bg-blue-100 text-blue-700', mitre: 'bg-slate-200 text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${colores[sucursal] || 'bg-slate-100 text-slate-600'}`}>
        {SUCURSAL_LABELS[sucursal] || sucursal}
      </span>
    );
  };

  const montoDisplay = (cuenta) => {
    const monto = parseFloat(cuenta.monto_original || cuenta.monto_usd || 0);
    return cuenta.moneda === 'ARS' ? formatearARS(monto) : formatearUSD(monto);
  };

  const limpiarFiltros = () => {
    setFiltroSucursal('todas');
    setFiltroEstado('todos');
    setFiltroCategoria('todas');
    setFiltroDesde('');
    setFiltroHasta('');
  };

  // ── Handlers: Nuevo Servicio ────────────────────────────────────────────────
  const handleNuevoServicioSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      nombre: form.nombre.value.trim(),
      sucursal: form.sucursal.value,
      categoria: form.categoria.value,
      proveedor: form.proveedor.value.trim() || null,
      activo: true
    };
    if (!data.nombre || !data.sucursal || !data.categoria) {
      alert('Completá los campos obligatorios');
      return;
    }
    const result = await addServicio(data);
    if (result.success) {
      setModalNuevoServicio(false);
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleEditarServicioSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      nombre: form.nombre.value.trim(),
      sucursal: form.sucursal.value,
      categoria: form.categoria.value,
      proveedor: form.proveedor.value.trim() || null
    };
    const result = await updateServicio(modalEditarServicio.id, data);
    if (result.success) {
      setModalEditarServicio(null);
    } else {
      alert('Error: ' + result.error);
    }
  };

  // ── Handlers: Nueva Cuenta ──────────────────────────────────────────────────
  const abrirNuevaCuenta = () => {
    setServicioSeleccionado(null);
    setMonedaNueva('USD');
    setModalNuevaCuenta(true);
  };

  const handleServicioChange = (e) => {
    const id = e.target.value;
    const s = servicios.find(s => s.id === id) || null;
    setServicioSeleccionado(s);
  };

  const handleNuevaCuentaSubmit = async (e) => {
    e.preventDefault();
    if (!servicioSeleccionado) {
      alert('Seleccioná un servicio');
      return;
    }
    const form = e.target;
    const montoOriginal = parseFloat(form.monto.value) || 0;
    if (montoOriginal <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    let montoUSD = 0, montoARS = 0, cotizacion = null;
    if (monedaNueva === 'USD') {
      montoUSD = montoOriginal;
    } else {
      cotizacion = parseFloat(form.cotizacion_usd?.value);
      if (!cotizacion || cotizacion <= 0) {
        alert('La cotización del USD es obligatoria para cuentas en ARS');
        return;
      }
      montoARS = montoOriginal;
      montoUSD = Math.round((montoOriginal / cotizacion) * 100) / 100;
    }

    const data = {
      servicio_id: servicioSeleccionado.id,
      descripcion: servicioSeleccionado.nombre,
      proveedor: servicioSeleccionado.proveedor || null,
      sucursal: servicioSeleccionado.sucursal,
      categoria: servicioSeleccionado.categoria,
      moneda: monedaNueva,
      monto_original: montoOriginal,
      monto_usd: montoUSD,
      monto_ars: montoARS,
      cotizacion_creacion: cotizacion,
      fecha_vencimiento: form.fecha_vencimiento.value,
      observaciones: form.observaciones.value.trim() || null,
      estado: 'pendiente'
    };

    if (!data.fecha_vencimiento) {
      alert('La fecha de vencimiento es obligatoria');
      return;
    }

    const result = await addCuenta(data);
    if (result.success) {
      setModalNuevaCuenta(false);
      setServicioSeleccionado(null);
      setMonedaNueva('USD');
    } else {
      alert('Error: ' + result.error);
    }
  };

  // ── Handlers: Editar Cuenta ─────────────────────────────────────────────────
  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const montoOriginal = parseFloat(form.monto.value) || 0;
    let montoUSD = 0, montoARS = 0, cotizacion = null;
    if (monedaEditar === 'USD') {
      montoUSD = montoOriginal;
    } else {
      cotizacion = parseFloat(form.cotizacion_usd?.value);
      if (!cotizacion || cotizacion <= 0) {
        alert('La cotización del USD es obligatoria para cuentas en ARS');
        return;
      }
      montoARS = montoOriginal;
      montoUSD = Math.round((montoOriginal / cotizacion) * 100) / 100;
    }
    const data = {
      moneda: monedaEditar,
      monto_original: montoOriginal,
      monto_usd: montoUSD,
      monto_ars: montoARS,
      cotizacion_creacion: cotizacion,
      fecha_vencimiento: form.fecha_vencimiento.value,
      observaciones: form.observaciones.value.trim() || null
    };
    const result = await updateCuenta(modalEditar.id, data);
    if (result.success) {
      setModalEditar(null);
    } else {
      alert('Error: ' + result.error);
    }
  };

  // ── Handlers: Marcar Pagada ─────────────────────────────────────────────────
  const handlePagarSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fechaPago = form.fecha_pago.value;
    if (!fechaPago) { alert('La fecha de pago es obligatoria'); return; }

    const data = {
      fecha_pago: fechaPago,
      metodo_pago: form.metodo_pago.value || null,
      cuenta_contable: form.cuenta_contable.value.trim() || null
    };

    if (modalPagar.moneda === 'ARS') {
      const cotizacion = parseFloat(form.cotizacion_usd?.value);
      if (!cotizacion || cotizacion <= 0) {
        alert('La cotización del USD es obligatoria para cuentas en ARS');
        return;
      }
      data.cotizacion_pago = cotizacion;
      data.monto_usd = parseFloat(modalPagar.monto_original || 0) / cotizacion;
    }

    const result = await marcarPagada(modalPagar.id, data);
    if (result.success) setModalPagar(null);
    else alert('Error: ' + result.error);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta cuenta a pagar?')) return;
    const result = await deleteCuenta(id);
    if (!result.success) alert('Error: ' + result.error);
  };

  const serviciosActivos = servicios.filter(s => s.activo !== false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200">
        <div className="bg-slate-800 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <CreditCard size={28} />
              <div>
                <h2 className="text-2xl font-semibold">Cuentas a Pagar</h2>
                <p className="text-gray-300 mt-1">Gestión de obligaciones de pago por sucursal</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setModalNuevoServicio(true)}
                className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Building2 size={16} />
                Nuevo Servicio
              </button>
              <button
                onClick={abrirNuevaCuenta}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Nueva Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjeta titulo="Pendiente (USD)" valor={formatearUSD(stats.totalPendienteUSD)} />
        <Tarjeta titulo="Vencidas" valor={stats.vencidas} />
        <Tarjeta titulo="Pagado este mes" valor={formatearUSD(stats.pagadoMes)} />
        <Tarjeta titulo="Servicios activos" valor={serviciosActivos.length} />
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Gasto mensual por sucursal (USD pagados)</h3>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => formatearUSD(value)} />
              <Legend />
              <Bar dataKey="la_plata" name="La Plata" fill={SUCURSAL_COLORES.la_plata} />
              <Bar dataKey="mitre" name="Mitre" fill={SUCURSAL_COLORES.mitre} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros + Tabla */}
      <div className="bg-white rounded border border-slate-200">
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Filter size={14} /> Filtros
            </div>
            <button onClick={limpiarFiltros} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              Limpiar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className={labelCls}>Sucursal</label>
              <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)} className={inputCls}>
                <option value="todas">Todas</option>
                {SUCURSALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={inputCls}>
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencida">Vencida</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={inputCls}>
                <option value="todas">Todas</option>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Desde</label>
              <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hasta</label>
              <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Servicio</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Sucursal</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Vencimiento</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Cargando...</td></tr>
              ) : cuentasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    {cuentas.length === 0 ? 'No hay cuentas registradas' : 'Sin resultados para los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                cuentasFiltradas.map((cuenta, index) => {
                  const estadoReal = getEstadoReal(cuenta);
                  return (
                    <tr key={cuenta.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-sm text-slate-800 font-medium max-w-[220px]">
                        <div className="truncate" title={cuenta.descripcion}>{cuenta.descripcion}</div>
                        {cuenta.proveedor && (
                          <div className="text-xs text-slate-400 truncate">{cuenta.proveedor}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{getSucursalBadge(cuenta.sucursal)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">
                        {CATEGORIA_LABELS[cuenta.categoria] || cuenta.categoria}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800 text-center whitespace-nowrap">
                        {formatearFecha(cuenta.fecha_vencimiento)}
                        {cuenta.estado === 'pagada' && cuenta.fecha_pago && (
                          <div className="text-xs text-slate-400">Pago: {formatearFecha(cuenta.fecha_pago)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 text-center whitespace-nowrap">
                        {montoDisplay(cuenta)}
                        <div className="text-xs text-slate-400">
                          {cuenta.moneda === 'ARS' ? `≈ ${formatearUSD(cuenta.monto_usd)}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getEstadoBadge(estadoReal)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {estadoReal !== 'pagada' && (
                            <button
                              onClick={() => setModalPagar(cuenta)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Marcar como pagada"
                            >
                              <Check size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => { setModalEditar(cuenta); setMonedaEditar(cuenta.moneda || 'USD'); }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleEliminar(cuenta.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Nuevo Servicio ─────────────────────────────────────────────── */}
      {modalNuevoServicio && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-md">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
              <div className="flex items-center gap-3">
                <Building2 size={18} />
                <h3 className="text-base font-semibold">Nuevo Servicio</h3>
              </div>
              <button onClick={() => setModalNuevoServicio(false)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNuevoServicioSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input name="nombre" type="text" required className={inputCls} placeholder="Ej: Alquiler local La Plata" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Sucursal *</label>
                  <select name="sucursal" required className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {SUCURSALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Categoría *</label>
                  <select name="categoria" required className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Proveedor</label>
                <input name="proveedor" type="text" className={inputCls} placeholder="Opcional" />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setModalNuevoServicio(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium">Guardar Servicio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Servicio ────────────────────────────────────────────── */}
      {modalEditarServicio && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-md">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
              <div className="flex items-center gap-3">
                <Edit2 size={18} />
                <h3 className="text-base font-semibold">Editar Servicio</h3>
              </div>
              <button onClick={() => setModalEditarServicio(null)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditarServicioSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input name="nombre" type="text" required defaultValue={modalEditarServicio.nombre} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Sucursal *</label>
                  <select name="sucursal" required defaultValue={modalEditarServicio.sucursal} className={inputCls}>
                    {SUCURSALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Categoría *</label>
                  <select name="categoria" required defaultValue={modalEditarServicio.categoria} className={inputCls}>
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Proveedor</label>
                <input name="proveedor" type="text" defaultValue={modalEditarServicio.proveedor || ''} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setModalEditarServicio(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Nueva Cuenta ───────────────────────────────────────────────── */}
      {modalNuevaCuenta && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
              <div className="flex items-center gap-3">
                <Plus size={18} />
                <h3 className="text-base font-semibold">Nueva Cuenta a Pagar</h3>
              </div>
              <button onClick={() => setModalNuevaCuenta(false)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNuevaCuentaSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Servicio *</label>
                <select
                  onChange={handleServicioChange}
                  required
                  className={inputCls}
                  defaultValue=""
                >
                  <option value="" disabled>Seleccionar servicio...</option>
                  {SUCURSALES.map(suc => {
                    const items = serviciosActivos.filter(s => s.sucursal === suc.value);
                    if (items.length === 0) return null;
                    return (
                      <optgroup key={suc.value} label={suc.label}>
                        {items.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}{s.proveedor ? ` — ${s.proveedor}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                {serviciosActivos.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No hay servicios registrados. Creá uno primero con "Nuevo Servicio".</p>
                )}
              </div>

              {servicioSeleccionado && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getSucursalBadge(servicioSeleccionado.sucursal)}
                    <span className="text-slate-500">{CATEGORIA_LABELS[servicioSeleccionado.categoria] || servicioSeleccionado.categoria}</span>
                    {servicioSeleccionado.proveedor && (
                      <span className="text-slate-400">· {servicioSeleccionado.proveedor}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Moneda *</label>
                  <select value={monedaNueva} onChange={(e) => setMonedaNueva(e.target.value)} className={inputCls}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Monto ({monedaNueva}) *</label>
                  <input name="monto" type="number" step="0.01" min="0" required className={inputCls} placeholder="0.00" />
                </div>
              </div>

              {monedaNueva === 'ARS' && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <label className={labelCls}>Cotización USD *</label>
                  <input name="cotizacion_usd" type="number" step="0.01" min="0" required className={inputCls} placeholder="Ej: 1200.00" />
                  <p className="text-xs text-slate-500 mt-1">Valor del dólar en pesos</p>
                </div>
              )}

              <div>
                <label className={labelCls}>Fecha de vencimiento *</label>
                <input name="fecha_vencimiento" type="date" required className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Observaciones</label>
                <textarea name="observaciones" rows={2} className={`${inputCls} resize-none`} placeholder="Opcional..." />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setModalNuevaCuenta(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium">Registrar Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Cuenta ──────────────────────────────────────────────── */}
      {modalEditar && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
              <div className="flex items-center gap-3">
                <Edit2 size={18} />
                <h3 className="text-base font-semibold">Editar Cuenta — {modalEditar.descripcion}</h3>
              </div>
              <button onClick={() => setModalEditar(null)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditarSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Moneda *</label>
                  <select value={monedaEditar} onChange={(e) => setMonedaEditar(e.target.value)} className={inputCls}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Monto ({monedaEditar}) *</label>
                  <input
                    name="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={modalEditar.monto_original || modalEditar.monto_usd || modalEditar.monto_ars}
                    className={inputCls}
                  />
                </div>
              </div>
              {monedaEditar === 'ARS' && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <label className={labelCls}>Cotización USD *</label>
                  <input name="cotizacion_usd" type="number" step="0.01" min="0" required defaultValue={modalEditar.cotizacion_creacion || ''} className={inputCls} placeholder="Ej: 1200.00" />
                </div>
              )}
              <div>
                <label className={labelCls}>Fecha de vencimiento *</label>
                <input name="fecha_vencimiento" type="date" required defaultValue={modalEditar.fecha_vencimiento} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Observaciones</label>
                <textarea name="observaciones" rows={2} defaultValue={modalEditar.observaciones || ''} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setModalEditar(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Marcar Pagada ──────────────────────────────────────────────── */}
      {modalPagar && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-md">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
              <div className="flex items-center gap-3">
                <Check size={18} />
                <h3 className="text-base font-semibold">Marcar como Pagada</h3>
              </div>
              <button onClick={() => setModalPagar(null)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePagarSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-sm font-medium text-slate-800">{modalPagar.descripcion}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {montoDisplay(modalPagar)} · Vence: {formatearFecha(modalPagar.fecha_vencimiento)}
                </p>
              </div>
              <div>
                <label className={labelCls}>Fecha de pago *</label>
                <input name="fecha_pago" type="date" required defaultValue={obtenerFechaArgentina()} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Método de pago</label>
                <select name="metodo_pago" className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {modalPagar.moneda === 'ARS' && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <label className={labelCls}>Cotización USD al momento del pago *</label>
                  <input name="cotizacion_usd" type="number" step="0.01" min="0" required className={inputCls} placeholder="Ej: 1200.00" />
                </div>
              )}
              <div>
                <label className={labelCls}>Cuenta contable</label>
                <input name="cuenta_contable" type="text" className={inputCls} placeholder="Ej: 4.1 Alquileres" />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setModalPagar(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium">Confirmar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuentasAPagarSection;
