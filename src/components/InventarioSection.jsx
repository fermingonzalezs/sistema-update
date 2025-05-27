import React from 'react';
import { Trash2, Edit } from 'lucide-react';

const InventarioSection = ({ computers, loading, error, onDelete }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Inventario de Computadoras</h2>
    {loading && <p className="text-blue-600">Cargando desde Supabase...</p>}
    {error && <p className="text-red-600">Error: {error}</p>}
    {!loading && !error && (
      <div className="overflow-x-auto">
        <div className="mb-4">
          <p className="text-green-600 font-semibold">✅ {computers.length} computadoras encontradas</p>
        </div>
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condición</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Compra</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procesador</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RAM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SSD</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pantalla</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sistema</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batería</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garantía</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {computers.map((comp) => (
              <tr key={comp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">{comp.serial}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.modelo}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    comp.condicion === 'nuevo' ? 'bg-green-100 text-green-800' :
                    comp.condicion === 'usado' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {comp.condicion}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.sucursal}</td>
                <td className="px-4 py-3 text-sm text-gray-900">${comp.precio_compra_usd}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-semibold">${comp.precio_venta_usd}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.procesador}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.memoria_ram}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.ssd}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.pantalla}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.sistema_operativo}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.estado_estetico}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.porcentaje_de_bateria}%</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.color}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{comp.garantia}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => onDelete(comp.id)}
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

export default InventarioSection;