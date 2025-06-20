import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../Roboto/static/Roboto-Bold.ttf'

// Registrar la fuente ANTES de los estilos
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

// Estilos profesionales mejorados para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4,
  },
  
  // Header de la empresa
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
  
  // Header del documento
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
  
  // Sección de información del cliente
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

  // Tabla de productos
  table: {
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowOdd: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  tableCellBold: {
    fontSize: 9,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  
  // Columnas de la tabla
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '17.5%', textAlign: 'right' },
  col4: { width: '17.5%', textAlign: 'right' },

  // Totales
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  totalValue: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  finalTotalValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },

  // Footer
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
  
  // Metadatos del documento
  metadata: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 7,
    color: '#9CA3AF',
  },
});

// Componente del documento PDF
const ReciboVentaDocument = ({ data }) => {
  const formatearFecha = (fecha) => {
    return new Date(fecha || Date.now()).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
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
            <Text style={styles.documentTitle}>RECIBO DE VENTA</Text>
            <Text style={styles.documentSubtitle}>Comprobante de Compra</Text>
            <Text style={styles.documentInfo}>
              N° {data.numeroRecibo}{'\n'}
              Fecha: {formatearFecha(data.fecha)}{'\n'}
              Vendedor: {data.vendedor || 'Sistema'}
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
            <Text style={styles.sectionTitle}>Información de Pago</Text>
            <Text style={styles.clientInfo}>
              Método de pago: {data.metodoPago}{'\n'}
              Fecha de compra: {formatearFecha(data.fechaVenta)}{'\n'}
              Número de transacción: {data.numeroTransaccion}
            </Text>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Producto</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Precio Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
          </View>
          
          {data.productos.map((producto, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowOdd]}>
              <View style={styles.col1}>
                <Text style={styles.tableCellBold}>{producto.nombre}</Text>
                {producto.serial && (
                  <Text style={[styles.tableCell, { fontSize: 8, color: '#6B7280' }]}>
                    S/N: {producto.serial}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.col2]}>{producto.cantidad}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{formatearMoneda(producto.precioUnitario)}</Text>
              <Text style={[styles.tableCellBold, styles.col4]}>{formatearMoneda(producto.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatearMoneda(data.subtotal)}</Text>
          </View>
          
          {data.descuento > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento:</Text>
              <Text style={styles.totalValue}>-{formatearMoneda(data.descuento)}</Text>
            </View>
          )}
          
          <View style={styles.finalTotal}>
            <Text style={styles.finalTotalLabel}>TOTAL:</Text>
            <Text style={styles.finalTotalValue}>{formatearMoneda(data.total)}</Text>
          </View>
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
            Gracias por su compra • UPDATE TECH WW SRL • {formatearFecha()}
          </Text>
        </View>

        {/* Metadatos */}
        <Text style={styles.metadata}>
          Doc ID: {data.numeroRecibo} • Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

// Función para convertir datos de venta al formato de recibo
export const convertirVentaARecibo = (venta) => {
  const productos = venta.venta_items?.map(item => ({
    nombre: item.modelo_producto || 'Producto sin especificar',
    serial: item.numero_serie || item.serial_producto || '',
    cantidad: item.cantidad || 1,
    precioUnitario: item.precio_unitario || 0,
    total: item.precio_total || (item.precio_unitario * (item.cantidad || 1))
  })) || [];

  const subtotal = productos.reduce((sum, prod) => sum + prod.total, 0);
  
  return {
    numeroRecibo: `RC-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    numeroTransaccion: venta.numero_transaccion || 'N/A',
    fecha: new Date(),
    fechaVenta: venta.fecha_venta || new Date(),
    
    cliente: {
      nombre: venta.cliente_nombre || 'Cliente no especificado',
      telefono: venta.cliente_telefono || '',
      email: venta.cliente_email || '',
      dni: venta.cliente_dni || '',
      direccion: venta.cliente_direccion || ''
    },
    
    vendedor: venta.vendedor || 'Sistema',
    metodoPago: venta.metodo_pago || 'No especificado',
    
    productos,
    subtotal,
    descuento: 0,
    total: venta.total_venta || subtotal
  };
};

// Función para generar y descargar el PDF
export const generarYDescargarRecibo = async (venta) => {
  try {
    const reciboData = convertirVentaARecibo(venta);
    const blob = await pdf(<ReciboVentaDocument data={reciboData} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo-${reciboData.numeroRecibo}-${venta.cliente_nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generando recibo PDF:', error);
    return false;
  }
};

export default ReciboVentaDocument;