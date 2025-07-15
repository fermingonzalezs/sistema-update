import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../Roboto/static/Roboto-Bold.ttf'
import { determinarTipoDocumento, calcularFechaVencimiento, generarTextoLegalPagare } from '../shared/utils/documentTypeUtils';

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
    marginBottom: 20,
    letterSpacing: 0.3,
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
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
    minWidth: 200,
  },
  documentTitle: {
    fontSize: 20,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginTop:10,
    marginBottom: 5,
    letterSpacing: 1,
  },
  documentSubtitle: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  },
  documentInfo: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 1.6,
    marginTop: 8,
    fontFamily: 'Roboto',
  },
  
  // Información del cliente
  clientSection: {
    flexDirection: 'row',
    marginBottom: 35,
    gap: 40,
  },
  clientColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 45,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    justifyContent: 'center',
  },
  tableCellBold: {
    fontSize: 9,
    color: '#1F2937',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },
  tableCellDescription: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },
  serialText: {
    fontSize: 8,
    color: '#6B7280',
    fontFamily: 'Roboto',
    marginTop: 2,
  },
  
  // Columnas de la tabla con mejor distribución
  colNumber: {
    width: '8%',
    textAlign: 'center',
  },
  colDescription: {
    width: '44%',
    textAlign: 'left',
  },
  colQty: {
    width: '10%',
    textAlign: 'center',
  },
  colUnit: {
    width: '10%',
    textAlign: 'center',
  },
  colUnitPrice: {
    width: '14%',
    textAlign: 'right',
  },
  colAmount: {
    width: '14%',
    textAlign: 'right',
  },
  
  // Sección de totales
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsContainer: {
    width: '50%',
    minWidth: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  totalValue: {
    fontSize: 9,
    color: '#374151',
    fontFamily: 'Roboto',
    textAlign: 'right',
  },
  discountRow: {
    backgroundColor: '#FEF3F2',
  },
  discountLabel: {
    color: '#DC2626',
  },
  discountValue: {
    color: '#DC2626',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 4,
  },
  finalTotalLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    letterSpacing: 0.3,
  },
  finalTotalValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    letterSpacing: 0.3,
  },
  
  // Footer
  footer: {
    marginTop: 50,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 3,
  },
  
  // Elementos decorativos
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  
  // Espaciado y elementos de diseño
  spacer: {
    height: 15,
  },
  
  // Sección específica para pagarés
  pagareSection: {
    marginTop: 30,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  pagareTitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#DC2626',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pagareText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.6,
    textAlign: 'justify',
    fontFamily: 'Roboto',
  },
  vencimientoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vencimientoLabel: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#6B7280',
  },
  vencimientoFecha: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#DC2626',
  },
  
  // Metadatos del documento
  metadata: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 7,
    color: '#D1D5DB',
  },
});

