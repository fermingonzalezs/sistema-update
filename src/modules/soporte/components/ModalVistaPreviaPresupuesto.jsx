import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

const ModalVistaPreviaPresupuesto = ({ open, onClose, reparacion, presupuesto }) => {
  if (!open || !reparacion || !presupuesto) return null;

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const handleDescargarPDF = () => {
    const doc = new jsPDF();
    
    // Configurar fuente
    doc.setFont('helvetica');
    
    // Header empresarial mejorado
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('UPDATE TECH', 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text('Reparación de Equipos', 20, 35);
    doc.text('CUIT: 30-71826065-2', 20, 43);
    doc.text('Calle 13 N° 718 Oficina 10', 20, 51);
    doc.text('La Plata, Buenos Aires, Argentina', 20, 59);
    doc.text('221 641 9101', 20, 67);
    
    // Cuadro del título del presupuesto
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(130, 20, 60, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Presupuesto de', 135, 28, { align: 'left' });
    doc.text('reparación', 135, 36, { align: 'left' });
    
    // Información de la orden
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.text(`Ingreso: ${formatearFecha(reparacion.fecha_ingreso)}`, 135, 50);
    doc.text(`N° de orden: ${reparacion.numero}`, 135, 58);
    
    // Línea divisoria azul
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.line(20, 75, 190, 75);
    
    let yPos = 90;
    
    // Información del cliente y equipo en dos columnas
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del cliente', 20, yPos);
    doc.text('Información del equipo', 110, yPos);
    yPos += 10;
    
    // Cliente
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${reparacion.cliente_nombre}`, 20, yPos);
    doc.text(`Teléfono: ${reparacion.cliente_telefono || 'N/A'}`, 20, yPos + 6);
    doc.text(`Email: ${reparacion.cliente_email || 'N/A'}`, 20, yPos + 12);
    
    // Equipo
    doc.text(`Equipo: ${reparacion.equipo_tipo || 'N/A'}`, 110, yPos);
    doc.text(`Marca/Modelo: ${reparacion.equipo_marca || ''} ${reparacion.equipo_modelo || ''}`, 110, yPos + 6);
    doc.text(`Serial: ${reparacion.equipo_serial || 'N/A'}`, 110, yPos + 12);
    doc.text(`Accesorios: ${reparacion.accesorios_incluidos || 'Ninguno'}`, 110, yPos + 18);
    
    yPos += 35;
    
    // Diagnóstico (fondo gris)
    if (reparacion.problema_reportado || reparacion.diagnostico) {
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.rect(20, yPos - 5, 170, 25, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('Falla:', 25, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const fallaTexto = doc.splitTextToSize(reparacion.problema_reportado || 'N/A', 140);
      doc.text(fallaTexto, 45, yPos + 5);
      
      if (reparacion.diagnostico) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('Diagnóstico:', 25, yPos + 15);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const diagnosticoTexto = doc.splitTextToSize(reparacion.diagnostico, 140);
        doc.text(diagnosticoTexto, 70, yPos + 15);
      }
      
      yPos += 35;
    }
    
    // Tabla de items del presupuesto
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', 20, yPos);
    yPos += 10;
    
    // Encabezado de tabla
    doc.setFillColor(243, 244, 246); // Gray-100
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.setDrawColor(209, 213, 219); // Gray-300
    doc.setLineWidth(0.5);
    
    // Líneas de la tabla
    doc.line(20, yPos - 5, 190, yPos - 5); // Top
    doc.line(20, yPos + 5, 190, yPos + 5); // Bottom header
    doc.line(20, yPos - 5, 20, yPos + 5); // Left
    doc.line(110, yPos - 5, 110, yPos + 5); // Center
    doc.line(140, yPos - 5, 140, yPos + 5); // Center
    doc.line(165, yPos - 5, 165, yPos + 5); // Center
    doc.line(190, yPos - 5, 190, yPos + 5); // Right
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', 22, yPos + 1);
    doc.text('Cantidad', 115, yPos + 1);
    doc.text('P. Unit.', 145, yPos + 1);
    doc.text('P. Total', 170, yPos + 1);
    
    yPos += 10;
    
    // Items de servicios
    if (presupuesto.servicios && presupuesto.servicios.length > 0) {
      presupuesto.servicios.forEach(servicio => {
        const cantidad = servicio.cantidad || 1;
        const precioTotal = servicio.precio * cantidad;
        
        // Líneas de la tabla
        doc.line(20, yPos - 3, 190, yPos - 3);
        doc.line(20, yPos + 7, 190, yPos + 7);
        doc.line(20, yPos - 3, 20, yPos + 7);
        doc.line(110, yPos - 3, 110, yPos + 7);
        doc.line(140, yPos - 3, 140, yPos + 7);
        doc.line(165, yPos - 3, 165, yPos + 7);
        doc.line(190, yPos - 3, 190, yPos + 7);
        
        doc.setFont('helvetica', 'normal');
        doc.text(servicio.nombre, 22, yPos + 2);
        doc.text(cantidad.toString(), 120, yPos + 2);
        doc.text(`$${servicio.precio.toFixed(2)}`, 145, yPos + 2);
        doc.text(`$${precioTotal.toFixed(2)}`, 170, yPos + 2);
        
        yPos += 10;
      });
    }
    
    // Items de repuestos
    if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
      presupuesto.repuestos.forEach(repuesto => {
        const cantidad = repuesto.cantidad || 1;
        const precioTotal = repuesto.precio * cantidad;
        const nombreCompleto = repuesto.nombre + (repuesto.esTercero ? ' (Tercero)' : '');
        
        // Líneas de la tabla
        doc.line(20, yPos - 3, 190, yPos - 3);
        doc.line(20, yPos + 7, 190, yPos + 7);
        doc.line(20, yPos - 3, 20, yPos + 7);
        doc.line(110, yPos - 3, 110, yPos + 7);
        doc.line(140, yPos - 3, 140, yPos + 7);
        doc.line(165, yPos - 3, 165, yPos + 7);
        doc.line(190, yPos - 3, 190, yPos + 7);
        
        doc.setFont('helvetica', 'normal');
        doc.text(nombreCompleto, 22, yPos + 2);
        doc.text(cantidad.toString(), 120, yPos + 2);
        doc.text(`$${repuesto.precio.toFixed(2)}`, 145, yPos + 2);
        doc.text(`$${precioTotal.toFixed(2)}`, 170, yPos + 2);
        
        yPos += 10;
      });
    }
    
    // Cerrar tabla
    doc.line(20, yPos - 3, 190, yPos - 3);
    
    yPos += 10;
    
    // Totales (alineados a la derecha)
    const totalBoxX = 130;
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalBoxX, yPos);
    doc.text(`$${presupuesto.subtotal.toFixed(2)}`, 175, yPos);
    yPos += 8;
    
    doc.text(`Margen (${presupuesto.margenGanancia}%):`, totalBoxX, yPos);
    doc.text(`$${presupuesto.margenValor.toFixed(2)}`, 175, yPos);
    yPos += 10;
    
    // Línea divisoria para total
    doc.setLineWidth(1);
    doc.line(totalBoxX, yPos - 2, 190, yPos - 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('TOTAL:', totalBoxX, yPos + 5);
    doc.text(`$${presupuesto.total.toFixed(2)}`, 175, yPos + 5);
    
    yPos += 20;
    
    // Garantía y términos
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.setFont('helvetica', 'normal');
    doc.text('Garantía: 30 días', 20, yPos);
    doc.text('Tiempo de entrega: 30 días hábiles desde la aprobación del presupuesto', 20, yPos + 6);
    
    yPos += 15;
    
    // Observaciones
    if (presupuesto.observaciones) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Observaciones:', 20, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const observacionesTexto = doc.splitTextToSize(presupuesto.observaciones, 170);
      doc.text(observacionesTexto, 20, yPos);
      yPos += observacionesTexto.length * 5;
    }
    
    // Texto legal
    yPos += 10;
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Gray-400
    const textoLegal = doc.splitTextToSize(
      'Si el equipo no fuera retirado dentro de los 90 días, a partir de la fecha de ingreso al taller, será considerado abandonado, perdiendo todo tipo de derecho de propiedad sobre el mismo y/o sobre los materiales que contiene. De ello se dispondrá en el concepto de gastos por depósito y estadía.',
      170
    );
    doc.text(textoLegal, 20, yPos);
    
    // Firma al final
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(107, 114, 128);
    doc.setLineWidth(0.5);
    doc.line(65, pageHeight - 30, 145, pageHeight - 30);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Firma y aclaración: UPDATE TECH S.R.L', 105, pageHeight - 20, { align: 'center' });
    
    // Descargar PDF
    doc.save(`Presupuesto_${reparacion.numero}.pdf`);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold">Vista Previa del Presupuesto</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleImprimir}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={handleDescargarPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido del presupuesto */}
        <div className="p-8 bg-white" id="presupuesto-vista-previa">
          {/* Header empresarial */}
          <div className="border-b-2 border-blue-600 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-blue-600">UPDATE TECH</h1>
                <p className="text-gray-600">Reparación de Equipos</p>
                <p className="text-sm text-gray-500">CUIT: 30-71826065-2</p>
                <p className="text-sm text-gray-500">Calle 13 N° 718 Oficina 10</p>
                <p className="text-sm text-gray-500">La Plata, Buenos Aires, Argentina</p>
                <p className="text-sm text-gray-500">221 641 9101</p>
              </div>
              <div className="text-right">
                <div className="bg-blue-600 text-white px-4 py-2 rounded mb-2">
                  <h2 className="text-xl font-bold">Presupuesto de reparación</h2>
                </div>
                <p className="text-sm text-gray-600">Ingreso: {formatearFecha(reparacion.fecha_ingreso)}</p>
                <p className="text-sm text-gray-600">N° de orden: {reparacion.numero}</p>
              </div>
            </div>
          </div>

          {/* Información del cliente y equipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Información del cliente</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nombre:</span> {reparacion.cliente_nombre}</p>
                <p><span className="font-medium">Teléfono:</span> {reparacion.cliente_telefono}</p>
                <p><span className="font-medium">Email:</span> {reparacion.cliente_email || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Información del equipo</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Equipo:</span> {reparacion.equipo_tipo}</p>
                <p><span className="font-medium">Marca/Modelo:</span> {reparacion.equipo_marca} {reparacion.equipo_modelo}</p>
                <p><span className="font-medium">Serial:</span> {reparacion.equipo_serial || 'N/A'}</p>
                <p><span className="font-medium">Accesorios:</span> {reparacion.accesorios_incluidos || 'Ninguno'}</p>
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          {(reparacion.problema_reportado || reparacion.diagnostico) && (
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-800">Falla:</h4>
                  <p className="text-sm text-gray-700">{reparacion.problema_reportado}</p>
                </div>
                {reparacion.diagnostico && (
                  <div>
                    <h4 className="font-semibold text-gray-800">Diagnóstico:</h4>
                    <p className="text-sm text-gray-700">{reparacion.diagnostico}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabla de items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-3">Descripción</h3>
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Descripción</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Cantidad</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Precio Unitario</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Precio Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Servicios */}
                {presupuesto.servicios && presupuesto.servicios.map((servicio, index) => (
                  <tr key={`servicio-${index}`}>
                    <td className="border border-gray-300 px-4 py-2">{servicio.nombre}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{servicio.cantidad}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatearMoneda(servicio.precio)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatearMoneda(servicio.precio * servicio.cantidad)}</td>
                  </tr>
                ))}
                {/* Repuestos */}
                {presupuesto.repuestos && presupuesto.repuestos.map((repuesto, index) => (
                  <tr key={`repuesto-${index}`}>
                    <td className="border border-gray-300 px-4 py-2">
                      {repuesto.nombre}{repuesto.esTercero && ' (Tercero)'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{repuesto.cantidad}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatearMoneda(repuesto.precio)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatearMoneda(repuesto.precio * repuesto.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatearMoneda(presupuesto.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margen ({presupuesto.margenGanancia}%):</span>
                  <span>{formatearMoneda(presupuesto.margenValor)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL:</span>
                    <span className="text-blue-600">{formatearMoneda(presupuesto.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Garantía y términos */}
          <div className="text-sm text-gray-700 space-y-2 mb-6">
            <p><span className="font-medium">Garantía:</span> 30 días</p>
            <p><span className="font-medium">Tiempo de entrega:</span> 30 días hábiles desde la aprobación del presupuesto</p>
          </div>

          {/* Observaciones */}
          {presupuesto.observaciones && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Observaciones:</h4>
              <p className="text-sm text-gray-700">{presupuesto.observaciones}</p>
            </div>
          )}

          {/* Texto legal */}
          <div className="text-xs text-gray-600 mb-8">
            <p>
              Si el equipo no fuera retirado dentro de los 90 días, a partir de la fecha de ingreso al taller, será 
              considerado abandonado, perdiendo todo tipo de derecho de propiedad sobre el mismo y/o sobre los materiales 
              que contiene. De ello se dispondrá en el concepto de gastos por depósito y estadía.
            </p>
          </div>

          {/* Firma */}
          <div className="text-center">
            <div className="border-t border-gray-400 w-64 mx-auto pt-2">
              <p className="text-sm font-medium">Firma y aclaración: UPDATE TECH S.R.L</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVistaPreviaPresupuesto;