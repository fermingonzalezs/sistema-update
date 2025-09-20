import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../../../../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../../../../Roboto/static/Roboto-Bold.ttf'
import { determinarTipoDocumento, calcularFechaVencimiento, generarTextoLegalPagare } from '../../../../shared/utils/documentTypeUtils';

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

// Estilos profesionales mejorados para el PDF - Versión compacta
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
  
  // Tabla de productos
  table: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 6,
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 30,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 7,
    color: '#374151',
    justifyContent: 'center',
  },
  tableCellBold: {
    fontSize: 7,
    color: '#1F2937',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },
  tableCellDescription: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.3,
  },
  serialText: {
    fontSize: 6,
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
    width: '52%',
    textAlign: 'left',
  },
  colQty: {
    width: '12%',
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
    marginTop: 15,
    alignItems: 'flex-end',
  },
  totalsContainer: {
    width: '50%',
    minWidth: 150,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 7,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  totalValue: {
    fontSize: 7,
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 6,
    borderRadius: 4,
  },
  finalTotalLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    letterSpacing: 0.3,
  },
  finalTotalValue: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    letterSpacing: 0.3,
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
    marginTop: 15,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  pagareTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#DC2626',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pagareText: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.3,
    textAlign: 'justify',
    fontFamily: 'Roboto',
  },
  vencimientoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vencimientoLabel: {
    fontSize: 6,
    fontFamily: 'Roboto',
    color: '#6B7280',
  },
  vencimientoFecha: {
    fontSize: 7,
    fontFamily: 'Roboto',
    color: '#DC2626',
  },
  
  // Sección de información de garantía
  warrantySection: {
    marginTop: 15,
    marginBottom: 15,
  },
  warrantyTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 3,
  },
  warrantyText: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
    marginBottom: 4,
    textAlign: 'justify',
  },

  // Sección importante
  importantSection: {
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    borderRadius: 4,
  },
  importantTitle: {
    fontSize: 6,
    fontFamily: 'Roboto',
    color: '#DC2626',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  importantText: {
    fontSize: 5,
    color: '#374151',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
    marginBottom: 3,
    textAlign: 'justify',
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
            UPDATE TECH - 221-641-9901 - LA PLATA - BUENOS AIRES - ARGENTINA{'\n'}
            UPDATE TECH - 221-359-9837 - CABA - BUENOS AIRES - ARGENTINA
          </Text>
          <Text style={styles.footerText}>
            Email: info@updatetech.com.ar • Web: www.updatetech.com.ar
          </Text>
          <Text style={styles.footerText}>
            UPDATE TECH WW SRL • {fechaActual}
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
    items: (transaccion.venta_items || []).map(item => {
      // Extraer información básica del copy
      const copy = item.copy || 'Producto sin especificar';

      // Intentar extraer modelo y condición del copy
      let modelo = copy;
      let condicion = '';

      // Buscar patrones comunes para extraer condición
      const condicionPatterns = [
        /- (nuevo|usado|refurbished|reacondicionado)/i,
        /\((nuevo|usado|refurbished|reacondicionado)\)/i,
        /(nuevo|usado|refurbished|reacondicionado)$/i
      ];

      for (const pattern of condicionPatterns) {
        const match = copy.match(pattern);
        if (match) {
          condicion = match[1].toLowerCase();
          // Normalizar condición
          if (condicion === 'reacondicionado') condicion = 'refurbished';
          modelo = copy.replace(pattern, '').trim();
          break;
        }
      }

      // Si no se encontró condición, asumir "usado"
      if (!condicion) {
        condicion = 'usado';
      }

      // Construir descripción simplificada
      const descripcionSimple = `${modelo} - ${condicion}`;

      return {
        description: descripcionSimple,
        quantity: item.cantidad || 1,
        unitPrice: item.precio_unitario || 0,
        amount: item.precio_total || 0,
        serial: item.serial_producto || null
      };
    }),
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