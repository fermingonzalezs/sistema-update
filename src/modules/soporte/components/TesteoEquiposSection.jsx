import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Plus, Eye, Trash2, CheckCircle, XCircle, AlertCircle, Star, Save, Edit2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const tiposEquipo = {
  notebook: { label: 'Notebook', icon: Monitor },
  celular: { label: 'Celular', icon: Smartphone },
};

const estadosEsteticos = [
  { value: 'excelente', label: 'Excelente', color: 'bg-green-500' },
  { value: 'muy_bueno', label: 'Muy Bueno', color: 'bg-green-400' },
  { value: 'bueno', label: 'Bueno', color: 'bg-yellow-400' },
  { value: 'regular', label: 'Regular', color: 'bg-orange-400' },
  { value: 'malo', label: 'Malo', color: 'bg-red-400' },
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
      case 'aprobado': return 'bg-green-100 text-green-700';
      case 'rechazado': return 'bg-red-100 text-red-700';
      case 'pendiente': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
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
          <h4 className="font-semibold text-gray-800 mb-3">{titulo}</h4>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">{item.label}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChecklistChange(item.id, true)}
                    className={`p-2 rounded ${
                      testeoData.checklist[item.id] === true
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-400 border'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleChecklistChange(item.id, false)}
                    className={`p-2 rounded ${
                      testeoData.checklist[item.id] === false
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-400 border'
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Monitor className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Testeo de Equipos</h2>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Nuevo Equipo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los tipos</option>
          <option value="notebook">Notebooks</option>
          <option value="celular">Celulares</option>
        </select>
        
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>

      {/* Tabla de equipos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Testeo</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Cargando equipos...
                </td>
              </tr>
            ) : equiposFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No hay equipos para mostrar
                </td>
              </tr>
            ) : (
              equiposFiltrados.map((equipo) => {
                const TipoIcon = tiposEquipo[equipo.tipo]?.icon || Monitor;
                return (
                  <tr key={equipo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <TipoIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {equipo.marca} {equipo.modelo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {equipo.serial && `Serial: ${equipo.serial}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
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
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Completado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">Pendiente</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => abrirTesteo(equipo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Realizar/Ver testeo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarEquipo(equipo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Equipo para Testeo</h3>
            <form onSubmit={handleCrearEquipo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Equipo
                </label>
                <select
                  value={formNuevo.tipo}
                  onChange={(e) => setFormNuevo(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="notebook">Notebook</option>
                  <option value="celular">Celular</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    value={formNuevo.marca}
                    onChange={(e) => setFormNuevo(prev => ({ ...prev, marca: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    value={formNuevo.modelo}
                    onChange={(e) => setFormNuevo(prev => ({ ...prev, modelo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Serie
                </label>
                <input
                  type="text"
                  value={formNuevo.serial}
                  onChange={(e) => setFormNuevo(prev => ({ ...prev, serial: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formNuevo.proveedor}
                  onChange={(e) => setFormNuevo(prev => ({ ...prev, proveedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formNuevo.observaciones}
                  onChange={(e) => setFormNuevo(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Testeo */}
      {modalTesteo && equipoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                Testeo: {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
              </h3>
              <button
                onClick={() => setModalTesteo(false)}
                className="text-gray-400 hover:text-gray-600"
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
                  <h4 className="font-semibold text-gray-800 mb-3">Estado Estético General</h4>
                  <div className="space-y-2">
                    {estadosEsteticos.map(estado => (
                      <label key={estado.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="estado_estetico"
                          value={estado.value}
                          checked={testeoData.estado_estetico === estado.value}
                          onChange={(e) => setTesteoData(prev => ({ ...prev, estado_estetico: e.target.value }))}
                          className="w-4 h-4 text-blue-600"
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
                  <h4 className="font-semibold text-gray-800 mb-3">Observaciones del Testeo</h4>
                  <textarea
                    value={testeoData.observaciones_testeo}
                    onChange={(e) => setTesteoData(prev => ({ ...prev, observaciones_testeo: e.target.value }))}
                    rows={4}
                    placeholder="Detalles adicionales del testeo..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setModalTesteo(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarTesteo}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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