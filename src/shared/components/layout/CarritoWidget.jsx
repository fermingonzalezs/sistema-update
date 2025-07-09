import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Monitor, Smartphone, Box, CreditCard, DollarSign, Edit2 } from 'lucide-react';
import ClienteSelector from '../../../modules/ventas/components/ClienteSelector';
import ConversionMonedas from '../../../components/ConversionMonedas';
import { useVendedores } from '../../../modules/ventas/hooks/useVendedores';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';

const CarritoWidget = ({ carrito, onUpdateCantidad, onRemover, onLimpiar, onProcesarVenta }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [datosCliente, setDatosCliente] = useState({
    metodo_pago_1: 'efectivo_pesos',
    metodo_pago_2: '',
    monto_pago_1: 0,
    monto_pago_2: 0,
    observaciones: '',
    vendedor: '',
    sucursal: 'la_plata',
    cotizacion_dolar: 1000
  });

  // Usar el hook de vendedores
  const { vendedores, loading: loadingVendedores, fetchVendedores } = useVendedores();
  const [editandoCotizacion, setEditandoCotizacion] = useState(false);

  useEffect(() => {
    fetchVendedores();
    // Cargar cotización inicial
    cargarCotizacionInicial();
  }, [fetchVendedores]);

  const cargarCotizacionInicial = async () => {
    try {
      const cotizacionData = await cotizacionSimple.obtenerCotizacion();
      setDatosCliente(prev => ({
        ...prev,
        cotizacion_dolar: cotizacionData.valor || 1000
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

  const handleMontosChange = (metodo, monto) => {
    const total = calcularTotalPesos();
    const otroMonto = metodo === 1 ? datosCliente.monto_pago_2 : datosCliente.monto_pago_1;
    const nuevoMonto = Math.min(Math.max(0, parseFloat(monto) || 0), total - otroMonto);
    
    setDatosCliente(prev => ({
      ...prev,
      [`monto_pago_${metodo}`]: nuevoMonto
    }));
  };

  const distribuyeMontos = () => {
    const total = calcularTotalPesos();
    const monto1 = datosCliente.monto_pago_1;
    const monto2 = total - monto1;
    
    setDatosCliente(prev => ({
      ...prev,
      monto_pago_2: Math.max(0, monto2)
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

    // ✅ VALIDACIÓN ESPECIAL: Si es cuenta corriente, confirmar
    if (datosCliente.metodo_pago === 'cuenta_corriente') {
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
        metodo_pago: datosCliente.metodo_pago,
        observaciones: datosCliente.observaciones,
        vendedor: datosCliente.vendedor,
        sucursal: datosCliente.sucursal,
        numeroTransaccion,
        fecha_venta: new Date().toISOString(),
        // ✅ NUEVO: Información para cuenta corriente
        esCuentaCorriente: datosCliente.metodo_pago === 'cuenta_corriente',
        total: calcularTotal()
      };

      console.log('📦 Datos completos de la venta:', datosVentaCompletos);

      // Procesar la venta en la base de datos
      console.log('💾 Enviando venta a la base de datos...');
      await onProcesarVenta(carrito, datosVentaCompletos);
      console.log('✅ Venta procesada exitosamente en la BD');

      // ✅ MOSTRAR MENSAJE DE ÉXITO personalizado
      const mensajeExito = datosCliente.metodo_pago === 'cuenta_corriente' 
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
        observaciones: '',
        vendedor: '',
        sucursal: 'la_plata',
        cotizacion_dolar: datosCliente.cotizacion_dolar // Mantener la cotización
      });
      setMostrarFormulario(false);
      setIsOpen(false);

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
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {calcularCantidadTotal() > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {calcularCantidadTotal()}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Modal del carrito */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {!mostrarFormulario ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Carrito de Compras ({calcularCantidadTotal()} items)
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Contenido del carrito */}
                <div className="p-6 max-h-96 overflow-y-auto">
                  {carrito.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Tu carrito está vacío</p>
                      <p className="text-sm">Agrega productos desde el inventario</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {carrito.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getIconoTipo(item.tipo)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {item.producto.modelo || item.producto.nombre_producto}
                              </h3>
                              <p className="text-sm text-gray-500 capitalize">{item.tipo}</p>
                              {item.producto.serial && (
                                <p className="text-xs text-gray-400">Serial: {item.producto.serial}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Controles de cantidad */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => onUpdateCantidad(item.id, item.cantidad - 1)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.cantidad}</span>
                              <button
                                onClick={() => onUpdateCantidad(item.id, item.cantidad + 1)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                                disabled={item.tipo !== 'otro' && item.cantidad >= 1}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Precio */}
                            <div className="text-right">
                              <p className="font-medium">${(item.precio_unitario * item.cantidad).toFixed(2)}</p>
                              <p className="text-sm text-gray-500">${item.precio_unitario}/ud</p>
                            </div>

                            {/* Eliminar */}
                            <button
                              onClick={() => onRemover(item.id)}
                              className="p-1 text-red-500 hover:text-red-700"
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
                  <div className="border-t p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-gray-800">
                        Total: ${calcularTotal().toFixed(2)}
                      </div>
                      <button
                        onClick={onLimpiar}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Limpiar carrito
                      </button>
                    </div>
                    <button
                      onClick={() => setMostrarFormulario(true)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
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
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-800">Datos de la Venta</h2>
                  <button
                    onClick={() => setMostrarFormulario(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleProcesarVenta} className="p-6">
                    {/* ✅ Selector de cliente */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente *
                      </label>
                      <ClienteSelector
                        selectedCliente={clienteSeleccionado}
                        onSelectCliente={setClienteSeleccionado}
                        required={true}
                      />
                      {clienteSeleccionado && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                            ✅ Cliente seleccionado: <strong>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong>
                          </p>
                          {clienteSeleccionado.email && (
                            <p className="text-xs text-green-600">📧 {clienteSeleccionado.email}</p>
                          )}
                          {clienteSeleccionado.telefono && (
                            <p className="text-xs text-green-600">📞 {clienteSeleccionado.telefono}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cotización del Dólar */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-blue-800">Cotización del Dólar</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditandoCotizacion(!editandoCotizacion)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-blue-600">Total USD</p>
                          <p className="text-lg font-bold text-blue-800">U$${calcularTotal().toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Cotización</p>
                          {editandoCotizacion ? (
                            <input
                              type="number"
                              value={datosCliente.cotizacion_dolar}
                              onChange={(e) => setDatosCliente(prev => ({...prev, cotizacion_dolar: parseFloat(e.target.value) || 0}))}
                              className="w-full text-center text-lg font-bold border border-blue-300 rounded px-2 py-1"
                              step="0.01"
                            />
                          ) : (
                            <p className="text-lg font-bold text-blue-800">${datosCliente.cotizacion_dolar}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Total ARS</p>
                          <p className="text-lg font-bold text-blue-800">${calcularTotalPesos().toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Métodos de Pago */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Métodos de Pago</h3>
                      
                      {/* Primer método de pago */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Método de Pago 1 *
                          </label>
                          <select
                            name="metodo_pago_1"
                            value={datosCliente.metodo_pago_1}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monto (ARS)
                          </label>
                          <input
                            type="number"
                            value={datosCliente.monto_pago_1}
                            onChange={(e) => handleMontosChange(1, e.target.value)}
                            onBlur={distribuyeMontos}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0"
                            step="0.01"
                            min="0"
                            max={calcularTotalPesos()}
                          />
                        </div>
                      </div>

                      {/* Segundo método de pago (opcional) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Método de Pago 2 (Opcional)
                          </label>
                          <select
                            name="metodo_pago_2"
                            value={datosCliente.metodo_pago_2}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monto (ARS)
                          </label>
                          <input
                            type="number"
                            value={datosCliente.monto_pago_2}
                            onChange={(e) => handleMontosChange(2, e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0"
                            step="0.01"
                            min="0"
                            max={calcularTotalPesos() - datosCliente.monto_pago_1}
                            disabled={!datosCliente.metodo_pago_2}
                          />
                        </div>
                      </div>

                      {/* Resumen de pagos */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total a pagar:</span>
                          <span className="font-bold">${calcularTotalPesos().toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total pagado:</span>
                          <span className="font-bold">${(datosCliente.monto_pago_1 + datosCliente.monto_pago_2).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2 mt-2">
                          <span>Diferencia:</span>
                          <span className={`font-bold ${calcularTotalPesos() - (datosCliente.monto_pago_1 + datosCliente.monto_pago_2) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${(calcularTotalPesos() - (datosCliente.monto_pago_1 + datosCliente.monto_pago_2)).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor</label>
                        <select
                          name="vendedor"
                          value={datosCliente.vendedor}
                          onChange={handleInputChange}
                          disabled={loadingVendedores}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sucursal *</label>
                        <select
                          name="sucursal"
                          value={datosCliente.sucursal}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="la_plata">🏢 La Plata</option>
                          <option value="mitre">🏢 Mitre</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                      <textarea
                        name="observaciones"
                        value={datosCliente.observaciones}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Observaciones adicionales..."
                      />
                    </div>

                    {/* Resumen */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-gray-700 mb-3">Resumen de la Venta</h3>
                      <div className="text-sm space-y-2">
                        {clienteSeleccionado && (
                          <p>Cliente: <span className="font-medium">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</span></p>
                        )}
                        <p>Items: {calcularCantidadTotal()}</p>
                        <p>Sucursal: <span className="font-medium">{datosCliente.sucursal.replace('_', ' ').toUpperCase()}</span></p>
                        <p>Cotización: <span className="font-medium">${datosCliente.cotizacion_dolar}</span></p>
                        
                        <div className="mt-3 space-y-1">
                          <p className="font-medium">Métodos de Pago:</p>
                          <p className="ml-2">• {datosCliente.metodo_pago_1.replace(/_/g, ' ')}: ${datosCliente.monto_pago_1.toLocaleString('es-AR')}</p>
                          {datosCliente.metodo_pago_2 && (
                            <p className="ml-2">• {datosCliente.metodo_pago_2.replace(/_/g, ' ')}: ${datosCliente.monto_pago_2.toLocaleString('es-AR')}</p>
                          )}
                        </div>
                        
                        {/* ✅ ALERTA si hay diferencia en el pago */}
                        {calcularTotalPesos() !== (datosCliente.monto_pago_1 + datosCliente.monto_pago_2) && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-xs">
                            ⚠️ Los montos no coinciden con el total de la venta
                          </div>
                        )}
                        
                        {/* ✅ RESUMEN especial para cuenta corriente */}
                        {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') && (
                          <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800 text-xs">
                            💡 Parte de esta venta se registrará como deuda en la cuenta corriente del cliente
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setMostrarFormulario(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        disabled={!clienteSeleccionado || (calcularTotalPesos() !== (datosCliente.monto_pago_1 + datosCliente.monto_pago_2))}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                          (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
                            ? 'bg-orange-600 text-white hover:bg-orange-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
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