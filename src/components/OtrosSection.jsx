import React from 'react';
import { Trash2, Box, ShoppingCart } from 'lucide-react';

const OtrosSection = ({ otros, loading, error, onDelete, onAddToCart }) => (
  <div className="p-8">
    <div className="flex items-center space-x-3 mb-4">
      <Box className="w-8 h-8 text-purple-600" />
      <h2 className="text-2xl font-bold text-gray-800">Inventario - Otros Productos</h2>
    </div>
    
    {loading && <p className="text-blue-600">Cargando productos desde Supabase...</p>}
    {error && <p className="text-red-600">Error: {error}</p>}
    {!loading && !error && (
      <div className="overflow-x-auto">
        <div className="mb-4">
          <p className="text-green-600 font-semibold">📦 {otros.length} productos encontrados</p>
        </div>
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Compra</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {otros.map((producto) => {
              const margen = (producto.precio_venta_usd || 0) - (producto.precio_compra_usd || 0);
              const porcentajeMargen = producto.precio_compra_usd > 0 
                ? ((margen / producto.precio_compra_usd) * 100).toFixed(1)
                : 0;
              
              return (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs">
                    <div className="truncate" title={producto.descripcion_producto}>
                      {producto.descripcion_producto}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      producto.cantidad > 10 ? 'bg-green-100 text-green-800' :
                      producto.cantidad > 5 ? 'bg-yellow-100 text-yellow-800' :
                      producto.cantidad > 0 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {producto.cantidad}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">${producto.precio_compra_usd}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">${producto.precio_venta_usd}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <span className={`font-medium ${margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${margen.toFixed(2)}
                      </span>
                      <div className="text-xs text-gray-500">
                        ({porcentajeMargen}%)
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      producto.cantidad > 10 ? 'bg-green-100 text-green-800' :
                      producto.cantidad > 5 ? 'bg-yellow-100 text-yellow-800' :
                      producto.cantidad > 0 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {producto.cantidad > 0 ? 'Disponible' : 'Sin Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2">
                      {producto.cantidad > 0 && onAddToCart && (
                        <button
                          onClick={() => onAddToCart(producto, 'otro')}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Agregar al carrito"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(producto.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default OtrosSection;