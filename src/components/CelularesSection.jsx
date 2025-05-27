import React from 'react';
import { Trash2, Smartphone } from 'lucide-react';

const CelularesSection = ({ celulares, loading, error, onDelete }) => (
  <div className="p-8">
    <div className="flex items-center space-x-3 mb-4">
      <Smartphone className="w-8 h-8 text-blue-600" />
      <h2 className="text-2xl font-bold text-gray-800">Inventario de Celulares</h2>
    </div>
    
    {loading && <p className="text-blue-600">Cargando celulares desde Supabase...</p>}
    {error && <p className="text-red-600">Error: {error}</p>}
    {!loading && !error && (
      <div className="overflow-x-auto">
        <div className="mb-4">
          <p className="text-green-600 font-semibold">📱 {celulares.length} celulares encontrados</p>
        </div>
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condición</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Compra</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batería</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ciclos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garantía</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fallas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {celulares.map((celular) => (
              <tr key={celular.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">{celular.serial}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{celular.modelo}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{celular.capacidad}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    celular.condicion === 'nuevo' ? 'bg-green-100 text-green-800' :
                    celular.condicion === 'usado' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {celular.condicion}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{celular.sucursal}</td>
                <td className="px-4 py-3 text-sm text-gray-900">${celular.precio_compra_usd}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-semibold">${celular.precio_venta_usd}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{celular.color}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    celular.estado === 'Nuevo' || celular.estado === 'Excelente' ? 'bg-green-100 text-green-800' :
                    celular.estado === 'Muy Bueno' || celular.estado === 'Bueno' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {celular.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{celular.bateria}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <span className={`${
                    celular.ciclos < 200 ? 'text-green-600' :
                    celular.ciclos < 500 ? 'text-yellow-600' :
                    'text-red-600'
                  } font-medium`}>
                    {celular.ciclos}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{celular.garantia}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <span className={`${
                    celular.fallas === 'Ninguna' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {celular.fallas}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => onDelete(celular.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default CelularesSection;