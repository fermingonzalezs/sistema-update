import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ShoppingBag, DollarSign, Package, FileText, Calendar, Building2, Laptop, Minus, ChevronDown, ChevronRight, CheckCircle, Truck } from 'lucide-react';
import { useCompras } from '../hooks/useCompras';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
import { supabase } from '../../../lib/supabase';

const ComprasSection = () => {
  const { compras, loading, error, createCompra, updateCompra, deleteCompra, deleteReciboCompleto } = useCompras();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [recibosExpandidos, setRecibosExpandidos] = useState({});

  // Estados para edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [reciboEnEdicionId, setReciboEnEdicionId] = useState(null);
  const [itemEnEdicion, setItemEnEdicion] = useState(null); // ID del item siendo editado
  const [datosItemEdicion, setDatosItemEdicion] = useState({}); // Datos temporales durante edición

  // Estados del recibo (header)
  const [reciboData, setReciboData] = useState({
    proveedor: '',
    metodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    moneda: 'USD',
    cotizacion: 1000,
    costosAdicionales: 0,
    estado: 'ingresado' // 'en_camino' o 'ingresado'
  });

  // Estados de los items
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({
    serial: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: '',
    agregarSeparado: false // true = una fila por unidad, false = una fila con cantidad total
  });

  // Estados para filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');

  // Cargar cotización al montar el componente
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        const valorCotizacion = cotizacionData.valor || cotizacionData.promedio || 1000;
        setCotizacionDolar(valorCotizacion);
        setReciboData(prev => ({ ...prev, cotizacion: valorCotizacion }));
      } catch (error) {
        console.error('Error cargando cotización:', error);
        setCotizacionDolar(1000);
      }
    };
    cargarCotizacion();
  }, []);

  const limpiarFormulario = () => {
    setReciboData({
      proveedor: '',
      metodoPago: '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      moneda: 'USD',
      cotizacion: cotizacionDolar,
      costosAdicionales: 0,
      estado: 'ingresado'
    });
    setItems([]);
    setNuevoItem({
      serial: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: '',
      agregarSeparado: false
    });
    setMostrarFormulario(false);
    setModoEdicion(false);
    setReciboEnEdicionId(null);
    // Cancelar edición de items si hay alguna en curso
    setItemEnEdicion(null);
    setDatosItemEdicion({});
  };

  // Función para cargar un recibo en el formulario para editarlo
  const cargarReciboParaEditar = (recibo) => {
    // Calcular costos adicionales totales
    const totalCostosAdicionales = recibo.items.reduce((sum, item) => sum + (parseFloat(item.costo_adicional) || 0), 0);

    // Cargar datos del recibo
    setReciboData({
      proveedor: recibo.proveedor,
      metodoPago: recibo.caja_pago,
      fecha: recibo.fecha,
      descripcion: recibo.descripcion || '',
      moneda: recibo.moneda,
      cotizacion: recibo.cotizacion || cotizacionDolar,
      costosAdicionales: totalCostosAdicionales,
      estado: recibo.estado || 'ingresado' // Cargar estado o default
    });

    // Cargar items (sin los costos adicionales prorrateados, ya que se recalcularán)
    const itemsCargados = recibo.items.map(item => ({
      id: item.id, // Mantener el ID original para poder actualizar
      serial: item.serial || '',
      descripcion: item.item,
      cantidad: item.cantidad,
      precioUnitario: parseFloat(item.monto),
      total: parseFloat(item.monto) * item.cantidad
    }));

    setItems(itemsCargados);
    setModoEdicion(true);
    setReciboEnEdicionId(recibo.recibo_id);
    setMostrarFormulario(true);

    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Funciones para manejar items
  const agregarItem = () => {
    // Validaciones
    if (!nuevoItem.descripcion.trim()) {
      alert('La descripción del item es requerida');
      return;
    }
    if (!nuevoItem.precioUnitario || parseInt(nuevoItem.precioUnitario) <= 0) {
      alert('El precio unitario debe ser mayor a 0');
      return;
    }
    if (!nuevoItem.cantidad || parseInt(nuevoItem.cantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const cantidad = parseInt(nuevoItem.cantidad);
    const precioUnitario = parseInt(nuevoItem.precioUnitario);

    if (nuevoItem.agregarSeparado) {
      // Agregar una fila por cada unidad
      const nuevosItems = [];
      for (let i = 0; i < cantidad; i++) {
        nuevosItems.push({
          id: Date.now() + i, // ID temporal único
          serial: nuevoItem.serial.trim() || '',
          descripcion: nuevoItem.descripcion.trim(),
          cantidad: 1,
          precioUnitario: precioUnitario,
          total: precioUnitario
        });
      }
      setItems(prev => [...prev, ...nuevosItems]);
    } else {
      // Agregar una sola fila con la cantidad total
      const item = {
        id: Date.now(),
        serial: nuevoItem.serial.trim() || '',
        descripcion: nuevoItem.descripcion.trim(),
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        total: cantidad * precioUnitario
      };
      setItems(prev => [...prev, item]);
    }

    setNuevoItem({
      serial: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: '',
      agregarSeparado: false
    });
  };

  const eliminarItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Iniciar edición de un item
  const iniciarEdicionItem = (item) => {
    setItemEnEdicion(item.id);
    setDatosItemEdicion({
      serial: item.serial || '',
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    });
  };

  // Cancelar edición de item
  const cancelarEdicionItem = () => {
    setItemEnEdicion(null);
    setDatosItemEdicion({});
  };

  // Guardar edición de item
  const guardarEdicionItem = () => {
    if (!datosItemEdicion.descripcion || !datosItemEdicion.descripcion.trim()) {
      alert('La descripción es requerida');
      return;
    }
    if (!datosItemEdicion.cantidad || parseInt(datosItemEdicion.cantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    if (!datosItemEdicion.precioUnitario || parseFloat(datosItemEdicion.precioUnitario) <= 0) {
      alert('El precio unitario debe ser mayor a 0');
      return;
    }

    setItems(prev => prev.map(item =>
      item.id === itemEnEdicion
        ? {
            ...item,
            serial: datosItemEdicion.serial,
            descripcion: datosItemEdicion.descripcion,
            cantidad: parseInt(datosItemEdicion.cantidad),
            precioUnitario: parseFloat(datosItemEdicion.precioUnitario),
            total: parseInt(datosItemEdicion.cantidad) * parseFloat(datosItemEdicion.precioUnitario)
          }
        : item
    ));

    cancelarEdicionItem();
  };

  // Calcular total del recibo
  const totalRecibo = items.reduce((acc, item) => acc + item.total, 0);

  // Calcular distribución proporcional de costos adicionales
  const calcularCostosAdicionalesPorItem = () => {
    const costosAdicionales = parseFloat(reciboData.costosAdicionales) || 0;
    if (costosAdicionales === 0 || totalRecibo === 0) {
      return items.map(item => ({ ...item, costoAdicionalProrrateado: 0 }));
    }

    return items.map(item => {
      const proporcion = item.total / totalRecibo;
      const costoAdicionalProrrateado = proporcion * costosAdicionales;
      return {
        ...item,
        costoAdicionalProrrateado: parseFloat(costoAdicionalProrrateado.toFixed(2))
      };
    });
  };

  const itemsConCostosAdicionales = calcularCostosAdicionalesPorItem();
  const totalCostosAdicionales = parseFloat(reciboData.costosAdicionales) || 0;
  const granTotal = totalRecibo + totalCostosAdicionales;

  // Convertir monto a USD si es necesario
  const convertirAUSD = (monto) => {
    if (reciboData.moneda === 'ARS') {
      return (monto / reciboData.cotizacion).toFixed(2);
    }
    return monto.toFixed(2);
  };

  const handleGuardarRecibo = async () => {
    try {
      // Validaciones del recibo
      if (!reciboData.proveedor.trim()) {
        alert('El proveedor es requerido');
        return;
      }
      if (!reciboData.metodoPago.trim()) {
        alert('El método de pago es requerido');
        return;
      }
      if (items.length === 0) {
        alert('Debe agregar al menos un item al recibo');
        return;
      }
      if (reciboData.moneda === 'ARS' && (!reciboData.cotizacion || parseFloat(reciboData.cotizacion) <= 0)) {
        alert('La cotización es requerida para moneda ARS');
        return;
      }

      if (modoEdicion) {
        // MODO EDICIÓN: Eliminar items viejos y crear nuevos
        await deleteReciboCompleto(reciboEnEdicionId);

        // Crear un registro por cada item con costos adicionales prorrateados
        const comprasAGuardar = itemsConCostosAdicionales.map(item => ({
          recibo_id: reciboEnEdicionId, // Usar el mismo recibo_id
          item: item.descripcion,
          cantidad: item.cantidad,
          serial: item.serial || null,
          moneda: reciboData.moneda,
          cotizacion: reciboData.moneda === 'ARS' ? parseFloat(reciboData.cotizacion) : null,
          monto: parseFloat(item.precioUnitario),
          costo_adicional: item.costoAdicionalProrrateado,
          proveedor: reciboData.proveedor,
          caja_pago: reciboData.metodoPago,
          descripcion: reciboData.descripcion || null,
          fecha: reciboData.fecha,
          estado: reciboData.estado
        }));

        // Guardar cada compra
        for (const compra of comprasAGuardar) {
          await createCompra(compra);
        }

        alert(`✅ Recibo actualizado exitosamente (${comprasAGuardar.length} items)`);
      } else {
        // MODO CREACIÓN: Obtener el último recibo_id y sumar 1
        const { data: ultimaCompra, error: errorMax } = await supabase
          .from('compras')
          .select('recibo_id')
          .order('recibo_id', { ascending: false })
          .limit(1)
          .single();

        const reciboId = (ultimaCompra?.recibo_id || 0) + 1;

        // Crear un registro por cada item con costos adicionales prorrateados
        const comprasAGuardar = itemsConCostosAdicionales.map(item => ({
          recibo_id: reciboId,
          item: item.descripcion,
          cantidad: item.cantidad,
          serial: item.serial || null,
          moneda: reciboData.moneda,
          cotizacion: reciboData.moneda === 'ARS' ? parseFloat(reciboData.cotizacion) : null,
          monto: parseFloat(item.precioUnitario),
          costo_adicional: item.costoAdicionalProrrateado,
          proveedor: reciboData.proveedor,
          caja_pago: reciboData.metodoPago,
          descripcion: reciboData.descripcion || null,
          fecha: reciboData.fecha,
          estado: reciboData.estado
        }));

        // Guardar cada compra
        for (const compra of comprasAGuardar) {
          await createCompra(compra);
        }

        alert(`✅ Compra guardada exitosamente (${comprasAGuardar.length} items)`);
      }

      limpiarFormulario();
    } catch (error) {
      console.error('Error al guardar el recibo:', error);
      alert('Error al guardar el recibo: ' + error.message);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta compra?')) {
      try {
        await deleteCompra(id);
      } catch (error) {
        alert('Error al eliminar la compra: ' + error.message);
      }
    }
  };

  const formatearMonto = (monto, moneda) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const calcularMontoUSD = (montoARS, cotizacion) => {
    if (!montoARS || !cotizacion) return 0;
    return (parseFloat(montoARS) / parseFloat(cotizacion)).toFixed(2);
  };

  // Agrupar compras por recibo_id
  const recibosAgrupados = compras.reduce((acc, compra) => {
    const reciboId = compra.recibo_id || compra.id; // Usar id si no tiene recibo_id
    if (!acc[reciboId]) {
      acc[reciboId] = {
        recibo_id: reciboId,
        fecha: compra.fecha,
        proveedor: compra.proveedor,
        caja_pago: compra.caja_pago,
        moneda: compra.moneda,
        cotizacion: compra.cotizacion,
        descripcion: compra.descripcion,
        estado: compra.estado || 'ingresado', // Agregar estado
        items: []
      };
    }
    acc[reciboId].items.push({
      id: compra.id,
      item: compra.item,
      cantidad: compra.cantidad,
      serial: compra.serial,
      monto: compra.monto,
      costo_adicional: compra.costo_adicional
    });
    return acc;
  }, {});

  // Convertir a array y ordenar por fecha descendente
  const recibos = Object.values(recibosAgrupados).sort((a, b) =>
    new Date(b.fecha) - new Date(a.fecha)
  );

  // Filtrar recibos
  const recibosFiltrados = recibos.filter(recibo => {
    // Filtro por fecha desde
    if (filtroFechaDesde && recibo.fecha < filtroFechaDesde) return false;

    // Filtro por fecha hasta
    if (filtroFechaHasta && recibo.fecha > filtroFechaHasta) return false;

    // Filtro por proveedor
    if (filtroProveedor && !recibo.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())) return false;

    return true;
  });

  // Obtener proveedores únicos para el filtro
  const proveedoresUnicos = [...new Set(recibos.map(recibo => recibo.proveedor))].sort();

  // Función para toggle expandir recibo
  const toggleRecibo = (reciboId) => {
    setRecibosExpandidos(prev => ({
      ...prev,
      [reciboId]: !prev[reciboId]
    }));
  };

  // Función para cambiar el estado de un recibo
  const handleCambiarEstado = async (recibo, nuevoEstado, e) => {
    e.stopPropagation(); // Evitar que se expanda/colapse el recibo

    const estadoTexto = nuevoEstado === 'ingresado' ? 'INGRESADO' : 'EN CAMINO';
    const emoji = nuevoEstado === 'ingresado' ? '✅' : '📦';

    const confirmar = window.confirm(
      `¿Está seguro de marcar el recibo #${recibo.recibo_id} como ${estadoTexto}?\n\n` +
      `Proveedor: ${recibo.proveedor}\n` +
      `Items: ${recibo.items.length}\n` +
      `Total: ${formatearMonto(calcularTotalRecibo(recibo.items), recibo.moneda)}`
    );

    if (!confirmar) return;

    try {
      // Actualizar todos los items del recibo
      for (const item of recibo.items) {
        await updateCompra(item.id, { estado: nuevoEstado });
      }
      alert(`${emoji} Recibo #${recibo.recibo_id} marcado como ${estadoTexto.toLowerCase()}`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert(`❌ Error al actualizar el estado: ${error.message}`);
    }
  };

  // Función para eliminar recibo completo
  const handleEliminarRecibo = async (recibo, e) => {
    e.stopPropagation(); // Evitar que se expanda/colapse el recibo

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el recibo #${recibo.recibo_id}?\n\n` +
      `Proveedor: ${recibo.proveedor}\n` +
      `Items: ${recibo.items.length}\n` +
      `Total: ${formatearMonto(calcularTotalRecibo(recibo.items), recibo.moneda)}\n\n` +
      `Esta acción eliminará todas las compras asociadas a este recibo y no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      await deleteReciboCompleto(recibo.recibo_id);
      alert(`✅ Recibo #${recibo.recibo_id} eliminado exitosamente`);
    } catch (error) {
      console.error('Error eliminando recibo:', error);
      alert(`❌ Error al eliminar el recibo: ${error.message}`);
    }
  };

  // Calcular total de un recibo
  const calcularTotalRecibo = (items) => {
    return items.reduce((sum, item) => sum + (item.monto * item.cantidad), 0);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroProveedor('');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ShoppingBag size={28} />
            <div>
              <p className="text-gray-300 mt-1">Registro de compras</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              {mostrarFormulario ? 'Ocultar Formulario' : 'Nueva Compra'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Formulario de Recibo */}
      {mostrarFormulario && (
        <div className="space-y-6">
          {/* HEADER DEL RECIBO */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {modoEdicion ? `Editar Recibo #${reciboEnEdicionId}` : 'Nueva Compra'}
                    </h3>
                    {modoEdicion && (
                      <p className="text-xs text-slate-300 mt-1">Modificando recibo existente</p>
                    )}
                  </div>
                </div>
                {modoEdicion && (
                  <div className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-medium">
                    MODO EDICIÓN
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    value={reciboData.proveedor}
                    onChange={(e) => setReciboData(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={reciboData.metodoPago}
                    onChange={(e) => setReciboData(prev => ({ ...prev, metodoPago: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Seleccionar método...</option>
                    <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                    <option value="dolares_billete">💸 Dólares Billete</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="criptomonedas">₿ Criptomonedas</option>
                    <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                    <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={reciboData.fecha}
                    onChange={(e) => setReciboData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado *
                  </label>
                  <select
                    value={reciboData.estado}
                    onChange={(e) => setReciboData(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="ingresado">✅ Ingresado</option>
                    <option value="en_camino">📦 En Camino</option>
                  </select>
                </div>

                {/* Moneda */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Moneda *
                  </label>
                  <select
                    value={reciboData.moneda}
                    onChange={(e) => setReciboData(prev => ({
                      ...prev,
                      moneda: e.target.value,
                      cotizacion: e.target.value === 'USD' ? 1 : cotizacionDolar
                    }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>

                {/* Cotización (solo si es ARS) */}
                {reciboData.moneda === 'ARS' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cotización USD/ARS *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={reciboData.cotizacion}
                      onChange={(e) => setReciboData(prev => ({ ...prev, cotizacion: parseFloat(e.target.value) }))}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      placeholder="Ej: 1150"
                    />
                  </div>
                )}

                {/* Costos Adicionales */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Costos Adicionales ({reciboData.moneda})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={reciboData.costosAdicionales}
                    onChange={(e) => setReciboData(prev => ({
                      ...prev,
                      costosAdicionales: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                    }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Envío, impuestos, etc."
                  />
                  <p className="text-xs text-slate-500 mt-1">Se distribuirá proporcionalmente entre items</p>
                </div>

                {/* Descripción */}
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción General de la Compra
                  </label>
                  <textarea
                    rows={2}
                    value={reciboData.descripcion}
                    onChange={(e) => setReciboData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Descripción de la compra..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCTOS */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">Productos</h3>
                </div>
                <span className="text-slate-300 text-sm">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Formulario para agregar item */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Serial/ID
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.serial}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, serial: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    placeholder="Opcional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.descripcion}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    placeholder="Descripción del item"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, cantidad: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Precio Unit. * ({reciboData.moneda})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoItem.precioUnitario}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, precioUnitario: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Agregar como
                  </label>
                  <select
                    value={nuevoItem.agregarSeparado}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, agregarSeparado: e.target.value === 'true' }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                  >
                    <option value="false">Fila única</option>
                    <option value="true">Filas separadas</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de items */}
            <div className="overflow-x-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay items agregados</p>
                  <p className="text-sm">Agregue items usando el formulario de arriba</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Serial</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Unit.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Subtotal</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costo Adic.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total Final</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {itemsConCostosAdicionales.map((item, index) => {
                      const estaEditando = itemEnEdicion === item.id;

                      return (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          {/* Serial */}
                          <td className="px-4 py-3 text-sm text-slate-800">
                            {estaEditando ? (
                              <input
                                type="text"
                                value={datosItemEdicion.serial}
                                onChange={(e) => setDatosItemEdicion(prev => ({ ...prev, serial: e.target.value }))}
                                className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Serial"
                              />
                            ) : (
                              item.serial || 'N/A'
                            )}
                          </td>

                          {/* Descripción */}
                          <td className="px-4 py-3 text-sm text-slate-800">
                            {estaEditando ? (
                              <input
                                type="text"
                                value={datosItemEdicion.descripcion}
                                onChange={(e) => setDatosItemEdicion(prev => ({ ...prev, descripcion: e.target.value }))}
                                className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Descripción"
                              />
                            ) : (
                              item.descripcion
                            )}
                          </td>

                          {/* Cantidad */}
                          <td className="px-4 py-3 text-center text-sm text-slate-800">
                            {estaEditando ? (
                              <input
                                type="number"
                                min="1"
                                value={datosItemEdicion.cantidad}
                                onChange={(e) => setDatosItemEdicion(prev => ({ ...prev, cantidad: e.target.value }))}
                                className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            ) : (
                              item.cantidad
                            )}
                          </td>

                          {/* Precio Unitario */}
                          <td className="px-4 py-3 text-center text-sm text-slate-800">
                            {estaEditando ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={datosItemEdicion.precioUnitario}
                                onChange={(e) => setDatosItemEdicion(prev => ({ ...prev, precioUnitario: e.target.value }))}
                                className="w-24 border border-slate-300 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            ) : (
                              `$${item.precioUnitario} ${reciboData.moneda}`
                            )}
                          </td>

                          {/* Subtotal */}
                          <td className="px-4 py-3 text-center text-sm text-slate-800">
                            ${estaEditando
                              ? (parseFloat(datosItemEdicion.cantidad || 0) * parseFloat(datosItemEdicion.precioUnitario || 0)).toFixed(2)
                              : item.total
                            } {reciboData.moneda}
                          </td>

                          {/* Costo Adicional */}
                          <td className="px-4 py-3 text-center text-sm text-emerald-600">
                            {item.costoAdicionalProrrateado > 0 ? `+$${item.costoAdicionalProrrateado.toFixed(2)}` : '-'}
                          </td>

                          {/* Total Final */}
                          <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                            ${(item.total + item.costoAdicionalProrrateado).toFixed(2)} {reciboData.moneda}
                            {reciboData.moneda === 'ARS' && (
                              <div className="text-xs text-slate-500">
                                USD ${convertirAUSD(item.total + item.costoAdicionalProrrateado)}
                              </div>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3 text-center">
                            {estaEditando ? (
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={guardarEdicionItem}
                                  className="text-emerald-600 hover:text-emerald-800 p-1 rounded transition-colors"
                                  title="Guardar cambios"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelarEdicionItem}
                                  className="text-slate-600 hover:text-slate-800 p-1 rounded transition-colors"
                                  title="Cancelar edición"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => iniciarEdicionItem(item)}
                                  className="text-emerald-600 hover:text-emerald-800 p-1 rounded transition-colors"
                                  title="Editar item"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => eliminarItem(item.id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                  title="Eliminar item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Footer con total */}
                  <tfoot className="bg-slate-800 text-white">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-right">TOTAL</td>
                      <td colSpan="4" className="px-4 py-3 text-center text-lg font-bold">
                        ${granTotal.toFixed(2)} {reciboData.moneda}
                        {reciboData.moneda === 'ARS' && (
                          <div className="text-sm text-slate-300">
                            USD ${convertirAUSD(granTotal)}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Botones del recibo */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              type="button"
              onClick={handleGuardarRecibo}
              disabled={items.length === 0}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{modoEdicion ? 'Actualizar Recibo' : 'Guardar Recibo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="">Todos los proveedores</option>
              {proveedoresUnicos.map(proveedor => (
                <option key={proveedor} value={proveedor}>{proveedor}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de compras */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">
              Historial
            </h3>
            <p className="text-sm text-slate-600">
              {recibosFiltrados.length} de {recibos.length} recibos
            </p>
          </div>
        </div>

        {recibos.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>No hay compras registradas</p>
            <p className="text-sm">Haz clic en "Nueva Compra" para comenzar</p>
          </div>
        ) : recibosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>No hay compras que coincidan con los filtros</p>
            <p className="text-sm">Ajusta los filtros o limpia la búsqueda</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {recibosFiltrados.map((recibo) => {
              const totalRecibo = calcularTotalRecibo(recibo.items);
              const isExpanded = recibosExpandidos[recibo.recibo_id];

              return (
                <div key={recibo.recibo_id} className="border border-slate-200 rounded overflow-hidden">
                  {/* Header del recibo - clickeable */}
                  <div
                    className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between"
                    onClick={() => toggleRecibo(recibo.recibo_id)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <button className="p-1">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-slate-600" />
                        ) : (
                          <ChevronRight size={20} className="text-slate-600" />
                        )}
                      </button>

                      <div className="flex items-center gap-8 flex-1">
                        <div className="min-w-[80px] text-center">
                          <div className="text-xs text-slate-500">Recibo</div>
                          <div className="font-mono text-sm font-semibold text-slate-800">#{recibo.recibo_id}</div>
                        </div>

                        <div className="min-w-[100px] text-center">
                          <div className="text-xs text-slate-500">Fecha</div>
                          <div className="text-sm text-slate-800">{new Date(recibo.fecha).toLocaleDateString('es-AR')}</div>
                        </div>

                        <div className="flex-1 min-w-[150px] text-center">
                          <div className="text-xs text-slate-500">Proveedor</div>
                          <div className="text-sm font-medium text-slate-800">{recibo.proveedor}</div>
                        </div>

                        <div className="min-w-[60px] text-center">
                          <div className="text-xs text-slate-500">Items</div>
                          <div className="text-sm text-slate-800">{recibo.items.length}</div>
                        </div>

                        <div className="min-w-[120px] text-center">
                          <div className="text-xs text-slate-500">Total</div>
                          <div className="text-sm font-bold text-slate-800">
                            {formatearMonto(totalRecibo, recibo.moneda)}
                          </div>
                          {recibo.moneda === 'ARS' && recibo.cotizacion && (
                            <div className="text-xs text-slate-500">
                              USD ${calcularMontoUSD(totalRecibo, recibo.cotizacion)}
                            </div>
                          )}
                        </div>

                        {/* Estado */}
                        <div className="min-w-[100px] text-center">
                          <div className="text-xs text-slate-500 mb-1">Estado</div>
                          {recibo.estado === 'ingresado' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                              <CheckCircle size={12} className="mr-1" />
                              Ingresado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <Truck size={12} className="mr-1" />
                              En Camino
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center space-x-1.5 ml-6">
                      {/* Botón para cambiar estado */}
                      {recibo.estado === 'en_camino' ? (
                        <button
                          onClick={(e) => handleCambiarEstado(recibo, 'ingresado', e)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Marcar como ingresado"
                        >
                          <CheckCircle size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleCambiarEstado(recibo, 'en_camino', e)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Marcar como en camino"
                        >
                          <Truck size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cargarReciboParaEditar(recibo);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar recibo"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleEliminarRecibo(recibo, e)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar recibo completo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Detalle de items - expandible */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white">
                      {/* Info adicional - arriba */}
                      <div className="p-4 bg-slate-50 border-b border-slate-200 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-600">Método de pago:</span>
                            <span className="ml-2 font-medium text-slate-800">{recibo.caja_pago}</span>
                          </div>
                          {recibo.cotizacion && (
                            <div>
                              <span className="text-slate-600">Cotización USD:</span>
                              <span className="ml-2 font-medium text-slate-800">${recibo.cotizacion}</span>
                            </div>
                          )}
                          {recibo.descripcion && (
                            <div className="col-span-2">
                              <span className="text-slate-600">Notas:</span>
                              <span className="ml-2 text-slate-800">{recibo.descripcion}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tabla de items - abajo */}
                      <table className="w-full">
                        <thead className="bg-slate-800 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase">Item</th>
                            <th className="px-4 py-2 text-center text-xs font-medium uppercase">Cant.</th>
                            <th className="px-4 py-2 text-center text-xs font-medium uppercase">Serial</th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase">Precio Unit.</th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase">Subtotal</th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase">Costo Adic.</th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase">Total Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {recibo.items.map((item, idx) => {
                            const subtotal = item.monto * item.cantidad;
                            const costoAdicional = item.costo_adicional || 0;
                            const totalFinal = subtotal + costoAdicional;
                            return (
                              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-4 py-2 text-sm text-slate-800">{item.item}</td>
                                <td className="px-4 py-2 text-sm text-slate-700 text-center">{item.cantidad}</td>
                                <td className="px-4 py-2 text-sm text-slate-600 text-center">{item.serial || '-'}</td>
                                <td className="px-4 py-2 text-sm text-slate-800 text-right">
                                  {formatearMonto(item.monto, recibo.moneda)}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-800 text-right">
                                  {formatearMonto(subtotal, recibo.moneda)}
                                </td>
                                <td className="px-4 py-2 text-sm text-emerald-600 text-right">
                                  {costoAdicional > 0 ? `+${formatearMonto(costoAdicional, recibo.moneda)}` : '-'}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-slate-800 text-right">
                                  {formatearMonto(totalFinal, recibo.moneda)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-800 text-white">
                          {(() => {
                            const subtotalItems = recibo.items.reduce((sum, item) => sum + (item.monto * item.cantidad), 0);
                            const totalCostosAdic = recibo.items.reduce((sum, item) => sum + (item.costo_adicional || 0), 0);
                            const granTotalRecibo = subtotalItems + totalCostosAdic;
                            return (
                              <tr>
                                <td colSpan="4" className="px-4 py-2 text-sm font-semibold text-right">TOTAL</td>
                                <td colSpan="3" className="px-4 py-2 text-sm font-bold text-right">
                                  {formatearMonto(granTotalRecibo, recibo.moneda)}
                                </td>
                              </tr>
                            );
                          })()}
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprasSection;