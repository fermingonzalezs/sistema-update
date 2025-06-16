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

// Estilos profesionales para el PDF de garantía
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 8,
    lineHeight: 1.2,
  },
  
  // Header de la empresa
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 1,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Roboto',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  companyDetails: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
  },
  
  // Header del documento
  documentTitleSection: {
    alignItems: 'flex-end',
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 1,
    minWidth: 180,
  },
  documentTitle: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    marginTop: 5,
    marginBottom: 3,
    letterSpacing: 1.5,
  },
  documentSubtitle: {
    fontSize: 6,
    color: '#D1D5DB',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Roboto',
  },
  documentInfo: {
    fontSize: 7,
    color: '#F3F4F6',
    textAlign: 'right',
    lineHeight: 1.4,
    marginTop: 5,
    fontFamily: 'Roboto',
  },
  
  // Sección de información del cliente y producto
  clientSection: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 20,
  },
  clientColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Roboto',
    color: '#000000',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },
  clientInfo: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
  },
  clientName: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#000000',
    marginBottom: 2,
  },

  // Sección de información del producto
  productSection: {
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 1,
    borderWidth: 2,
    borderColor: '#000000',
  },
  productTitle: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  productGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productField: {
    flex: 1,
    marginHorizontal: 5,
  },
  productLabel: {
    fontSize: 6,
    color: '#000000',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  productValue: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#000000',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000000',
    minHeight: 15,
    textAlign: 'center',
  },

  // Sección de condiciones de garantía
  warrantySection: {
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#000000',
  },
  warrantyTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: 3,
    borderRadius: 0,
  },
  warrantyText: {
    fontSize: 6,
    color: '#000000',
    lineHeight: 1.2,
    fontFamily: 'Roboto',
    marginBottom: 4,
    textAlign: 'justify',
  },

  // Sección importante
  importantSection: {
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#000000',
  },
  importantTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
    backgroundColor: '#000000',
    padding: 3,
    borderRadius: 0,
  },
  importantText: {
    fontSize: 6,
    color: '#000000',
    lineHeight: 1.2,
    fontFamily: 'Roboto',
    marginBottom: 3,
    textAlign: 'justify',
  },

  // Causales de anulación
  cancellationSection: {
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#000000',
  },
  cancellationTitle: {
    fontSize: 7,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
    backgroundColor: '#000000',
    padding: 3,
    borderRadius: 0,
  },
  cancellationItem: {
    fontSize: 6,
    color: '#000000',
    lineHeight: 1.2,
    marginBottom: 2,
    fontFamily: 'Roboto',
    paddingLeft: 5,
  },

  // Footer
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#000000',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 1,
  },
  footerText: {
    fontSize: 6,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  contactInfo: {
    fontSize: 7,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
    marginBottom: 5,
  },
  
  // Metadatos del documento
  metadata: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 6,
    color: '#6B7280',
  },
});

