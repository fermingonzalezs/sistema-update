// src/components/CuentasCorrientesSection.jsx
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  Search,
  Plus,
  Eye,
  DollarSign,
  Calendar,
  X,
  Building2,
  Minus,
  Edit3,
  UserPlus,
  Trash2
} from 'lucide-react';
import { useCuentasCorrientes } from '../hooks/useCuentasCorrientes.js';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import { formatearMonto, obtenerFechaLocal, formatearFechaReporte } from '../../../shared/utils/formatters';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { cotizacionService } from '../../../shared/services/cotizacionService';

const CuentasCorrientesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState('todos'); // 'todos', 'deudores', 'acreedores'
  const [estadisticas, setEstadisticas] = useState(null);
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState(null); // 'cobro', 'pago', 'ajustar_deuda', 'tomar_deuda'
  const [clientePreseleccionado, setClientePreseleccionado] = useState(null);
  const [clienteSeleccionadoFiltro, setClienteSeleccionadoFiltro] = useState(null);
  const [todosMovimientos, setTodosMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [showEditarMovimiento, setShowEditarMovimiento] = useState(false);
  const [movimientoAEditar, setMovimientoAEditar] = useState(null);

  const {
    saldos,
    loading,
    error,
    fetchSaldos,
    fetchMovimientosCliente,
    fetchTodosMovimientos,
    getEstadisticas,
    registrarPagoRecibido,
    registrarNuevaDeuda,
    registrarPagoRealizado,
    registrarDeudaUpdate,
    eliminarMovimiento,
    editarMovimiento
  } = useCuentasCorrientes();

  useEffect(() => {
    loadData();
    cargarTodosMovimientos();
  }, []);

  const loadData = async () => {
    await fetchSaldos();
    const stats = await getEstadisticas();
    setEstadisticas(stats);
  };

  const cargarTodosMovimientos = async () => {
    try {
      setLoadingMovimientos(true);
      const movimientos = await fetchTodosMovimientos();
      setTodosMovimientos(movimientos);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      alert('Error cargando movimientos: ' + error.message);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const handleRegistrarPago = async (clienteId, monto, concepto, observaciones, fechaOperacion) => {
    try {
      await registrarPagoRecibido(clienteId, monto, concepto, observaciones, fechaOperacion);
      await loadData(); // Recargar estadísticas
      await cargarTodosMovimientos(); // Recargar movimientos
      alert('✅ Pago registrado exitosamente');
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('❌ Error registrando pago: ' + error.message);
    }
  };

  const handleSelectTipoMovimiento = (tipo) => {
    setTipoMovimiento(tipo);
  };

  const formatSaldo = (saldo) => {
    const valor = parseFloat(saldo || 0);
    if (valor > 0) {
      return {
        texto: 'Debe:',
        valor: valor,
        color: 'text-slate-800',
        bgColor: 'bg-slate-100'
      };
    } else if (valor < 0) {
      return {
        texto: 'Debemos:',
        valor: Math.abs(valor),
        color: 'text-slate-600',
        bgColor: 'bg-slate-200'
      };
    } else {
      return {
        texto: 'Saldado',
        valor: 0,
        color: 'text-slate-600',
        bgColor: 'bg-slate-100'
      };
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin movimientos';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { 
      timeZone: 'America/Argentina/Buenos_Aires' 
    });
  };

  // Filtrar clientes
  const clientesFiltrados = saldos.filter(cliente => {
    const matchSearch = searchTerm === '' ||
      `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());

    const saldo = parseFloat(cliente.saldo_total || 0);


    let matchFiltro = true;

    switch (filtroSaldo) {
      case 'acreedores':
        matchFiltro = saldo < 0; // Les debemos (saldo negativo) - son nuestros acreedores
        break;
      case 'deudores':
        matchFiltro = saldo > 0; // Nos deben (saldo positivo) - son nuestros deudores
        break;
      case 'todos':
        matchFiltro = true; // Mostrar todos
        break;
      default:
        matchFiltro = true;
        break;
    }

    return matchSearch && matchFiltro;
  });

  const handleCerrarMovimiento = () => {
    setTipoMovimiento(null);
    setShowNuevoMovimiento(false);
    setClientePreseleccionado(null);
  };

  // Filtrar movimientos por cliente seleccionado
  const movimientosFiltrados = clienteSeleccionadoFiltro
    ? todosMovimientos.filter(mov => mov.cliente_id === clienteSeleccionadoFiltro.cliente_id)
    : todosMovimientos;

  // Calcular saldo acumulado por cada movimiento usando el saldo del cliente desde la DB
  const movimientosConSaldo = React.useMemo(() => {
    // Crear un mapa de saldos totales por cliente desde la DB
    const saldosPorCliente = {};
    saldos.forEach(cliente => {
      saldosPorCliente[cliente.cliente_id] = parseFloat(cliente.saldo_total);
    });

    // Agrupar movimientos por cliente
    const movimientosPorCliente = {};
    movimientosFiltrados.forEach(mov => {
      const clienteKey = mov.cliente_id;
      if (!movimientosPorCliente[clienteKey]) {
        movimientosPorCliente[clienteKey] = [];
      }
      movimientosPorCliente[clienteKey].push(mov);
    });

    // Para cada cliente, ordenar y calcular saldos hacia atrás desde el saldo final
    const resultado = [];
    Object.keys(movimientosPorCliente).forEach(clienteId => {
      const clienteIdNum = parseInt(clienteId);

      // Obtener saldo total del cliente desde la DB
      const saldoFinal = saldosPorCliente[clienteIdNum] || 0;

      // Ordenar de más antiguo a más reciente por fecha y luego por ID
      const movsCliente = movimientosPorCliente[clienteId]
        .sort((a, b) => {
          const fechaA = new Date(a.fecha_operacion);
          const fechaB = new Date(b.fecha_operacion);
          if (fechaA.getTime() !== fechaB.getTime()) {
            return fechaA - fechaB;
          }
          return a.id - b.id;
        });

      // Calcular saldos hacia atrás desde el último movimiento
      // El último movimiento tiene el saldo final del cliente
      let saldoActual = saldoFinal;

      // Primero calcular el saldo de cada movimiento hacia atrás
      const saldosPorMovimiento = [];
      for (let i = movsCliente.length - 1; i >= 0; i--) {
        const mov = movsCliente[i];
        saldosPorMovimiento.unshift(saldoActual); // Guardar saldo después del movimiento

        // Restar este movimiento para obtener el saldo anterior
        if (mov.tipo_movimiento === 'debe') {
          saldoActual -= parseFloat(mov.monto);
        } else {
          saldoActual += parseFloat(mov.monto);
        }
      }

      // Agregar saldo calculado a cada movimiento
      const movsConSaldo = movsCliente.map((mov, index) => ({
        ...mov,
        saldo_acumulado: saldosPorMovimiento[index]
      }));

      resultado.push(...movsConSaldo);
    });

    // Ordenar todos los movimientos por created_at (más reciente primero)
    return resultado.sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return b.id - a.id;
    });
  }, [movimientosFiltrados, saldos]);

  // Funciones para editar y eliminar movimientos
  const handleEditarMovimiento = (movimiento) => {
    console.log('Editar movimiento:', movimiento);
    setMovimientoAEditar(movimiento);
    setShowEditarMovimiento(true);
  };

  const handleEliminarMovimiento = async (movimiento) => {
    const mensaje = `¿Está seguro de que desea eliminar este movimiento?

Cliente: ${movimiento.nombre_cliente} ${movimiento.apellido_cliente}
Tipo: ${movimiento.tipo_movimiento === 'debe' ? 'Debe' : 'Haber'}
Monto: $${movimiento.monto}
Concepto: ${movimiento.concepto}
Fecha: ${formatearFechaReporte(movimiento.fecha_operacion)}

Esta acción no se puede deshacer.`;

    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      await eliminarMovimiento(movimiento.id);
      await loadData();
      await cargarTodosMovimientos();
      alert('✅ Movimiento eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando movimiento:', error);
      alert('❌ Error eliminando movimiento: ' + error.message);
    }
  };

// 🔧 Componente Formulario para Editar Movimiento
const EditarMovimientoForm = ({ movimiento, onClose, onSuccess, editarMovimiento }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    monto: movimiento.monto || '',
    concepto: movimiento.concepto || '',
    observaciones: movimiento.observaciones || '',
    fecha_operacion: movimiento.fecha_operacion || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.monto || !formData.concepto) {
      alert('Monto y concepto son requeridos');
      return;
    }

    if (parseFloat(formData.monto) <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await editarMovimiento(movimiento.id, {
        monto: parseFloat(formData.monto),
        concepto: formData.concepto.trim(),
        observaciones: formData.observaciones?.trim() || null,
        fecha_operacion: formData.fecha_operacion
      });

      alert('✅ Movimiento editado exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error editando movimiento:', error);
      alert('❌ Error editando movimiento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-4">
        {/* Información no editable */}
        <div className="bg-slate-50 p-3 rounded">
          <p className="text-sm text-slate-600">
            <strong>Cliente:</strong> {movimiento.nombre_cliente} {movimiento.apellido_cliente}
          </p>
          <p className="text-sm text-slate-600">
            <strong>Tipo:</strong> {movimiento.tipo_movimiento === 'debe' ? 'Debe (Cliente nos debe)' : 'Haber (Nosotros debemos)'}
          </p>
          <p className="text-sm text-slate-600">
            <strong>Operación:</strong> {movimiento.tipo_operacion?.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Campo Monto */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Monto USD *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.monto}
            onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
            required
            disabled={loading}
          />
        </div>

        {/* Campo Concepto */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Concepto *
          </label>
          <input
            type="text"
            value={formData.concepto}
            onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
            required
            disabled={loading}
          />
        </div>

        {/* Campo Fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fecha de Operación
          </label>
          <input
            type="date"
            value={formData.fecha_operacion}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha_operacion: e.target.value }))}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
            disabled={loading}
          />
        </div>

        {/* Campo Observaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
            rows={3}
            disabled={loading}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
};

// 🔧 Componente Modal Unificado para Movimientos
const MovimientoModal = ({ tipo, onClose, onSuccess, clientePreseleccionado = null }) => {
  const [loading, setLoading] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(clientePreseleccionado);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [formData, setFormData] = useState({
    monto: '',
    concepto: '',
    observaciones: '',
    fecha_operacion: obtenerFechaLocal()

  });

  // Métodos de pago disponibles (igual que en CarritoWidget)
  const metodosPagoDisponibles = [
    { id: 'efectivo_pesos', nombre: '💵 Efectivo en Pesos' },
    { id: 'dolares_billete', nombre: '💸 Dólares Billete' },
    { id: 'transferencia', nombre: '🏦 Transferencia' },
    { id: 'criptomonedas', nombre: '₿ Criptomonedas' },
    { id: 'tarjeta_credito', nombre: '💳 Tarjeta de Crédito' },
    { id: 'cuenta_corriente', nombre: '🏷️ Cuenta Corriente' },
    { id: 'mercaderia', nombre: '📦 Pagar con Mercadería' }
  ];

  const tipoConfig = {
    cobro: {
      titulo: 'Registrar Pago',
      descripcion: 'Un cliente nos paga (reducir su deuda con nosotros)',
      icon: TrendingDown,
      conceptoPlaceholder: 'Pago recibido',
      filtroClientes: 'deudores' // Solo clientes que nos deben
    },
    agregar_deuda: {
      titulo: 'Agregar Deuda',
      descripcion: 'Registrar deuda que un cliente tiene con nosotros',
      icon: Plus,
      conceptoPlaceholder: 'Deuda agregada',
      filtroClientes: 'todos' // Todos los clientes
    },
    pago_realizado: {
      titulo: 'Pago Realizado',
      descripcion: 'Update paga a un proveedor o tercero',
      icon: TrendingUp,
      conceptoPlaceholder: 'Pago realizado por Update',
      filtroClientes: 'todos' // Todos los proveedores/terceros
    },
    tomar_deuda: {
      titulo: 'Tomar Deuda',
      descripcion: 'Registrar deuda que Update tiene con un proveedor',
      icon: Minus,
      conceptoPlaceholder: 'Deuda contraída por Update',
      filtroClientes: 'todos' // Todos los proveedores
    }
  };

  const config = tipoConfig[tipo];
  const Icon = config.icon;

  // Cargar cotización al montar el componente
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        setCotizacionDolar(cotizacionData.valor || cotizacionData.promedio || 1000);
      } catch (error) {
        console.error('Error cargando cotización:', error);
        setCotizacionDolar(1000); // Valor por defecto
      }
    };
    cargarCotizacion();
  }, []);

  // Actualizar cliente seleccionado cuando cambie el preseleccionado
  useEffect(() => {
    if (clientePreseleccionado) {
      setPersonaSeleccionada(clientePreseleccionado);
    }
  }, [clientePreseleccionado]);

  // Determinar si un método de pago es en pesos (ARS)
  const esMetodoEnPesos = (metodoPago) => {
    return metodoPago === 'efectivo_pesos' || metodoPago === 'transferencia' || metodoPago === 'tarjeta_credito';
  };

  // Convertir monto a USD si es necesario
  const convertirMontoAUSD = (monto, metodoPago) => {
    const montoNumerico = parseFloat(monto) || 0;
    if (esMetodoEnPesos(metodoPago)) {
      return montoNumerico / cotizacionDolar;
    }
    return montoNumerico;
  };

  // Filtrar clientes según el tipo de movimiento
  const clientesFiltrados = saldos.filter(cliente => {
    const saldo = parseFloat(cliente.saldo_total || 0);

    switch (config.filtroClientes) {
      case 'acreedores':
        return saldo < 0; // Solo clientes a los que les debemos (saldo negativo)
      case 'deudores':
        return saldo > 0; // Solo clientes que nos deben (saldo positivo)
      case 'todos':
      default:
        return true; // Todos los clientes
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!personaSeleccionada) {
      alert('Debe seleccionar una persona');
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('Debe ingresar un monto válido');
      return;
    }

    // Validar método de pago solo para tipos que lo requieren
    if ((tipo === 'cobro' || tipo === 'pago_realizado') && !cuentaSeleccionada) {
      alert('Debe seleccionar un método de pago');
      return;
    }

    setLoading(true);
    
    try {
      // Obtener ID del cliente según el tipo de selector usado
      const clienteId = tipo === 'cobro'
        ? personaSeleccionada.cliente_id  // Dropdown simple
        : personaSeleccionada.id;         // ClienteSelector

      // Para agregar deuda y tomar deuda, el monto siempre es en USD (no necesita conversión)
      const montoEnUSD = (tipo === 'agregar_deuda' || tipo === 'tomar_deuda')
        ? parseFloat(formData.monto)
        : convertirMontoAUSD(formData.monto, cuentaSeleccionada);

      const movimientoData = {
        persona_id: clienteId,
        metodo_pago: (tipo === 'agregar_deuda' || tipo === 'tomar_deuda') ? null : cuentaSeleccionada,
        monto: montoEnUSD, // Monto convertido a USD
        monto_original: parseFloat(formData.monto), // Monto original en la moneda ingresada
        moneda_original: (tipo === 'agregar_deuda' || tipo === 'tomar_deuda') ? 'USD' : (esMetodoEnPesos(cuentaSeleccionada) ? 'ARS' : 'USD'),
        cotizacion_usada: (tipo === 'agregar_deuda' || tipo === 'tomar_deuda') ? null : cotizacionDolar,
        concepto: formData.concepto || config.conceptoPlaceholder,
        observaciones: formData.observaciones,
        fecha: formData.fecha_operacion,
        tipo: tipo,
        created_by: 'Usuario' // TODO: Obtener del contexto de usuario
      };

      console.log('Movimiento a registrar:', movimientoData);

      if (tipo === 'cobro') {
        await handleRegistrarPago(
          clienteId,
          montoEnUSD, // Usar monto convertido a USD
          formData.concepto || 'Pago recibido',
          formData.observaciones,
          formData.fecha_operacion
        );
      } else if (tipo === 'agregar_deuda') {
        // Implementar agregar deuda
        await registrarNuevaDeuda(
          clienteId,
          montoEnUSD,
          formData.concepto || 'Deuda agregada',
          formData.observaciones,
          formData.fecha_operacion
        );
      } else if (tipo === 'pago_realizado') {
        // Update paga a un proveedor o tercero
        await registrarPagoRealizado(
          clienteId,
          montoEnUSD,
          formData.concepto || 'Pago realizado por Update',
          formData.observaciones,
          formData.fecha_operacion
        );
      } else if (tipo === 'tomar_deuda') {
        // Update toma deuda con un proveedor
        await registrarDeudaUpdate(
          clienteId,
          montoEnUSD,
          formData.concepto || 'Deuda contraída por Update',
          formData.observaciones,
          formData.fecha_operacion
        );
      } else {
        alert(`✅ ${config.titulo} registrado exitosamente (funcionalidad no implementada)`);
      }

      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error registrando movimiento:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 rounded">
                <Icon className="w-6 h-6 text-slate-800" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{config.titulo}</h3>
                <p className="text-sm text-slate-500">{config.descripcion}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cliente * {config.filtroClientes === 'deudores' && '(que nos debe)'}
            </label>
            
            {/* Para Registrar Pago usar dropdown simple con clientes que tienen deuda */}
            {tipo === 'cobro' ? (
              clientesFiltrados.length === 0 ? (
                <div className="w-full p-3 border border-slate-200 rounded bg-slate-50 text-slate-500 text-center">
                  No hay clientes con deuda pendiente
                </div>
              ) : (
                <select
                  value={personaSeleccionada?.cliente_id || ''}
                  onChange={(e) => {
                    const clienteId = parseInt(e.target.value);
                    const cliente = clientesFiltrados.find(c => c.cliente_id === clienteId);
                    setPersonaSeleccionada(cliente);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={loading}
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesFiltrados.map((cliente) => (
                    <option key={cliente.cliente_id} value={cliente.cliente_id}>
                      {cliente.nombre} {cliente.apellido} - Debe: ${Math.abs(parseFloat(cliente.saldo_total || 0)).toFixed(2)}
                    </option>
                  ))}
                </select>
              )
            ) : (
              /* Para Agregar Deuda usar ClienteSelector completo para crear o seleccionar */
              <ClienteSelector
                selectedCliente={personaSeleccionada}
                onSelectCliente={setPersonaSeleccionada}
                required={true}
                placeholder="Seleccionar cliente o crear nuevo..."
              />
            )}
          </div>

          {/* Método de Pago - Solo para tipos que requieren pago físico */}
          {(tipo === 'cobro' || tipo === 'pago_realizado') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Método de Pago *
              </label>
              <select
                value={cuentaSeleccionada}
                onChange={(e) => setCuentaSeleccionada(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="">Seleccionar método de pago...</option>
                {metodosPagoDisponibles.map(metodo => (
                  <option key={metodo.id} value={metodo.id}>
                    {metodo.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monto * {(tipo === 'agregar_deuda' || tipo === 'tomar_deuda')
                ? '(en USD)'
                : cuentaSeleccionada && esMetodoEnPesos(cuentaSeleccionada)
                  ? '(en Pesos ARS)'
                  : '(en USD)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0.00"
                required
              />
            </div>
            
            {/* Información de conversión - Solo para tipos con métodos de pago en pesos */}
            {(tipo === 'cobro' || tipo === 'pago_realizado') && cuentaSeleccionada && esMetodoEnPesos(cuentaSeleccionada) && formData.monto && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Cotización USD:</span>
                  <span className="font-medium">${cotizacionDolar.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-600">Equivalente en USD:</span>
                  <span className="font-medium text-emerald-600">
                    ${convertirMontoAUSD(formData.monto, cuentaSeleccionada).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Concepto
            </label>
            <input
              type="text"
              value={formData.concepto}
              onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={config.conceptoPlaceholder}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Selector de Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha del Movimiento *
            </label>
            <input
              type="date"
              value={formData.fecha_operacion}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_operacion: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={loading}
            />
          </div>


          {/* Botones */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !personaSeleccionada || ((tipo === 'cobro' || tipo === 'pago_realizado') && !cuentaSeleccionada)}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Icon className="w-4 h-4" />
                  <span>Registrar {tipo === 'cobro' ? 'Pago' : 'Deuda'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

  return (
    <div className="p-6 bg-slate-50">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Cuentas Corrientes</h2>
                <p className="text-slate-300 mt-1">Gestión de deudas de la empresa con personas</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNuevoMovimiento(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-medium flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Movimiento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Tarjeta
            icon={TrendingDown}
            titulo="Nos Deben"
            valor={formatearMonto(estadisticas.totalQueNosDeben, 'USD')}
            colorVariant="emerald"
          />
          <Tarjeta
            icon={TrendingUp}
            titulo="Debemos"
            valor={formatearMonto(estadisticas.totalQueDebemos, 'USD')}
            colorVariant="slate"
          />
          <Tarjeta
            icon={Users}
            titulo="Acreedores"
            valor={estadisticas.clientesConDeuda}
            colorVariant="emerald"
          />
          <Tarjeta
            icon={Users}
            titulo="Deudores"
            valor={estadisticas.clientesAQuienesDedemos}
            colorVariant="slate"
          />
        </div>
      )}

      {/* Layout principal: Clientes (izquierda) + Movimientos (derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: Lista de Clientes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded border border-slate-200">
            {/* Header Clientes */}
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <h3 className="font-semibold">Clientes</h3>
              </div>
            </div>

            {/* Filtros Clientes */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Filtro de saldo */}
              <select
                value={filtroSaldo}
                onChange={(e) => setFiltroSaldo(e.target.value)}
                className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="todos">Todos</option>
                <option value="deudores">Deudores (nos deben)</option>
                <option value="acreedores">Acreedores (les debemos)</option>
              </select>

              {/* Botón limpiar filtro de cliente */}
              {clienteSeleccionadoFiltro && (
                <button
                  onClick={() => setClienteSeleccionadoFiltro(null)}
                  className="w-full px-3 py-2 text-sm bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                >
                  Mostrar todos los movimientos
                </button>
              )}
            </div>

            {/* Lista de Clientes */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-sm text-slate-500">Cargando...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-600">Error: {error}</p>
                  <button
                    onClick={loadData}
                    className="mt-2 text-sm text-emerald-600 hover:underline"
                  >
                    Reintentar
                  </button>
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No se encontraron clientes</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {clientesFiltrados.map((cliente) => {
                    const saldoInfo = formatSaldo(cliente.saldo_total);
                    const isSelected = clienteSeleccionadoFiltro?.cliente_id === cliente.cliente_id;

                    return (
                      <div
                        key={cliente.cliente_id}
                        className={`p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-100 border-l-4 border-slate-500'
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setClienteSeleccionadoFiltro(isSelected ? null : cliente)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-800 text-sm">
                              {cliente.nombre} {cliente.apellido}
                            </h4>
                            <div className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${saldoInfo.bgColor} ${saldoInfo.color}`}>
                              {saldoInfo.texto}: {formatearMonto(saldoInfo.valor, 'USD')}
                            </div>
                          </div>

                          {/* Info adicional en una línea */}
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatFecha(cliente.ultimo_movimiento)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CreditCard className="w-3 h-3" />
                              <span>{cliente.total_movimientos || 0} movs</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Tabla de Movimientos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded border border-slate-200">
            {/* Header Movimientos */}
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <h3 className="font-semibold">
                    Movimientos {clienteSeleccionadoFiltro && `- ${clienteSeleccionadoFiltro.nombre} ${clienteSeleccionadoFiltro.apellido}`}
                  </h3>
                </div>
                <span className="text-sm text-slate-300">
                  {movimientosFiltrados.length} registros
                </span>
              </div>
            </div>

            {/* Tabla de Movimientos */}
            <div className="overflow-x-auto">
              {loadingMovimientos ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-slate-500">Cargando movimientos...</p>
                </div>
              ) : movimientosFiltrados.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">
                    {clienteSeleccionadoFiltro
                      ? 'No hay movimientos para este cliente'
                      : 'No hay movimientos registrados'
                    }
                  </p>
                </div>
              ) : (
                <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b-0">Cliente</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b-0">Fecha</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b-0">Concepto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b-0">Débito</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b-0">Crédito</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b-0">Saldo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b-0">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {movimientosConSaldo.map((movimiento, index) => (
                      <tr key={movimiento.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-center text-sm">
                          <div className="font-medium text-slate-800">{movimiento.nombre_cliente} {movimiento.apellido_cliente}</div>
                          {movimiento.observaciones && (
                            <div className="text-xs text-slate-500 mt-1">{movimiento.observaciones}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600 whitespace-nowrap">
                          {formatFecha(movimiento.fecha_operacion)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800">
                          {movimiento.concepto}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {movimiento.tipo_movimiento === 'debe' ? formatearMonto(movimiento.monto, 'USD') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600 whitespace-nowrap">
                          {movimiento.tipo_movimiento === 'haber' ? formatearMonto(movimiento.monto, 'USD') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-slate-800 whitespace-nowrap">
                            {movimiento.saldo_acumulado > 0 ? '+' : movimiento.saldo_acumulado < 0 ? '-' : ''}{formatearMonto(Math.abs(movimiento.saldo_acumulado), 'USD')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEditarMovimiento(movimiento)}
                              className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
                              title="Editar movimiento"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarMovimiento(movimiento)}
                              className="text-red-600 hover:text-red-800 transition-colors p-1"
                              title="Eliminar movimiento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Modal de Nuevo Movimiento - Selector */}
      {showNuevoMovimiento && !tipoMovimiento && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Nuevo Movimiento</h3>
                <button
                  onClick={() => {
                    setShowNuevoMovimiento(false);
                    setClientePreseleccionado(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Sección CLIENTES */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">CLIENTES</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSelectTipoMovimiento('cobro')}
                      className="p-3 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-emerald-100 rounded">
                          <TrendingDown className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-slate-800 text-sm">Registrar Pago</h4>
                          <p className="text-xs text-slate-500 truncate">Cliente nos paga</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectTipoMovimiento('agregar_deuda')}
                      className="p-3 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-emerald-100 rounded">
                          <Plus className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-slate-800 text-sm">Agregar Deuda</h4>
                          <p className="text-xs text-slate-500 truncate">Cliente nos debe</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Separador */}
                <div className="border-t border-slate-200"></div>

                {/* Sección UPDATE */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">UPDATE</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSelectTipoMovimiento('pago_realizado')}
                      className="p-3 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-slate-100 rounded">
                          <TrendingUp className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-slate-800 text-sm">Pago Realizado</h4>
                          <p className="text-xs text-slate-500 truncate">Update paga</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectTipoMovimiento('tomar_deuda')}
                      className="p-3 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-slate-100 rounded">
                          <Minus className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-slate-800 text-sm">Tomar Deuda</h4>
                          <p className="text-xs text-slate-500 truncate">Update debe</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Unificado para Movimientos */}
      {tipoMovimiento && (
        <MovimientoModal
          tipo={tipoMovimiento}
          onClose={handleCerrarMovimiento}
          onSuccess={async () => {
            await loadData();
            await cargarTodosMovimientos();
          }}
          clientePreseleccionado={clientePreseleccionado}
        />
      )}

      {/* Modal de Edición de Movimiento */}
      {showEditarMovimiento && movimientoAEditar && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Editar Movimiento</h3>
                <button
                  onClick={() => {
                    setShowEditarMovimiento(false);
                    setMovimientoAEditar(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <EditarMovimientoForm
              movimiento={movimientoAEditar}
              onClose={() => {
                setShowEditarMovimiento(false);
                setMovimientoAEditar(null);
              }}
              onSuccess={async () => {
                await loadData();
                await cargarTodosMovimientos();
                setShowEditarMovimiento(false);
                setMovimientoAEditar(null);
              }}
              editarMovimiento={editarMovimiento}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CuentasCorrientesSection;
