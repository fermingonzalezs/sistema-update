import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Monitor, Smartphone, Box, CreditCard, DollarSign, Edit2 } from 'lucide-react';
import ClienteSelector from '../../../modules/ventas/components/ClienteSelector';
import ConversionMonedas from '../../../components/ConversionMonedas';
import { useVendedores } from '../../../modules/ventas/hooks/useVendedores';
import { cotizacionService } from '../../services/cotizacionService';
import { formatearMonto } from '../../utils/formatters';

const CarritoWidget = ({ carrito, onUpdateCantidad, onRemover, onLimpiar, onProcesarVenta }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [datosCliente, setDatosCliente] = useState({
    metodo_pago_1: 'efectivo_pesos',
    metodo_pago_2: '',
    monto_pago_1: 0,
    monto_pago_2: 0,
    recargo_pago_1: 0,
    recargo_pago_2: 0,
    observaciones: '',
    vendedor: '',
    sucursal: 'la_plata',
    cotizacion_dolar: 1000
  });

  // Estados locales para inputs para evitar problema del cursor
  const [inputMonto1, setInputMonto1] = useState('');
  const [inputMonto2, setInputMonto2] = useState('');
  const [inputRecargo1, setInputRecargo1] = useState('0');
  const [inputRecargo2, setInputRecargo2] = useState('0');

  // Usar el hook de vendedores
  const { vendedores, loading: loadingVendedores, fetchVendedores } = useVendedores();
  const [editandoCotizacion, setEditandoCotizacion] = useState(false);

  useEffect(() => {
    fetchVendedores();
    // Cargar cotización inicial
    cargarCotizacionInicial();
  }, [fetchVendedores]);

  // Inicializar monto_pago_1 cuando se abre el formulario
  useEffect(() => {
    if (mostrarFormulario && carrito.length > 0) {
      const totalUSD = calcularTotal();
      setDatosCliente(prev => ({
        ...prev,
        monto_pago_1: totalUSD,
        monto_pago_2: 0
      }));
      
      // Inicializar inputs locales
      setInputMonto1(Math.round(totalUSD * datosCliente.cotizacion_dolar).toString());
      setInputMonto2('');
      setInputRecargo1('0');
      setInputRecargo2('0');
    }
  }, [mostrarFormulario, carrito]);

  const cargarCotizacionInicial = async () => {
    try {
      const cotizacionData = await cotizacionService.obtenerCotizacionActual();
      setDatosCliente(prev => ({
        ...prev,
        cotizacion_dolar: cotizacionData.valor || cotizacionData.promedio || 1000
      }));
    } catch (error) {
      console.error('Error cargando cotización:', error);
    }
  };


  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
  };

  const calcularCantidadTotal = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4" />;
      case 'celular': return <Smartphone className="w-4 h-4" />;
      case 'otro': return <Box className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosCliente(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const calcularTotalPesos = () => {
    return calcularTotal() * datosCliente.cotizacion_dolar;
  };

  // Determinar si un método de pago debe mostrarse en pesos (ARS)
  const esMetodoEnPesos = (metodoPago) => {
    return metodoPago === 'efectivo_pesos' || metodoPago === 'transferencia' || metodoPago === 'tarjeta_credito';
  };

  // Obtener moneda para un método de pago
  const obtenerMonedaMetodo = (metodoPago) => {
    return esMetodoEnPesos(metodoPago) ? 'ARS' : 'USD';
  };

  // Convertir monto a USD para guardar en base de datos (incluye recargo)
  const convertirMontoAUSD = (monto, metodoPago, recargo = 0) => {
    let montoConRecargo = monto;
    
    // Solo aplicar recargo a tarjeta de crédito
    if (metodoPago === 'tarjeta_credito' && recargo > 0) {
      montoConRecargo = monto * (1 + recargo / 100);
    }
    
    if (esMetodoEnPesos(metodoPago)) {
      return montoConRecargo / datosCliente.cotizacion_dolar;
    }
    return montoConRecargo;
  };

  // Determinar si un método necesita recargo
  const necesitaRecargo = (metodoPago) => {
    return metodoPago === 'tarjeta_credito';
  };

  // Obtener monto base (sin recargo) para mostrar en input
  const obtenerMontoBaseParaInput = (metodo) => {
    const montoUSD = metodo === 1 ? datosCliente.monto_pago_1 : datosCliente.monto_pago_2;
    const metodoPago = metodo === 1 ? datosCliente.metodo_pago_1 : datosCliente.metodo_pago_2;
    const recargo = metodo === 1 ? datosCliente.recargo_pago_1 : datosCliente.recargo_pago_2;
    
    // Si es tarjeta con recargo, obtener monto base
    if (metodoPago === 'tarjeta_credito' && recargo > 0) {
      const montoBaseUSD = montoUSD / (1 + recargo / 100);
      return esMetodoEnPesos(metodoPago) ? 
        Math.round(montoBaseUSD * datosCliente.cotizacion_dolar).toString() : 
        Math.round(montoBaseUSD).toString();
    }
    
    // Para otros métodos, mostrar monto normal
    return esMetodoEnPesos(metodoPago) ? 
      Math.round(montoUSD * datosCliente.cotizacion_dolar).toString() : 
      Math.round(montoUSD).toString();
  };

  // Obtener monto en la moneda del método de pago para mostrar
  const obtenerMontoParaMostrar = (metodoPago) => {
    if (esMetodoEnPesos(metodoPago)) {
      return calcularTotalPesos();
    }
    return calcularTotal();
  };

  const handleMontosChange = (metodo, monto) => {
    // Actualizar input local
    if (metodo === 1) {
      setInputMonto1(monto);
    } else {
      setInputMonto2(monto);
    }

    const metodoPago = metodo === 1 ? datosCliente.metodo_pago_1 : datosCliente.metodo_pago_2;
    const recargo = metodo === 1 ? datosCliente.recargo_pago_1 : datosCliente.recargo_pago_2;
    const montoEnMonedaMetodo = parseFloat(monto) || 0;
    
    // Convertir a USD para guardar (incluye recargo automáticamente)
    const montoUSD = convertirMontoAUSD(montoEnMonedaMetodo, metodoPago, recargo);
    
    setDatosCliente(prev => ({
      ...prev,
      [`monto_pago_${metodo}`]: montoUSD
    }));
  };

  const handleRecargoChange = (metodo, recargo) => {
    // Actualizar input local
    if (metodo === 1) {
      setInputRecargo1(recargo);
    } else {
      setInputRecargo2(recargo);
    }

    setDatosCliente(prev => ({
      ...prev,
      [`recargo_pago_${metodo}`]: parseFloat(recargo) || 0
    }));

    // Recalcular monto con nuevo recargo
    const montoInput = metodo === 1 ? inputMonto1 : inputMonto2;
    if (montoInput) {
      handleMontosChange(metodo, montoInput);
    }
  };

  const distribuyeMontos = () => {
    // Solo distribuir si hay un segundo método seleccionado
    if (!datosCliente.metodo_pago_2) return;
    
    const totalUSD = calcularTotal();
    const monto1USD = datosCliente.monto_pago_1;
    const monto2USD = totalUSD - monto1USD;
    
    setDatosCliente(prev => ({
      ...prev,
      monto_pago_2: Math.max(0, monto2USD)
    }));
  };

  const handleProcesarVenta = async (e) => {
    e.preventDefault();

    console.log('🔄 Iniciando proceso de venta...');
    console.log('Cliente seleccionado:', clienteSeleccionado);
    console.log('Datos del cliente:', datosCliente);
    console.log('Carrito:', carrito);

    // ✅ VALIDACIÓN: Verificar que hay cliente seleccionado
    if (!clienteSeleccionado || !clienteSeleccionado.id) {
      console.error('❌ No hay cliente seleccionado');
      
      const clienteInput = document.querySelector('input[placeholder*="Buscar cliente"]');
      if (clienteInput) {
        clienteInput.focus();
        clienteInput.style.border = '2px solid red';
        setTimeout(() => {
          clienteInput.style.border = '';
        }, 3000);
      }
      
      alert('⚠️ Debe seleccionar un cliente antes de procesar la venta');
      return;
    }

    // ✅ VALIDACIÓN: Verificar que hay productos en el carrito
    if (!carrito || carrito.length === 0) {
      console.error('❌ Carrito vacío');
      alert('⚠️ El carrito está vacío. Agregue productos antes de procesar la venta.');
      return;
    }

    // ✅ VALIDACIÓN: Verificar que los montos suman correctamente
    // Para métodos con recargo, el total pagado debe cubrir el total base + recargos
    const totalUSD = calcularTotal();
    const totalPagadoUSD = datosCliente.monto_pago_1 + (datosCliente.monto_pago_2 || 0);
    
    // Calcular total base esperado (sumando montos base sin recargos)
    let totalBaseEsperado = 0;
    
    // Método 1
    if (datosCliente.metodo_pago_1 === 'tarjeta_credito' && datosCliente.recargo_pago_1 > 0) {
      totalBaseEsperado += datosCliente.monto_pago_1 / (1 + datosCliente.recargo_pago_1 / 100);
    } else {
      totalBaseEsperado += datosCliente.monto_pago_1;
    }
    
    // Método 2
    if (datosCliente.monto_pago_2 > 0) {
      if (datosCliente.metodo_pago_2 === 'tarjeta_credito' && datosCliente.recargo_pago_2 > 0) {
        totalBaseEsperado += datosCliente.monto_pago_2 / (1 + datosCliente.recargo_pago_2 / 100);
      } else {
        totalBaseEsperado += datosCliente.monto_pago_2;
      }
    }
    
    if (Math.abs(totalUSD - totalBaseEsperado) > 0.01) { // Tolerancia de 1 centavo por redondeo
      console.error('❌ Los montos base no coinciden con el total de la venta');
      alert(`⚠️ Los montos base no cubren el total de la venta.\n\nTotal venta: ${formatearMonto(totalUSD, 'USD')}\nTotal base cubierto: ${formatearMonto(totalBaseEsperado, 'USD')}\nTotal a cobrar (con recargos): ${formatearMonto(totalPagadoUSD, 'USD')}\n\nAjuste los montos antes de continuar.`);
      return;
    }

    // ✅ VALIDACIÓN ESPECIAL: Si es cuenta corriente, confirmar
    if (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') {
      const confirmacion = window.confirm(
        `¿Confirmar venta a CUENTA CORRIENTE por $${calcularTotal().toFixed(2)} para ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}?\n\nEsto quedará registrado como deuda pendiente del cliente.`
      );
      
      if (!confirmacion) {
        console.log('🚫 Venta a cuenta corriente cancelada por el usuario');
        return;
      }
    } else {
      // Confirmación normal para otros métodos de pago
      const confirmacion = window.confirm(
        `¿Confirmar venta por $${calcularTotal().toFixed(2)} para ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}?`
      );
      
      if (!confirmacion) {
        console.log('🚫 Venta cancelada por el usuario');
        return;
      }
    }

    try {

      // Generar número de transacción único
      const numeroTransaccion = `VT-${Date.now()}`;
      
      // ✅ DATOS COMPLETOS: Usar información del cliente seleccionado
      const datosVentaCompletos = {
        cliente_id: clienteSeleccionado.id,
        cliente_nombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        cliente_email: clienteSeleccionado.email || null,
        cliente_telefono: clienteSeleccionado.telefono || null,
        metodo_pago_1: datosCliente.metodo_pago_1,
        metodo_pago_2: datosCliente.metodo_pago_2,
        monto_pago_1: datosCliente.monto_pago_1,
        monto_pago_2: datosCliente.monto_pago_2,
        observaciones: datosCliente.observaciones,
        vendedor: datosCliente.vendedor,
        sucursal: datosCliente.sucursal,
        numeroTransaccion,
        fecha_venta: new Date().toISOString(),
        // ✅ NUEVO: Información para cuenta corriente
        esCuentaCorriente: datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente',
        total: calcularTotal()
      };

      console.log('📦 Datos completos de la venta:', datosVentaCompletos);

      // Procesar la venta en la base de datos
      console.log('💾 Enviando venta a la base de datos...');
      await onProcesarVenta(carrito, datosVentaCompletos);
      console.log('✅ Venta procesada exitosamente en la BD');

      // ✅ MOSTRAR MENSAJE DE ÉXITO personalizado
      const mensajeExito = (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') 
        ? `✅ Venta a CUENTA CORRIENTE procesada exitosamente!\n\nTransacción: ${numeroTransaccion}\nCliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}\nTotal: $${calcularTotal().toFixed(2)}\n\n📝 El saldo se registró en la cuenta corriente del cliente.`
        : `✅ Venta procesada exitosamente!\n\nTransacción: ${numeroTransaccion}\nCliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}\nTotal: $${calcularTotal().toFixed(2)}`;

      alert(mensajeExito);

      // ✅ LIMPIAR TODO después del éxito
      setClienteSeleccionado(null);
      setDatosCliente({
        metodo_pago_1: 'efectivo_pesos',
        metodo_pago_2: '',
        monto_pago_1: 0,
        monto_pago_2: 0,
        recargo_pago_1: 0,
        recargo_pago_2: 0,
        observaciones: '',
        vendedor: '',
        sucursal: 'la_plata',
        cotizacion_dolar: datosCliente.cotizacion_dolar // Mantener la cotización
      });
      setMostrarFormulario(false);
      setIsOpen(false);
      
      // Limpiar inputs locales
      setInputMonto1('');
      setInputMonto2('');
      setInputRecargo1('0');
      setInputRecargo2('0');

      console.log('🎉 Proceso completado exitosamente');

    } catch (err) {
      console.error('❌ Error procesando venta:', err);
      
      let errorMessage = 'Error procesando venta';
      
      if (err.message.includes('cliente')) {
        errorMessage = 'Error con los datos del cliente';
      } else if (err.message.includes('stock') || err.message.includes('inventario')) {
        errorMessage = 'Error de inventario - verifique el stock disponible';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Error de conexión - verifique su internet';
      }
      
      alert(`❌ ${errorMessage}:\n\n${err.message}\n\nIntente nuevamente o contacte al administrador.`);
    }
  };

  return (
    <>
      {/* Botón flotante del carrito */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-lg shadow-lg transition-all duration-300"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {calcularCantidadTotal() > 0 && (
              <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-xs rounded-lg w-5 h-5 flex items-center justify-center font-bold">
                {calcularCantidadTotal()}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Modal del carrito */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {!mostrarFormulario ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold text-slate-800">
                      Carrito de Compras ({calcularCantidadTotal()} items)
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-800 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Contenido del carrito */}
                <div className="p-6 max-h-96 overflow-y-auto">
                  {carrito.length === 0 ? (
                    <div className="text-center py-8 text-slate-800">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                      <p className="text-lg">Tu carrito está vacío</p>
                      <p className="text-sm">Agrega productos desde el inventario</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {carrito.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-200 rounded-lg">
                              {getIconoTipo(item.tipo)}
                            </div>
                            <div>
                              <h3 className="font-medium text-slate-800">
                                {item.producto.modelo || item.producto.nombre_producto}
                              </h3>
                              <p className="text-sm text-slate-800 capitalize">{item.tipo}</p>
                              {item.producto.serial && (
                                <p className="text-xs text-slate-800">Serial: {item.producto.serial}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Controles de cantidad */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => onUpdateCantidad(item.id, item.cantidad - 1)}
                                className="p-1 text-slate-800 hover:text-emerald-600"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium text-slate-800">{item.cantidad}</span>
                              <button
                                onClick={() => onUpdateCantidad(item.id, item.cantidad + 1)}
                                className="p-1 text-slate-800 hover:text-emerald-600"
                                disabled={item.tipo !== 'otro' && item.cantidad >= 1}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Precio */}
                            <div className="text-right">
                              <p className="font-medium text-slate-800">${(item.precio_unitario * item.cantidad).toFixed(2)}</p>
                              <p className="text-sm text-slate-800">${item.precio_unitario}/ud</p>
                            </div>

                            {/* Eliminar */}
                            <button
                              onClick={() => onRemover(item.id)}
                              className="p-1 text-slate-800 hover:text-emerald-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {carrito.length > 0 && (
                  <div className="border-t border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-slate-800">
                        Total: ${calcularTotal().toFixed(2)}
                      </div>
                      <button
                        onClick={onLimpiar}
                        className="text-slate-800 hover:text-emerald-600 text-sm"
                      >
                        Limpiar carrito
                      </button>
                    </div>
                    <button
                      onClick={() => setMostrarFormulario(true)}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Procesar Venta</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Formulario de venta */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800">Datos de la Venta</h2>
                  <button
                    onClick={() => setMostrarFormulario(false)}
                    className="text-slate-800 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleProcesarVenta} className="p-6">
                    {/* ✅ Selector de cliente */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-800 mb-2">
                        Cliente *
                      </label>
                      <ClienteSelector
                        selectedCliente={clienteSeleccionado}
                        onSelectCliente={setClienteSeleccionado}
                        required={true}
                      />
                      {clienteSeleccionado && (
                        <div className="mt-2 p-3 bg-slate-200 rounded-lg border border-slate-200">
                          <p className="text-sm text-slate-800">
                            ✅ Cliente seleccionado: <strong>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong>
                          </p>
                          {clienteSeleccionado.email && (
                            <p className="text-xs text-slate-800">📧 {clienteSeleccionado.email}</p>
                          )}
                          {clienteSeleccionado.telefono && (
                            <p className="text-xs text-slate-800">📞 {clienteSeleccionado.telefono}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cotización del Dólar */}
                    <div className="mb-6 p-4 bg-slate-200 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-lg font-semibold text-slate-800">Cotización del Dólar</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditandoCotizacion(!editandoCotizacion)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-emerald-600">Total USD</p>
                          <p className="text-lg font-bold text-slate-800">U$${calcularTotal().toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600">Cotización</p>
                          {editandoCotizacion ? (
                            <input
                              type="number"
                              value={datosCliente.cotizacion_dolar}
                              onChange={(e) => setDatosCliente(prev => ({...prev, cotizacion_dolar: parseFloat(e.target.value) || 0}))}
                              className="w-full text-center text-lg font-bold border border-slate-200 rounded-lg px-2 py-1"
                              step="0.01"
                            />
                          ) : (
                            <p className="text-lg font-bold text-slate-800">${datosCliente.cotizacion_dolar}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600">Total ARS</p>
                          <p className="text-lg font-bold text-slate-800">${calcularTotalPesos().toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Métodos de Pago */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Métodos de Pago</h3>
                      
                      {/* Primer método de pago */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Método de Pago 1 *
                          </label>
                          <select
                            name="metodo_pago_1"
                            value={datosCliente.metodo_pago_1}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                          >
                            <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                            <option value="dolares_billete">💸 Dólares Billete</option>
                            <option value="transferencia">🏦 Transferencia</option>
                            <option value="criptomonedas">₿ Criptomonedas</option>
                            <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                            <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Monto ({obtenerMonedaMetodo(datosCliente.metodo_pago_1)})
                          </label>
                          <input
                            type="number"
                            value={inputMonto1}
                            onChange={(e) => handleMontosChange(1, e.target.value)}
                            onBlur={distribuyeMontos}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                            placeholder="0"
                            step="1"
                            min="0"
                          />
                          <p className="text-xs text-slate-800 mt-1">
                            Total disponible: {formatearMonto(obtenerMontoParaMostrar(datosCliente.metodo_pago_1), obtenerMonedaMetodo(datosCliente.metodo_pago_1))}
                          </p>
                        </div>
                      </div>

                      {/* Recargo para primer método si es tarjeta de crédito */}
                      {necesitaRecargo(datosCliente.metodo_pago_1) && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Recargo Tarjeta de Crédito (%)
                          </label>
                          <input
                            type="number"
                            value={inputRecargo1}
                            onChange={(e) => handleRecargoChange(1, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                            placeholder="0"
                            step="0.1"
                            min="0"
                            max="100"
                          />
                          {datosCliente.recargo_pago_1 > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">
                              Recargo aplicado: +{formatearMonto(
                                (datosCliente.monto_pago_1 * datosCliente.cotizacion_dolar * datosCliente.recargo_pago_1) / 100, 
                                'ARS'
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Segundo método de pago (opcional) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Método de Pago 2 (Opcional)
                          </label>
                          <select
                            name="metodo_pago_2"
                            value={datosCliente.metodo_pago_2}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                          >
                            <option value="">Seleccionar método</option>
                            <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                            <option value="dolares_billete">💸 Dólares Billete</option>
                            <option value="transferencia">🏦 Transferencia</option>
                            <option value="criptomonedas">₿ Criptomonedas</option>
                            <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                            <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Monto ({datosCliente.metodo_pago_2 ? obtenerMonedaMetodo(datosCliente.metodo_pago_2) : 'N/A'})
                          </label>
                          <input
                            type="number"
                            value={inputMonto2}
                            onChange={(e) => handleMontosChange(2, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                            placeholder="0"
                            step="1"
                            min="0"
                            disabled={!datosCliente.metodo_pago_2}
                          />
                          {datosCliente.metodo_pago_2 && (
                            <p className="text-xs text-slate-800 mt-1">
                              Restante: {formatearMonto(
                                esMetodoEnPesos(datosCliente.metodo_pago_2) ? 
                                  (calcularTotal() - datosCliente.monto_pago_1) * datosCliente.cotizacion_dolar : 
                                  calcularTotal() - datosCliente.monto_pago_1, 
                                obtenerMonedaMetodo(datosCliente.metodo_pago_2)
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Recargo para segundo método si es tarjeta de crédito */}
                      {necesitaRecargo(datosCliente.metodo_pago_2) && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Recargo Tarjeta de Crédito 2 (%)
                          </label>
                          <input
                            type="number"
                            value={inputRecargo2}
                            onChange={(e) => handleRecargoChange(2, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                            placeholder="0"
                            step="0.1"
                            min="0"
                            max="100"
                          />
                          {datosCliente.recargo_pago_2 > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">
                              Recargo aplicado: +{formatearMonto(
                                (datosCliente.monto_pago_2 * datosCliente.cotizacion_dolar * datosCliente.recargo_pago_2) / 100, 
                                'ARS'
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Resumen de pagos */}
                      <div className="bg-slate-200 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total a pagar:</span>
                          <span className="font-bold">{formatearMonto(calcularTotal(), 'USD')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total pagado:</span>
                          <span className="font-bold">{formatearMonto(datosCliente.monto_pago_1 + (datosCliente.monto_pago_2 || 0), 'USD')}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                          <span>Diferencia:</span>
                          <span className={`font-bold ${Math.abs(calcularTotal() - (datosCliente.monto_pago_1 + (datosCliente.monto_pago_2 || 0))) < 0.01 ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {formatearMonto(calcularTotal() - (datosCliente.monto_pago_1 + (datosCliente.monto_pago_2 || 0)), 'USD')}
                          </span>
                        </div>
                        {/* Desglose por método */}
                        {datosCliente.metodo_pago_1 && (
                          <div className="mt-3 pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-800 mb-1">Desglose por método:</p>
                            <div className="flex justify-between text-xs">
                              <span>
                                {datosCliente.metodo_pago_1.replace(/_/g, ' ')}
                                {necesitaRecargo(datosCliente.metodo_pago_1) && datosCliente.recargo_pago_1 > 0 && 
                                  ` (+${datosCliente.recargo_pago_1}%)`
                                }:
                              </span>
                              <span>{formatearMonto(
                                esMetodoEnPesos(datosCliente.metodo_pago_1) ? 
                                  datosCliente.monto_pago_1 * datosCliente.cotizacion_dolar : 
                                  datosCliente.monto_pago_1, 
                                obtenerMonedaMetodo(datosCliente.metodo_pago_1)
                              )}</span>
                            </div>
                            {datosCliente.metodo_pago_2 && datosCliente.monto_pago_2 > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>
                                  {datosCliente.metodo_pago_2.replace(/_/g, ' ')}
                                  {necesitaRecargo(datosCliente.metodo_pago_2) && datosCliente.recargo_pago_2 > 0 && 
                                    ` (+${datosCliente.recargo_pago_2}%)`
                                  }:
                                </span>
                                <span>{formatearMonto(
                                  esMetodoEnPesos(datosCliente.metodo_pago_2) ? 
                                    datosCliente.monto_pago_2 * datosCliente.cotizacion_dolar : 
                                    datosCliente.monto_pago_2, 
                                  obtenerMonedaMetodo(datosCliente.metodo_pago_2)
                                )}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">Vendedor</label>
                        <select
                          name="vendedor"
                          value={datosCliente.vendedor}
                          onChange={handleInputChange}
                          disabled={loadingVendedores}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-slate-200"
                        >
                          <option value="">
                            {loadingVendedores ? 'Cargando vendedores...' : 'Seleccionar vendedor'}
                          </option>
                          {vendedores.map((vendedor) => (
                            <option key={vendedor.id} value={vendedor.id}>
                              {vendedor.nombre} {vendedor.apellido}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">Sucursal *</label>
                        <select
                          name="sucursal"
                          value={datosCliente.sucursal}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                        >
                          <option value="la_plata">🏢 La Plata</option>
                          <option value="mitre">🏢 Mitre</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-800 mb-2">Observaciones</label>
                      <textarea
                        name="observaciones"
                        value={datosCliente.observaciones}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                        placeholder="Observaciones adicionales..."
                      />
                    </div>

                    {/* Resumen */}
                    <div className="bg-slate-200 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-slate-800 mb-3">Resumen de la Venta</h3>
                      <div className="text-sm space-y-2">
                        {clienteSeleccionado && (
                          <p>Cliente: <span className="font-medium">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</span></p>
                        )}
                        <p>Items: {calcularCantidadTotal()}</p>
                        <p>Sucursal: <span className="font-medium">{datosCliente.sucursal.replace('_', ' ').toUpperCase()}</span></p>
                        <p>Cotización: <span className="font-medium">${datosCliente.cotizacion_dolar}</span></p>
                        
                        <div className="mt-3 space-y-1">
                          <p className="font-medium">Métodos de Pago:</p>
                          <p className="ml-2">• {datosCliente.metodo_pago_1.replace(/_/g, ' ')}
                            {necesitaRecargo(datosCliente.metodo_pago_1) && datosCliente.recargo_pago_1 > 0 && 
                              ` (+${datosCliente.recargo_pago_1}%)`
                            }: {formatearMonto(
                            esMetodoEnPesos(datosCliente.metodo_pago_1) ? 
                              datosCliente.monto_pago_1 * datosCliente.cotizacion_dolar : 
                              datosCliente.monto_pago_1, 
                            obtenerMonedaMetodo(datosCliente.metodo_pago_1)
                          )}</p>
                          {datosCliente.metodo_pago_2 && datosCliente.monto_pago_2 > 0 && (
                            <p className="ml-2">• {datosCliente.metodo_pago_2.replace(/_/g, ' ')}
                              {necesitaRecargo(datosCliente.metodo_pago_2) && datosCliente.recargo_pago_2 > 0 && 
                                ` (+${datosCliente.recargo_pago_2}%)`
                              }: {formatearMonto(
                              esMetodoEnPesos(datosCliente.metodo_pago_2) ? 
                                datosCliente.monto_pago_2 * datosCliente.cotizacion_dolar : 
                                datosCliente.monto_pago_2, 
                              obtenerMonedaMetodo(datosCliente.metodo_pago_2)
                            )}</p>
                          )}
                        </div>
                        
                        {/* ✅ ALERTA si hay diferencia en el pago */}
                        {Math.abs(calcularTotal() - (datosCliente.monto_pago_1 + (datosCliente.monto_pago_2 || 0))) > 0.01 && (
                          <div className="mt-2 p-2 bg-slate-800 text-white rounded-lg text-xs">
                            ⚠️ Los montos no coinciden con el total de la venta
                          </div>
                        )}
                        
                        {/* ✅ RESUMEN especial para cuenta corriente */}
                        {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') && (
                          <div className="mt-2 p-2 bg-slate-800 text-white rounded-lg text-xs">
                            💡 Parte de esta venta se registrará como deuda en la cuenta corriente del cliente
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setMostrarFormulario(false)}
                        className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-lg font-semibold hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        disabled={!clienteSeleccionado}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 disabled:bg-slate-200 disabled:cursor-not-allowed ${
                          (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
                            ? 'bg-slate-800 text-white hover:bg-slate-600' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') ? (
                          <>
                            <CreditCard className="w-5 h-5" />
                            <span>Procesar con Cuenta Corriente</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            <span>Procesar Venta</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CarritoWidget;