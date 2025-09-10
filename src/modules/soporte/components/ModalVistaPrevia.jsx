import React from 'react';
import { X, FileDown, Send, ThumbsUp, Wrench, Package, DollarSign, Printer } from 'lucide-react';
import { generarYDescargarPresupuesto as abrirPresupuestoPDF } from './pdf/PresupuestoReparacionPDF.jsx';

function ModalVistaPrevia({ open, onClose, presupuestoData }) {
  if (!open || !presupuestoData) return null;

  const formatearFecha = (fecha) => {
    return new Date(fecha || Date.now()).toLocaleDateString('es-AR');
  };

  const formatearMoneda = (valor) => {
    const numero = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
    
    return `US$ ${numero}`;
  };

  // Generar número de presupuesto
  const numeroPresupuesto = `UP-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;

  const handleDescargarPDF = async () => {
    try {
      const resultado = await abrirPresupuestoPDF(presupuestoData.reparacion, presupuestoData);
      if (!resultado.success) {
        alert('Error al generar el PDF: ' + resultado.error);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    }
  };

  const handleEnviarEmail = () => {
    // Implementar envío por email
    alert('Funcionalidad de envío por email próximamente');
  };

  const handleAprobar = () => {
    // Implementar aprobación del presupuesto
    alert('Presupuesto aprobado');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h3 className="text-xl font-semibold">Vista Previa del Presupuesto</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDescargarPDF}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
              title="Generar PDF"
            >
              <FileDown size={16} />
              PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido del modal - Vista previa */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="p-8 bg-white">
            {/* Header empresarial */}
            <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-200">
              {/* Logo y datos de la empresa */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">UPDATE TECH WW SRL</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Avenida 44 N° 862 1/2 Piso 4</p>
                  <p>La Plata, Buenos Aires, Argentina</p>
                  <p>Tel: 221-641-9901 • CUIT: 30-71850553-2</p>
                </div>
              </div>

              {/* Información del presupuesto */}
              <div className="text-right bg-gray-50 p-4 rounded border-l-4 border-gray-800">
                <h2 className="text-xl font-bold text-gray-800 mb-1">PRESUPUESTO</h2>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Reparación de Equipos</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>N° {numeroPresupuesto}</p>
                  <p>Fecha: {formatearFecha()}</p>
                  <p>Orden: {presupuestoData.reparacion?.numero || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Información del cliente y equipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Información del cliente */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
                  Cliente
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-gray-800">{presupuestoData.reparacion?.cliente_nombre || 'No especificado'}</div>
                  {presupuestoData.reparacion?.cliente_telefono && (
                    <div className="text-gray-600">Tel: {presupuestoData.reparacion.cliente_telefono}</div>
                  )}
                  {presupuestoData.reparacion?.cliente_email && (
                    <div className="text-gray-600">Email: {presupuestoData.reparacion.cliente_email}</div>
                  )}
                </div>
              </div>

              {/* Información del equipo */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
                  Equipo
                </h3>
                <div className="space-y-1 text-sm">
                  {presupuestoData.reparacion?.equipo_tipo && (
                    <div className="text-gray-600">Tipo: {presupuestoData.reparacion.equipo_tipo}</div>
                  )}
                  {presupuestoData.reparacion?.equipo_marca && (
                    <div className="text-gray-600">Marca: {presupuestoData.reparacion.equipo_marca}</div>
                  )}
                  {presupuestoData.reparacion?.equipo_modelo && (
                    <div className="text-gray-600">Modelo: {presupuestoData.reparacion.equipo_modelo}</div>
                  )}
                  {presupuestoData.reparacion?.equipo_serial && (
                    <div className="text-gray-600">Serial: {presupuestoData.reparacion.equipo_serial}</div>
                  )}
                  {presupuestoData.reparacion?.accesorios_incluidos && (
                    <div className="text-gray-600">Accesorios: {presupuestoData.reparacion.accesorios_incluidos}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnóstico */}
            {(presupuestoData.reparacion?.problema_reportado || presupuestoData.reparacion?.diagnostico) && (
              <div className="mb-6 bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                {presupuestoData.reparacion?.problema_reportado && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Falla Reportada</h4>
                    <p className="text-sm text-gray-700 mb-3">{presupuestoData.reparacion.problema_reportado}</p>
                  </>
                )}
                {presupuestoData.reparacion?.diagnostico && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Diagnóstico</h4>
                    <p className="text-sm text-gray-700">{presupuestoData.reparacion.diagnostico}</p>
                  </>
                )}
              </div>
            )}

            {/* Tabla de servicios y repuestos */}
            <div className="mb-6">
              <div className="border border-gray-300 rounded">
                <div className="bg-gray-800 text-white px-3 py-2">
                  <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wide">
                    <div className="col-span-6">Descripción</div>
                    <div className="col-span-2 text-center">Cant.</div>
                    <div className="col-span-2 text-right">Precio Unit.</div>
                    <div className="col-span-2 text-right">Importe</div>
                  </div>
                </div>
                
                {/* Servicios */}
                {presupuestoData.servicios && presupuestoData.servicios.map((servicio, index) => (
                  <div key={`servicio-${index}`} className="border-b border-gray-200 px-3 py-3">
                    <div className="grid grid-cols-12 gap-2 text-sm">
                      <div className="col-span-6">
                        <div className="font-medium text-gray-800">{servicio.nombre}</div>
                        {servicio.categoria && (
                          <div className="text-xs text-gray-500">{servicio.categoria}</div>
                        )}
                      </div>
                      <div className="col-span-2 text-center text-gray-700">{servicio.cantidad}</div>
                      <div className="col-span-2 text-right font-medium text-gray-800">{formatearMoneda(servicio.precio)}</div>
                      <div className="col-span-2 text-right font-medium text-gray-800">{formatearMoneda(servicio.precio * servicio.cantidad)}</div>
                    </div>
                  </div>
                ))}

                {/* Repuestos */}
                {presupuestoData.repuestos && presupuestoData.repuestos.map((repuesto, index) => (
                  <div key={`repuesto-${index}`} className="border-b border-gray-200 px-3 py-3">
                    <div className="grid grid-cols-12 gap-2 text-sm">
                      <div className="col-span-6">
                        <div className="font-medium text-gray-800">{repuesto.nombre}</div>
                        {repuesto.esTercero && (
                          <div className="text-xs text-orange-600">(Repuesto de tercero)</div>
                        )}
                      </div>
                      <div className="col-span-2 text-center text-gray-700">{repuesto.cantidad}</div>
                      <div className="col-span-2 text-right font-medium text-gray-800">{formatearMoneda(repuesto.precio)}</div>
                      <div className="col-span-2 text-right font-medium text-gray-800">{formatearMoneda(repuesto.precio * repuesto.cantidad)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="flex justify-end mb-6">
              <div className="w-80">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal servicios</span>
                    <span className="text-gray-800">{formatearMoneda(presupuestoData.subtotalServicios)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal repuestos</span>
                    <span className="text-gray-800">{formatearMoneda(presupuestoData.subtotalRepuestos)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatearMoneda(presupuestoData.subtotal)}</span>
                  </div>
                  <div className="bg-gray-800 text-white px-3 py-3 rounded mt-2 flex justify-between">
                    <span className="font-medium">TOTAL</span>
                    <span className="font-medium text-lg">{formatearMoneda(presupuestoData.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Condiciones y Observaciones */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Condiciones y Garantías</h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p>• Validez del presupuesto: 15 días corridos desde la fecha de emisión</p>
                <p>• Tiempo de entrega estimado: 5 a 10 días hábiles desde la aprobación del presupuesto</p>
                <p>• Garantía: 90 días sobre el servicio realizado y repuestos instalados</p>
                <p>• Forma de pago: 50% al aprobar el presupuesto, 50% al retirar el equipo</p>
                <p>• Los repuestos de terceros pueden tener tiempos de entrega extendidos</p>
              </div>
            </div>

            {presupuestoData.observaciones && (
              <div className="bg-red-50 p-4 rounded border-l-4 border-red-500 mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Observaciones Adicionales</h4>
                <p className="text-sm text-gray-700">{presupuestoData.observaciones}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-300 pt-4">
              <div className="text-xs text-gray-500 mb-3">
                <p>Si el equipo no fuera retirado dentro de los 90 días, a partir de la fecha de ingreso al taller, será considerado abandonado, perdiendo todo tipo de derecho de propiedad sobre el mismo y/o sobre los materiales que contiene. De ello se dispondrá en el concepto de gastos por depósito y estadía.</p>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-600">
                  <p>Email: info@updatetech.com.ar • Web: www.updatetech.com.ar</p>
                  <p>UPDATE TECH WW SRL • {formatearFecha()}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-32 border-t border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-600">Firma y aclaración</p>
                  <p className="text-xs text-gray-600">UPDATE TECH WW SRL</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleDescargarPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileDown size={16} />
            Generar PDF
          </button>
          <button
            onClick={handleEnviarEmail}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Send size={16} />
            Enviar por Email
          </button>
          <button
            onClick={handleAprobar}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ThumbsUp size={16} />
            Aprobar Presupuesto
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalVistaPrevia;