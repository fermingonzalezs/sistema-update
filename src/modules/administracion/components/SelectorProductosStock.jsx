import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Laptop, Smartphone, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const SelectorProductosStock = ({ onAgregarProducto }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar productos de las tres tablas
  const cargarProductos = async () => {
    try {
      setLoading(true);

      // Cargar notebooks
      const { data: notebooks, error: notebooksError } = await supabase
        .from('inventario')
        .select('*')
        .order('created_at', { ascending: false });

      if (notebooksError) throw notebooksError;

      // Cargar celulares
      const { data: celulares, error: celularesError } = await supabase
        .from('celulares')
        .select('*')
        .order('created_at', { ascending: false });

      if (celularesError) throw celularesError;

      // Cargar otros
      const { data: otros, error: otrosError } = await supabase
        .from('otros')
        .select('*')
        .order('created_at', { ascending: false });

      if (otrosError) throw otrosError;

      // Agregar tipo a cada producto
      const notebooksConTipo = (notebooks || []).map(p => ({ ...p, _tipo: 'notebook' }));
      const celularesConTipo = (celulares || []).map(p => ({ ...p, _tipo: 'celular' }));
      const otrosConTipo = (otros || []).map(p => ({ ...p, _tipo: 'otro' }));

      // Combinar todos
      const todosProductos = [...notebooksConTipo, ...celularesConTipo, ...otrosConTipo];
      setProductos(todosProductos);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (modalOpen) {
      cargarProductos();
    }
  }, [modalOpen]);

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(producto => {
    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      const marca = (producto.marca || '').toLowerCase();
      const modelo = (producto.modelo || '').toLowerCase();
      const nombre = (producto.nombre_producto || '').toLowerCase();
      const serial = (producto.serial || '').toLowerCase();

      return (
        marca.includes(termino) ||
        modelo.includes(termino) ||
        nombre.includes(termino) ||
        serial.includes(termino)
      );
    }

    return true;
  });

  // Formatear categoría con mayúscula inicial
  const formatearCategoria = (categoria) => {
    if (!categoria) return '-';
    // Capitalizar primera letra de cada palabra
    return categoria
      .split('_')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  };

  // Generar descripción resumida del producto
  const generarDescripcion = (producto) => {
    let descripcion = '';

    if (producto._tipo === 'celular') {
      // Celulares: solo modelo
      descripcion = producto.modelo || 'Sin modelo';
    } else if (producto._tipo === 'notebook') {
      // Notebooks: solo modelo (sin marca)
      descripcion = producto.modelo || 'Sin modelo';
    } else {
      // Otros productos: nombre del producto
      descripcion = producto.nombre_producto || 'Producto sin nombre';
    }

    // Convertir todo a mayúsculas
    return descripcion.toUpperCase();
  };

  // Obtener icono según tipo
  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'notebook':
        return <Laptop size={16} className="text-blue-600" />;
      case 'celular':
        return <Smartphone size={16} className="text-purple-600" />;
      case 'otro':
        return <Package size={16} className="text-orange-600" />;
      default:
        return null;
    }
  };

  // Obtener label de tipo
  const getLabelTipo = (tipo) => {
    switch (tipo) {
      case 'notebook':
        return 'Notebook';
      case 'celular':
        return 'Celular';
      case 'otro':
        return 'Otro';
      default:
        return '';
    }
  };

  // Agregar producto al formulario
  const handleAgregarProducto = (producto) => {
    const item = {
      descripcion: generarDescripcion(producto),
      serial: producto.serial || '',
      cantidad: 1,
      precio_unitario: producto.precio_venta_usd || 0,
      esDelStock: true,
      productoOriginal: producto
    };

    onAgregarProducto(item);
    setModalOpen(false);
    setBusqueda('');
  };

  return (
    <>
      {/* Botón para abrir el selector */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center gap-2 text-sm transition-colors"
      >
        <Plus size={16} />
        Agregar del Stock
      </button>

      {/* Modal de selector */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
            {/* Header del modal */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">
                Seleccionar Producto del Stock
              </h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setBusqueda('');
                }}
                className="p-2 hover:bg-slate-100 rounded transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Búsqueda */}
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por marca, modelo, nombre o serial..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="text-center py-10 text-slate-500">
                  Cargando productos...
                </div>
              )}

              {!loading && productosFiltrados.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  {busqueda ? 'No se encontraron productos' : 'No hay productos en stock'}
                </div>
              )}

              {!loading && productosFiltrados.length > 0 && (
                <div className="grid grid-cols-1 gap-1">
                  {productosFiltrados.slice(0, 100).map((producto) => (
                    <div
                      key={`${producto._tipo}-${producto.id}`}
                      className="px-3 py-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => handleAgregarProducto(producto)}
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        {/* Tipo */}
                        <div className="flex items-center justify-center gap-2 w-24 flex-shrink-0">
                          {getIconoTipo(producto._tipo)}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            producto._tipo === 'notebook' ? 'bg-blue-100 text-blue-700' :
                            producto._tipo === 'celular' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {getLabelTipo(producto._tipo)}
                          </span>
                        </div>

                        {/* Producto */}
                        <div className="flex-1 font-medium text-slate-800 truncate">
                          {generarDescripcion(producto)}
                        </div>

                        {/* Serial */}
                        <div className="w-32 flex-shrink-0 text-center">
                          {producto.serial ? (
                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                              {producto.serial}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Sin serial</span>
                          )}
                        </div>

                        {/* Categoría */}
                        <div className="w-32 flex-shrink-0 text-center text-slate-600 text-xs truncate">
                          {formatearCategoria(producto.categoria)}
                        </div>

                        {/* Precio */}
                        <div className="w-24 flex-shrink-0 text-center text-emerald-600">
                          U$ {producto.precio_venta_usd || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && productosFiltrados.length > 100 && (
                <div className="text-center mt-4 text-sm text-slate-500">
                  Mostrando 100 de {productosFiltrados.length} resultados. Refina tu búsqueda para ver más.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setBusqueda('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SelectorProductosStock;
