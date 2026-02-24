import React, { useState } from 'react';
import { Weight, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { usePesajes } from '../hooks/usePesajes';

const TablaPesajesSection = () => {
  const { pesajes, loading, error, crearPesaje, actualizarPesaje, eliminarPesaje } = usePesajes();

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPeso, setNuevoPeso] = useState('');
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPeso, setEditPeso] = useState('');
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoPeso) return;
    setGuardandoNuevo(true);
    try {
      await crearPesaje({ nombre: nuevoNombre.trim(), peso_kg: nuevoPeso });
      setNuevoNombre('');
      setNuevoPeso('');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGuardandoNuevo(false);
    }
  };

  const iniciarEdicion = (pesaje) => {
    setEditandoId(pesaje.id);
    setEditNombre(pesaje.nombre);
    setEditPeso(String(pesaje.peso_kg));
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditNombre('');
    setEditPeso('');
  };

  const handleActualizar = async (id) => {
    if (!editNombre.trim() || !editPeso) return;
    setGuardandoEdit(true);
    try {
      await actualizarPesaje(id, { nombre: editNombre.trim(), peso_kg: editPeso });
      cancelarEdicion();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGuardandoEdit(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await eliminarPesaje(id);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex items-center space-x-3">
          <Weight size={28} />
          <div>
            <h2 className="text-2xl font-semibold">Tabla de Pesajes</h2>
            <p className="text-gray-300 mt-1">Pesos unitarios de productos para importaciones</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Formulario alta */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="bg-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus size={16} />
              Agregar Producto
            </h3>
          </div>
          <form onSubmit={handleCrear} className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: iPhone 15 Pro Max"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={nuevoPeso}
                  onChange={(e) => setNuevoPeso(e.target.value)}
                  placeholder="0.000"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
              </div>
              <button
                type="submit"
                disabled={!nuevoNombre.trim() || !nuevoPeso || guardandoNuevo}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                {guardandoNuevo ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-slate-200 rounded">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Cargando...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 text-sm">{error}</div>
          ) : pesajes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No hay productos registrados. Agrega el primero arriba.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Unitario (kg)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pesajes.map((p, index) => (
                  <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {editandoId === p.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                            autoFocus
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={editPeso}
                            onChange={(e) => setEditPeso(e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 text-center"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleActualizar(p.id)}
                              disabled={guardandoEdit}
                              className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              className="p-1.5 bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-slate-800">{p.nombre}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 text-center font-medium">
                          {parseFloat(p.peso_kg).toFixed(3)} kg
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => iniciarEdicion(p)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleEliminar(p.id, p.nombre)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800 text-white">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold">{pesajes.length} productos registrados</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TablaPesajesSection;
