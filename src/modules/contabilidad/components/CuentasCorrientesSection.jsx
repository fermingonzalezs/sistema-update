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
  Calculator,
  Building2,
  Minus,
  Edit3,
  UserPlus
} from 'lucide-react';
import { useCuentasCorrientes } from '../hooks/useCuentasCorrientes.js';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import { formatearMonto } from '../../../shared/utils/formatters';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { cotizacionService } from '../../../shared/services/cotizacionService';

const CuentasCorrientesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState('con_deuda'); // 'todos', 'deudores', 'acreedores', 'saldados', 'con_deuda'
  const [estadisticas, setEstadisticas] = useState(null);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState(null); // 'cobro', 'pago', 'ajustar_deuda', 'tomar_deuda'
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [movimientosCliente, setMovimientosCliente] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [clientePreseleccionado, setClientePreseleccionado] = useState(null);

  const {
    saldos,
    loading,
    error,
    fetchSaldos,
    fetchMovimientosCliente,
    getEstadisticas,
    registrarPagoRecibido
  } = useCuentasCorrientes();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchSaldos();
    const stats = await getEstadisticas();
    setEstadisticas(stats);
  };

  const handleVerMovimientos = async (cliente) => {
    try {
      setPersonaSeleccionada(cliente);
      setLoadingMovimientos(true);
      const movimientos = await fetchMovimientosCliente(cliente.cliente_id);
      setMovimientosCliente(movimientos);
      setShowMovimientos(true);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      alert('Error cargando movimientos: ' + error.message);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const handleRegistrarPago = async (clienteId, monto, concepto, observaciones) => {
    try {
      await registrarPagoRecibido(clienteId, monto, concepto, observaciones);
      await loadData(); // Recargar estadísticas
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
        texto: 'Debe',
        valor: valor,
        color: 'text-slate-800',
        bgColor: 'bg-slate-100'
      };
    } else if (valor < 0) {
      return {
        texto: 'A favor',
        valor: Math.abs(valor),
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100'
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
    return new Date(fecha).toLocaleDateString();
  };

  // Filtrar clientes
  const clientesFiltrados = saldos.filter(cliente => {
    const matchSearch = searchTerm === '' || 
      `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const saldo = parseFloat(cliente.saldo_total || 0);
    let matchFiltro = true;
    
    switch (filtroSaldo) {
      case 'con_deuda':
        matchFiltro = saldo > 0;
        break;
      case 'deudores':
        matchFiltro = saldo > 0;
        break;
      case 'acreedores':
        matchFiltro = saldo < 0;
        break;
      case 'saldados':
        matchFiltro = saldo === 0;
        break;
      case 'todos':
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

// 🔧 Componente Modal Unificado para Movimientos
const MovimientoModal = ({ tipo, onClose, onSuccess, clientePreseleccionado = null }) => {
  const [loading, setLoading] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(clientePreseleccionado);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [formData, setFormData] = useState({
    monto: '',
    concepto: '',
    observaciones: ''
  });

  // Métodos de pago disponibles (igual que en CarritoWidget)
  const metodosPagoDisponibles = [
    { id: 'efectivo_pesos', nombre: '💵 Efectivo en Pesos' },
    { id: 'dolares_billete', nombre: '💸 Dólares Billete' },
    { id: 'transferencia', nombre: '🏦 Transferencia' },
    { id: 'criptomonedas', nombre: '₿ Criptomonedas' },
    { id: 'tarjeta_credito', nombre: '💳 Tarjeta de Crédito' },
    { id: 'cuenta_corriente', nombre: '🏷️ Cuenta Corriente' }
  ];

  const tipoConfig = {
    cobro: {
      titulo: 'Registrar Cobro',
      descripcion: 'Alguien nos paga (reducir su deuda con nosotros)',
      icon: TrendingDown,
      conceptoPlaceholder: 'Pago recibido',
      filtroClientes: 'deudores' // Solo clientes que nos deben
    },
    pago: {
      titulo: 'Registrar Pago',
      descripcion: 'Le pagamos a alguien (reducir nuestra deuda)',
      icon: Minus,
      conceptoPlaceholder: 'Pago realizado',
      filtroClientes: 'acreedores' // Solo clientes a los que les debemos
    },
    tomar_deuda: {
      titulo: 'Tomar Deuda',
      descripcion: 'Registrar cuánto tomamos de deuda con alguien',
      icon: TrendingUp,
      conceptoPlaceholder: 'Deuda tomada',
      filtroClientes: 'todos' // Todos los clientes
    },
    agregar_deuda: {
      titulo: 'Agregar Deuda',
      descripcion: 'Registrar deuda que alguien tiene con nosotros',
      icon: Plus,
      conceptoPlaceholder: 'Deuda agregada',
      filtroClientes: 'todos' // Todos los clientes
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
      case 'deudores':
        return saldo > 0; // Solo clientes que nos deben
      case 'acreedores':
        return saldo < 0; // Solo clientes a los que les debemos
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

    if (!cuentaSeleccionada) {
      alert('Debe seleccionar un método de pago');
      return;
    }

    setLoading(true);
    
    try {
      // Obtener ID del cliente según el tipo de selector usado
      const clienteId = (tipo === 'cobro' || tipo === 'pago') 
        ? personaSeleccionada.cliente_id  // Dropdown simple
        : personaSeleccionada.id;         // ClienteSelector

      // Convertir monto a USD según el método de pago
      const montoEnUSD = convertirMontoAUSD(formData.monto, cuentaSeleccionada);

      const movimientoData = {
        persona_id: clienteId,
        metodo_pago: cuentaSeleccionada,
        monto: montoEnUSD, // Monto convertido a USD
        monto_original: parseFloat(formData.monto), // Monto original en la moneda ingresada
        moneda_original: esMetodoEnPesos(cuentaSeleccionada) ? 'ARS' : 'USD',
        cotizacion_usada: cotizacionDolar,
        concepto: formData.concepto || config.conceptoPlaceholder,
        observaciones: formData.observaciones,
        fecha: new Date().toISOString().split('T')[0],
        tipo: tipo,
        created_by: 'Usuario' // TODO: Obtener del contexto de usuario
      };

      console.log('Movimiento a registrar:', movimientoData);
      
      if (tipo === 'cobro') {
        await handleRegistrarPago(
          clienteId, 
          montoEnUSD, // Usar monto convertido a USD
          formData.concepto || 'Pago recibido',
          formData.observaciones
        );
      } else {
        // TODO: Implementar otros tipos de movimiento
        alert(`✅ ${config.titulo} registrado exitosamente (funcionalidad próximamente)`);
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
              {config.filtroClientes === 'acreedores' && '(al que le debemos)'}
            </label>
            
            {/* Para tipos que requieren filtrado de clientes, usar dropdown simple */}
            {(tipo === 'cobro' || tipo === 'pago') ? (
              clientesFiltrados.length === 0 ? (
                <div className="w-full p-3 border border-slate-200 rounded bg-slate-50 text-slate-500 text-center">
                  No hay clientes disponibles para este tipo de movimiento
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
                      {cliente.nombre} {cliente.apellido} - Saldo: ${Math.abs(parseFloat(cliente.saldo_total || 0)).toFixed(2)}
                    </option>
                  ))}
                </select>
              )
            ) : (
              /* Para tomar_deuda y agregar_deuda, usar ClienteSelector completo */
              <ClienteSelector
                selectedCliente={personaSeleccionada}
                onSelectCliente={setPersonaSeleccionada}
                required={true}
                placeholder="Seleccionar cliente o crear nuevo..."
              />
            )}
          </div>

          {/* Método de Pago */}
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

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monto * {cuentaSeleccionada && esMetodoEnPesos(cuentaSeleccionada) ? '(en Pesos ARS)' : '(en USD)'}
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
            
            {/* Información de conversión */}
            {cuentaSeleccionada && esMetodoEnPesos(cuentaSeleccionada) && formData.monto && (
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
              disabled={loading || !personaSeleccionada || !cuentaSeleccionada}
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
                  <span>Registrar {tipo === 'cobro' ? 'Cobro' : tipo === 'pago' ? 'Pago' : tipo === 'ajustar_deuda' ? 'Ajuste' : 'Deuda'}</span>
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
            titulo="Total a Cobrar"
            valor={formatearMonto(estadisticas.totalDeuda, 'USD')}
          />
          <Tarjeta 
            icon={Users}
            titulo="Clientes con Deuda"
            valor={estadisticas.clientesConDeuda}
          />
          <Tarjeta 
            icon={Calculator}
            titulo="Total Movimientos"
            valor={estadisticas.totalMovimientos}
          />
          <Tarjeta 
            icon={CreditCard}
            titulo="Clientes Saldados"
            valor={estadisticas.clientesSaldados}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Filtro de saldo */}
          <div>
            <select
              value={filtroSaldo}
              onChange={(e) => setFiltroSaldo(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="con_deuda">Solo con deuda</option>
              <option value="deudores">Deudas de la empresa (les debemos)</option>
              <option value="acreedores">Créditos a favor (nos deben)</option>
              <option value="todos">Todas las personas</option>
              <option value="saldados">Saldados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de personas */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700">
            {loading ? 'Cargando...' : `${clientesFiltrados.length} personas`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-500">Cargando cuentas corrientes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-slate-600">Error: {error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-emerald-600 hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No se encontraron personas</p>
            <p className="text-sm text-slate-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay personas registradas en cuentas corrientes'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {clientesFiltrados.map((cliente) => {
              const saldoInfo = formatSaldo(cliente.saldo_total);
              
              return (
                <div key={cliente.cliente_id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-slate-800">
                          {cliente.nombre} {cliente.apellido}
                        </h4>
                        
                        {/* Saldo */}
                        <div className={`px-3 py-1 rounded text-sm font-medium ${saldoInfo.bgColor} ${saldoInfo.color}`}>
                          {saldoInfo.texto}: {formatearMonto(saldoInfo.valor, 'USD')}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Último mov: {formatFecha(cliente.ultimo_movimiento)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4" />
                          <span>Movimientos: {cliente.total_movimientos || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleVerMovimientos(cliente)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="Ver movimientos"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setClientePreseleccionado(cliente);
                          setShowNuevoMovimiento(true);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                        title="Nuevo movimiento"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de movimientos de la persona */}
      {showMovimientos && personaSeleccionada && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Movimientos de {personaSeleccionada.nombre} {personaSeleccionada.apellido}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Saldo actual: {formatearMonto(personaSeleccionada.saldo_total, 'USD')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMovimientos(false);
                    setPersonaSeleccionada(null);
                    setMovimientosCliente([]);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {loadingMovimientos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <span className="ml-2 text-slate-600">Cargando movimientos...</span>
                </div>
              ) : movimientosCliente.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No hay movimientos registrados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {movimientosCliente.map((movimiento) => (
                    <div key={movimiento.id} className="border border-slate-200 rounded p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`p-2 rounded ${
                              movimiento.tipo_movimiento === 'debe' 
                                ? 'bg-slate-100' 
                                : 'bg-emerald-100'
                            }`}>
                              {movimiento.tipo_movimiento === 'debe' ? (
                                <TrendingUp className={`w-4 h-4 ${
                                  movimiento.tipo_movimiento === 'debe' 
                                    ? 'text-slate-600' 
                                    : 'text-emerald-600'
                                }`} />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800">{movimiento.concepto}</h4>
                              <p className="text-sm text-slate-500">{movimiento.tipo_operacion}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(movimiento.fecha_operacion).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Estado: {movimiento.estado}</span>
                            </div>
                            {movimiento.comprobante && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-4 h-4" />
                                <span>Comp: {movimiento.comprobante}</span>
                              </div>
                            )}
                          </div>
                          
                          {movimiento.observaciones && (
                            <p className="text-sm text-slate-500 mt-2">
                              <strong>Obs:</strong> {movimiento.observaciones}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className={`text-lg font-semibold ${
                            movimiento.tipo_movimiento === 'debe' 
                              ? 'text-slate-800' 
                              : 'text-emerald-600'
                          }`}>
                            {movimiento.tipo_movimiento === 'debe' ? '+' : '-'}
                            {formatearMonto(movimiento.monto, 'USD')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {movimiento.tipo_movimiento === 'debe' ? 'Adeuda' : 'Pagó'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <button
                  onClick={() => handleSelectTipoMovimiento('cobro')}
                  className="w-full p-4 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded">
                      <TrendingDown className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Registrar Cobro</h4>
                      <p className="text-sm text-slate-500">Alguien nos paga (reducir su deuda con nosotros)</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('pago')}
                  className="w-full p-4 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 rounded">
                      <Minus className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Registrar Pago</h4>
                      <p className="text-sm text-slate-500">Le pagamos a alguien (reducir nuestra deuda)</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('tomar_deuda')}
                  className="w-full p-4 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 rounded">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Tomar Deuda</h4>
                      <p className="text-sm text-slate-500">Registrar cuánto tomamos de deuda con alguien</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('agregar_deuda')}
                  className="w-full p-4 text-left border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded">
                      <Plus className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Agregar Deuda</h4>
                      <p className="text-sm text-slate-500">Registrar deuda que alguien tiene con nosotros</p>
                    </div>
                  </div>
                </button>
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
          onSuccess={loadData}
          clientePreseleccionado={clientePreseleccionado}
        />
      )}
    </div>
  );
};

export default CuentasCorrientesSection;
