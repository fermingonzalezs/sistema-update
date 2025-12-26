import React, { useState } from 'react';
import { Plus, Package, Clock, CheckCircle, Layers, Search } from 'lucide-react';
import CargaEquiposUnificada from './CargaEquiposUnificada';
import CargaMasivaEquipos from './CargaMasivaEquipos';
import { useIngresoEquipos } from './useIngresoEquipos';
import { useInventario } from '../../ventas/hooks/useInventario';
import { useCelulares } from '../../ventas/hooks/useCelulares';
import { useOtros } from '../../ventas/hooks/useOtros';
import { useAuthContext } from '../../../context/AuthContext';

const IngresoEquiposSection = () => {
  const [destinoSeleccionado, setDestinoSeleccionado] = useState('stock');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modalCargaMasiva, setModalCargaMasiva] = useState(false);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const { user } = useAuthContext();

  const {
    ingresos,
    loading: ingresosLoading,
    registrarIngreso,
    generarDescripcionCompleta
  } = useIngresoEquipos();

  const { addComputer, loading: computersLoading } = useInventario();
  const { addCelular, loading: celularesLoading } = useCelulares();
  const { addOtro, loading: otrosLoading } = useOtros();

  const { marcarComoAprobado } = useIngresoEquipos();

  const handleApprove = async (id) => {
    await marcarComoAprobado(id);
  };

  const loading = computersLoading || celularesLoading || otrosLoading;

  // Wrapper para manejar el ingreso con destino
  const handleAddEquipo = async (tipoEquipo, datos, funcionOriginal) => {
    try {
      // Preparar datos del ingreso
      const descripcionCompleta = generarDescripcionCompleta(tipoEquipo, datos);
      // Usar username, pero si es "admin" usar el nombre real o email
      let username = user?.user_metadata?.username;
      if (!username || username.toLowerCase() === 'admin') {
        username = user?.user_metadata?.nombre || user?.email || 'Sistema';
      }

      const ingresoData = {
        tipo_producto: tipoEquipo,
        descripcion_completa: descripcionCompleta,
        precio_compra: datos.precio_costo_usd || datos.precio_compra_usd || datos.precio_compra || 0,
        proveedor: datos.proveedor || '',
        proveedor_id: datos.proveedor_id || null,
        garantias: datos.garantia || datos.garantias || '',
        destino: destinoSeleccionado,
        usuario_ingreso: username,
        notas: `${tipoEquipo.toUpperCase()} - Serial: ${datos.serial || 'N/A'} | Precio Venta: ${datos.precio_venta_usd || 0} | Modelo: ${datos.modelo || datos.nombre_producto || 'N/A'} | Categoria: ${datos.categoria || ''}`
      };

      if (destinoSeleccionado === 'stock') {
        // Enviar directo al stock
        const resultado = await funcionOriginal(datos);
        if (resultado) {
          // Registrar en historial como completado
          await registrarIngreso({
            ...ingresoData,
            estado: 'completado',
            referencia_inventario_id: resultado.id || null
          });
          setMostrarFormulario(false);
        }
      } else {
        // Enviar a testeo - solo registrar en historial
        const resultado = await registrarIngreso({
          ...ingresoData,
          estado: 'pendiente'
        });

        if (resultado.success) {
          alert('Equipo enviado a testeo. Aparecerá en la sección de Testeo de Equipos en Soporte.');
          setMostrarFormulario(false);
        } else {
          alert('Error al registrar el equipo: ' + resultado.error);
        }
      }
    } catch (error) {
      console.error('Error en handleAddEquipo:', error);
      alert('Error al procesar el equipo: ' + error.message);
    }
  };

  const onAddComputer = (datos) => handleAddEquipo('notebook', datos, addComputer);
  const onAddCelular = (datos) => handleAddEquipo('celular', datos, addCelular);
  const onAddOtro = (datos) => handleAddEquipo('otro', datos, addOtro);

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio) => {
    if (!precio) return 'N/A';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completado': return 'text-emerald-600 bg-emerald-100';
      case 'en_testeo': return 'text-yellow-600 bg-yellow-100';
      case 'pendiente': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getDestinoIcon = (destino) => {
    return destino === 'stock' ? Package : Clock;
  };

  const normalizarCategoria = (categoria) => {
    if (!categoria) return '';

    // Diccionario de normalización para categorías de "otros"
    const normalizaciones = {
      'CABLES_CARGADORES': 'Cables y Cargadores',
      'CABLES_cARGADORES': 'Cables y Cargadores',
      'FUNDAS_TEMPLADOS': 'Fundas y Templados',
      'MOUSE_TECLADOS': 'Mouse y Teclados',
      'BAGS_CASES': 'Mochilas y Fundas',
      'ACCESORIOS': 'Accesorios',
      'ALMACENAMIENTO': 'Almacenamiento',
      'AUDIO': 'Audio',
      'CAMARAS': 'Cámaras',
      'COMPONENTES': 'Componentes',
      'CONSOLAS': 'Consolas',
      'DESKTOP': 'Desktop',
      'GAMING': 'Gaming',
      'MEMORIA': 'Memoria',
      'MONITORES': 'Monitores',
      'REPUESTOS': 'Repuestos',
      'STREAMING': 'Streaming'
    };

    const categoriaUpper = categoria.toUpperCase();
    return normalizaciones[categoriaUpper] || categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase();
  };

  const getCategoriaColor = (tipoProducto) => {
    switch (tipoProducto) {
      case 'notebook':
        return 'bg-blue-100 text-blue-800';
      case 'celular':
        return 'bg-purple-100 text-purple-800';
      case 'otro':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Traducir emails a nombres de usuario
  const traducirUsuario = (usuario) => {
    if (!usuario) return 'N/A';

    const traducciones = {
      'updatenotebooksadmi@gmail.com': 'Álvaro',
      'yaelmarich@gmail.com': 'Yael',
      'soporte.updatenotebooks@gmail.com': 'Fermin'
    };

    // Buscar traducción exacta o parcial (por si viene con mayúsculas diferentes)
    const usuarioLower = usuario.toLowerCase();
    for (const [email, nombre] of Object.entries(traducciones)) {
      if (usuarioLower === email.toLowerCase() || usuarioLower.includes(email.toLowerCase())) {
        return nombre;
      }
    }

    return usuario;
  };

  // Filtrar ingresos según búsqueda
  const ingresosFiltrados = ingresos.filter(ingreso => {
    if (!busquedaHistorial.trim()) return true;

    const busqueda = busquedaHistorial.toLowerCase().trim();

    // Buscar en modelo (descripcion_completa)
    const modelo = (ingreso.descripcion_completa || '').toLowerCase();

    // Buscar en serial
    const serial = (ingreso.serial || '').toLowerCase();

    // Buscar en proveedor
    const proveedor = (ingreso.proveedor || '').toLowerCase();

    return modelo.includes(busqueda) || serial.includes(busqueda) || proveedor.includes(busqueda);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Plus className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Ingreso de Equipos</h2>
                <p className="text-slate-300 mt-1">Cargar nuevos productos al sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalCargaMasiva(true)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors"
                disabled={loading}
              >
                <Layers className="w-4 h-4" />
                <span>Carga Masiva</span>
              </button>
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                <span>{mostrarFormulario ? 'Ocultar' : 'Nuevo Ingreso'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de ingreso */}
      {mostrarFormulario && (
        <div className="bg-white rounded border border-slate-200 p-6">
          {/* Selector de destino */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Destino del Equipo</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => setDestinoSeleccionado('stock')}
                className={`flex-1 p-4 rounded border transition-all ${destinoSeleccionado === 'stock'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50'
                  }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <Package className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-base">Agregar al Stock</div>
                    <div className="text-sm opacity-80">Disponible para venta</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setDestinoSeleccionado('testeo')}
                className={`flex-1 p-4 rounded border transition-all ${destinoSeleccionado === 'testeo'
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-800 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <Clock className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-base">Enviar a Testeo</div>
                    <div className="text-sm opacity-80">Revisión técnica</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Formulario de carga */}
          <CargaEquiposUnificada
            onAddComputer={onAddComputer}
            onAddCelular={onAddCelular}
            onAddOtro={onAddOtro}
            loading={loading}
          />
        </div>
      )}

      {/* Historial de ingresos */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Historial de Ingresos</h3>
            {busquedaHistorial && (
              <span className="text-sm text-slate-600">
                Mostrando {ingresosFiltrados.length} de {ingresos.length} ingresos
              </span>
            )}
          </div>
        </div>

        {/* Filtro de búsqueda */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar en Historial
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                  placeholder="Buscar por modelo, serial o proveedor..."
                  className="w-full border border-slate-200 rounded pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setBusquedaHistorial('')}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm w-full md:w-auto"
              >
                Limpiar Búsqueda
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Serial
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Precio Compra
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ingresosLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-3 text-center text-slate-500">
                    Cargando historial...
                  </td>
                </tr>
              ) : ingresosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-3 text-center text-slate-500">
                    {ingresos.length === 0 ? 'No hay ingresos registrados' : 'No se encontraron ingresos con esos criterios de búsqueda'}
                  </td>
                </tr>
              ) : (
                ingresosFiltrados.map((ingreso, index) => {
                  const categoriaTexto = normalizarCategoria(ingreso.subcategoria || ingreso.tipo_producto);
                  const categoriaColor = getCategoriaColor(ingreso.tipo_producto);

                  return (
                    <tr key={ingreso.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-center text-sm text-slate-800 whitespace-nowrap">
                        {formatearFecha(ingreso.fecha)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-800">
                        {ingreso.serial && ingreso.serial.trim() !== '' ? ingreso.serial : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-800">
                        {ingreso.descripcion_completa}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${categoriaColor}`}>
                          {categoriaTexto}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-800 whitespace-nowrap">
                        {formatearPrecio(ingreso.precio_compra)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">
                        {ingreso.proveedor || <span className="italic text-slate-400">Sin especificar</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-800">
                        {traducirUsuario(ingreso.usuario_ingreso)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Carga Masiva */}
      <CargaMasivaEquipos
        isOpen={modalCargaMasiva}
        onClose={() => setModalCargaMasiva(false)}
        onSuccess={() => {
          setModalCargaMasiva(false);
          // Refrescar datos si es necesario
        }}
      />
    </div>
  );
};

export default IngresoEquiposSection;