// Componente del documento PDF de garantía
const GarantiaDocument = ({ data }) => {
  const formatearFecha = (fecha) => {
    return new Date(fecha || Date.now()).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header de la empresa */}
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
            <Text style={styles.documentSubtitle}>Certificado de Garantía</Text>
            <Text style={styles.documentInfo}>
              N° {data.numeroGarantia}{'\n'}
              Fecha: {formatearFecha(data.fecha)}{'\n'}
              Venta: {data.numeroVenta}
            </Text>
          </View>
        </View>

        {/* Información del cliente */}
        <View style={styles.clientSection}>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.clientName}>{data.cliente.nombre}</Text>
            <Text style={styles.clientInfo}>
              {data.cliente.telefono && `Tel: ${data.cliente.telefono}\n`}
              {data.cliente.email && `Email: ${data.cliente.email}\n`}
              {data.cliente.dni && `DNI: ${data.cliente.dni}\n`}
              {data.cliente.direccion && `Dirección: ${data.cliente.direccion}`}
            </Text>
          </View>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Información de Compra</Text>
            <Text style={styles.clientInfo}>
              Fecha de compra: {formatearFecha(data.fechaCompra)}{'\n'}
              Vendedor: {data.vendedor || 'N/A'}{'\n'}
              Método de pago: {data.metodoPago || 'N/A'}{'\n'}
              Total: ${data.total || '0.00'}
            </Text>
          </View>
        </View>

        {/* Información del producto */}
        <View style={styles.productSection}>
          <Text style={styles.productTitle}>INFORMACIÓN DEL PRODUCTO</Text>
          <View style={styles.productGrid}>
            <View style={styles.productField}>
              <Text style={styles.productLabel}>PRODUCTO</Text>
              <Text style={styles.productValue}>{data.producto || ''}</Text>
            </View>
            <View style={styles.productField}>
              <Text style={styles.productLabel}>NÚMERO DE SERIE</Text>
              <Text style={styles.productValue}>{data.numeroSerie || ''}</Text>
            </View>
            <View style={styles.productField}>
              <Text style={styles.productLabel}>PLAZO DE GARANTÍA</Text>
              <Text style={styles.productValue}>{data.plazoGarantia || '365'} DÍAS</Text>
            </View>
          </View>
        </View>

        {/* Condiciones de garantía */}
        <View style={styles.warrantySection}>
          <Text style={styles.warrantyTitle}>CONDICIONES DE GARANTÍA</Text>
          <Text style={styles.warrantyText}>
            LA EMPRESA acompaña a cada uno de sus productos con un certificado de garantía, comprometiéndose a reparar o cambiar cualquier parte que el criterio resultaría defectuosa. La garantía será efectiva únicamente en nuestras oficinas.
          </Text>
          <Text style={styles.warrantyText}>
            Esta garantía NO da el derecho a exigir la sustitución de la totalidad del elemento o de sus partes, ni el reintegro del importe pagado por el producto. Tampoco cubre funcionamientos originados por causas ajenas al producto o por las fallas del producto. La garantía es única y sólo cubre defectos de fabricación; no contempla fallas debidas a mal degradación de los componentes por el uso, rotura, suciedad, errores en la operación, instalación defectuosa, etc.
          </Text>
          <Text style={styles.warrantyText}>
            Para efectuar cualquier reclamo, el cliente deberá presentar el comprobante original de compra junto con el certificado de garantía.
          </Text>
        </View>

        {/* Información importante */}
        <View style={styles.importantSection}>
          <Text style={styles.importantTitle}>IMPORTANTE</Text>
          <Text style={styles.importantText}>
            Han de verse que se producen reclamos por supuestas fallas de productos en garantía, que resulten infundados y demanden un plus en horas de servicio técnico, de investigación y/o reinstalación. LA EMPRESA COBRARÁ dicho trabajo.
          </Text>
          <Text style={styles.importantText}>
            Si dentro de las 48 horas hábiles de comprado el producto, se detectara una falla evidente de fabricación, el cliente tiene el derecho a recibir un reemplazo sin tener que esperar. Si la falla no fuera evidente será necesario verificar el funcionamiento del producto en garantía. En tal caso LA EMPRESA cuenta con un plazo mínimo de 72Hs hábiles para realizar un diagnóstico preciso.
          </Text>
          <Text style={styles.importantText}>
            Pasadas estas 48 horas, el tiempo que demore la reparación y/o reemplazo del producto, será de 72 horas hábiles como mínimo, dependiendo de las tareas a realizar, disponibilidad de repuestos y/o stock para reemplazar total o parcialmente el producto.
          </Text>
          <Text style={styles.importantText}>
            El plazo de reposición del producto depende de la disponibilidad del stock así también como de la disponibilidad de los servicios técnicos oficiales del producto en cuestión al momento de atención, época del año y nivel de la demanda, etc. Estos factores pueden demorar el reemplazo o la reparación del producto.
          </Text>
          <Text style={styles.importantText}>
            La garantía será cubierta totalmente en nuestras oficinas. LA EMPRESA no se hará cargo de los gastos de mensajería necesarios para acercar el producto a nuestras oficinas o enviarlo nuevamente a su destino, a menos que expresamente y por escrito la empresa y el cliente acuerden esto.
          </Text>
        </View>

        {/* Causales de anulación */}
        <View style={styles.cancellationSection}>
          <Text style={styles.cancellationTitle}>CAUSALES DE ANULACIÓN DE LA GARANTÍA</Text>
          <Text style={styles.cancellationItem}>
            • LOS DAÑOS ORIGINADOS POR PROBLEMAS DE GARANTÍA DEL PRODUCTO, Y POR EL MISMO PRODUCTO, O EN CASO DE NO HABER EN STOCK O EXISTENCIA POR SU REEMPLAZO.
          </Text>
          <Text style={styles.cancellationItem}>
            • Si el producto ha sido abierto.
          </Text>
          <Text style={styles.cancellationItem}>
            • Incorrecta manipulación y/o configuración (cuando corresponda).
          </Text>
          <Text style={styles.cancellationItem}>
            • Incorrecta carga inicial (cuando corresponda).
          </Text>
          <Text style={styles.cancellationItem}>
            • Si se han alterado inscripciones tales como números de serie, modelo, etiquetas de cualquier tipo, etiquetas de LA EMPRESA, o cualquier otra información técnica y/o comercial adherida al producto o su envase. Esta información es imprescindible para determinar el origen del producto, y es exigida por cada fabricante, representante o importador.
          </Text>
          <Text style={styles.cancellationItem}>
            • Si el producto presenta oxidación.
          </Text>
          <Text style={styles.cancellationItem}>
            • Si el producto presenta abolladuras fijo de cualquier tipo en botones, carcasas o pantallas.
          </Text>
          <Text style={styles.cancellationItem}>
            • Si el producto ha sido quemado por no efectuar la descarga.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.contactInfo}>
            UPDATE TECH - 221-641-9901 - LA PLATA - BUENOS AIRES - ARGENTINA{'\n'}
            UPDATE TECH - 221-359-9837 - CABA - BUENOS AIRES - ARGENTINA
          </Text>
          
          <Text style={styles.footerText}>
            Email: info@updatetech.com.ar • Web: www.updatetech.com.ar
          </Text>
          <Text style={styles.footerText}>
            UPDATE TECH WW SRL • {formatearFecha()}
          </Text>
        </View>

        {/* Metadatos */}
        <Text style={styles.metadata}>
          Doc ID: {data.numeroGarantia} • Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

