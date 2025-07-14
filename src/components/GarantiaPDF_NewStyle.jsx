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

// Estilos optimizados para una sola página
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 25,
    fontFamily: 'Roboto',
    fontSize: 8,
    lineHeight: 1.2,
  },
  
  // Header de la empresa
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 15,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  companyDetails: {
    fontSize: 6,
    color: '#6B7280',
    lineHeight: 1.2,
    fontFamily: 'Roboto',
  },
  
  // Header del documento
  documentTitleSection: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#1F2937',
    minWidth: 120,
  },
  documentTitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginTop: 3,
    marginBottom: 2,
    letterSpacing: 1,
  },
  documentSubtitle: {
    fontSize: 5,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  },
  documentInfo: {
    fontSize: 6,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 1.3,
    marginTop: 3,
    fontFamily: 'Roboto',
  },
  
  // Información del cliente
  clientSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 25,
  },
  clientColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 3,
  },
  clientInfo: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Roboto',
  },
  clientName: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 3,
  },
  
  // Información del producto
  productSection: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  productHeader: {
    backgroundColor: '#1F2937',
    padding: 8,
  },
  productTitle: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  productContent: {
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  productGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  productField: {
    flex: 1,
  },
  productLabel: {
    fontSize: 6,
    color: '#6B7280',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontFamily: 'Roboto',
  },
  productValue: {
    fontSize: 7,
    fontFamily: 'Roboto',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    padding: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 2,
    minHeight: 15,
    textAlign: 'center',
  },

  // Condiciones de garantía
  warrantySection: {
    marginBottom: 15,
  },
  warrantyTitle: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5,
  },
  warrantyText: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
    marginBottom: 6,
    textAlign: 'justify',
  },

  // Sección importante
  importantSection: {
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    borderRadius: 4,
  },
  importantTitle: {
    fontSize: 7,
    fontFamily: 'Roboto',
    color: '#DC2626',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  importantText: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
    marginBottom: 4,
    textAlign: 'justify',
  },

  // Causales de anulación
  cancellationSection: {
    marginBottom: 15,
  },
  cancellationTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 3,
  },
  cancellationItem: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.3,
    marginBottom: 3,
    fontFamily: 'Roboto',
    paddingLeft: 8,
  },

  // Footer
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 6,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 2,
  },
  
  // Metadatos del documento
  metadata: {
    position: 'absolute',
    bottom: 20,
    right: 25,
    fontSize: 5,
    color: '#D1D5DB',
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
          <View style={styles.productHeader}>
            <Text style={styles.productTitle}>Información del Producto</Text>
          </View>
          <View style={styles.productContent}>
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
                <Text style={styles.productLabel}>Plazo de Garantía</Text>
                <Text style={styles.productValue}>{data.plazoGarantia || '365'} DÍAS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Condiciones de garantía */}
        <View style={styles.warrantySection}>
          <Text style={styles.warrantyTitle}>Condiciones de Garantía</Text>
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
          <Text style={styles.importantTitle}>Importante</Text>
          <Text style={styles.importantText}>
            Han de verse que se producen reclamos por supuestas fallas de productos en garantía, que resulten infundados y demanden un plus en horas de servicio técnico, de investigación y/o reinstalación. LA EMPRESA COBRARÁ dicho trabajo.
          </Text>
          <Text style={styles.importantText}>
            Si dentro de las 48 horas hábiles de comprado el producto, se detectara una falla evidente de fabricación, el cliente tiene el derecho a recibir un reemplazo sin tener que esperar.
          </Text>
          <Text style={styles.importantText}>
            Pasadas estas 48 horas, el tiempo que demore la reparación y/o reemplazo del producto, será de 72 horas hábiles como mínimo.
          </Text>
        </View>

        {/* Causales de anulación */}
        <View style={styles.cancellationSection}>
          <Text style={styles.cancellationTitle}>Causales de Anulación de la Garantía</Text>
          <Text style={styles.cancellationItem}>
            • Los daños originados por problemas de garantía del producto, y por el mismo producto, o en caso de no haber en stock o existencia por su reemplazo.
          </Text>
          <Text style={styles.cancellationItem}>
            • Si el producto ha sido abierto.
          </Text>
          <Text style={styles.cancellationItem}>
            • Incorrecta manipulación y/o configuración (cuando corresponda).
          </Text>
          <Text style={styles.cancellationItem}>
            • Si se han alterado inscripciones tales como números de serie, modelo, etiquetas de cualquier tipo.
          </Text>
          <Text style={styles.cancellationItem}>
            • Si el producto presenta oxidación, abolladuras o daños físicos.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
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
    producto: primerItem.copy || 'Producto sin especificar',
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

// Función para generar y abrir el PDF de garantía en nueva pestaña (desde venta)
export const generarYDescargarGarantia = async (venta, items = []) => {
  try {
    const garantiaData = convertirVentaAGarantia(venta, items);
    const blob = await pdf(<GarantiaDocument data={garantiaData} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
    
    return {
      success: true,
      message: 'Garantía abierta en nueva pestaña'
    };
  } catch (error) {
    console.error('Error generando garantía PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para generar y abrir el PDF de garantía de producto individual en nueva pestaña
export const generarYDescargarGarantiaProducto = async (producto, cliente = {}, datosVenta = {}) => {
  try {
    const garantiaData = convertirProductoAGarantia(producto, cliente, datosVenta);
    const blob = await pdf(<GarantiaDocument data={garantiaData} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
    
    return {
      success: true,
      message: 'Garantía abierta en nueva pestaña'
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