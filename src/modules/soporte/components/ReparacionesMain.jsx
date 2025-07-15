import React, { useState, useEffect } from 'react';
import { Wrench, Plus, FileText, Calculator, Eye, Trash2, ClipboardList, BadgeCheck, User, Phone, Mail, Laptop, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, Send, ThumbsUp, ExternalLink } from 'lucide-react';
import ModalNuevaReparacion from './ModalNuevaReparacion';
import ModalPresupuesto from './ModalPresupuesto';
import ModalVistaPrevia from './ModalVistaPrevia';
import { useReparaciones } from '../hooks/useReparaciones';
import { generarYDescargarPresupuesto as abrirPresupuestoPDF } from '../../../components/PresupuestoReparacionPDF.jsx';

const estados = {
  ingresado: { label: 'Ingresado', color: 'bg-emerald-100 text-emerald-700' },
  diagnosticando: { label: 'Diagnosticando', color: 'bg-emerald-100 text-emerald-700' },
  presupuestado: { label: 'Presupuestado', color: 'bg-emerald-100 text-emerald-700' },
  aprobado: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700' },
  reparando: { label: 'Reparando', color: 'bg-emerald-100 text-emerald-700' },
  terminado: { label: 'Terminado', color: 'bg-emerald-100 text-emerald-700' },
  entregado: { label: 'Entregado', color: 'bg-slate-100 text-slate-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const stats = [
  { label: 'Total Reparaciones', value: 32, icon: ClipboardList },
  { label: 'En Proceso', value: 7, icon: Loader2 },
  { label: 'Terminadas', value: 18, icon: BadgeCheck },
  { label: 'Ingresos del Mes', value: '$4,200', icon: Calculator },
];

const filtrosEstados = [
  'todos',
  'ingresado',
  'diagnosticando',
  'presupuestado',
  'aprobado',
  'reparando',
  'terminado',
  'entregado',
  'cancelado',
];

function ReparacionesMain() {
  // Estados para modales
  const [modalNueva, setModalNueva] = useState(false);
  const [modalPresupuesto, setModalPresupuesto] = useState(false);
  const [modalVista, setModalVista] = useState(false);
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [debouncedFiltroCliente, setDebouncedFiltroCliente] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  
  // Estados para funcionalidades
  const [expand, setExpand] = useState(null);
  const [reparacionSeleccionada, setReparacionSeleccionada] = useState(null);
  const [presupuestoData, setPresupuestoData] = useState(null);

  // Debounce para filtroCliente
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFiltroCliente(filtroCliente);
    }, 300);
    return () => clearTimeout(handler);
  }, [filtroCliente]);

  // Hook de reparaciones
  const {
    reparaciones,
    obtenerReparaciones,
    crearReparacion,
    eliminarReparacion,
    cambiarEstado,
    loading
  } = useReparaciones();

  // Cargar reparaciones al iniciar
  useEffect(() => {
    obtenerReparaciones();
  }, [obtenerReparaciones]);

  // Handlers
  const handleNuevaReparacion = async (form) => {
    // Mapear datos del form a la estructura de la tabla
    const cliente = form.cliente;
    const reparacionData = {
      cliente_nombre: cliente?.nombre || '',
      cliente_telefono: cliente?.telefono || '',
      cliente_email: cliente?.email || '',
      equipo_tipo: form.tipo,
      equipo_marca: form.marca,
      equipo_modelo: form.modelo,
      equipo_serial: form.serial,
      accesorios_incluidos: form.accesorios,
      problema_reportado: form.problema,
      prioridad: form.prioridad || 'media',
      observaciones: form.observaciones,
    };
    
    try {
      await crearReparacion(reparacionData);
      setModalNueva(false);
      alert('✅ Reparación creada exitosamente');
    } catch (err) {
      alert('Error al crear reparación: ' + err.message);
    }
  };

  const handleEliminarReparacion = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta reparación?')) return;
    
    try {
      await eliminarReparacion(id);
      alert('✅ Reparación eliminada exitosamente');
    } catch (err) {
      alert('Error al eliminar reparación: ' + err.message);
    }
  };

  const handleAbrirPresupuesto = (reparacion) => {
    setReparacionSeleccionada(reparacion);
    setModalPresupuesto(true);
  };

  const handleVistaPrevia = (datos) => {
    setPresupuestoData(datos);
    setModalPresupuesto(false);
    setModalVista(true);
  };

  const handleCambiarEstado = async (reparacionId, nuevoEstado) => {
    try {
      await cambiarEstado(reparacionId, nuevoEstado);
      alert('✅ Estado actualizado exitosamente');
    } catch (err) {
      alert('Error al cambiar estado: ' + err.message);
    }
  };

  const handleGenerarPDFPresupuesto = async (reparacion) => {
    if (!reparacion.presupuesto_json) {
      alert('Esta reparación no tiene presupuesto guardado');
      return;
    }

    try {
      const resultado = await abrirPresupuestoPDF(reparacion, reparacion.presupuesto_json);
      if (!resultado.success) {
        alert('Error al generar el presupuesto: ' + resultado.error);
      }
    } catch (error) {
      console.error('Error generando presupuesto:', error);
      alert('Error al generar el presupuesto. Intente nuevamente.');
    }
  };

  // Filtrar reparaciones
  const reparacionesFiltradas = reparaciones.filter(r => {
    const estadoOk = filtroEstado === 'todos' || r.estado === filtroEstado;
    const clienteOk = !debouncedFiltroCliente || (r.cliente_nombre || '').toLowerCase().includes(debouncedFiltroCliente.toLowerCase());
    const fechaOk = !filtroFecha || r.fecha_ingreso === filtroFecha;
    return estadoOk && clienteOk && fechaOk;
  });

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Actualizar stats dinámicamente
  const statsActualizadas = [
    { 
      label: 'Total Reparaciones', 
      value: reparaciones.length, 
      icon: ClipboardList 
    },
    { 
      label: 'En Proceso', 
      value: reparaciones.filter(r => ['ingresado', 'diagnosticando', 'presupuestado', 'aprobado', 'reparando'].includes(r.estado)).length, 
      icon: Loader2 
    },
    { 
      label: 'Terminadas', 
      value: reparaciones.filter(r => r.estado === 'terminado').length, 
      icon: BadgeCheck 
    },
    { 
      label: 'Entregadas', 
      value: reparaciones.filter(r => r.estado === 'entregado').length, 
      icon: CheckCircle 
    },
  ];

  return (
    <div className="">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Wrench className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Gestión de Reparaciones</h2>
                <p className="text-slate-300 mt-1">Control y seguimiento de reparaciones de equipos</p>
              </div>
            </div>
            <button
              onClick={() => setModalNueva(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 transition-colors font-semibold text-base flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Reparación</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {statsActualizadas.map(card => (
          <div key={card.label} className="bg-slate-800 p-6 rounded border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-md">{card.label}</p>
                <p className="text-3xl font-semibold text-white">{card.value}</p>
              </div>
              <div className="bg-slate-600 p-2 rounded-full">
                <card.icon className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="flex gap-1">
          {filtrosEstados.map(est => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1 rounded font-medium text-sm border transition-all ${
                filtroEstado === est
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
              }`}
            >
              {est === 'todos' ? 'Todos' : estados[est]?.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={filtroCliente}
          onChange={e => setFiltroCliente(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm"
        />
        <input
          type="date"
          value={filtroFecha}
          onChange={e => setFiltroFecha(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm"
        />
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Cargando reparaciones...</span>
        </div>
      )}

      {/* Tabla de reparaciones */}
      {!loading && (
        <div className="overflow-x-auto bg-white rounded border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Número</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Fecha Ingreso</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Equipo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Problema</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {reparacionesFiltradas.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-emerald-50 transition-all">
                  <td className="px-4 py-3 font-mono text-sm text-emerald-700">
                    {r.numero || 'Sin número'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatearFecha(r.fecha_ingreso)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold">{r.cliente_nombre || 'Sin nombre'}</span>
                      <span className="text-xs text-slate-500">{r.cliente_telefono || 'Sin teléfono'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {r.equipo_marca && r.equipo_modelo 
                          ? `${r.equipo_marca} ${r.equipo_modelo}` 
                          : r.equipo_tipo || 'Sin especificar'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {r.equipo_serial ? `Serial: ${r.equipo_serial}` : 'Sin serial'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate" title={r.problema_reportado}>
                    {r.problema_reportado || 'Sin descripción'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.estado || 'ingresado'}
                      onChange={(e) => handleCambiarEstado(r.id, e.target.value)}
                      className={`px-3 py-1 rounded text-xs font-bold border-0 cursor-pointer ${
                        estados[r.estado]?.color || 'bg-slate-100 text-slate-700'
                      } focus:ring-2 focus:ring-emerald-600`}
                    >
                      {filtrosEstados.slice(1).map(estado => (
                        <option key={estado} value={estado}>
                          {estados[estado]?.label || estado}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        title="Ver detalles" 
                        onClick={() => setExpand(expand === idx ? null : idx)} 
                        className="p-2 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        {expand === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button 
                        title={r.presupuesto_json ? "Ver/Editar presupuesto" : "Crear presupuesto"} 
                        onClick={() => handleAbrirPresupuesto(r)} 
                        className={`p-2 rounded transition-colors ${
                          r.presupuesto_json 
                            ? 'hover:bg-emerald-200 text-emerald-600' 
                            : 'hover:bg-emerald-200 text-emerald-600'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button 
                        title={r.presupuesto_json ? "Ver presupuesto" : "Sin presupuesto guardado"} 
                        onClick={() => handleGenerarPDFPresupuesto(r)} 
                        disabled={!r.presupuesto_json}
                        className={`p-2 rounded transition-colors ${
                          r.presupuesto_json 
                            ? 'hover:bg-slate-200 text-slate-600 cursor-pointer' 
                            : 'text-slate-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button 
                        title="Eliminar reparación" 
                        onClick={() => handleEliminarReparacion(r.id)}
                        className="p-2 rounded hover:bg-red-200 text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Fila expandible */}
              {expand !== null && reparacionesFiltradas[expand] && (
                <tr className="bg-slate-25">
                  <td colSpan={7} className="px-4 py-6">
                    <div className="bg-slate-50 rounded p-6">
                      <h4 className="font-semibold text-slate-800 mb-4">Detalles de la Reparación</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <h5 className="font-medium text-slate-800 mb-2">Información del Cliente</h5>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Email:</span> {reparacionesFiltradas[expand].cliente_email || 'No especificado'}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-800 mb-2">Detalles del Equipo</h5>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Accesorios:</span> {reparacionesFiltradas[expand].accesorios_incluidos || 'Ninguno'}</p>
                            <p><span className="font-medium">Prioridad:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                reparacionesFiltradas[expand].prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                                reparacionesFiltradas[expand].prioridad === 'alta' ? 'bg-emerald-100 text-emerald-800' :
                                reparacionesFiltradas[expand].prioridad === 'media' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {reparacionesFiltradas[expand].prioridad?.toUpperCase() || 'MEDIA'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-800 mb-2">Observaciones</h5>
                          <div className="text-sm">
                            <p>{reparacionesFiltradas[expand].observaciones || 'Sin observaciones'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Problema completo:</span> {reparacionesFiltradas[expand].problema_reportado}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {reparacionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    {loading ? 'Cargando...' : 'No hay reparaciones para mostrar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {modalNueva && (
        <ModalNuevaReparacion 
          open={modalNueva} 
          onClose={() => setModalNueva(false)} 
          onSave={handleNuevaReparacion} 
        />
      )}
      
      {modalPresupuesto && (
        <ModalPresupuesto 
          open={modalPresupuesto} 
          onClose={() => {
            setModalPresupuesto(false);
            // Recargar reparaciones para refrescar el estado del presupuesto
            obtenerReparaciones();
          }} 
          reparacion={reparacionSeleccionada}
        />
      )}
      
      {modalVista && (
        <ModalVistaPrevia 
          open={modalVista} 
          onClose={() => setModalVista(false)}
          presupuestoData={presupuestoData}
        />
      )}
      
    </div>
  );
}

export default ReparacionesMain;