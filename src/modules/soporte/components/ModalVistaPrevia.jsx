import React from 'react';
import { X, FileDown, Send, ThumbsUp, Wrench, Package, DollarSign, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ModalVistaPrevia({ open, onClose, presupuestoData }) {
  if (!open || !presupuestoData) return null;

  const formatearFecha = (fecha) => {
    return new Date(fecha || Date.now()).toLocaleDateString('es-AR');
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  // Generar número de presupuesto
  const numeroPresupuesto = `UP-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;

  const handleDescargarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Configurar fuentes
    doc.setFont('helvetica');
    
    // Header empresarial
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text('UPDATE TECH WW SRL', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text('CUIT: 30-71825053-2', 20, 32);
    doc.text('Calle 15, N° 710 Oficina 10', 20, 37);
    doc.text('La Plata, Buenos Aires, Argentina', 20, 42);
    doc.text('221-641 9001', 20, 47);
    
    // Información del presupuesto (derecha)
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('Presupuesto de reparación', pageWidth - 20, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(`Fecha: ${formatearFecha()}`, pageWidth - 20, 32, { align: 'right' });
    doc.text(`N° de orden: ${numeroPresupuesto}`, pageWidth - 20, 37, { align: 'right' });
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 55, pageWidth - 20, 55);
    
    let currentY = 70;
    
    // Información del cliente y equipo
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Información del cliente', 20, currentY);
    doc.text('Información del equipo', pageWidth/2 + 10, currentY);
    
    currentY += 10;
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    
    // Cliente (columna izquierda)
    const clienteData = [
      ['Nombre:', presupuestoData.reparacion?.cliente_nombre || 'No especificado'],
      ['Teléfono:', presupuestoData.reparacion?.cliente_telefono || 'No especificado'],
      ['Email:', presupuestoData.reparacion?.cliente_email || 'No especificado'],
      ['DNI:', '-'],
      ['Dirección:', '-']
    ];
    
    clienteData.forEach(([label, value], index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, currentY + (index * 5));
      doc.setFont('helvetica', 'normal');
      doc.text(value, 50, currentY + (index * 5));
    });
    
    // Equipo (columna derecha)
    const equipoData = [
      ['Equipo:', presupuestoData.reparacion?.equipo_tipo || 'No especificado'],
      ['Marca:', presupuestoData.reparacion?.equipo_marca || 'No especificado'],
      ['Modelo:', presupuestoData.reparacion?.equipo_modelo || 'No especificado'],
      ['Serial:', presupuestoData.reparacion?.equipo_serial || 'No especificado'],
      ['Accesorios:', presupuestoData.reparacion?.accesorios_incluidos || 'No especificado']
    ];
    
    equipoData.forEach(([label, value], index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, pageWidth/2 + 10, currentY + (index * 5));
      doc.setFont('helvetica', 'normal');
      doc.text(value, pageWidth/2 + 40, currentY + (index * 5));
    });
    
    currentY += 35;
    
    // Falla reportada
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('Falla reportada', 20, currentY);
    currentY += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    const problema = presupuestoData.reparacion?.problema_reportado || 'No se especificó problema';
    const problemaSplit = doc.splitTextToSize(problema, pageWidth - 40);
    doc.text(problemaSplit, 20, currentY);
    currentY += problemaSplit.length * 4 + 10;
    
    // Servicios
    if (presupuestoData.servicios?.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('Servicios de reparación', 20, currentY);
      currentY += 10;
      
      const serviciosTableData = presupuestoData.servicios.map(servicio => [
        servicio.nombre,
        servicio.cantidad.toString(),
        `$${servicio.precio.toFixed(2)}`,
        `$${(servicio.precio * servicio.cantidad).toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: currentY,
        head: [['Descripción del servicio', 'Cantidad', 'Precio unitario', 'Precio total']],
        body: serviciosTableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    }
    
    // Repuestos
    if (presupuestoData.repuestos?.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('Repuestos necesarios', 20, currentY);
      currentY += 10;
      
      const repuestosTableData = presupuestoData.repuestos.map(repuesto => [
        repuesto.nombre,
        repuesto.cantidad.toString(),
        repuesto.esTercero ? 'Tercero' : 'Stock',
        `$${repuesto.precio.toFixed(2)}`,
        `$${(repuesto.precio * repuesto.cantidad).toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: currentY,
        head: [['Descripción del repuesto', 'Cantidad', 'Origen', 'Precio unitario', 'Precio total']],
        body: repuestosTableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    }
    
    // Totales
    currentY += 5;
    const totalBoxX = pageWidth - 80;
    const totalBoxY = currentY;
    const totalBoxWidth = 60;
    const totalBoxHeight = 35;
    
    // Fondo del recuadro de totales
    doc.setFillColor(240, 240, 240);
    doc.rect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    
    let totalY = totalBoxY + 8;
    doc.text('Subtotal servicios:', totalBoxX + 2, totalY);
    doc.text(`$${presupuestoData.subtotalServicios.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalY, { align: 'right' });
    
    totalY += 5;
    doc.text('Subtotal repuestos:', totalBoxX + 2, totalY);
    doc.text(`$${presupuestoData.subtotalRepuestos.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalY, { align: 'right' });
    
    totalY += 5;
    doc.text(`Margen (${presupuestoData.margenGanancia}%):`, totalBoxX + 2, totalY);
    doc.text(`$${presupuestoData.margenValor.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalY, { align: 'right' });
    
    // Línea separadora
    totalY += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(totalBoxX + 2, totalY, totalBoxX + totalBoxWidth - 2, totalY);
    
    totalY += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('TOTAL:', totalBoxX + 2, totalY);
    doc.text(`$${presupuestoData.total.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalY, { align: 'right' });
    
    // Nueva página si es necesario
    if (currentY + 60 > pageHeight - 30) {
      doc.addPage();
      currentY = 30;
    } else {
      currentY += 50;
    }
    
    // Condiciones
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('Condiciones y garantías', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(8);
    doc.setTextColor(51, 51, 51);
    const condiciones = [
      '• Validez del presupuesto: 15 días corridos desde la fecha de emisión.',
      '• Tiempo de entrega estimado: 5 a 10 días hábiles desde la aprobación del presupuesto.',
      '• Garantía: 90 días sobre el servicio realizado y repuestos instalados.',
      '• Forma de pago: 50% al aprobar el presupuesto, 50% al retirar el equipo.',
      '• Los repuestos de terceros pueden tener tiempos de entrega extendidos.'
    ];
    
    condiciones.forEach((condicion, index) => {
      const condicionSplit = doc.splitTextToSize(condicion, pageWidth - 40);
      doc.text(condicionSplit, 20, currentY + (index * 8));
    });
    
    currentY += condiciones.length * 8 + 10;
    
    // Observaciones si existen
    if (presupuestoData.observaciones) {
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('Observaciones adicionales', 20, currentY);
      currentY += 8;
      
      doc.setFontSize(8);
      doc.setTextColor(51, 51, 51);
      const obsSplit = doc.splitTextToSize(presupuestoData.observaciones, pageWidth - 40);
      doc.text(obsSplit, 20, currentY);
      currentY += obsSplit.length * 4 + 10;
    }
    
    // Pie del documento
    const footerY = pageHeight - 30;
    doc.setFontSize(7);
    doc.setTextColor(102, 102, 102);
    doc.text('Email: info@updatetech.com.ar | Web: www.updatetech.com.ar', 20, footerY);
    
    // Línea para firma
    doc.setDrawColor(150, 150, 150);
    doc.line(pageWidth - 80, footerY - 10, pageWidth - 20, footerY - 10);
    doc.setFontSize(8);
    doc.text('Firma y aclaración', pageWidth - 50, footerY - 5, { align: 'center' });
    doc.text('UPDATE TECH WW SRL', pageWidth - 50, footerY, { align: 'center' });
    
    // Guardar el PDF
    doc.save(`Presupuesto_${numeroPresupuesto}_${presupuestoData.reparacion?.cliente_nombre || 'Cliente'}.pdf`);
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
            <div className="flex items-start justify-between mb-8">
              {/* Logo y datos de la empresa */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">UT</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">UPDATE TECH WW SRL</h1>
                    <p className="text-sm text-gray-600">CUIT: 30-71825053-2</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Calle 15, N° 710 Oficina 10</p>
                  <p>La Plata, Buenos Aires, Argentina</p>
                  <p>221-641 9001</p>
                </div>
              </div>

              {/* Información del presupuesto */}
              <div className="text-right">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-4">
                  <h2 className="text-xl font-bold">Presupuesto de reparación</h2>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Fecha:</span> {formatearFecha()}</p>
                  <p><span className="font-medium">N° de orden:</span> {numeroPresupuesto}</p>
                </div>
              </div>
            </div>

            {/* Información del cliente y equipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Información del cliente */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">
                  Información del cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Nombre:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.cliente_nombre || 'No especificado'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Teléfono:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.cliente_telefono || 'No especificado'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.cliente_email || 'No especificado'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">DNI:</span>
                    <span className="col-span-2">-</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Dirección:</span>
                    <span className="col-span-2">-</span>
                  </div>
                </div>
              </div>

              {/* Información del equipo */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">
                  Información del equipo
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Equipo:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.equipo_tipo || 'No especificado'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Marca:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.equipo_marca || 'No especificado'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Modelo:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.equipo_modelo || 'No especificado'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Serial:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.equipo_serial || 'No especificado'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-700">Accesorios:</span>
                    <span className="col-span-2">{presupuestoData.reparacion?.accesorios_incluidos || 'No especificado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Falla reportada */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">
                Falla reportada
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  {presupuestoData.reparacion?.problema_reportado || 'No se especificó problema'}
                </p>
              </div>
            </div>

            {/* Tabla de servicios */}
            {presupuestoData.servicios?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Servicios de reparación
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">Descripción</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Cantidad</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-700">Precio unitario</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-700">Precio total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presupuestoData.servicios.map((servicio, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3">
                            <div>
                              <div className="font-medium">{servicio.nombre}</div>
                              <div className="text-xs text-gray-500">{servicio.categoria}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{servicio.cantidad}</td>
                          <td className="border border-gray-300 px-4 py-3 text-right">{formatearMoneda(servicio.precio)}</td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-medium">{formatearMoneda(servicio.precio * servicio.cantidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabla de repuestos */}
            {presupuestoData.repuestos?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Repuestos necesarios
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">Descripción</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Cantidad</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Origen</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-700">Precio unitario</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-700">Precio total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presupuestoData.repuestos.map((repuesto, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3">
                            <div>
                              <div className="font-medium">{repuesto.nombre}</div>
                              <div className="text-xs text-gray-500">{repuesto.categoria}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{repuesto.cantidad}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              repuesto.esTercero ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {repuesto.esTercero ? 'Tercero' : 'Stock'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right">{formatearMoneda(repuesto.precio)}</td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-medium">{formatearMoneda(repuesto.precio * repuesto.cantidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resumen de costos */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Resumen del presupuesto
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-700">Subtotal servicios:</span>
                      <span className="font-medium">{formatearMoneda(presupuestoData.subtotalServicios)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-700">Subtotal repuestos:</span>
                      <span className="font-medium">{formatearMoneda(presupuestoData.subtotalRepuestos)}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-3">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-medium">{formatearMoneda(presupuestoData.subtotal)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-700">Margen de ganancia ({presupuestoData.margenGanancia}%):</span>
                      <span className="font-medium">{formatearMoneda(presupuestoData.margenValor)}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-3">
                      <div className="flex justify-between py-2">
                        <span className="text-lg font-bold text-blue-700">TOTAL:</span>
                        <span className="text-lg font-bold text-blue-700">{formatearMoneda(presupuestoData.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {presupuestoData.observaciones && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">
                  Observaciones adicionales
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{presupuestoData.observaciones}</p>
                </div>
              </div>
            )}

            {/* Condiciones y términos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">
                Condiciones y garantías
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2">
                <p><span className="font-medium">• Validez del presupuesto:</span> 15 días corridos desde la fecha de emisión.</p>
                <p><span className="font-medium">• Tiempo de entrega estimado:</span> 5 a 10 días hábiles desde la aprobación del presupuesto (sujeto a disponibilidad de repuestos).</p>
                <p><span className="font-medium">• Garantía:</span> 90 días sobre el servicio realizado y repuestos instalados.</p>
                <p><span className="font-medium">• Forma de pago:</span> 50% al aprobar el presupuesto, 50% al retirar el equipo.</p>
                <p><span className="font-medium">• Importante:</span> Los repuestos de terceros pueden tener tiempos de entrega extendidos.</p>
              </div>
            </div>

            {/* Pie del documento */}
            <div className="border-t border-gray-300 pt-6">
              <div className="text-xs text-gray-500 mb-4">
                <p>Si el equipo no fuera retirado dentro de los 90 días, a partir de la fecha de ingreso al taller, será considerado abandonado, perdiendo todo tipo de derecho de propiedad sobre el mismo y/o sobre los materiales que contiene. De ello se dispondrá en el concepto de gastos por depósito y estadía.</p>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Email:</span> info@updatetech.com.ar</p>
                  <p><span className="font-medium">Web:</span> www.updatetech.com.ar</p>
                </div>
                
                <div className="text-center">
                  <div className="w-48 border-t border-gray-400 mb-2"></div>
                  <p className="text-sm font-medium text-gray-700">Firma y aclaración</p>
                  <p className="text-xs text-gray-500">UPDATE TECH WW SRL</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleDescargarPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileDown size={16} />
            Generar PDF
          </button>
          <button
            onClick={handleEnviarEmail}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Send size={16} />
            Enviar por Email
          </button>
          <button
            onClick={handleAprobar}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
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