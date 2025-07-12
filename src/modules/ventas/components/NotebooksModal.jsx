import React from 'react';
import { X } from 'lucide-react';

const NotebooksModal = ({ producto, isOpen, onClose, cotizacionDolar }) => {
  if (!isOpen || !producto) return null;

  // Función para formatear precios en USD sin decimales con prefijo U$
  const formatPriceUSD = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `U$${Math.round(numPrice)}`;
  };

  // Función para formatear precios en ARS
  const formatPriceARS = (price, cotizacion) => {
    const numPrice = parseFloat(price) || 0;
    const arsPrice = Math.round(numPrice * cotizacion);
    return `$${arsPrice.toLocaleString('es-AR')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded overflow-hidden flex w-300">
        
        {/* Panel izquierdo */}
        <div className="w-1/4 bg-gray-900 text-white p-6 border-r-4 border-gray-900">
          <div className="space-y-8 justify-between">
            
            <div className='text-center bg-slate-800 p-3 rounded-xl'>
              <h3 className="text-sm font-semibold mb-1 bg-slate-700 rounded-full p-1 mb-2 text-gray-300 text-center">CONDICIÓN</h3>
              <div className="">
                <span className="font-semibold text-white">
                  {producto.condicion?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            <div className='text-center bg-slate-800 p-3 rounded-xl'>
              <h3 className="text-sm font-semibold mb-1 bg-slate-700 rounded-full p-1 mb-2 text-gray-300 text-center">UBICACIÓN</h3>
              <div className="">
                <span className="font-semibold text-white">
                  {(producto.sucursal || producto.ubicacion || producto.ubicacion_otro || 'N/A')?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className='text-center bg-slate-800 p-3 rounded-xl'>
              <h3 className="text-sm font-semibold mb-1 bg-slate-700 rounded-full p-1 mb-2 text-gray-300 text-center">CANTIDAD</h3>
              <div className="">
                <span className="font-semibold text-white">
                  {(producto.cantidad ?? '1') + ' unidades'}
                </span>
              </div>
            </div>

            {(producto.garantia_update || producto.garantia_oficial || producto.garantia) && (
              <div className='text-center bg-slate-800 p-3 rounded-xl'>
                <h3 className="text-sm font-semibold mb-1 bg-slate-700 rounded-full p-1 mb-2 text-gray-300 text-center">GARANTÍA</h3>
                <div className="">
                  <span className="font-semibold text-white">
                    {producto.garantia_update || producto.garantia_oficial || producto.garantia || 'Sin garantía'}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Panel derecho */}
        <div className="p-5 overflow-y-auto flex-1">
          
          <div className="text-center flex items-center justify-between mb-6">
            <h2 className="text-2xl text-center font-bold text-slate-900">{producto.modelo || producto.nombre_producto}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="text-lg text-center font-semibold text-white bg-slate-800 px-3 py-2 rounded">Información</h3>
              <div className="bg-slate-100 p-4 rounded-lg">
                <div><strong>Serial:</strong> {producto.serial || 'N/A'}</div>
                <div><strong>Fecha Ingreso:</strong> {producto.fecha_ingreso || 'N/A'}</div>
                <div><strong>Marca:</strong> {producto.marca || 'N/A'}</div>
                <div><strong>Tamaño:</strong> {producto.pantalla}"</div>
                <div><strong>Resolución:</strong> {producto.resolucion}</div>
                {producto.fallas && <div><strong>Fallas:</strong> {producto.fallas}</div>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg text-center font-semibold text-white bg-slate-800 px-3 py-2 rounded">Hardware</h3>
              <div className="bg-slate-100 p-4 rounded-lg">
                <div><strong>Procesador:</strong> {producto.procesador}</div>
                <div><strong>RAM:</strong> {producto.ram} {producto.tipo_ram}</div>
                <div><strong>SSD:</strong> {producto.ssd}</div>
                <div><strong>HDD:</strong> {producto.hdd}</div>
                <div><strong>GPU:</strong> {producto.gpu}</div>
                <div><strong>VRAM:</strong> {producto.vram}</div>
              </div>
            </div>

          </div>

          <div className="space-y-4 mt-9 mb-2 text-center mx-auto">
            <h3 className="text-lg font-semibold text-white bg-emerald-600 px-3 py-2 rounded-lg">PRECIOS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tarjeta Compra */}
              <div className="rounded-xl bg-slate-900 py-2">
                <div className="rounded-full bg-slate-800 text-center p-1 m-3">
                  <h4 className="text-md text-slate-200 font-bold">COMPRA</h4>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {formatPriceUSD(producto.precio_compra_usd)}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatPriceARS(producto.precio_compra_usd, cotizacionDolar)}
                  </p>
                </div>
              </div>

              {/* Tarjeta Venta */}
              <div className="rounded-xl bg-slate-900 py-2">
                <div className="rounded-full bg-slate-800 text-center p-1 m-3">
                  <h4 className="text-md text-slate-200 font-bold">VENTA</h4>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {formatPriceUSD(producto.precio_venta_usd)}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatPriceARS(producto.precio_venta_usd, cotizacionDolar)}
                  </p>
                </div>
              </div>

              {/* Tarjeta Ganancia */}
              <div className="rounded-xl bg-slate-900 py-2">
                <div className="rounded-full bg-slate-800 text-center p-1 m-3">
                  <h4 className="text-md text-slate-200 font-bold">GANANCIA</h4>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {formatPriceUSD(producto.precio_venta_usd - producto.precio_compra_usd)}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatPriceARS(producto.precio_venta_usd - producto.precio_compra_usd, cotizacionDolar)}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebooksModal;