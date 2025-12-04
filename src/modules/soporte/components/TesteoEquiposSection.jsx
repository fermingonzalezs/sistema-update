import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Plus, Eye, Trash2, CheckCircle, XCircle, AlertCircle, Star, Save, Edit2, Package, Clock, Clipboard } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ModalEditarEquipo from './ModalEditarEquipo';
import ModalChecklistEquipo from './ModalChecklistEquipo';

const tiposEquipo = {
  notebook: { label: 'Notebook', icon: Monitor },
  celular: { label: 'Celular', icon: Smartphone },
};

const estadosEsteticos = [
  { value: 'excelente', label: 'Excelente', color: 'bg-emerald-600' },
  { value: 'muy_bueno', label: 'Muy Bueno', color: 'bg-emerald-500' },
  { value: 'bueno', label: 'Bueno', color: 'bg-slate-500' },
  { value: 'regular', label: 'Regular', color: 'bg-slate-600' },
  { value: 'malo', label: 'Malo', color: 'bg-slate-800' },
];

// Los checklists ahora están centralizados en ModalChecklistNotebook.jsx

function TesteoEquiposSection() {
  const [equipos, setEquipos] = useState([]);
  const [ingresosPendientes, setIngresosPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [equipoActual, setEquipoActual] = useState(null);
  const [modoModal, setModoModal] = useState('editar'); // 'editar' o 'cargar_stock'

  // Cargar equipos de testeo y ingresos pendientes
  useEffect(() => {
    Promise.all([cargarEquipos(), cargarIngresosPendientes()]);
  }, []);

  const cargarEquipos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testeo_equipos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipos(data || []);
    } catch (err) {
      console.error('Error cargando equipos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarIngresosPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from('ingresos_equipos')
        .select('*')
        .in('destino', ['testeo'])
        .in('destino', ['testeo'])
        .in('estado', ['pendiente']) // Solo pendientes, los 'en_testeo' ya están en la otra lista
        .in('tipo_producto', ['notebook', 'celular', 'otros']) // Todos los tipos
        .order('fecha', { ascending: false });

      if (error) throw error;
      setIngresosPendientes(data || []);
    } catch (err) {
      console.error('Error cargando ingresos pendientes:', err);
    }
  };

  // Función para procesar ingreso desde administración a testeo
  const procesarIngresoATesteo = async (ingreso) => {
    try {
      // Extraer precio de venta de las notas si existe
      const precioVentaMatch = ingreso.notas?.match(/Precio Venta: \$?([\d.]+)/);
      const precioVenta = precioVentaMatch ? parseFloat(precioVentaMatch[1]) : 0;

      const datosEquipo = {
        tipo: ingreso.tipo_producto,
        serial: (() => {
          const serialMatch = ingreso.notas?.match(/Serial:\s*([^\s|]+)/);
          return serialMatch ? serialMatch[1].trim() : 'Por definir';
        })(),
        modelo: (() => {
          const modeloMatch = ingreso.notas?.match(/Modelo:\s*([^|]+)/);
          return modeloMatch ? modeloMatch[1].trim() : 'Por definir';
        })(),
        categoria: (() => {
          const categoriaMatch = ingreso.notas?.match(/Categoria:\s*([^|]+)/);
          return categoriaMatch ? categoriaMatch[1].trim() : null;
        })(),
        proveedor: ingreso.proveedor || '',
        observaciones: `Equipo ingresado desde administración. ${ingreso.notas || ''}`,
        estado_testeo: 'pendiente',
        checklist_data: {
          _precios: {
            compra: ingreso.precio_compra || 0,
            venta: precioVenta
          }
        },
        checklist_completado: false,
        estado_estetico: 'bueno',
        observaciones_testeo: ingreso.descripcion_completa
      };

      // Insertar en testeo_equipos
      const { data, error } = await supabase
        .from('testeo_equipos')
        .insert([datosEquipo])
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado del ingreso
      await supabase
        .from('ingresos_equipos')
        .update({ estado: 'en_testeo' })
        .eq('id', ingreso.id);

      // Recargar listas
      await Promise.all([cargarEquipos(), cargarIngresosPendientes()]);

      alert('Equipo movido a testeo correctamente');
    } catch (err) {
      console.error('Error procesando ingreso:', err);
      alert('Error al procesar el ingreso: ' + err.message);
    }
  };

  // Función para descartar un ingreso (no procesarlo a testeo)
  const descartarIngreso = async (ingreso) => {
    if (!window.confirm(`¿Descartar este ingreso de ${ingreso.tipo_producto}?\n\n${ingreso.descripcion_completa}\n\nNo se podrá recuperar.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ingresos_equipos')
        .delete()
        .eq('id', ingreso.id);

      if (error) throw error;

      // Recargar ingresos pendientes
      await cargarIngresosPendientes();
      alert('✅ Ingreso descartado correctamente');
    } catch (err) {
      console.error('Error descartando ingreso:', err);
      alert('❌ Error al descartar: ' + err.message);
    }
  };

  const eliminarEquipoTesteado = async (equipo) => {
    if (!window.confirm(`¿Estás seguro de eliminar este equipo testeado?\n\n${equipo.marca} ${equipo.modelo}\nSerial: ${equipo.serial}\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('testeo_equipos')
        .delete()
        .eq('id', equipo.id);

      if (error) throw error;

      await cargarEquipos();
      alert('✅ Equipo eliminado correctamente');
    } catch (err) {
      console.error('Error eliminando equipo:', err);
      alert('❌ Error al eliminar: ' + err.message);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para calcular tiempo transcurrido
  const calcularTiempoTranscurrido = (fecha) => {
    const ahora = new Date();
    const fechaInicio = new Date(fecha);
    const diferencia = ahora - fechaInicio;

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) {
      return `${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `${horas} hora${horas > 1 ? 's' : ''}`;
    } else {
      return `${minutos} minuto${minutos > 1 ? 's' : ''}`;
    }
  };

  const formatCategoria = (categoria) => {
    if (!categoria) return 'Sin categoría';
    const map = {
      'windows': 'Windows',
      'macbook': 'MacBook',
      'iphone': 'iPhone',
      'android': 'Android',
      'ipad': 'iPad',
      'tablet': 'Tablet',
      'monitor': 'Monitor',
      'cargador': 'Cargador',
      'bags_cases': 'Bags/Cases',
      'cables_cargadores': 'Cables y Cargadores',
      'fundas_templados': 'Fundas y Templados',
      'mouse_teclados': 'Mouse y Teclados',
      'mochilas_fundas': 'Mochilas y Fundas',
      'accesorios': 'Accesorios',
      'almacenamiento': 'Almacenamiento',
      'audio': 'Audio',
      'camaras': 'Cámaras',
      'componentes': 'Componentes',
      'consolas': 'Consolas',
      'desktop': 'Desktop',
      'gaming': 'Gaming',
      'memoria': 'Memoria',
      'monitores': 'Monitores',
      'repuestos': 'Repuestos',
      'streaming': 'Streaming'
    };
    return map[categoria.toLowerCase()] || categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Testeo de Equipos</h2>
                <p className="text-slate-300 mt-1">Revisión técnica y control de calidad</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ingresos pendientes de administración */}
      {ingresosPendientes.length > 0 && (
        <div className="bg-white rounded border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-slate-800">INGRESOS DE ADMINISTRACIÓN</h3>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                {ingresosPendientes.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Fecha</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Tipo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Descripción</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ingresosPendientes.map((ingreso) => (
                  <tr key={ingreso.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-center">
                      {formatearFecha(ingreso.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                        {ingreso.tipo_producto}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 max-w-xs text-center">
                      <div className="space-y-2">
                        <div className="truncate">
                          {ingreso.descripcion_completa}
                          {ingreso.notas && (() => {
                            const serialMatch = ingreso.notas.match(/Serial:\s*([^\s]+)/);
                            return serialMatch ? ` - S/N: ${serialMatch[1]}` : '';
                          })()}
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <Clock className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600 font-medium">
                            {calcularTiempoTranscurrido(ingreso.fecha)} pendiente
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ingreso.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {ingreso.estado === 'pendiente' ? 'Pendiente' :
                          ingreso.estado === 'en_testeo' ? 'En Testeo' :
                            ingreso.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => procesarIngresoATesteo(ingreso)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Iniciar Testeo
                        </button>
                        <button
                          onClick={() => descartarIngreso(ingreso)}
                          className="bg-red-800 hover:bg-red-900 text-white px-3 py-1 rounded text-sm transition-colors"
                          title="Descartar este ingreso"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Descartar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipos Pendientes de Testeo */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-800">EQUIPOS PENDIENTES DE TESTEO</h3>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
              {equipos.filter(e => e.estado_testeo === 'pendiente').length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Cargando equipos...</div>
        ) : equipos.filter(e => e.estado_testeo === 'pendiente').length === 0 ? (
          <div className="p-6 text-center text-slate-500">No hay equipos pendientes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Equipo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Categoría</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Detalles</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {equipos.filter(e => e.estado_testeo === 'pendiente').map((equipo, index) => {
                  const TipoIcon = tiposEquipo[equipo.tipo]?.icon || Monitor;

                  return (
                    <tr key={equipo.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <TipoIcon className="w-5 h-5 text-slate-500" />
                          <div>
                            <div className="font-medium text-slate-900">
                              {equipo.marca} {equipo.modelo}
                            </div>
                            <div className="text-sm text-slate-500">
                              S/N: {equipo.serial || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Categoría */}
                      <td className="px-6 py-4 text-sm text-slate-900 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${equipo.categoria ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {equipo.categoria || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 max-w-xs text-center">
                        <div className="space-y-2">
                          <div className="truncate">
                            {equipo.observaciones_testeo || 'Sin detalles'}
                          </div>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center justify-center space-x-2">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600 font-medium">
                                {calcularTiempoTranscurrido(equipo.created_at)} en testeo
                              </span>
                            </div>
                            {equipo.estado_testeo === 'pendiente' && (
                              <div className="flex items-center justify-center space-x-2">
                                <AlertCircle className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-orange-600 font-medium">
                                  {calcularTiempoTranscurrido(equipo.created_at)} pendiente
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex flex-wrap gap-2 items-center justify-end">
                          {/* Editar datos básicos */}
                          <button
                            onClick={() => {
                              setEquipoActual(equipo);
                              setModoModal('editar');
                              setMostrarModal(true);
                            }}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            <Edit2 className="w-3 h-3 inline mr-1" />
                            Editar
                          </button>

                          {/* Iniciar/ver checklist si no completado */}
                          {!equipo.checklist_completado ? (
                            <button
                              onClick={() => {
                                setEquipoActual(equipo);
                                setMostrarChecklist(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              <Clipboard className="w-3 h-3 inline mr-1" />
                              Iniciar Checklist
                            </button>
                          ) : (
                            <>
                              {/* Ver checklist completado */}
                              <button
                                onClick={() => {
                                  setEquipoActual(equipo);
                                  setMostrarChecklist(true);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                <Eye className="w-3 h-3 inline mr-1" />
                                Ver Checklist
                              </button>

                              {/* Cargar al stock solo si checklist completado */}
                              <button
                                onClick={() => {
                                  setEquipoActual(equipo);
                                  setModoModal('cargar_stock');
                                  setMostrarModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                <Package className="w-3 h-3 inline mr-1" />
                                Cargar al Stock
                              </button>
                            </>
                          )}
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

      {/* Equipos ya Testeados */}
      {equipos.filter(e => ['aprobado', 'rechazado', 'condicional'].includes(e.estado_testeo)).length > 0 && (
        <div className="bg-white rounded border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-800">EQUIPOS TESTEADOS - LISTOS PARA STOCK</h3>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm font-medium">
                {equipos.filter(e => ['aprobado', 'rechazado', 'condicional'].includes(e.estado_testeo)).length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Equipo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Categoría</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Resultado Testeo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Condición</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {equipos.filter(e => ['aprobado', 'rechazado', 'condicional'].includes(e.estado_testeo)).map((equipo, index) => {
                  const TipoIcon = tiposEquipo[equipo.tipo]?.icon || Monitor;

                  return (
                    <tr key={equipo.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <TipoIcon className="w-5 h-5 text-slate-500" />
                          <div>
                            <div className="font-medium text-slate-900">
                              {equipo.marca} {equipo.modelo}
                            </div>
                            <div className="text-sm text-slate-500">
                              S/N: {equipo.serial || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${equipo.categoria ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {formatCategoria(equipo.categoria)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${equipo.estado_testeo === 'aprobado' ? 'bg-emerald-100 text-emerald-800' :
                          equipo.estado_testeo === 'rechazado' ? 'bg-red-100 text-red-800' :
                            equipo.estado_testeo === 'condicional' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-800'
                          }`}>
                          {equipo.estado_testeo === 'aprobado' ? '✓ Aprobado' :
                            equipo.estado_testeo === 'rechazado' ? '✗ Rechazado' :
                              equipo.estado_testeo === 'condicional' ? '⚠ Condicional' :
                                equipo.estado_testeo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${estadosEsteticos.find(e => e.value === equipo.estado_estetico)?.color || 'bg-slate-100'
                          } text-white`}>
                          {estadosEsteticos.find(e => e.value === equipo.estado_estetico)?.label || equipo.estado_estetico}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2 items-center justify-end">
                          <button
                            onClick={() => {
                              if (equipo.estado_testeo !== 'rechazado') {
                                setEquipoActual(equipo);
                                setModoModal('cargar_stock');
                                setMostrarModal(true);
                              }
                            }}
                            className={`px-3 py-1 rounded text-sm transition-colors flex items-center ${equipo.estado_testeo === 'rechazado'
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            title={equipo.estado_testeo === 'rechazado' ? 'Este equipo fue rechazado en testeo' : 'Cargar al stock'}
                            disabled={equipo.estado_testeo === 'rechazado'}
                          >
                            <Package className="w-3 h-3 mr-1" />
                            Cargar al Stock
                          </button>

                          <button
                            onClick={() => eliminarEquipoTesteado(equipo)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded transition-colors"
                            title="Eliminar equipo testeado"
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
        </div>
      )}

      {/* Modal de checklist */}
      <ModalChecklistEquipo
        equipo={equipoActual}
        isOpen={mostrarChecklist}
        onClose={() => {
          setMostrarChecklist(false);
          setEquipoActual(null);
        }}
        onComplete={() => {
          cargarEquipos();
          setMostrarChecklist(false);
          setEquipoActual(null);
        }}
      />

      {/* Modal de edición */}
      <ModalEditarEquipo
        equipo={equipoActual}
        isOpen={mostrarModal}
        modo={modoModal}
        onClose={() => {
          setMostrarModal(false);
          setEquipoActual(null);
          setModoModal('editar');
        }}
        onSave={() => {
          cargarEquipos();
          setMostrarModal(false);
          setEquipoActual(null);
          setModoModal('editar');
        }}
      />
    </div>
  );
}

export default TesteoEquiposSection;