// Función para convertir datos de venta al formato de garantía
export const convertirVentaAGarantia = (venta, items = []) => {
  const primerItem = items[0] || {};
  
  return {
    numeroGarantia: `GT-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    numeroVenta: venta.numero_transaccion || 'N/A',
    fecha: new Date(),
    fechaCompra: venta.fecha_venta || new Date(),
    
    cliente: {
      nombre: venta.cliente_nombre || 'Cliente no especificado',
      telefono: venta.cliente_telefono || '',
      email: venta.cliente_email || '',
      dni: venta.cliente_dni || '',
      direccion: venta.cliente_direccion || ''
    },
    
    vendedor: venta.vendedor || '',
    metodoPago: venta.metodo_pago || '',
    total: venta.total_venta || 0,
    
    // Información del producto (primer item de la venta)
    producto: primerItem.modelo_producto || 'Producto sin especificar',
    numeroSerie: primerItem.numero_serie || '',
    plazoGarantia: primerItem.garantia_dias || '365'
  };
};

// Función para convertir producto individual al formato de garantía
export const convertirProductoAGarantia = (producto, cliente = {}, datosVenta = {}) => {
  return {
    numeroGarantia: `GT-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    numeroVenta: datosVenta.numeroTransaccion || 'N/A',
    fecha: new Date(),
    fechaCompra: datosVenta.fechaVenta || new Date(),
    
    cliente: {
      nombre: cliente.nombre || 'Cliente no especificado',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      dni: cliente.dni || '',
      direccion: cliente.direccion || ''
    },
    
    vendedor: datosVenta.vendedor || 'Sistema',
    metodoPago: datosVenta.metodoPago || 'N/A',
    total: producto.precio_venta_usd || producto.precio_venta || 0,
    
    // Información del producto individual
    producto: producto.modelo || producto.descripcion_producto || 'Producto sin especificar',
    numeroSerie: producto.serial || producto.numero_serie || '',
    plazoGarantia: producto.garantia_update || producto.garantia_oficial || producto.garantia || '365'
  };
};

// Función para generar y descargar el PDF de garantía (desde venta)
export const generarYDescargarGarantia = async (venta, items = []) => {
  try {
    const garantiaData = convertirVentaAGarantia(venta, items);
    const blob = await pdf(<GarantiaDocument data={garantiaData} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `garantia-${garantiaData.numeroGarantia}-${venta.cliente_nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: link.download
    };
  } catch (error) {
    console.error('Error generando garantía PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para generar y descargar el PDF de garantía de producto individual
export const generarYDescargarGarantiaProducto = async (producto, cliente = {}, datosVenta = {}) => {
  try {
    const garantiaData = convertirProductoAGarantia(producto, cliente, datosVenta);
    const blob = await pdf(<GarantiaDocument data={garantiaData} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `garantia-${garantiaData.numeroGarantia}-${producto.serial || 'producto'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: link.download
    };
  } catch (error) {
    console.error('Error generando garantía de producto PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default GarantiaDocument;