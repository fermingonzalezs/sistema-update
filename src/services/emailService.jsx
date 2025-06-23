// emailService.js
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';

class EmailReceiptService {
  constructor() {
    // Configurar EmailJS con la clave pública
    emailjs.init('H2PWp2ZNPXjz6AGsT');
    
    // IDs de configuración
    this.SERVICE_ID = 'service_79n27ne';
    this.TEMPLATE_ID = 'template_25xf5jy';
  }

  // Generar PDF del recibo
  generateReceiptPDF(ventaData, carrito) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Configuración de colores y fuentes
    const primaryColor = [37, 99, 235]; // Azul
    const secondaryColor = [75, 85, 99]; // Gris
    
    // Header con logo/empresa
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('UPDATE TECH', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Inventario', 20, 35);
    
    // Información de la venta
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE VENTA', 20, 60);
    
    // Línea divisoria
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 65, pageWidth - 20, 65);
    
    // Datos del recibo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const today = new Date();
    const receiptData = [
      [`Nº Transacción:`, ventaData.numeroTransaccion || `VT-${Date.now()}`],
      [`Fecha:`, today.toLocaleDateString('es-ES')],
      [`Hora:`, today.toLocaleTimeString('es-ES')],
      [`Cliente:`, ventaData.cliente_nombre],
      [`Email:`, ventaData.cliente_email || 'N/A'],
      [`Teléfono:`, ventaData.cliente_telefono || 'N/A'],
      [`Método de Pago:`, ventaData.metodo_pago.toUpperCase()],
      [`Vendedor:`, ventaData.vendedor || 'N/A'],
      [`Sucursal:`, (ventaData.sucursal || 'UPDATE TECH').replace('_', ' ').toUpperCase()]
    ];
    
