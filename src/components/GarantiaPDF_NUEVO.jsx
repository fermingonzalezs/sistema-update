import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../Roboto/static/Roboto-Bold.ttf'

// Registrar la fuente
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: RobotoRegular,
      fontWeight: 'normal',
    },
    {
      src: RobotoBold,
      fontWeight: 'bold',
    }
  ]
});

// Estilos profesionales consistentes con recibo y presupuesto
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 25,
    fontFamily: 'Roboto',
    fontSize: 8,
    lineHeight: 1.2,
  },
  
  // Header de la empresa (igual que recibo/presupuesto)
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  companyDetails: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.4,
    fontFamily: 'Roboto',
  },
  
  // Header del documento (igual que recibo/presupuesto)
  documentTitleSection: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
    minWidth: 180,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 1,
  },
  documentSubtitle: {
    fontSize: 7,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  },
  documentInfo: {
    fontSize: 8,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 1.5,
    marginTop: 6,
    fontFamily: 'Roboto',
  },
  
  // Información del cliente y venta
  clientSection: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 25,
  },
  clientColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 3,
  },
  clientName: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  clientInfo: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.4,
    fontFamily: 'Roboto',
    marginBottom: 2,
  },
  
  // Información del producto (similar a tabla de items)
  productSection: {
    marginBottom: 15,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productTitle: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  productField: {
    flex: 1,
    marginHorizontal: 3,
  },
  productLabel: {
    fontSize: 7,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  productValue: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    textAlign: 'center',
    minHeight: 16,
  },
  
  // Condiciones compactas
  conditionsSection: {
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  conditionsTitle: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#1F2937',
    padding: 4,
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  conditionsText: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.2,
    fontFamily: 'Roboto',
    marginBottom: 2,
    textAlign: 'justify',
  },
  
  // Lista de causales compacta
  listItem: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.1,
    fontFamily: 'Roboto',
    marginBottom: 1,
    paddingLeft: 8,
  },
  
  // Footer compacto
  footer: {
    marginTop: 10,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    textAlign: 'center',
  },
  contactInfo: {
    fontSize: 8,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  footerText: {
    fontSize: 7,
    color: '#6B7280',
    fontFamily: 'Roboto',
    marginBottom: 2,
  },
  
  // Firma/sello
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  signatureBox: {
    width: 120,
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#6B7280',
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
});

// Componente del documento
const GarantiaDocument = ({ data }) => {
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header igual que recibo/presupuesto */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
            <Text style={styles.companyDetails}>
              Avenida 44 N° 862 1/2 Piso 4{'\n'}
              La Plata, Buenos Aires, Argentina{'\n'}
              Tel: 221-641-9901 • CUIT: 30-71850553-2
            </Text>
          </View>
          <View style={styles.documentTitleSection}>
            <Text style={styles.documentTitle}>GARANTÍA</Text>
            <Text style={styles.documentInfo}>
              N°: {data.numeroGarantia}{'\n'}
              Fecha: {formatearFecha(data.fecha)}
            </Text>
          </View>
        </View>

        {/* Cliente y venta */}
        <View style={styles.clientSection}>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.clientName}>{data.cliente.nombre}</Text>
            {data.cliente.telefono && (
              <Text style={styles.clientInfo}>Tel: {data.cliente.telefono}</Text>
            )}
            {data.cliente.email && (
              <Text style={styles.clientInfo}>Email: {data.cliente.email}</Text>
            )}
            {data.cliente.dni && (
              <Text style={styles.clientInfo}>DNI: {data.cliente.dni}</Text>
            )}
          </View>
          
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Datos de Compra</Text>
            <Text style={styles.clientInfo}>Fecha: {formatearFecha(data.fechaCompra)}</Text>
            <Text style={styles.clientInfo}>Vendedor: {data.vendedorCompleto || 'N/A'}</Text>
            <Text style={styles.clientInfo}>Pago: {data.metodoPagoFormateado || 'N/A'}</Text>
            <Text style={styles.clientInfo}>Total: {data.totalFormateado || 'N/A'}</Text>
          </View>
        </View>

        {/* Producto */}
        <View style={styles.productSection}>
          <Text style={styles.productTitle}>Producto en Garantía</Text>
          <View style={styles.productGrid}>
            <View style={styles.productField}>
              <Text style={styles.productLabel}>Producto</Text>
              <Text style={styles.productValue}>{data.producto || ''}</Text>
            </View>
            <View style={styles.productField}>
              <Text style={styles.productLabel}>Número de Serie</Text>
              <Text style={styles.productValue}>{data.numeroSerie || ''}</Text>
            </View>
            <View style={styles.productField}>
              <Text style={styles.productLabel}>Garantía</Text>
              <Text style={styles.productValue}>{data.plazoGarantia || '365'} días{'\n'}Vence: {data.fechaVencimiento}</Text>
            </View>
          </View>
        </View>

        {/* Condiciones principales */}
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsTitle}>Condiciones de Garantía</Text>
          <Text style={styles.conditionsText}>
            LA EMPRESA acompaña a cada uno de sus productos con un certificado de garantía, comprometiéndose a reparar o cambiar cualquier parte que el criterio resultaría defectuosa. La garantía será efectiva únicamente en nuestras oficinas.
          </Text>
          <Text style={styles.conditionsText}>
            Esta garantía NO da el derecho a exigir la sustitución de la totalidad del elemento o de sus partes, ni el reintegro del importe pagado por el producto. Tampoco cubre funcionamientos originados por causas ajenas al producto o por las fallas del producto. La garantía es única y sólo cubre defectos de fabricación; no contempla fallas debidas a mal degradación de los componentes por el uso, rotura, suciedad, errores en la operación, instalación defectuosa, etc.
          </Text>
          <Text style={styles.conditionsText}>
            Para efectuar cualquier reclamo, el cliente deberá presentar el comprobante original de compra junto con el certificado de garantía.
          </Text>
        </View>

        {/* Información importante */}
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsTitle}>Información Importante</Text>
          <Text style={styles.conditionsText}>
            Han de verse que se producen reclamos por supuestas fallas de productos en garantía, que resulten infundados y demanden un plus en horas de servicio técnico, de investigación y/o reinstalación. LA EMPRESA COBRARÁ dicho trabajo.
          </Text>
          <Text style={styles.conditionsText}>
            Si dentro de las 48 horas hábiles de comprado el producto, se detectara una falla evidente de fabricación, el cliente tiene el derecho a recibir un reemplazo sin tener que esperar. Si la falla no fuera evidente será necesario verificar el funcionamiento del producto en garantía. En tal caso LA EMPRESA cuenta con un plazo mínimo de 72Hs hábiles para realizar un diagnóstico preciso.
          </Text>
          <Text style={styles.conditionsText}>
            Pasadas estas 48 horas, el tiempo que demore la reparación y/o reemplazo del producto, será de 72 horas hábiles como mínimo, dependiendo de las tareas a realizar, disponibilidad de repuestos y/o stock para reemplazar total o parcialmente el producto.
          </Text>
          <Text style={styles.conditionsText}>
            El plazo de reposición del producto depende de la disponibilidad del stock así también como de la disponibilidad de los servicios técnicos oficiales del producto en cuestión al momento de atención, época del año y nivel de la demanda, etc. Estos factores pueden demorar el reemplazo o la reparación del producto.
          </Text>
          <Text style={styles.conditionsText}>
            La garantía será cubierta totalmente en nuestras oficinas. LA EMPRESA no se hará cargo de los gastos de mensajería necesarios para acercar el producto a nuestras oficinas o enviarlo nuevamente a su destino, a menos que expresamente y por escrito la empresa y el cliente acuerden esto.
          </Text>
        </View>

        {/* Causales de anulación */}
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsTitle}>Causales de Anulación de la Garantía</Text>
          <Text style={styles.listItem}>• LOS DAÑOS ORIGINADOS POR PROBLEMAS DE GARANTÍA DEL PRODUCTO, Y POR EL MISMO PRODUCTO, O EN CASO DE NO HABER EN STOCK O EXISTENCIA POR SU REEMPLAZO.</Text>
          <Text style={styles.listItem}>• Si el producto ha sido abierto.</Text>
          <Text style={styles.listItem}>• Incorrecta manipulación y/o configuración (cuando corresponda).</Text>
          <Text style={styles.listItem}>• Incorrecta carga inicial (cuando corresponda).</Text>
          <Text style={styles.listItem}>• Si se han alterado inscripciones tales como números de serie, modelo, etiquetas de cualquier tipo, etiquetas de LA EMPRESA, o cualquier otra información técnica y/o comercial adherida al producto o su envase. Esta información es imprescindible para determinar el origen del producto, y es exigida por cada fabricante, representante o importador.</Text>
          <Text style={styles.listItem}>• Si el producto presenta oxidación.</Text>
          <Text style={styles.listItem}>• Si el producto presenta abolladuras fijo de cualquier tipo en botones, carcasas o pantallas.</Text>
          <Text style={styles.listItem}>• Si el producto ha sido quemado por no efectuar la descarga.</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.contactInfo}>UPDATE TECH - 221-641-9901 - LA PLATA - BUENOS AIRES</Text>
          <Text style={styles.footerText}>info@updatetech.com.ar</Text>
        </View>

        {/* Firmas */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Firma Cliente</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Update Tech</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Función para convertir datos del producto a formato de garantía
export const crearDatosGarantia = (producto, cliente = {}, datosVenta = {}) => {
  const numeroGarantia = `GT-${Date.now().toString().slice(-6)}`;
  const fechaCompra = datosVenta.fechaVenta || new Date();
  const plazoGarantia = parseInt(producto.garantia_update || producto.garantia_oficial || producto.garantia || '365');
  
  // Calcular fecha de vencimiento de garantía
  const fechaVencimiento = new Date(fechaCompra);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + plazoGarantia);
  
  // Formatear método de pago
  let metodoPagoFormateado = datosVenta.metodoPago || 'N/A';
  if (metodoPagoFormateado.toLowerCase().includes('efectivo_pesos')) {
    metodoPagoFormateado = 'Efectivo pesos';
  } else if (metodoPagoFormateado.toLowerCase().includes('efectivo_dolares')) {
    metodoPagoFormateado = 'Efectivo dólares';
  }
  
  // Formatear total (USD / Pesos)
  const precioUSD = producto.precio_venta_usd || producto.precio_venta || 0;
  const precioPesos = datosVenta.totalPesos || (precioUSD * (datosVenta.cotizacionDolar || 1200)); // estimación si no hay cotización
  const totalFormateado = `U$${precioUSD.toFixed(2)} / $${precioPesos.toLocaleString('es-AR')}`;
  
  // Obtener nombre completo del vendedor
  const vendedorCompleto = datosVenta.vendedorCompleto || datosVenta.vendedor || 'Sistema';
  
  return {
    numeroGarantia,
    fecha: new Date(),
    fechaCompra,
    fechaVencimiento: fechaVencimiento.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }),
    
    cliente: {
      nombre: cliente.nombre || 'Cliente no especificado',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      dni: cliente.dni || '',
      direccion: cliente.direccion || ''
    },
    
    vendedorCompleto,
    metodoPagoFormateado,
    totalFormateado,
    
    producto: producto.modelo || producto.descripcion_producto || 'Producto sin especificar',
    numeroSerie: producto.serial || producto.numero_serie || '',
    plazoGarantia: plazoGarantia.toString()
  };
};

