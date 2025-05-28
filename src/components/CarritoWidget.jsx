import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Monitor, Smartphone, Box, Mail, Download, Loader } from 'lucide-react';
import EmailReceiptService from '../services/emailService'; // Ajustar la ruta según tu estructura

const CarritoWidget = ({ carrito, onUpdateCantidad, onRemover, onLimpiar, onProcesarVenta }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    metodo_pago: 'efectivo',
    observaciones: '',
    vendedor: '',
    sucursal: '',
    enviar_recibo: true // Nueva opción
  });

  const emailService = new EmailReceiptService();

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
    const { name, value, type, checked } = e.target;
    setDatosCliente(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleProcesarVenta = async (e) => {
    e.preventDefault();
    if (!datosCliente.cliente_nombre) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    // Validar email si quiere recibo por email
    if (datosCliente.enviar_recibo && !datosCliente.cliente_email) {
      alert('Por favor ingresa el email del cliente para enviar el recibo');
      return;
    }

    try {
      setEnviandoEmail(true);

      // Generar número de transacción único
      const numeroTransaccion = `VT-${Date.now()}`;
      const datosVentaCompletos = {
        ...datosCliente,
        numeroTransaccion,
        fecha_venta: new Date().toISOString()
      };

      // Procesar la venta en la base de datos
      await onProcesarVenta(carrito, datosVentaCompletos);

      // Enviar recibo por email si está habilitado
      if (datosCliente.enviar_recibo && datosCliente.cliente_email) {
        try {
          await emailService.sendReceiptEmail(datosVentaCompletos, carrito);
          alert('✅ Venta procesada y recibo enviado por email exitosamente!');
        } catch (emailError) {
          console.error('Error enviando email:', emailError);
          // Ofrecer descargar PDF como alternativa
          emailService.downloadReceipt(datosVentaCompletos, carrito);
          alert('✅ Venta procesada exitosamente!\n⚠️ No se pudo enviar el email, pero se descargó el recibo PDF.');
        }
      } else {
        // Solo descargar PDF si no quiere email
        if (datosCliente.cliente_email) {
          emailService.downloadReceipt(datosVentaCompletos, carrito);
        }
        alert('✅ Venta procesada exitosamente!');
      }

      // Limpiar formulario y carrito
      setDatosCliente({
        cliente_nombre: '',
        cliente_email: '',
        cliente_telefono: '',
        metodo_pago: 'efectivo',
        observaciones: '',
        vendedor: '',
        sucursal: '',
        enviar_recibo: true
      });
      setMostrarFormulario(false);
      setIsOpen(false);

    } catch (err) {
      console.error('Error procesando venta:', err);
      alert('❌ Error procesando venta: ' + err.message);
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleDescargarRecibo = () => {
    if (carrito.length === 0) return;
    
    const datosTemp = {
      ...datosCliente,
      numeroTransaccion: `PREVIEW-${Date.now()}`,
      cliente_nombre: datosCliente.cliente_nombre || 'Cliente',
    };
    
    emailService.downloadReceipt(datosTemp, carrito);
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
                  <div className="flex items-center space-x-2">
                    {carrito.length > 0 && (
                      <button
                        onClick={handleDescargarRecibo}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Descargar recibo preview"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
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
                                {item.producto.modelo || item.producto.descripcion_producto}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Cliente *
                        </label>
                        <input
                          type="text"
                          name="cliente_nombre"
                          value={datosCliente.cliente_nombre}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email {datosCliente.enviar_recibo && '*'}
                        </label>
                        <input
                          type="email"
                          name="cliente_email"
                          value={datosCliente.cliente_email}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required={datosCliente.enviar_recibo}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                        <input
                          type="tel"
                          name="cliente_telefono"
                          value={datosCliente.cliente_telefono}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                        <select
                          name="metodo_pago"
                          value={datosCliente.metodo_pago}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor</label>
                        <input
                          type="text"
                          name="vendedor"
                          value={datosCliente.vendedor}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sucursal</label>
                        <input
                          type="text"
                          name="sucursal"
                          value={datosCliente.sucursal}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="UPDATE TECH"
                        />
                      </div>
                    </div>

                    {/* Opción de envío de recibo */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="enviar_recibo"
                          checked={datosCliente.enviar_recibo}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <label className="text-sm font-medium text-gray-700">
                            Enviar recibo por email
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 ml-7">
                        Se enviará un PDF con el recibo de compra al email del cliente
                      </p>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                      <textarea
                        name="observaciones"
                        value={datosCliente.observaciones}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {/* Resumen */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-gray-700 mb-2">Resumen de la Venta</h3>
                      <div className="text-sm space-y-1">
                        <p>Items: {calcularCantidadTotal()}</p>
                        <p className="text-lg font-bold">Total: ${calcularTotal().toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setMostrarFormulario(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                        disabled={enviandoEmail}
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        disabled={enviandoEmail}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {enviandoEmail ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            <span>Vender</span>
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