    let yPos = 80;
    receiptData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, yPos);
      yPos += 8;
    });
    
    // Tabla de productos
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTOS VENDIDOS', 20, yPos);
    
    yPos += 10;
    
    // Headers de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTO', 25, yPos);
    doc.text('CANT.', 120, yPos);
    doc.text('PRECIO UNIT.', 140, yPos);
    doc.text('TOTAL', 170, yPos);
    
    yPos += 15;
    
    // Productos
    doc.setFont('helvetica', 'normal');
    let subtotal = 0;
    
    carrito.forEach((item) => {
      const itemTotal = item.precio_unitario * item.cantidad;
      subtotal += itemTotal;
      
      // Nombre del producto (truncado si es muy largo)
      const nombreProducto = (item.producto.modelo || item.producto.descripcion_producto);
      const nombreCorto = nombreProducto.length > 25 
        ? nombreProducto.substring(0, 25) + '...' 
        : nombreProducto;
      
      doc.text(nombreCorto, 25, yPos);
      doc.text(`${item.cantidad}`, 125, yPos);
      doc.text(`$${item.precio_unitario.toFixed(2)}`, 145, yPos);
      doc.text(`$${itemTotal.toFixed(2)}`, 175, yPos);
      
      // Serial del producto (si existe)
      if (item.producto.serial) {
        yPos += 6;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Serial: ${item.producto.serial}`, 25, yPos);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }
      
      yPos += 12;
    });
    
    // Total
    yPos += 10;
    doc.setDrawColor(...secondaryColor);
    doc.line(120, yPos - 5, pageWidth - 20, yPos - 5);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL A PAGAR:', 120, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, 175, yPos);
    
    // Footer
    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Gracias por su compra en UPDATE TECH', 20, yPos);
    doc.text('Este recibo es válido como comprobante de compra', 20, yPos + 10);
    doc.text(`Generado el ${today.toLocaleString('es-ES')}`, 20, yPos + 20);
    
    return doc;
  }

  // Crear template de email personalizable
  createEmailTemplate(ventaData, carrito) {
    const total = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
    const cantidadItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    return {
      to_email: ventaData.cliente_email,
      to_name: ventaData.cliente_nombre,
      from_name: 'UPDATE TECH',
      subject: `Recibo de Compra - ${ventaData.numeroTransaccion || `VT-${Date.now()}`}`,
      message: `
Estimado/a ${ventaData.cliente_nombre},

¡Gracias por tu compra en UPDATE TECH!

DETALLES DE TU COMPRA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Nº Transacción: ${ventaData.numeroTransaccion || `VT-${Date.now()}`}
📅 Fecha: ${new Date().toLocaleDateString('es-ES')}
🛒 Total de productos: ${cantidadItems}
💰 Total pagado: $${total.toFixed(2)}
💳 Método de pago: ${ventaData.metodo_pago.toUpperCase()}

PRODUCTOS ADQUIRIDOS:
${carrito.map(item => `
• ${item.producto.modelo || item.producto.descripcion_producto}
  Cantidad: ${item.cantidad} | Precio: $${item.precio_unitario} | Total: $${(item.precio_unitario * item.cantidad).toFixed(2)}
  ${item.producto.serial ? `Serial: ${item.producto.serial}` : ''}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Adjunto encontrarás tu recibo en formato PDF.

Si tienes alguna pregunta sobre tu compra, no dudes en contactarnos.

¡Esperamos verte pronto!

--
UPDATE TECH
Sistema de Gestión de Inventario
${(ventaData.sucursal || 'Sucursal Principal').replace('_', ' ').toUpperCase()}
      `.trim(),
      transaction_number: ventaData.numeroTransaccion || `VT-${Date.now()}`,
      total_amount: `$${total.toFixed(2)}`,
      items_count: cantidadItems,
      payment_method: ventaData.metodo_pago.toUpperCase(),
      vendor: ventaData.vendedor || 'N/A',
      branch: (ventaData.sucursal || 'UPDATE TECH').replace('_', ' ').toUpperCase()
    };
  }

  // Enviar email con PDF adjunto
  async sendReceiptEmail(ventaData, carrito) {
    try {
      console.log('📧 Iniciando envío de email...');
      console.log('Datos de venta:', ventaData);
      console.log('Service ID:', this.SERVICE_ID);
      console.log('Template ID:', this.TEMPLATE_ID);

      // Validar que el cliente tenga email
      if (!ventaData.cliente_email) {
        throw new Error('No se proporcionó email del cliente');
      }

      // Generar PDF
      console.log('📄 Generando PDF...');
      const pdf = this.generateReceiptPDF(ventaData, carrito);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      // Crear template del email
      console.log('✉️ Creando template del email...');
      const emailTemplate = this.createEmailTemplate(ventaData, carrito);

      // Parámetros para EmailJS
      const templateParams = {
        ...emailTemplate,
        pdf_attachment: pdfBase64,
        pdf_filename: `recibo_${ventaData.numeroTransaccion || Date.now()}.pdf`
      };

      console.log('🚀 Enviando email con EmailJS...');
      
      // ✅ AQUÍ ESTABA EL PROBLEMA - Usar los IDs correctos
      const result = await emailjs.send(
        this.SERVICE_ID,    // ✅ Usar SERVICE_ID configurado
        this.TEMPLATE_ID,   // ✅ Usar TEMPLATE_ID configurado
        templateParams
      );

      console.log('✅ Email enviado exitosamente:', result);
      return {
        success: true,
        messageId: result.text,
        message: 'Recibo enviado por email exitosamente'
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      
      // Log detallado del error
      if (error.text) {
        console.error('Error text:', error.text);
      }
      if (error.status) {
        console.error('Error status:', error.status);
      }
      
      throw new Error(`Error enviando recibo: ${error.message || error.text || 'Error desconocido'}`);
    }
  }

  // Método alternativo: solo generar y descargar PDF (si no hay email)
  downloadReceipt(ventaData, carrito) {
    console.log('💾 Descargando recibo PDF...');
    const pdf = this.generateReceiptPDF(ventaData, carrito);
    const filename = `recibo_${ventaData.numeroTransaccion || Date.now()}.pdf`;
    pdf.save(filename);
  }

  // Configurar EmailJS (método de instancia)
  configure(publicKey, serviceId, templateId) {
    console.log('⚙️ Configurando EmailJS:', { publicKey, serviceId, templateId });
    emailjs.init(publicKey);
    this.SERVICE_ID = serviceId;
    this.TEMPLATE_ID = templateId;
  }

  // Método estático para compatibilidad
  static configure(publicKey, serviceId, templateId) {
    console.log('⚙️ Configurando EmailJS (estático):', { publicKey, serviceId, templateId });
    emailjs.init(publicKey);
  }
}

export default EmailReceiptService;