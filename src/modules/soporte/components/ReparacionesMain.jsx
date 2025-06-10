import React, { useState, useEffect } from 'react';
import { Wrench, Plus, FileText, Calculator, Eye, Trash2, ClipboardList, BadgeCheck, User, Phone, Mail, Laptop, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, FileDown, Send, ThumbsUp } from 'lucide-react';
import ModalNuevaReparacion from './ModalNuevaReparacion';
import ModalPresupuesto from './ModalPresupuesto';
import ModalVistaPrevia from './ModalVistaPrevia';
import ModalVistaPreviaPresupuesto from './ModalVistaPreviaPresupuesto';
import { useReparaciones } from '../hooks/useReparaciones';
import jsPDF from 'jspdf';

const estados = {
  ingresado: { label: 'Ingresado', color: 'bg-orange-100 text-orange-700' },
  diagnosticando: { label: 'Diagnosticando', color: 'bg-yellow-100 text-yellow-700' },
  presupuestado: { label: 'Presupuestado', color: 'bg-purple-100 text-purple-700' },
  aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  reparando: { label: 'Reparando', color: 'bg-blue-100 text-blue-700' },
  terminado: { label: 'Terminado', color: 'bg-emerald-100 text-emerald-700' },
  entregado: { label: 'Entregado', color: 'bg-gray-100 text-gray-700' },
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
  const [modalVistaPreviaPresupuesto, setModalVistaPreviaPresupuesto] = useState(false);
  
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

  const handleGenerarPDFPresupuesto = (reparacion) => {
    if (!reparacion.presupuesto_json) {
      alert('Esta reparación no tiene presupuesto guardado');
      return;
    }

    // En lugar de generar PDF directamente, mostrar vista previa
    setReparacionSeleccionada(reparacion);
    setModalVistaPreviaPresupuesto(true);
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
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* Header y botón */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Wrench className="w-10 h-10 text-orange-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 drop-shadow">Gestión de Reparaciones</h1>
        </div>
        <button
          onClick={() => setModalNueva(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-orange-600 transition-all"
        >
          <Plus className="w-5 h-5" /> Nueva Reparación
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsActualizadas.map(card => (
          <div key={card.label} className="bg-orange-100 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <card.icon className="w-8 h-8 text-orange-500 opacity-90" />
            <div>
              <div className="text-2xl font-bold text-orange-700">{card.value}</div>
              <div className="text-orange-700/80 text-sm">{card.label}</div>
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
              className={`px-3 py-1 rounded-full font-medium text-sm border transition-all ${
                filtroEstado === est
                  ? 'bg-orange-600 text-white border-orange-600 shadow'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50'
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
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
        />
        <input
          type="date"
          value={filtroFecha}
          onChange={e => setFiltroFecha(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
        />
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Cargando reparaciones...</span>
        </div>
      )}

      {/* Tabla de reparaciones */}
      {!loading && (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-orange-600 to-red-600">
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
            <tbody className="bg-white divide-y divide-gray-100">
              {reparacionesFiltradas.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-orange-50 transition-all">
                  <td className="px-4 py-3 font-mono text-sm text-orange-700">
                    {r.numero || 'Sin número'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatearFecha(r.fecha_ingreso)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold">{r.cliente_nombre || 'Sin nombre'}</span>
                      <span className="text-xs text-gray-500">{r.cliente_telefono || 'Sin teléfono'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {r.equipo_marca && r.equipo_modelo 
                          ? `${r.equipo_marca} ${r.equipo_modelo}` 
                          : r.equipo_tipo || 'Sin especificar'}
                      </span>
                      <span className="text-xs text-gray-500">
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
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow border-0 cursor-pointer ${
                        estados[r.estado]?.color || 'bg-gray-100 text-gray-700'
                      } focus:ring-2 focus:ring-orange-500`}
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
                        className="p-2 rounded hover:bg-orange-200 text-orange-600 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        title={r.presupuesto_json ? "Ver/Editar presupuesto" : "Crear presupuesto"} 
                        onClick={() => handleAbrirPresupuesto(r)} 
                        className={`p-2 rounded transition-colors ${
                          r.presupuesto_json 
                            ? 'hover:bg-green-200 text-green-600' 
                            : 'hover:bg-orange-200 text-orange-600'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button 
                        title={r.presupuesto_json ? "Descargar PDF del presupuesto" : "Sin presupuesto guardado"} 
                        onClick={() => handleGenerarPDFPresupuesto(r)} 
                        disabled={!r.presupuesto_json}
                        className={`p-2 rounded transition-colors ${
                          r.presupuesto_json 
                            ? 'hover:bg-blue-200 text-blue-600 cursor-pointer' 
                            : 'text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <FileDown className="w-5 h-5" />
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
                <tr className="bg-orange-25">
                  <td colSpan={7} className="px-4 py-6">
                    <div className="bg-orange-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Detalles de la Reparación</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Información del Cliente</h5>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Email:</span> {reparacionesFiltradas[expand].cliente_email || 'No especificado'}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Detalles del Equipo</h5>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Accesorios:</span> {reparacionesFiltradas[expand].accesorios_incluidos || 'Ninguno'}</p>
                            <p><span className="font-medium">Prioridad:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                reparacionesFiltradas[expand].prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                                reparacionesFiltradas[expand].prioridad === 'alta' ? 'bg-orange-100 text-orange-800' :
                                reparacionesFiltradas[expand].prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {reparacionesFiltradas[expand].prioridad?.toUpperCase() || 'MEDIA'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Observaciones</h5>
                          <div className="text-sm">
                            <p>{reparacionesFiltradas[expand].observaciones || 'Sin observaciones'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-orange-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Problema completo:</span> {reparacionesFiltradas[expand].problema_reportado}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {reparacionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
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
      
      {modalVistaPreviaPresupuesto && reparacionSeleccionada && (
        <ModalVistaPreviaPresupuesto 
          open={modalVistaPreviaPresupuesto} 
          onClose={() => setModalVistaPreviaPresupuesto(false)}
          reparacion={reparacionSeleccionada}
          presupuesto={reparacionSeleccionada.presupuesto_json}
        />
      )}
    </div>
  );
}

export default ReparacionesMain;