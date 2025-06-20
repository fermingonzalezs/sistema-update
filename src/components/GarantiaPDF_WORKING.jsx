import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../Roboto/static/Roboto-Bold.ttf'

// Registrar la fuente ANTES de los estilos - IGUAL QUE EL RECIBO QUE FUNCIONA
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

// Estilos EXACTAMENTE como el recibo que funciona - SIN borderRadius problemáticos
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4,
  },
  
  // Header de la empresa - IGUAL QUE RECIBO
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.5,
    fontFamily: 'Roboto',
  },
  
  // Header del documento - IGUAL QUE RECIBO
  documentTitleSection: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
    minWidth: 200,
  },
  documentTitle: {
    fontSize: 18,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 1,
  },
  documentSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Roboto',
  },
  documentInfo: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 1.6,
    marginTop: 10,
    fontFamily: 'Roboto',
  },
  
  // Sección de información del cliente - IGUAL QUE RECIBO
  clientSection: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 30,
  },
  clientColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  clientInfo: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.6,
    fontFamily: 'Roboto',
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 4,
  },

  // Sección de producto - USANDO ESTILOS DEL RECIBO
  productSection: {
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  productHeaderText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  productCell: {
    fontSize: 9,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  productCellBold: {
    fontSize: 9,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  
  // Columnas
  col1: { width: '33%' },
  col2: { width: '33%', textAlign: 'center' },
  col3: { width: '34%', textAlign: 'right' },

  // Sección de condiciones - USANDO ESTILOS DEL RECIBO
  conditionsSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  conditionsHeader: {
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  conditionsTitle: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  conditionsContent: {
    padding: 15,
    backgroundColor: '#F9FAFB',
  },
  conditionsText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Roboto',
    marginBottom: 8,
    textAlign: 'justify',
  },
  conditionsItem: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 4,
    fontFamily: 'Roboto',
    paddingLeft: 10,
  },

  // Footer - IGUAL QUE RECIBO
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  contactInfo: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.5,
    fontFamily: 'Roboto',
    marginBottom: 12,
  },
  
  // Metadatos - IGUAL QUE RECIBO
  metadata: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 7,
    color: '#9CA3AF',
  },
});

// Componente del documento PDF de garantía - ESTRUCTURA IGUAL AL RECIBO
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
        {/* Header de la empresa - IGUAL QUE RECIBO */}
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
            <Text style={styles.documentTitle}>CERTIFICADO DE GARANTÍA</Text>
            <Text style={styles.documentSubtitle}>Garantía de Producto</Text>
            <Text style={styles.documentInfo}>
              N° {data.numeroGarantia}{'\n'}
              Fecha: {formatearFecha(data.fecha)}{'\n'}
              Venta: {data.numeroVenta}
            </Text>
          </View>
        </View>

        {/* Información del cliente - IGUAL QUE RECIBO */}
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

        {/* Información del producto - USANDO ESTRUCTURA DE TABLA DEL RECIBO */}
        <View style={styles.productSection}>
          <View style={styles.productHeader}>
            <Text style={[styles.productHeaderText, styles.col1]}>Producto</Text>
            <Text style={[styles.productHeaderText, styles.col2]}>Número de Serie</Text>
            <Text style={[styles.productHeaderText, styles.col3]}>Garantía</Text>
          </View>
          
          <View style={styles.productRow}>
            <Text style={[styles.productCellBold, styles.col1]}>{data.producto || 'N/A'}</Text>
            <Text style={[styles.productCell, styles.col2]}>{data.numeroSerie || 'N/A'}</Text>
            <Text style={[styles.productCell, styles.col3]}>{data.plazoGarantia || '365'} días</Text>
          </View>
        </View>

        {/* Condiciones de garantía - USANDO ESTRUCTURA DEL RECIBO */}
        <View style={styles.conditionsSection}>
          <View style={styles.conditionsHeader}>
            <Text style={styles.conditionsTitle}>Condiciones de Garantía</Text>
          </View>
          <View style={styles.conditionsContent}>
            <Text style={styles.conditionsText}>
              LA EMPRESA acompaña a cada uno de sus productos con un certificado de garantía, comprometiéndose a reparar o cambiar cualquier parte que el criterio resultaría defectuosa. La garantía será efectiva únicamente en nuestras oficinas.
            </Text>
            <Text style={styles.conditionsText}>
              Esta garantía NO da el derecho a exigir la sustitución de la totalidad del elemento o de sus partes, ni el reintegro del importe pagado por el producto. La garantía es única y sólo cubre defectos de fabricación.
            </Text>
            <Text style={styles.conditionsText}>
              Para efectuar cualquier reclamo, el cliente deberá presentar el comprobante original de compra junto con el certificado de garantía.
            </Text>
          </View>
        </View>

        {/* Causales de anulación - USANDO ESTRUCTURA DEL RECIBO */}
        <View style={styles.conditionsSection}>
          <View style={styles.conditionsHeader}>
            <Text style={styles.conditionsTitle}>Causales de Anulación de la Garantía</Text>
          </View>
          <View style={styles.conditionsContent}>
            <Text style={styles.conditionsItem}>• Si el producto ha sido abierto sin autorización</Text>
            <Text style={styles.conditionsItem}>• Incorrecta manipulación y/o configuración</Text>
            <Text style={styles.conditionsItem}>• Si se han alterado números de serie, modelo o etiquetas</Text>
            <Text style={styles.conditionsItem}>• Si el producto presenta oxidación o daños físicos</Text>
            <Text style={styles.conditionsItem}>• Daños por golpes, caídas o mal uso</Text>
          </View>
        </View>

        {/* Footer - IGUAL QUE RECIBO */}
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

        {/* Metadatos - IGUAL QUE RECIBO */}
        <Text style={styles.metadata}>
          Doc ID: {data.numeroGarantia} • Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

// Función para convertir datos de venta al formato de garantía - IGUAL QUE RECIBO
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
    numeroSerie: primerItem.numero_serie || primerItem.serial_producto || '',
    plazoGarantia: primerItem.garantia_dias || '365'
  };
};

// Función para convertir producto individual al formato de garantía - IGUAL QUE RECIBO
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

// Función para generar y descargar el PDF de garantía - IGUAL QUE RECIBO
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

// Función para generar y descargar el PDF de garantía de producto individual - IGUAL QUE RECIBO
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