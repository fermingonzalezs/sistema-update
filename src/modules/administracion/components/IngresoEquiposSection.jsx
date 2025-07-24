import React, { useState } from 'react';
import { Plus, Package, Clock, CheckCircle } from 'lucide-react';
import CargaEquiposUnificada from './CargaEquiposUnificada';
import { useIngresoEquipos } from './useIngresoEquipos';
import { useInventario } from '../../ventas/hooks/useInventario';
import { useCelulares } from '../../ventas/hooks/useCelulares';
import { useOtros } from '../../ventas/hooks/useOtros';

const IngresoEquiposSection = () => {
  const [destinoSeleccionado, setDestinoSeleccionado] = useState('stock');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
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
      const ingresoData = {
        tipo_producto: tipoEquipo,
        descripcion_completa: descripcionCompleta,
        precio_compra: datos.precio_costo_usd || datos.precio_compra_usd || datos.precio_compra || 0,
        proveedor: datos.proveedor || '',
        garantias: datos.garantia || datos.garantias || '',
        destino: destinoSeleccionado,
        usuario_ingreso: 'admin', // TODO: obtener del contexto de auth
        notas: `${tipoEquipo.toUpperCase()} - Serial: ${datos.serial || 'N/A'}`
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
          alert('Equipo agregado al inventario exitosamente');
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

      {/* Formulario de ingreso */}
      {mostrarFormulario && (
        <div className="bg-white rounded border border-slate-200 p-6">
          {/* Selector de destino */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Destino del Equipo</h3>
            <div className="flex space-x-6">
              <button
                onClick={() => setDestinoSeleccionado('stock')}
                className={`flex-1 p-6 rounded border-2 transition-all duration-200 transform ${
                  destinoSeleccionado === 'stock'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg scale-105'
                    : 'border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50 hover:scale-105'
                }`}
              >
                <div className="flex items-center justify-center space-x-4">
                  <div className={`p-3 rounded ${
                    destinoSeleccionado === 'stock' 
                      ? 'bg-white text-emerald-600' 
                      : 'bg-slate-800 text-white'
                  }`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Agregar al Stock</div>
                    <div className="text-sm opacity-90 mt-1">
                      Disponible inmediatamente para venta
                    </div>
                    {destinoSeleccionado === 'stock' && (
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        <span className="text-xs font-medium">SELECCIONADO</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setDestinoSeleccionado('testeo')}
                className={`flex-1 p-6 rounded border-2 transition-all duration-200 transform ${
                  destinoSeleccionado === 'testeo'
                    ? 'border-slate-800 bg-slate-800 text-white shadow-lg scale-105'
                    : 'border-slate-200 bg-white hover:border-slate-800 hover:bg-slate-50 hover:scale-105'
                }`}
              >
                <div className="flex items-center justify-center space-x-4">
                  <div className={`p-3 rounded ${
                    destinoSeleccionado === 'testeo' 
                      ? 'bg-white text-slate-800' 
                      : 'bg-slate-800 text-white'
                  }`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Enviar a Testeo</div>
                    <div className="text-sm opacity-90 mt-1">
                      Requiere revisión técnica antes de venta
                    </div>
                    {destinoSeleccionado === 'testeo' && (
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        <span className="text-xs font-medium">SELECCIONADO</span>
                      </div>
                    )}
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
          <h3 className="text-lg font-semibold text-slate-800">Historial de Ingresos</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Precio Compra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {ingresosLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-slate-500">
                    Cargando historial...
                  </td>
                </tr>
              ) : ingresos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-slate-500">
                    No hay ingresos registrados
                  </td>
                </tr>
              ) : (
                ingresos.map((ingreso) => {
                  const DestinoIcon = getDestinoIcon(ingreso.destino);
                  return (
                    <tr key={ingreso.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatearFecha(ingreso.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                          {ingreso.tipo_producto}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                        {ingreso.descripcion_completa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatearPrecio(ingreso.precio_compra)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {ingreso.proveedor || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <DestinoIcon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-900 capitalize">{ingreso.destino}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(ingreso.estado)}`}>
                          {ingreso.estado === 'completado' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {ingreso.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {ingreso.estado === 'pendiente' && ingreso.destino === 'testeo' && (
                          <button
                            onClick={() => handleApprove(ingreso.id)}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Aprobar
                          </button>
                        )}
                        {ingreso.estado === 'aprobado' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Aprobado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IngresoEquiposSection;