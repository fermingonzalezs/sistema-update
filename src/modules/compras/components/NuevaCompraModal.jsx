import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const NuevaCompraModal = ({ isOpen, onClose, onSave, isLoading = false, isEditing = false, reciboInicial = null }) => {
  const METODOS_PAGO = [
    { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
    { value: 'dolares_billete', label: '💸 Dólares Billete' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'criptomonedas', label: '₿ Criptomonedas' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
    { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' }
  ];

  const [formRecibo, setFormRecibo] = useState({
    proveedor: reciboInicial?.proveedor || '',
    fecha_compra: reciboInicial?.fecha_compra || new Date().toISOString().split('T')[0],
    metodo_pago: reciboInicial?.metodo_pago || 'transferencia',
    observaciones: reciboInicial?.observaciones || ''
  });

  const [formItem, setFormItem] = useState({
    producto: '',
    cantidad: 1,
    serial: '',
    precio_unitario: '',
    descripcion: '',
    filasUnicas: true
  });

  const [items, setItems] = useState(reciboInicial?.compras_items || []);

  const agregarItem = () => {
    if (!formItem.producto.trim() || !formItem.cantidad || !formItem.precio_unitario) {
      alert('Completa todos los campos obligatorios del item');
      return;
    }

    const cantidad = parseInt(formItem.cantidad);
    const precio = parseFloat(formItem.precio_unitario);
    const nuevosItems = [];

    if (formItem.filasUnicas) {
      // Crear una fila por cada unidad
      for (let i = 0; i < cantidad; i++) {
        nuevosItems.push({
          id: Date.now() + i,
          producto: formItem.producto.trim(),
          cantidad: 1,
          serial: formItem.serial.trim() || null,
          precio_unitario: precio,
          precio_total: precio,
          descripcion: formItem.descripcion.trim() || null
        });
      }
    } else {
      // Agregar como una sola fila con cantidad total
      nuevosItems.push({
        id: Date.now(),
        producto: formItem.producto.trim(),
        cantidad: cantidad,
        serial: formItem.serial.trim() || null,
        precio_unitario: precio,
        precio_total: cantidad * precio,
        descripcion: formItem.descripcion.trim() || null
      });
    }

    setItems([...items, ...nuevosItems]);
    setFormItem({
      producto: '',
      cantidad: 1,
      serial: '',
      precio_unitario: '',
      descripcion: '',
      filasUnicas: true
    });
  };

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const actualizarSerial = (id, nuevoSerial) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, serial: nuevoSerial } : item
    ));
  };

  const calcularTotalItems = () => {
    return items.reduce((sum, item) => sum + item.precio_total, 0);
  };

  const handleGuardar = async () => {
    if (!formRecibo.proveedor.trim()) {
      alert('El proveedor es requerido');
      return;
    }
    if (items.length === 0) {
      alert('Debe agregar al menos un item');
      return;
    }

    await onSave({
      proveedor: formRecibo.proveedor,
      fecha_compra: formRecibo.fecha_compra,
      metodo_pago: formRecibo.metodo_pago,
      observaciones: formRecibo.observaciones
    }, items);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-semibold">{isEditing ? 'Editar Compra Local' : 'Nueva Compra Local'}</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" disabled={isLoading}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* DATOS GENERALES */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Datos Generales</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* PROVEEDOR */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
                  <input
                    type="text"
                    value={formRecibo.proveedor}
                    onChange={(e) => setFormRecibo({ ...formRecibo, proveedor: e.target.value })}
                    placeholder="Nombre del proveedor"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* FECHA */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Compra *</label>
                  <input
                    type="date"
                    value={formRecibo.fecha_compra}
                    onChange={(e) => setFormRecibo({ ...formRecibo, fecha_compra: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* MÉTODO DE PAGO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago *</label>
                  <select
                    value={formRecibo.metodo_pago}
                    onChange={(e) => setFormRecibo({ ...formRecibo, metodo_pago: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {METODOS_PAGO.map(metodo => (
                      <option key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OBSERVACIONES */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                  <textarea
                    value={formRecibo.observaciones}
                    onChange={(e) => setFormRecibo({ ...formRecibo, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales..."
                    rows="2"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AGREGAR ITEMS */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Agregar Productos</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Producto/Descripción *</label>
                  <input
                    type="text"
                    value={formItem.producto}
                    onChange={(e) => setFormItem({ ...formItem, producto: e.target.value })}
                    placeholder="Ej: Mouse Logitech MX"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    value={formItem.cantidad}
                    onChange={(e) => setFormItem({ ...formItem, cantidad: e.target.value })}
                    min="1"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial/Código (opcional)</label>
                  <input
                    type="text"
                    value={formItem.serial}
                    onChange={(e) => setFormItem({ ...formItem, serial: e.target.value })}
                    placeholder="ABC123456"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formItem.precio_unitario}
                    onChange={(e) => setFormItem({ ...formItem, precio_unitario: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="filasUnicas"
                  checked={formItem.filasUnicas}
                  onChange={(e) => setFormItem({ ...formItem, filasUnicas: e.target.checked })}
                  className="w-5 h-5 cursor-pointer accent-emerald-600 rounded"
                />
                <label htmlFor="filasUnicas" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Filas únicas
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Adicional (opcional)</label>
                <textarea
                  value={formItem.descripcion}
                  onChange={(e) => setFormItem({ ...formItem, descripcion: e.target.value })}
                  placeholder="Notas sobre el producto..."
                  rows="2"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={agregarItem}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Agregar Producto
              </button>
            </div>
          </div>

          {/* TABLA DE ITEMS */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                <h4 className="font-semibold text-slate-800 uppercase">Productos Agregados</h4>
              </div>
              <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Serial</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-slate-800">{item.producto}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.cantidad}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.serial || ''}
                            onChange={(e) => actualizarSerial(item.id, e.target.value)}
                            placeholder="Serial/Código"
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">${parseFloat(item.precio_unitario).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">${item.precio_total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-600">{item.descripcion || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t border-slate-200">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                        TOTAL:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                        ${calcularTotalItems().toFixed(2)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* BOTONES */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              disabled={isLoading || items.length === 0}
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Compra' : 'Crear Compra')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevaCompraModal;