// Función principal para generar y abrir PDF en navegador
export const abrirGarantiaPDF = async (producto, cliente = {}, datosVenta = {}) => {
  try {
    console.log('🔄 Generando certificado de garantía...');
    
    // Crear datos de garantía
    const garantiaData = crearDatosGarantia(producto, cliente, datosVenta);
    
    // Generar documento
    const documento = <GarantiaDocument data={garantiaData} />;
    const blob = await pdf(documento).toBlob();
    
    // Abrir en nueva pestaña del navegador
    const url = URL.createObjectURL(blob);
    const nuevaPestana = window.open(url, '_blank');
    
    // Verificar si se abrió correctamente
    if (nuevaPestana) {
      console.log('✅ Certificado de garantía abierto en nueva pestaña');
      
      // Limpiar URL después de un tiempo para liberar memoria
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
      
      return { 
        success: true, 
        mensaje: 'PDF abierto en nueva pestaña',
        filename: `garantia-${garantiaData.numeroGarantia}-${cliente.nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`
      };
    } else {
      // Si falló abrir en nueva pestaña, descargar como fallback
      const link = document.createElement('a');
      link.href = url;
      link.download = `garantia-${garantiaData.numeroGarantia}-${cliente.nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { 
        success: true, 
        mensaje: 'PDF descargado (navegador bloqueó nueva pestaña)',
        filename: link.download
      };
    }
    
  } catch (error) {
    console.error('❌ Error generando certificado de garantía:', error);
    return { success: false, error: error.message };
  }
};

// Mantener función de descarga por compatibilidad
export const descargarGarantiaPDF = abrirGarantiaPDF;

export default GarantiaDocument;