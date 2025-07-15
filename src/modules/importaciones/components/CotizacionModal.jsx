// Refactored CotizacionModal - Simplified and componentized
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calculator, DollarSign, AlertCircle } from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters.js';
import { useCotizacionCalculator } from '../hooks/useCotizacionCalculator';
import CotizacionFormFields from './CotizacionFormFields';
import CotizacionCalculator from './CotizacionCalculator';

const CotizacionModal = ({ isOpen, onClose, onSave, cotizacion = null }) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    descripcion: '',
    link_producto: '',
    proveedor_nombre: '',
    precio_compra_usd: '',
    peso_estimado_kg: '',
    impuestos_usa_porcentaje: '0',
    envio_usa_fijo: '0',
    envio_arg_fijo: '0',
    precio_por_kg: ''
  });

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Usar el hook para cálculos
  const { totalCalculado } = useCotizacionCalculator(formData);

  // Reiniciar form cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (cotizacion) {
        // Modo edición
        setFormData({
          cliente_id: cotizacion.cliente_id || '',
          descripcion: cotizacion.descripcion || '',
          link_producto: cotizacion.link_producto || '',
          proveedor_nombre: cotizacion.proveedor_nombre || '',
          precio_compra_usd: cotizacion.precio_compra_usd?.toString() || '',
          peso_estimado_kg: cotizacion.peso_estimado_kg?.toString() || '',
          impuestos_usa_porcentaje: cotizacion.impuestos_usa_porcentaje?.toString() || '0',
          envio_usa_fijo: cotizacion.envio_usa_fijo?.toString() || '0',
          envio_arg_fijo: cotizacion.envio_arg_fijo?.toString() || '0',
          precio_por_kg: cotizacion.precio_por_kg?.toString() || ''
        });
        setSelectedCliente(cotizacion.clientes || null);
      } else {
        // Modo creación - resetear formulario
        setFormData({
          cliente_id: '',
          descripcion: '',
          link_producto: '',
          proveedor_nombre: '',
          precio_compra_usd: '',
          peso_estimado_kg: '',
          impuestos_usa_porcentaje: '0',
          envio_usa_fijo: '0',
          envio_arg_fijo: '0',
          precio_por_kg: ''
        });
        setSelectedCliente(null);
      }
      setErrors({});
    }
  }, [isOpen, cotizacion]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Cliente es obligatorio';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'Descripción es obligatoria';
    }
    if (!formData.precio_compra_usd || parseFloat(formData.precio_compra_usd) <= 0) {
      newErrors.precio_compra_usd = 'Precio de compra debe ser mayor a 0';
    }
    if (!formData.peso_estimado_kg || parseFloat(formData.peso_estimado_kg) <= 0) {
      newErrors.peso_estimado_kg = 'Peso estimado debe ser mayor a 0';
    }
    if (!formData.precio_por_kg || parseFloat(formData.precio_por_kg) <= 0) {
      newErrors.precio_por_kg = 'Precio por kg debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const cotizacionData = {
        ...formData,
        precio_compra_usd: parseFloat(formData.precio_compra_usd),
        peso_estimado_kg: parseFloat(formData.peso_estimado_kg),
        impuestos_usa_porcentaje: parseFloat(formData.impuestos_usa_porcentaje),
        envio_usa_fijo: parseFloat(formData.envio_usa_fijo),
        envio_arg_fijo: parseFloat(formData.envio_arg_fijo),
        precio_por_kg: parseFloat(formData.precio_por_kg),
        total_cotizado: totalCalculado
      };

      await onSave(cotizacionData);
      handleClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    onClose();
  };

  const formatCurrency = (amount) => formatearMonto(amount, 'USD');

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            <span>{cotizacion ? 'Editar Cotización' : 'Nueva Cotización'}</span>
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error de submit */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{errors.submit}</span>
            </div>
          )}

          {/* Campos del formulario */}
          <CotizacionFormFields
            formData={formData}
            setFormData={setFormData}
            selectedCliente={selectedCliente}
            setSelectedCliente={setSelectedCliente}
            errors={errors}
          />

          {/* Calculadora y Total */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Total Cotización</h3>
              <span className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalCalculado)}
              </span>
            </div>

            {totalCalculado > 0 && (
              <CotizacionCalculator 
                formData={formData} 
                totalCalculado={totalCalculado} 
              />
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : cotizacion ? 'Actualizar' : 'Crear Cotización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CotizacionModal;