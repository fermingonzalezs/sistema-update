import React, { useState, useEffect } from 'react';
import { Wrench, FileText, Plus, X, Package, DollarSign, Trash2, AlertCircle } from 'lucide-react';
import { useReparaciones } from '../hooks/useReparaciones';
import { supabase } from '../../../lib/supabase';
import { formatearMonto } from '../../../shared/utils/formatters';

function ModalPresupuesto({ open, onClose, reparacion }) {
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);
  
  const [servicioPersonalizado, setServicioPersonalizado] = useState({ nombre: '', precio: '' });
  const [repuestoPersonalizado, setRepuestoPersonalizado] = useState({ nombre: '', precio: '' });
  
  const [tabRepuestos, setTabRepuestos] = useState('stock');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const { guardarPresupuesto } = useReparaciones();

  const serviciosCatalogo = [
    { id: 1, nombre: 'Diagnóstico', categoria: 'Básico', precio: 25, descripcion: 'Evaluación inicial del equipo' },
    { id: 2, nombre: 'Limpieza interna', categoria: 'Mantenimiento', precio: 35, descripcion: 'Limpieza completa de componentes' },
    { id: 3, nombre: 'Cambio de placa madre', categoria: 'Reparación', precio: 150, descripcion: 'Reemplazo de placa madre defectuosa' },
    { id: 4, nombre: 'Instalación de SO', categoria: 'Software', precio: 40, descripcion: 'Instalación y configuración de sistema operativo' },
    { id: 5, nombre: 'Recuperación de datos', categoria: 'Datos', precio: 80, descripcion: 'Recuperación de archivos perdidos' },
    { id: 6, nombre: 'Reparación de pantalla', categoria: 'Reparación', precio: 120, descripcion: 'Cambio de pantalla LCD/LED' },
  ];

  const cargarRepuestos = async () => {
    try {
      const { data, error } = await supabase.from('repuestos').select('*').order('categoria');
      if (error) throw error;
      const repuestosMapeados = data.map(r => ({ 
        id: r.id, 
        nombre: r.nombre_producto, 
        categoria: r.categoria || 'S/C', 
        precio: r.precio_venta_usd || 0, 
        stock: (r.cantidad_la_plata || 0) + (r.cantidad_mitre || 0)
      })).filter(r => r.stock > 0);
      setRepuestos(repuestosMapeados);
    } catch (error) {
      console.error('Error cargando repuestos:', error);
    }
  };

  useEffect(() => {
    if (open) {
      setServicios(serviciosCatalogo);
      cargarRepuestos();
      if (reparacion) {
        const presupuesto = reparacion.presupuesto_json;
        if (presupuesto) {
          setServiciosSeleccionados(presupuesto.servicios || []);
          setRepuestosSeleccionados(presupuesto.repuestos || []);
          setObservaciones(presupuesto.observaciones || '');
        } else {
          setServiciosSeleccionados([]);
          setRepuestosSeleccionados([]);
          setObservaciones(`Presupuesto para ${reparacion.equipo_tipo} - ${reparacion.problema_reportado}`);
        }
      }
    }
  }, [open, reparacion]);

  if (!open) return null;

  const agregarItem = (item, tipo) => {
    const lista = tipo === 'servicio' ? serviciosSeleccionados : repuestosSeleccionados;
    const setLista = tipo === 'servicio' ? setServiciosSeleccionados : setRepuestosSeleccionados;
    const existente = lista.find(i => i.id === item.id);

    if (existente) {
      if (tipo === 'repuesto' && existente.cantidad >= item.stock) {
        alert(`Stock insuficiente. Solo hay ${item.stock} unidades.`);
        return;
      }
      setLista(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      const newItem = tipo === 'repuesto' 
        ? { ...item, cantidad: 1, stock_disponible: item.stock }
        : { ...item, cantidad: 1 };
      setLista(prev => [...prev, newItem]);
    }
  };

  const agregarItemPersonalizado = (tipo) => {
    const item = tipo === 'servicio' ? servicioPersonalizado : repuestoPersonalizado;
    if (!item.nombre.trim() || !item.precio) {
      alert(`Complete el nombre y precio del ${tipo}.`);
      return;
    }
    const setLista = tipo === 'servicio' ? setServiciosSeleccionados : setRepuestosSeleccionados;
    const nuevoItem = {
      id: `custom-${Date.now()}`,
      nombre: item.nombre,
      categoria: tipo === 'servicio' ? 'Personalizado' : 'Terceros',
      precio: parseFloat(item.precio),
      cantidad: 1,
      esPersonalizado: true
    };
    setLista(prev => [...prev, nuevoItem]);
    if (tipo === 'servicio') setServicioPersonalizado({ nombre: '', precio: '' });
    else setRepuestoPersonalizado({ nombre: '', precio: '' });
  };

  const actualizarCantidad = (id, cantidad, tipo) => {
    const setLista = tipo === 'servicio' ? setServiciosSeleccionados : setRepuestosSeleccionados;
    const lista = tipo === 'servicio' ? serviciosSeleccionados : repuestosSeleccionados;
    const cant = parseInt(cantidad);
    if (cant <= 0) {
      setLista(prev => prev.filter(i => i.id !== id));
      return;
    }
    const item = lista.find(i => i.id === id);
    if (tipo === 'repuesto' && item && cant > item.stock_disponible) {
      alert(`Stock insuficiente. Solo hay ${item.stock_disponible} unidades.`);
      return;
    }
    setLista(prev => prev.map(i => i.id === id ? { ...i, cantidad: cant } : i));
  };

  const eliminarItem = (id, tipo) => {
    const setLista = tipo === 'servicio' ? setServiciosSeleccionados : setRepuestosSeleccionados;
    setLista(prev => prev.filter(i => i.id !== id));
  };

  const subtotalServicios = serviciosSeleccionados.reduce((acc, s) => acc + (s.precio * s.cantidad), 0);
  const subtotalRepuestos = repuestosSeleccionados.reduce((acc, r) => acc + (r.precio * r.cantidad), 0);
  const total = subtotalServicios + subtotalRepuestos;

  const handleGuardarPresupuesto = async () => {
    if (serviciosSeleccionados.length === 0 && repuestosSeleccionados.length === 0) {
      alert('Debe agregar al menos un servicio o repuesto.');
      return;
    }
    const presupuestoData = { servicios: serviciosSeleccionados, repuestos: repuestosSeleccionados, subtotalServicios, subtotalRepuestos, total, observaciones, fechaCreacion: new Date().toISOString() };
    try {
      setLoading(true);
      await guardarPresupuesto(reparacion.id, presupuestoData);
      alert('✅ Presupuesto guardado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error guardando presupuesto:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderCatalogo = (items, tipo) => (
    <div className="space-y-2 h-48 overflow-y-auto p-1">
      {items.map(item => (
        <div key={item.id} onClick={() => agregarItem(item, tipo)} className="flex justify-between items-center p-2 border border-slate-200 rounded hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-800">{item.nombre}</p>
            <p className="text-xs text-slate-500">{item.categoria} {tipo === 'repuesto' && `(Stock: ${item.stock})`}</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">{formatearMonto(item.precio)}</p>
        </div>
      ))}
    </div>
  );

  const renderFormPersonalizado = (item, setItem, tipo) => (
    <div className="bg-slate-100 p-3 rounded border border-slate-200">
      <p className="text-sm font-medium text-slate-700 mb-2">Agregar {tipo} personalizado</p>
      <div className="flex gap-2">
        <input type="text" placeholder="Nombre" value={item.nombre} onChange={e => setItem({ ...item, nombre: e.target.value })} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500" />
        <input type="number" placeholder="Precio" value={item.precio} onChange={e => setItem({ ...item, precio: e.target.value })} className="w-24 text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500" />
        <button onClick={() => agregarItemPersonalizado(tipo)} className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center rounded-t">
          <h2 className="text-lg font-semibold flex items-center gap-3"><FileText className="w-6 h-6 text-slate-300" />{reparacion?.presupuesto_json ? 'Editar' : 'Crear'} Presupuesto</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {reparacion && <div className="p-3 bg-slate-100 border-b border-slate-200 text-sm text-slate-600"><b>Reparación #{reparacion.numero}:</b> {reparacion.cliente_nombre} - {reparacion.equipo_tipo} {reparacion.equipo_modelo}</div>}

        <div className="flex-grow p-4 grid md:grid-cols-2 gap-4 overflow-hidden">
          {/* Columna Izquierda: Catálogos */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="border border-slate-200 rounded p-3 bg-white">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-2"><Wrench className="w-5 h-5 text-slate-500" />Servicios</h3>
              {renderCatalogo(servicios, 'servicio')}
              <div className="mt-2">{renderFormPersonalizado(servicioPersonalizado, setServicioPersonalizado, 'servicio')}</div>
            </div>
            <div className="border border-slate-200 rounded p-3 bg-white">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-slate-500" />Repuestos</h3>
              {renderCatalogo(repuestos, 'repuesto')}
              <div className="mt-2">{renderFormPersonalizado(repuestoPersonalizado, setRepuestoPersonalizado, 'repuesto')}</div>
            </div>
          </div>

          {/* Columna Derecha: Presupuesto Actual */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-slate-500" />Resumen del Presupuesto</h3>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
              {[...serviciosSeleccionados, ...repuestosSeleccionados].length === 0 ? (
                <div className="text-center text-slate-500 pt-16">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p>Aún no hay items.</p>
                  <p className="text-sm">Agrega servicios o repuestos desde el panel izquierdo.</p>
                </div>
              ) : (
                <>
                  {serviciosSeleccionados.length > 0 && <p className="text-sm font-medium text-slate-600">Servicios</p>}
                  {serviciosSeleccionados.map(s => (
                    <div key={s.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                      <p className="flex-grow text-sm text-slate-800">{s.nombre}</p>
                      <input type="number" value={s.cantidad} onChange={e => actualizarCantidad(s.id, e.target.value, 'servicio')} className="w-16 text-center text-sm p-1 border rounded" />
                      <p className="w-24 text-right text-sm font-medium">{formatearMonto(s.precio * s.cantidad)}</p>
                      <button onClick={() => eliminarItem(s.id, 'servicio')} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {repuestosSeleccionados.length > 0 && <p className="text-sm font-medium text-slate-600 mt-2">Repuestos</p>}
                  {repuestosSeleccionados.map(r => (
                    <div key={r.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                      <p className="flex-grow text-sm text-slate-800">{r.nombre}</p>
                      <input type="number" value={r.cantidad} onChange={e => actualizarCantidad(r.id, e.target.value, 'repuesto')} className="w-16 text-center text-sm p-1 border rounded" />
                      <p className="w-24 text-right text-sm font-medium">{formatearMonto(r.precio * r.cantidad)}</p>
                      <button onClick={() => eliminarItem(r.id, 'repuesto')} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal Servicios:</span> <span className="font-medium">{formatearMonto(subtotalServicios)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Subtotal Repuestos:</span> <span className="font-medium">{formatearMonto(subtotalRepuestos)}</span></div>
              <div className="flex justify-between text-base font-semibold text-slate-800 border-t border-slate-300 pt-2 mt-2"><span >TOTAL:</span> <span>{formatearMonto(total)}</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Condiciones, notas, etc." rows="2" className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"></textarea>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 p-4 flex justify-end gap-4 border-t border-slate-200 rounded-b">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={handleGuardarPresupuesto} disabled={loading} className="px-6 py-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 flex items-center gap-2">
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FileText className="w-4 h-4" />} {loading ? 'Guardando...' : 'Guardar Presupuesto'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalPresupuesto;
