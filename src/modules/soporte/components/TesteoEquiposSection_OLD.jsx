import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Plus, Eye, Trash2, CheckCircle, XCircle, AlertCircle, Star, Save, Edit2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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

const checklistNotebook = [
  { id: 'encendido', label: 'Encendido correcto', categoria: 'funcionamiento' },
  { id: 'pantalla', label: 'Pantalla sin pixeles muertos/líneas', categoria: 'funcionamiento' },
  { id: 'teclado', label: 'Todas las teclas funcionan', categoria: 'funcionamiento' },
  { id: 'touchpad', label: 'Touchpad funciona correctamente', categoria: 'funcionamiento' },
  { id: 'usb', label: 'Puertos USB funcionan', categoria: 'funcionamiento' },
  { id: 'wifi', label: 'WiFi conecta correctamente', categoria: 'funcionamiento' },
  { id: 'audio', label: 'Audio funciona (parlantes/auriculares)', categoria: 'funcionamiento' },
  { id: 'camara', label: 'Cámara funciona', categoria: 'funcionamiento' },
  { id: 'bateria', label: 'Batería carga y mantiene carga', categoria: 'funcionamiento' },
  { id: 'cargador', label: 'Cargador incluido y funciona', categoria: 'accesorios' },
  { id: 'tapa', label: 'Tapa sin grietas/golpes severos', categoria: 'estetico' },
  { id: 'bisagras', label: 'Bisagras firmes', categoria: 'estetico' },
];

const checklistCelular = [
  { id: 'encendido', label: 'Encendido correcto', categoria: 'funcionamiento' },
  { id: 'tactil', label: 'Pantalla táctil responde en toda la superficie', categoria: 'funcionamiento' },
  { id: 'botones', label: 'Botones físicos funcionan', categoria: 'funcionamiento' },
  { id: 'camara_trasera', label: 'Cámara trasera funciona', categoria: 'funcionamiento' },
  { id: 'camara_frontal', label: 'Cámara frontal funciona', categoria: 'funcionamiento' },
  { id: 'altavoz', label: 'Altavoz funciona', categoria: 'funcionamiento' },
  { id: 'microfono', label: 'Micrófono funciona', categoria: 'funcionamiento' },
  { id: 'wifi', label: 'WiFi conecta correctamente', categoria: 'funcionamiento' },
  { id: 'bluetooth', label: 'Bluetooth funciona', categoria: 'funcionamiento' },
  { id: 'carga', label: 'Carga correctamente', categoria: 'funcionamiento' },
  { id: 'bateria', label: 'Batería mantiene carga', categoria: 'funcionamiento' },
  { id: 'huella', label: 'Sensor de huella funciona (si tiene)', categoria: 'funcionamiento' },
  { id: 'pantalla_estado', label: 'Pantalla sin grietas/rayones', categoria: 'estetico' },
  { id: 'carcasa', label: 'Carcasa sin golpes severos', categoria: 'estetico' },
];

function TesteoEquiposSection() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalTesteo, setModalTesteo] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Formulario nuevo equipo
  const [formNuevo, setFormNuevo] = useState({
    tipo: 'notebook',
    marca: '',
    modelo: '',
    serial: '',
    proveedor: '',
    observaciones: ''
  });

  // Estado del testeo
  const [testeoData, setTesteoData] = useState({
    checklist: {},
    estado_estetico: 'bueno',
    observaciones_testeo: '',
    resultado_general: 'pendiente' // pendiente, aprobado, rechazado
  });

  useEffect(() => {
    cargarEquipos();
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
    } catch (error) {
      console.error('Error cargando equipos:', error);
      alert('Error al cargar equipos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearEquipo = async (e) => {
    e.preventDefault();

    if (!formNuevo.marca || !formNuevo.modelo) {
      alert('Marca y modelo son obligatorios');
      return;
    }

    try {
      const equipoData = {
        ...formNuevo,
        estado_testeo: 'pendiente',
        checklist_completado: false
      };

      const { error } = await supabase
        .from('testeo_equipos')
        .insert([equipoData]);

      if (error) throw error;

      alert('✅ Equipo agregado exitosamente');
      setFormNuevo({
        tipo: 'notebook',
        marca: '',
        modelo: '',
        serial: '',
        proveedor: '',
        observaciones: ''
      });
      setModalNuevo(false);
      cargarEquipos();
    } catch (error) {
      console.error('Error creando equipo:', error);
      alert('Error al crear equipo: ' + error.message);
    }
  };

  const abrirTesteo = (equipo) => {
    setEquipoSeleccionado(equipo);

    // Cargar datos existentes si los hay
    const checklistExistente = equipo.checklist_data ? JSON.parse(equipo.checklist_data) : {};

    setTesteoData({
      checklist: checklistExistente,
      estado_estetico: equipo.estado_estetico || 'bueno',
      observaciones_testeo: equipo.observaciones_testeo || '',
      resultado_general: equipo.estado_testeo || 'pendiente'
    });

    setModalTesteo(true);
  };

  const handleChecklistChange = (itemId, valor) => {
    setTesteoData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [itemId]: valor
      }
    }));
  };

  const calcularResultadoGeneral = (checklist, tipoEquipo) => {
    const checklistReferencia = tipoEquipo === 'notebook' ? checklistNotebook : checklistCelular;
    const itemsFuncionamiento = checklistReferencia.filter(item => item.categoria === 'funcionamiento');

    let aprobados = 0;
    let totales = 0;

    itemsFuncionamiento.forEach(item => {
      if (checklist[item.id] !== undefined) {
        totales++;
        if (checklist[item.id] === true) {
          aprobados++;
        }
      }
    });

    // Si más del 90% funciona, aprobado
    if (totales > 0 && (aprobados / totales) >= 0.9) {
      return 'aprobado';
    } else if (totales > 0 && (aprobados / totales) >= 0.7) {
      return 'pendiente'; // Requiere revisión
    } else {
      return 'rechazado';
    }
  };

  const guardarTesteo = async () => {
    try {
      const resultadoCalculado = calcularResultadoGeneral(testeoData.checklist, equipoSeleccionado.tipo);

      const updateData = {
        checklist_data: JSON.stringify(testeoData.checklist),
        estado_estetico: testeoData.estado_estetico,
        observaciones_testeo: testeoData.observaciones_testeo,
        estado_testeo: resultadoCalculado,
        checklist_completado: true,
        fecha_testeo: new Date().toISOString()
      };

      const { error } = await supabase
        .from('testeo_equipos')
        .update(updateData)
        .eq('id', equipoSeleccionado.id);

      if (error) throw error;

      alert('✅ Testeo guardado exitosamente');
      setModalTesteo(false);
      cargarEquipos();
    } catch (error) {
      console.error('Error guardando testeo:', error);
      alert('Error al guardar testeo: ' + error.message);
    }
  };

  const eliminarEquipo = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este equipo?')) return;

    try {
      const { error } = await supabase
        .from('testeo_equipos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('✅ Equipo eliminado');
      cargarEquipos();
    } catch (error) {
      console.error('Error eliminando equipo:', error);
      alert('Error al eliminar equipo: ' + error.message);
    }
  };

  const equiposFiltrados = equipos.filter(equipo => {
    const tipoOk = filtroTipo === 'todos' || equipo.tipo === filtroTipo;
    const estadoOk = filtroEstado === 'todos' || equipo.estado_testeo === filtroEstado;
    return tipoOk && estadoOk;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobado': return 'bg-emerald-100 text-emerald-800';
      case 'rechazado': return 'bg-slate-200 text-slate-800';
      case 'pendiente': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderChecklist = () => {
    const checklistReferencia = equipoSeleccionado?.tipo === 'notebook' ? checklistNotebook : checklistCelular;

    const categorias = {
      funcionamiento: 'Funcionamiento',
      accesorios: 'Accesorios',
      estetico: 'Estado Estético'
    };

    return Object.entries(categorias).map(([categoria, titulo]) => {
      const items = checklistReferencia.filter(item => item.categoria === categoria);

      return (
        <div key={categoria} className="mb-6">
          <h4 className="font-semibold text-slate-800 mb-3">{titulo}</h4>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <span className="text-sm">{item.label}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChecklistChange(item.id, true)}
                    className={`p-2 rounded ${testeoData.checklist[item.id] === true
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleChecklistChange(item.id, false)}
                    className={`p-2 rounded ${testeoData.checklist[item.id] === false
                      ? 'bg-slate-600 text-white'
                      : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="">
      {/* Header obligatorio según estándares */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Monitor className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Testeo de Equipos</h2>
                <p className="text-slate-300 mt-1">Control de calidad y testeo de equipos</p>
              </div>
            </div>
            <button
              onClick={() => setModalNuevo(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 transition-colors font-medium flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Equipo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded border border-slate-200 mb-6">
        <div className="flex gap-4">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
          >
            <option value="todos">Todos los tipos</option>
            <option value="notebook">Notebooks</option>
            <option value="celular">Celulares</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Tabla de equipos */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Proveedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Testeo</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                  Cargando equipos...
                </td>
              </tr>
            ) : equiposFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                  No hay equipos para mostrar
                </td>
              </tr>
            ) : (
              equiposFiltrados.map((equipo) => {
                const TipoIcon = tiposEquipo[equipo.tipo]?.icon || Monitor;
                return (
                  <tr key={equipo.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <TipoIcon className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">
                            {equipo.marca} {equipo.modelo}
                          </div>
                          <div className="text-sm text-slate-500">
                            {equipo.serial && `Serial: ${equipo.serial}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {equipo.proveedor || 'Sin especificar'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(equipo.estado_testeo)}`}>
                        {equipo.estado_testeo === 'pendiente' ? 'Pendiente' :
                          equipo.estado_testeo === 'aprobado' ? 'Aprobado' :
                            equipo.estado_testeo === 'rechazado' ? 'Rechazado' : 'Sin testear'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {equipo.checklist_completado ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-slate-600">Completado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600">Pendiente</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => abrirTesteo(equipo)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Realizar/Ver testeo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarEquipo(equipo.id)}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded"
                          title="Eliminar equipo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Equipo */}
      {modalNuevo && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center rounded-t">
              <h3 className="text-lg font-semibold flex items-center gap-3">
                <Plus className="w-5 h-5" />
                Nuevo Equipo para Testeo
              </h3>
              <button onClick={() => setModalNuevo(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario con scroll y footer fijo */}
            <form onSubmit={handleCrearEquipo} className="flex-grow flex flex-col overflow-hidden">
              {/* Contenido del formulario (scrollable) */}
              <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Equipo</label>
                  <select
                    value={formNuevo.tipo}
                    onChange={(e) => setFormNuevo(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  >
                    <option value="notebook">Notebook</option>
                    <option value="celular">Celular</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca *</label>
                    <input
                      type="text"
                      value={formNuevo.marca}
                      onChange={(e) => setFormNuevo(prev => ({ ...prev, marca: e.target.value }))}
                      placeholder="Ej: Apple, HP, Dell"
                      className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={formNuevo.modelo}
                      onChange={(e) => setFormNuevo(prev => ({ ...prev, modelo: e.target.value }))}
                      placeholder="Ej: MacBook Pro 14"
                      className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Serie (Opcional)</label>
                  <input
                    type="text"
                    value={formNuevo.serial}
                    onChange={(e) => setFormNuevo(prev => ({ ...prev, serial: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor (Opcional)</label>
                  <input
                    type="text"
                    value={formNuevo.proveedor}
                    onChange={(e) => setFormNuevo(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones (Opcional)</label>
                  <textarea
                    value={formNuevo.observaciones}
                    onChange={(e) => setFormNuevo(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={3}
                    placeholder="Cualquier detalle inicial relevante"
                    className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Footer de acciones (fijo abajo) */}
              <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-6 py-2 rounded bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Testeo */}
      {modalTesteo && equipoSeleccionado && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded border border-slate-200 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                Testeo: {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
              </h3>
              <button
                onClick={() => setModalTesteo(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {renderChecklist()}
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Estado Estético General</h4>
                  <div className="space-y-2">
                    {estadosEsteticos.map(estado => (
                      <label key={estado.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="estado_estetico"
                          value={estado.value}
                          checked={testeoData.estado_estetico === estado.value}
                          onChange={(e) => setTesteoData(prev => ({ ...prev, estado_estetico: e.target.value }))}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${estado.color}`}></div>
                          <span className="text-sm">{estado.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Observaciones del Testeo</h4>
                  <textarea
                    value={testeoData.observaciones_testeo}
                    onChange={(e) => setTesteoData(prev => ({ ...prev, observaciones_testeo: e.target.value }))}
                    rows={4}
                    placeholder="Detalles adicionales del testeo..."
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setModalTesteo(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarTesteo}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Testeo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TesteoEquiposSection;