import React, { useState, useMemo } from 'react';
import { Globe, Home, Users, Plus, X, Phone, Mail, MapPin, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import { useProveedores } from '../hooks/useProveedores';

const ProveedoresSection = () => {
  // Hook para proveedores
  const {
    proveedores,
    loading,
    error,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor
  } = useProveedores();

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros
  const [filtroPais, setFiltroPais] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Formulario
  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    email: '',
    telefono: '',
    pais: '',
    direccion: '',
    barrio: '',
    notas: '',
    cliente_id: null
  });

  // Obtener países únicos
  const paises = useMemo(() => {
    return [...new Set(proveedores.map(p => p.pais))].sort();
  }, [proveedores]);

  // Filtrar proveedores
  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter(proveedor => {
      if (filtroPais && proveedor.pais !== filtroPais) return false;
      if (filtroBusqueda.trim()) {
        const buscar = filtroBusqueda.toLowerCase();
        const coincide = [proveedor.nombre, proveedor.email, proveedor.telefono, proveedor.barrio]
          .some(campo => campo && campo.toLowerCase().includes(buscar));
        if (!coincide) return false;
      }
      return true;
    });
  }, [proveedores, filtroPais, filtroBusqueda]);

  // Stats
  const stats = useMemo(() => {
    return {
      totalProveedores: proveedores.length,
      proveedoresArgentina: proveedores.filter(p => p.pais === 'Argentina').length,
      proveedoresInternacionales: proveedores.filter(p => p.pais && p.pais !== 'Argentina').length,
      conCuentaCorriente: proveedores.filter(p => p.cliente_id).length
    };
  }, [proveedores]);

  const limpiarFiltros = () => {
    setFiltroPais('');
    setFiltroBusqueda('');
  };

  const resetearFormulario = () => {
    setFormProveedor({
      nombre: '',
      email: '',
      telefono: '',
      pais: '',
      direccion: '',
      barrio: '',
      notas: '',
      cliente_id: null
    });
    setIsEditing(false);
    setClienteSeleccionado(null);
  };

  const abrirNuevoProveedor = () => {
    resetearFormulario();
    setShowNewModal(true);
  };

  const abrirEditarProveedor = (proveedor) => {
    setFormProveedor(proveedor);
    setIsEditing(true);
    setShowNewModal(true);
  };

  const guardarProveedor = async () => {
    if (!formProveedor.nombre.trim()) {
      alert('El nombre del proveedor es requerido');
      return;
    }

    setIsSubmitting(true);

    let resultado;
    if (isEditing && selectedProveedor) {
      // Editar proveedor existente - solo actualizar campos con valores
      const datosActualizados = {};
      Object.keys(formProveedor).forEach(key => {
        datosActualizados[key] = formProveedor[key];
      });
      resultado = await actualizarProveedor(selectedProveedor.id, datosActualizados);
      if (resultado.success) {
        setSelectedProveedor(null);
      }
    } else {
      // Crear nuevo proveedor
      resultado = await crearProveedor(formProveedor);
    }

    setIsSubmitting(false);

    if (resultado.success) {
      setShowNewModal(false);
      resetearFormulario();
    } else {
      alert('Error: ' + resultado.error);
    }
  };

  const handleEliminarProveedor = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      setIsSubmitting(true);
      const resultado = await eliminarProveedor(id);
      setIsSubmitting(false);
      if (!resultado.success) {
        alert('Error: ' + resultado.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-semibold">Proveedores</h2>
              </div>
            </div>
            <button
              onClick={abrirNuevoProveedor}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nuevo Proveedor
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjeta
          icon={Users}
          titulo="Total Proveedores"
          valor={stats.totalProveedores}
        />
        <Tarjeta
          icon={MapPin}
          titulo="Argentina"
          valor={stats.proveedoresArgentina}
        />
        <Tarjeta
          icon={Globe}
          titulo="Internacionales"
          valor={stats.proveedoresInternacionales}
        />
        <Tarjeta
          icon={Home}
          titulo="Con C. Corriente"
          valor={stats.conCuentaCorriente}
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded border border-slate-200">
        <div className="bg-gray-50 p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <select
                value={filtroPais}
                onChange={(e) => setFiltroPais(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              >
                <option value="">Todos</option>
                {paises.map(pais => (
                  <option key={pais} value={pais}>{pais}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                placeholder="Nombre, email, teléfono, barrio..."
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm font-medium transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Mostrando {proveedoresFiltrados.length} de {proveedores.length} proveedores
          </p>
        </div>

        {/* MENSAJE DE CARGA */}
        {loading && (
          <div className="bg-white rounded-b border border-slate-200 border-t-0 p-8 text-center text-slate-600">
            Cargando proveedores desde la base de datos...
          </div>
        )}

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="bg-red-50 rounded-b border border-red-200 border-t-0 p-4 text-red-800">
            Error cargando proveedores: {error}
          </div>
        )}

        {/* TABLA DE PROVEEDORES */}
        {!loading && !error && (
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">País</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Barrio</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cliente C.C.</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <AlertCircle size={32} className="text-slate-400" />
                      <p>{proveedores.length === 0 ? 'No hay proveedores registrados' : 'No hay proveedores que coincidan con los filtros'}</p>
                      {proveedores.length === 0 && (
                        <p className="text-sm text-slate-400">Haz clic en "Nuevo Proveedor" para agregar uno</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((proveedor, idx) => (
                <tr key={proveedor.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-center text-slate-800">
                    {proveedor.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600">
                    {proveedor.pais}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600">
                    {proveedor.telefono}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600">
                    {proveedor.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600">
                    {proveedor.barrio}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600">
                    {proveedor.cliente_id ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm font-bold">
                        #{proveedor.cliente_id}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedProveedor(proveedor);
                          setFormProveedor(proveedor);
                          setIsEditing(false);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                        title="Ver proveedor"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProveedor(proveedor);
                          abrirEditarProveedor(proveedor);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                        title="Editar proveedor"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleEliminarProveedor(proveedor.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Eliminar proveedor"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: NUEVO/EDITAR PROVEEDOR */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9998 }}>
          <div className="bg-white rounded border border-slate-200 max-w-3xl w-full max-h-[95vh] flex flex-col">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-300 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4" style={{ zIndex: 9999 }}>
              {/* Datos Generales */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">DATOS GENERALES</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formProveedor.nombre}
                        onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                        placeholder="Nombre del proveedor"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                      <input
                        type="text"
                        value={formProveedor.pais}
                        onChange={(e) => setFormProveedor({ ...formProveedor, pais: e.target.value })}
                        placeholder="País"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={formProveedor.telefono}
                        onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                        placeholder="+54 123 456-7890"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formProveedor.email}
                        onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
                        placeholder="contacto@ejemplo.com"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                      <input
                        type="text"
                        value={formProveedor.direccion}
                        onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                        placeholder="Calle y número"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Barrio</label>
                      <input
                        type="text"
                        value={formProveedor.barrio}
                        onChange={(e) => setFormProveedor({ ...formProveedor, barrio: e.target.value })}
                        placeholder="Barrio/Localidad"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                      <textarea
                        value={formProveedor.notas}
                        onChange={(e) => setFormProveedor({ ...formProveedor, notas: e.target.value })}
                        placeholder="Notas adicionales del proveedor..."
                        rows="2"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vinculación a Cliente para Cuenta Corriente */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                  <h4 className="font-semibold text-slate-800 uppercase">VINCULACIÓN A CLIENTE</h4>
                </div>
                <div className="p-4">
                  <ClienteSelector
                    onClienteSelect={(cliente) => {
                      setClienteSeleccionado(cliente);
                      setFormProveedor({ ...formProveedor, cliente_id: cliente?.id || null });
                    }}
                    clienteSeleccionado={clienteSeleccionado}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarProveedor}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                >
                  {isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLES PROVEEDOR */}
      {selectedProveedor && !isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-semibold">Detalles del Proveedor</h3>
              <button onClick={() => setSelectedProveedor(null)} className="text-slate-300 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos Generales */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 uppercase">Información General</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Nombre</p>
                    <p className="font-semibold text-slate-800">{selectedProveedor.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">País</p>
                    <p className="font-semibold text-slate-800">{selectedProveedor.pais}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Teléfono</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                      <Phone size={16} />
                      {selectedProveedor.telefono}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Email</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                      <Mail size={16} />
                      {selectedProveedor.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Dirección</p>
                    <p className="font-semibold text-slate-800">{selectedProveedor.direccion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium">Barrio</p>
                    <p className="font-semibold text-slate-800">{selectedProveedor.barrio}</p>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedProveedor.notas && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-800 mb-3 uppercase">Notas</h4>
                  <p className="font-semibold text-slate-800 bg-slate-50 rounded p-3 text-sm">
                    {selectedProveedor.notas}
                  </p>
                </div>
              )}

              {/* Cliente Vinculado */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-800 mb-3 uppercase">Cliente Vinculado</h4>
                {selectedProveedor.cliente_id ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</span>
                    <div>
                      <p className="text-sm font-medium text-emerald-900">{selectedProveedor.cliente_id}</p>
                      <p className="text-xs text-emerald-700">Vinculado a Cuenta Corriente</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded p-3 flex items-center gap-2">
                    <span className="text-slate-400 text-lg font-bold">+</span>
                    <p className="text-sm text-slate-600">Sin vinculación a cliente</p>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setSelectedProveedor(null)}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => abrirEditarProveedor(selectedProveedor)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit size={16} />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresSection;
