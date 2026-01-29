import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Checklist para Notebooks (12 ítems)
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

// Checklist para Celulares (14 ítems)
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

// Checklist para Otros Productos (8 ítems generales)
const checklistOtros = [
  { id: 'encendido', label: 'Encendido/funcionamiento correcto', categoria: 'funcionamiento' },
  { id: 'conectividad', label: 'Conectividad funciona (si aplica)', categoria: 'funcionamiento' },
  { id: 'controles', label: 'Controles/botones funcionan', categoria: 'funcionamiento' },
  { id: 'puertos', label: 'Puertos/conexiones funcionan', categoria: 'funcionamiento' },
  { id: 'accesorios', label: 'Accesorios incluidos y funcionan', categoria: 'accesorios' },
  { id: 'cables', label: 'Cables/adaptadores incluidos', categoria: 'accesorios' },
  { id: 'carcasa', label: 'Carcasa/estructura sin daños', categoria: 'estetico' },
  { id: 'limpieza', label: 'Producto limpio y en buen estado', categoria: 'estetico' },
];

const categorias = {
  funcionamiento: { label: 'Funcionamiento', color: 'bg-blue-100 text-blue-800' },
  accesorios: { label: 'Accesorios', color: 'bg-purple-100 text-purple-800' },
  estetico: { label: 'Estado Estético', color: 'bg-orange-100 text-orange-800' }
};

const ModalChecklistEquipo = ({ equipo, isOpen, onClose, onComplete }) => {
  const [checklist, setChecklist] = useState({});
  const [observaciones, setObservaciones] = useState('');

  // Función para obtener el checklist correcto según el tipo
  const getChecklistPorTipo = (tipo) => {
    switch (tipo) {
      case 'notebook':
        return checklistNotebook;
      case 'celular':
        return checklistCelular;
      case 'otros':
        return checklistOtros;
      default:
        return checklistNotebook;
    }
  };

  const checklistActual = getChecklistPorTipo(equipo?.tipo);

  // Función para obtener el título según el tipo
  const getTituloPorTipo = (tipo) => {
    switch (tipo) {
      case 'notebook':
        return 'Checklist de Testeo - Notebook';
      case 'celular':
        return 'Checklist de Testeo - Celular';
      case 'otros':
        return 'Checklist de Testeo - Producto';
      default:
        return 'Checklist de Testeo';
    }
  };
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (equipo && isOpen) {
      // Cargar checklist existente si existe
      const checklistData = equipo.checklist_data || {};
      setChecklist(checklistData);
      setObservaciones(equipo.observaciones_testeo || '');
    }
  }, [equipo, isOpen]);

  const handleCheckChange = (itemId, status) => {
    setChecklist(prev => ({
      ...prev,
      [itemId]: status
    }));
  };

  const calcularResultado = () => {
    // Filtrar claves especiales que empiezan con _ (como _precios)
    const itemsChecklist = Object.keys(checklist).filter(k => !k.startsWith('_'));
    const itemsCompletados = itemsChecklist.length;
    const itemsFuncionando = Object.entries(checklist)
      .filter(([k, v]) => !k.startsWith('_') && v === 'si').length;

    if (itemsCompletados < checklistActual.length) {
      return { resultado: 'pendiente', porcentaje: 0 };
    }

    const porcentaje = (itemsFuncionando / checklistActual.length) * 100;

    if (porcentaje >= 90) {
      return { resultado: 'aprobado', porcentaje };
    } else if (porcentaje >= 70) {
      return { resultado: 'condicional', porcentaje };
    } else {
      return { resultado: 'rechazado', porcentaje };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { resultado, porcentaje } = calcularResultado();

      // Actualizar equipo con checklist completado
      const { error } = await supabase
        .from('testeo_equipos')
        .update({
          checklist_data: checklist,
          checklist_completado: true,
          estado_testeo: resultado,
          observaciones_testeo: observaciones,
          fecha_testeo: new Date().toISOString()
        })
        .eq('id', equipo.id);

      if (error) throw error;

      alert(`Checklist completado. Resultado: ${resultado.toUpperCase()} (${porcentaje.toFixed(1)}%)`);
      onComplete();
      onClose();
    } catch (err) {
      console.error('Error guardando checklist:', err);
      alert('Error al guardar el checklist: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const itemsChecklistKeys = Object.keys(checklist).filter(k => !k.startsWith('_'));
  const itemsCompletados = itemsChecklistKeys.length;
  const itemsFuncionando = Object.entries(checklist)
    .filter(([k, v]) => !k.startsWith('_') && v === 'si').length;
  const progreso = checklistActual.length > 0 ? (itemsCompletados / checklistActual.length) * 100 : 0;
  const { resultado, porcentaje } = calcularResultado();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {getTituloPorTipo(equipo?.tipo)}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {equipo?.marca} {equipo?.modelo} - S/N: {equipo?.serial || 'Sin serial'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progreso: {itemsCompletados}/{checklistActual.length} items</span>
              <span>{progreso.toFixed(0)}% completado</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
          </div>

          {/* Resultado preliminar */}
          {itemsCompletados === checklistActual.length && (
            <div className={`mt-4 p-3 rounded-lg ${resultado === 'aprobado' ? 'bg-emerald-100 text-emerald-800' :
              resultado === 'condicional' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
              <div className="flex items-center space-x-2">
                {resultado === 'aprobado' ? <CheckCircle className="w-5 h-5" /> :
                  resultado === 'condicional' ? <AlertTriangle className="w-5 h-5" /> :
                    <XCircle className="w-5 h-5" />}
                <span className="font-medium">
                  Resultado: {resultado.toUpperCase()} ({porcentaje.toFixed(1)}% funcionando)
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Checklist por categorías */}
          {Object.entries(categorias).map(([categoriaKey, categoria]) => {
            const itemsCategoria = checklistActual.filter(item => item.categoria === categoriaKey);

            return (
              <div key={categoriaKey} className="mb-6">
                <h4 className={`text-sm font-medium px-3 py-1 rounded-full inline-block mb-4 ${categoria.color}`}>
                  {categoria.label}
                </h4>

                <div className="space-y-3">
                  {itemsCategoria.map((item) => {
                    const estado = checklist[item.id];

                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <span className="text-slate-800 font-medium">{item.label}</span>

                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleCheckChange(item.id, 'si')}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${estado === 'si'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                              }`}
                          >
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Sí
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCheckChange(item.id, 'no')}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${estado === 'no'
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-red-600 text-red-600 hover:bg-red-50'
                              }`}
                          >
                            <XCircle className="w-4 h-4 inline mr-1" />
                            No
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCheckChange(item.id, 'parcial')}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${estado === 'parcial'
                              ? 'border-yellow-600 bg-yellow-600 text-white'
                              : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'
                              }`}
                          >
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Parcial
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Observaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observaciones del Testeo
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              rows="4"
              placeholder="Detalles sobre problemas encontrados, condiciones especiales, etc."
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || itemsCompletados < checklistActual.length}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving ? 'Guardando...' :
                  itemsCompletados < checklistActual.length ?
                    `Completar checklist (${checklistActual.length - itemsCompletados} pendientes)` :
                    'Guardar Checklist'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalChecklistEquipo;