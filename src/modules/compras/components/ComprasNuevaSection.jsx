import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, ShoppingBag, Package, FileText, ChevronRight, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
// TODO: Hook eliminado - useCompras (useComprasNuevo) necesita ser reimplementado
import CargaEquiposUnificada from '../../administracion/components/CargaEquiposUnificada';
import { supabase } from '../../../lib/supabase';

const ComprasNuevaSection = () => {
  // TODO: Backend de compras necesita ser reimplementado
  const reciboActual = null;
  const itemsCarrito = [];
  const loading = false;
  const error = null;
  const successMessage = '';
  const crearRecibo = async () => { alert('Backend de compras no implementado'); };
  const agregarItemAlCarrito = async () => { alert('Backend de compras no implementado'); };
  const editarItemDelCarrito = async () => { alert('Backend de compras no implementado'); };
  const eliminarItemDelCarrito = async () => { alert('Backend de compras no implementado'); };
  const procesarRecibo = async () => { alert('Backend de compras no implementado'); };
  const cancelarRecibo = async () => { alert('Backend de compras no implementado'); };
  const limpiarMensajes = () => {};

  const [vista, setVista] = useState('formulario'); // 'formulario' o 'carrito'
  const [mostrarAgregarProducto, setMostrarAgregarProducto] = useState(false);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState('stock');
  const [recibos, setRecibos] = useState([]);
  const [recibosExpandidos, setRecibosExpandidos] = useState({});

  // Cargar cotización del dólar y historial de recibos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar cotización (simulada, puedes reemplazar con API real)
        setCotizacionDolar(1000); // Valor por defecto, ajusta según tu API

        // Cargar recibos desde compras_recibos
        const { data: recibosData, error: recibosError } = await supabase
          .from('compras_recibos')
          .select('*')
          .order('created_at', { ascending: false });

        if (recibosError) throw recibosError;

        // Cargar items para cada recibo
        const recibosConItems = await Promise.all(
          (recibosData || []).map(async (recibo) => {
            const { data: items } = await supabase
              .from('compras_items')
              .select('*')
              .eq('recibo_id', recibo.id);
            return { ...recibo, items: items || [] };
          })
        );

        setRecibos(recibosConItems);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    cargarDatos();
  }, []);

  const [cotizacionDolar, setCotizacionDolar] = useState(1000);

  // Estados para formulario de recibo
  const [datosRecibo, setDatosRecibo] = useState({
    proveedor: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    metodoPago: ''
  });

  // Mostrar modal para agregar producto
  const handleAgregarProducto = (tipo, datos) => {
    agregarItemAlCarrito({
      tipo_producto: tipo,
      datos_producto: datos,
      destino: destinoSeleccionado
    });
    setMostrarAgregarProducto(false);
  };

  const handleCrearRecibo = async (e) => {
    e.preventDefault();

    if (!datosRecibo.proveedor.trim()) {
      alert('El proveedor es requerido');
      return;
    }

    const resultado = await crearRecibo(datosRecibo);
    if (resultado.success) {
      setVista('carrito');
    }
  };

  const handleProcesarRecibo = async () => {
    if (itemsCarrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const cantStock = itemsCarrito.filter(i => i.destino === 'stock').length;
    const cantTesteo = itemsCarrito.filter(i => i.destino === 'testeo').length;

    const confirmar = window.confirm(
      `¿Procesar recibo?\n\n${cantStock} items → Stock\n${cantTesteo} items → Testeo`
    );

    if (!confirmar) return;

    const resultado = await procesarRecibo();
    if (resultado.success) {
      alert(`✅ Recibo procesado\n${resultado.resumen.procesadosStock} a stock\n${resultado.resumen.procesadosTesteo} a testeo`);
      setVista('formulario');
      setDatosRecibo({ proveedor: '', fecha: new Date().toISOString().split('T')[0], descripcion: '' });
    }
  };

  const handleCancelar = async () => {
    if (window.confirm('¿Cancelar recibo? Se perderán todos los items')) {
      await cancelarRecibo();
      setVista('formulario');
      setDatosRecibo({ proveedor: '', fecha: new Date().toISOString().split('T')[0], descripcion: '' });
    }
  };

  const toggleRecibo = (reciboId) => {
    setRecibosExpandidos(prev => ({
      ...prev,
      [reciboId]: !prev[reciboId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ShoppingBag size={28} />
            <div>
              <h2 className="text-2xl font-semibold">Compras - Sistema Nuevo</h2>
              <p className="text-slate-300 mt-1">Recibos con agregación de productos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start space-x-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4 flex items-start space-x-3">
          <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-emerald-700 text-sm">{successMessage}</p>
        </div>
      )}

      {/* VISTA 1: Formulario de Recibo */}
      {vista === 'formulario' && !reciboActual && (
        <div className="bg-white border border-slate-200 rounded">
          <div className="p-4 bg-slate-800 text-white">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Nuevo Recibo</h3>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleCrearRecibo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    value={datosRecibo.proveedor}
                    onChange={(e) => setDatosRecibo(prev => ({ ...prev, proveedor: e.target.value }))}
                    placeholder="Nombre del proveedor"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={datosRecibo.fecha}
                    onChange={(e) => setDatosRecibo(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={datosRecibo.metodoPago}
                    onChange={(e) => setDatosRecibo(prev => ({ ...prev, metodoPago: e.target.value }))}
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


                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={datosRecibo.descripcion}
                    onChange={(e) => setDatosRecibo(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Notas del recibo..."
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2 transition-colors"
                >
                  <ChevronRight size={18} />
                  Continuar al Carrito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORIAL DE RECIBOS - Estilo desplegable */}
      {vista === 'formulario' && !reciboActual && (
        <div className="bg-white border border-slate-200 rounded">
          <div className="p-4 bg-slate-800 text-white">
            <h3 className="text-lg font-semibold">Historial de Recibos Procesados</h3>
          </div>

          {recibos.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No hay recibos procesados</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {recibos.map((recibo) => {
                const isExpanded = recibosExpandidos[recibo.id];
                const totalItems = recibo.items?.length || 0;

                return (
                  <div key={recibo.id} className="border border-slate-200 rounded overflow-hidden">
                    {/* Header del recibo - clickeable */}
                    <button
                      onClick={() => toggleRecibo(recibo.id)}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown size={20} className="text-slate-600" />
                          ) : (
                            <ChevronRight size={20} className="text-slate-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-6 flex-1">
                          <div className="min-w-[150px]">
                            <div className="text-xs text-slate-500">Proveedor</div>
                            <div className="text-sm font-medium text-slate-800">{recibo.proveedor}</div>
                          </div>
                          <div className="min-w-[100px]">
                            <div className="text-xs text-slate-500">Fecha</div>
                            <div className="text-sm text-slate-800">{new Date(recibo.fecha).toLocaleDateString('es-AR')}</div>
                          </div>
                          <div className="min-w-[60px]">
                            <div className="text-xs text-slate-500">Items</div>
                            <div className="text-sm text-slate-800">{totalItems}</div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Detalle expandido */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-white p-4">
                        {recibo.descripcion && (
                          <div className="mb-4 p-3 bg-slate-50 rounded text-sm text-slate-700">
                            <strong>Notas:</strong> {recibo.descripcion}
                          </div>
                        )}

                        {/* Tabla de items */}
                        {recibo.items && recibo.items.length > 0 && (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200">
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">Serial</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">Producto</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">Tipo</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">Destino</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recibo.items.map((item, idx) => (
                                <tr key={item.id} className="border-b border-slate-100 text-xs">
                                  <td className="px-2 py-2 text-center text-slate-700">{item.datos_producto?.serial || 'N/A'}</td>
                                  <td className="px-2 py-2 text-center text-slate-700">{item.datos_producto?.modelo || item.datos_producto?.nombre_producto || 'N/A'}</td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="text-xs">
                                      {item.tipo_producto === 'notebook' ? '💻' :
                                       item.tipo_producto === 'celular' ? '📱' :
                                       '📦'}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className={`text-xs font-medium ${
                                      item.destino === 'stock' ? 'text-emerald-700' : 'text-amber-700'
                                    }`}>
                                      {item.destino === 'stock' ? '✅ Stock' : '🔍 Testeo'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: Carrito */}
      {vista === 'carrito' && reciboActual && (
        <div className="space-y-6">
          {/* Datos del recibo */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-semibold">Recibo: {reciboActual.proveedor}</h3>
                  <p className="text-slate-300 text-sm mt-1">{new Date(reciboActual.fecha).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-600">Proveedor:</span>
                  <span className="ml-2 font-medium text-slate-800">{reciboActual.proveedor}</span>
                </div>
                <div>
                  <span className="text-slate-600">Fecha:</span>
                  <span className="ml-2 font-medium text-slate-800">{new Date(reciboActual.fecha).toLocaleDateString('es-AR')}</span>
                </div>
                {reciboActual.descripcion && (
                  <div className="col-span-2">
                    <span className="text-slate-600">Notas:</span>
                    <span className="ml-2 text-slate-800">{reciboActual.descripcion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selector de destino + Agregar producto */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destino de productos
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="stock"
                      checked={destinoSeleccionado === 'stock'}
                      onChange={(e) => setDestinoSeleccionado(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-2 text-sm text-slate-700">Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="testeo"
                      checked={destinoSeleccionado === 'testeo'}
                      onChange={(e) => setDestinoSeleccionado(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-2 text-sm text-slate-700">Testeo</span>
                  </label>
                </div>
              </div>

              <button
                onClick={() => setMostrarAgregarProducto(!mostrarAgregarProducto)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors self-end"
              >
                <Plus size={18} />
                Agregar Producto
              </button>
            </div>

            {/* Modal/Formulario para agregar producto */}
            {mostrarAgregarProducto && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div className="bg-emerald-50 p-4 rounded">
                  <p className="text-sm text-emerald-800">
                    Los productos se agregarán al destino seleccionado: <strong>{destinoSeleccionado === 'stock' ? 'STOCK' : 'TESTEO'}</strong>
                  </p>
                </div>

                <CargaEquiposUnificada
                  onAddComputer={(data) => handleAgregarProducto('notebook', data)}
                  onAddCelular={(data) => handleAgregarProducto('celular', data)}
                  onAddOtro={(data) => handleAgregarProducto('otro', data)}
                  loading={loading}
                  modoCarrito={true}
                />

                <button
                  onClick={() => setMostrarAgregarProducto(false)}
                  className="w-full text-center text-slate-600 hover:text-slate-800 text-sm py-2 transition-colors"
                >
                  Cerrar formulario
                </button>
              </div>
            )}
          </div>

          {/* Tabla de items */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">Items en Carrito</h3>
                </div>
                <span className="text-slate-300 text-sm">
                  {itemsCarrito.length} items
                </span>
              </div>
            </div>

            {itemsCarrito.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No hay productos agregados</p>
                <p className="text-sm">Usa el botón "Agregar Producto" para comenzar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Serial</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Tipo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase">Destino</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {itemsCarrito.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-sm text-center text-slate-800">
                          {item.datos_producto?.serial || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-slate-800">
                          {item.datos_producto?.modelo || item.datos_producto?.nombre_producto || 'N/A'}
                          {item.datos_producto?.marca && <div className="text-xs text-slate-500">{item.datos_producto.marca}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-slate-800">
                          <span className="inline-block bg-slate-200 text-slate-800 px-2 py-1 rounded text-xs font-medium">
                            {item.tipo_producto === 'notebook' ? '💻 Notebook' :
                             item.tipo_producto === 'celular' ? '📱 Celular' :
                             '📦 Otro'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.destino === 'stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.destino === 'stock' ? '✅ Stock' : '🔍 Testeo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarItemDelCarrito(item.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Eliminar del carrito"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancelar}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <X size={18} />
              Cancelar Recibo
            </button>
            <button
              onClick={handleProcesarRecibo}
              disabled={itemsCarrito.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors"
            >
              <CheckCircle size={18} />
              Procesar Recibo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasNuevaSection;