// Componente del documento PDF mejorado
const ReciboVentaDocument = ({ data, tipoDocumento }) => {
  const formatearMoneda = (valor, moneda = 'USD') => {
    const numero = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
    
    return moneda === 'USD' ? `US$ ${numero}` : `$ ${numero}`;
  };

  const calcularSubtotal = () => {
    return data.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calcularDescuento = () => {
    return data.discount || 0;
  };

  const calcularTotal = () => {
    return calcularSubtotal() - calcularDescuento();
  };

  const fechaActual = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Determinar tipo de documento si no se especifica
  const docInfo = tipoDocumento || determinarTipoDocumento(data.metodoPago);
  const fechaVencimiento = docInfo.esCredito ? calcularFechaVencimiento(data.invoice.date) : null;
  const textoLegal = docInfo.esCredito ? generarTextoLegalPagare(
    calcularTotal(), 
    data.moneda, 
    fechaVencimiento, 
    data.client.name
  ) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header de la empresa con info del recibo */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{data.company.name}</Text>
            <Text style={styles.companyDetails}>
              {data.company.address}{'\n'}
              Tel: {data.company.phone} • CUIT: {data.company.cuit}
            </Text>
          </View>
          <View style={styles.documentTitleSection}>
            <Text style={styles.documentTitle}>{docInfo.tipo}</Text>
            <Text style={styles.documentSubtitle}>{docInfo.subtitulo}</Text>
            <Text style={styles.documentInfo}>
              N° {data.invoice.number}{'\n'}
              Fecha:    {data.invoice.date}
            </Text>
          </View>
        </View>

        {/* Información del cliente */}
        <View style={styles.clientSection}>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.clientName}>{data.client.name}</Text>
            <Text style={styles.clientInfo}>
              {data.client.address}
            </Text>
          </View>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <Text style={styles.clientInfo}>
              {data.client.phone && `Tel: ${data.client.phone}\n`}
              {data.client.email && `Email: ${data.client.email}`}
            </Text>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNumber]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unidad</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>Precio Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Importe</Text>
          </View>
          
          {data.items.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow, 
                index === data.items.length - 1 && styles.tableRowLast
              ]}
            >
              <View style={[styles.tableCell, styles.colNumber]}>
                <Text>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={[styles.tableCellDescription, styles.colDescription]}>
                <Text>{item.description}</Text>
                {item.serial && (
                  <Text style={styles.serialText}>S/N: {item.serial}</Text>
                )}
              </View>
              <View style={[styles.tableCell, styles.colQty]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCell, styles.colUnit]}>
                <Text>{item.unit || 'Un.'}</Text>
              </View>
              <View style={[styles.tableCellBold, styles.colUnitPrice]}>
                <Text>{formatearMoneda(item.unitPrice, data.moneda)}</Text>
              </View>
              <View style={[styles.tableCellBold, styles.colAmount]}>
                <Text>{formatearMoneda(item.amount, data.moneda)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatearMoneda(calcularSubtotal(), data.moneda)}
              </Text>
            </View>
            
            {calcularDescuento() > 0 && (
              <View style={[styles.totalRow, styles.discountRow]}>
                <Text style={[styles.totalLabel, styles.discountLabel]}>Descuento</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -{formatearMoneda(calcularDescuento(), data.moneda)}
                </Text>
              </View>
            )}
            
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>TOTAL</Text>
              <Text style={styles.finalTotalValue}>
                {formatearMoneda(calcularTotal(), data.moneda)}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección específica para pagarés */}
        {docInfo.esCredito && (
          <View style={styles.pagareSection}>
            <Text style={styles.pagareTitle}>Términos del Pagaré</Text>
            <Text style={styles.pagareText}>{textoLegal}</Text>
            <View style={styles.vencimientoInfo}>
              <Text style={styles.vencimientoLabel}>Fecha de vencimiento:</Text>
              <Text style={styles.vencimientoFecha}>{fechaVencimiento}</Text>
            </View>
            <View style={styles.vencimientoInfo}>
              <Text style={styles.vencimientoLabel}>Lugar de pago:</Text>
              <Text style={styles.vencimientoFecha}>{data.company.address}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {docInfo.esCredito ? 'Documento de crédito comercial.' : 'Comprobante de pago recibido.'}
          </Text>
          <Text style={styles.footerText}>
            {data.company.name} • {fechaActual}
          </Text>
        </View>

        {/* Metadatos */}
        <Text style={styles.metadata}>
          Doc ID: {data.invoice.number} • Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

// Función para convertir datos de venta al formato del documento (mejorada)
export const convertirVentaARecibo = (transaccion) => {
  return {
    company: {
      name: "UPDATE TECH WW SRL",
      address: "Avenida 44 N° 862 1/2 Piso 4\nLa Plata, Buenos Aires, Argentina",
      phone: "221-641-9901",
      cuit: "30-71850553-2"
    },
    invoice: {
      number: `REC-${String(transaccion.numero_transaccion).padStart(6, '0')}`,
      date: new Date(transaccion.fecha_venta).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    client: {
      name: transaccion.cliente_nombre || 'Cliente No Especificado',
      address: transaccion.cliente_direccion || 'Dirección no disponible',
      phone: transaccion.cliente_telefono || '',
      email: transaccion.cliente_email || ''
    },
    items: (transaccion.venta_items || []).map(item => ({
      description: item.copy || 'Producto sin especificar',
      quantity: item.cantidad || 1,
      unit: 'Un.',
      unitPrice: item.precio_unitario || 0,
      amount: item.precio_total || 0,
      serial: item.serial_producto || null
    })),
    discount: transaccion.descuento || 0,
    moneda: transaccion.moneda_pago || 'USD',
    metodoPago: transaccion.metodo_pago || 'efectivo'
  };
};

// Función mejorada para generar y abrir el PDF en nueva pestaña
export const generarYDescargarRecibo = async (transaccion) => {
  try {
    const reciboData = convertirVentaARecibo(transaccion);
    const tipoDocumento = determinarTipoDocumento(transaccion.metodo_pago);
    const blob = await pdf(<ReciboVentaDocument data={reciboData} tipoDocumento={tipoDocumento} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
    
    return {
      success: true,
      message: `${tipoDocumento.tipo} abierto en nueva pestaña`
    };
  } catch (error) {
    console.error('Error generando recibo PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default ReciboVentaDocument;