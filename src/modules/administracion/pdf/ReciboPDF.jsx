import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer';
import InterRegular from '../../../../public/Inter/static/Inter_18pt-Regular.ttf'
import InterBold from '../../../../public/Inter/static/Inter_18pt-Bold.ttf'

// Registrar la fuente ANTES de los estilos
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: InterRegular,
      fontWeight: 'normal',
    },
    {
      src: InterBold,
      fontWeight: 'bold',
    }
  ]
});

// Estilos profesionales mejorados para el PDF - Mismos estilos que ReciboVentaPDF_NewTab
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontFamily: 'Inter',
    fontSize: 8,
    lineHeight: 1.2,
    flex: 1,
  },

  // Header de la empresa
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 7,
    paddingHorizontal: 25,
    backgroundColor: '#000000',
    width: '100%',
  },
  companyLogosSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 35,
    height: 35,
  },
  textoImage: {
    width: 85,
  },
  companyInfoHeaderSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 0,
    alignItems: 'flex-end',
  },
  companyInfo: {
    flex: 1,
    textAlign: 'right',
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  companyDetails: {
    fontSize: 7,
    color: '#FFFFFF',
    lineHeight: 1.4,
    fontFamily: 'Inter',
    marginBottom: 6,
    textAlign: 'right',
  },

  // Header del documento
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 25,
    paddingVertical: 15,
    marginBottom: 20,
  },
  documentTitleSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    marginTop: 0,
    marginBottom: 8,
    paddingTop: 0,
    paddingBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    textAlign: 'right',
  },
  documentSubtitle: {
    fontSize: 8,
    color: '#000000',
    fontFamily: 'Inter',
    marginBottom: 6,
    marginTop: 6,
    textAlign: 'right',
  },
  documentInfo: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'right',
    fontFamily: 'Inter',
    marginBottom: 0,
  },

  // Cliente info lado izquierdo del header
  clientHeaderSection: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  clientHeaderLabel: {
    fontSize: 7,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
  },
  clientHeaderName: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 4,
    marginTop: 4,
  },
  clientHeaderPhone: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 4,
  },
  clientHeaderEmail: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#000000',
  },

  // Tabla de productos
  table: {
    marginBottom: 25,
    marginHorizontal: 25,
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 25,
    marginBottom: 0.5,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
    justifyContent: 'center',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  tableCellDescription: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.3,
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },

  // Columnas de la tabla con mejor distribución
  colItem: {
    width: '60%',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  colItemContent: {
    width: '60%',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  colQuantity: {
    width: '13%',
    textAlign: 'center',
  },
  colPrice: {
    width: '14%',
    textAlign: 'center',
  },
  colTotal: {
    width: '13%',
    textAlign: 'center',
  },
  colTotalLast: {
    width: '13%',
    textAlign: 'center',
    borderRightWidth: 0,
  },

  // Sección de totales
  totalsSection: {
    marginTop: 15,
    marginHorizontal: 25,
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsContainer: {
    width: '40%',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
  },
  totalsHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
  },
  totalsHeaderText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    textAlign: 'center',
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB',
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 8,
    color: '#000000',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 8,
    color: '#000000',
    fontFamily: 'Inter',
    textAlign: 'center',
    flex: 1,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 0,
  },
  finalTotalLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  finalTotalValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },

  // Espacio para firmar
  signatureSection: {
    marginTop: 80,
    marginBottom: 30,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureLine: {
    width: '40%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 7,
    color: '#000000',
    fontFamily: 'Inter',
  },

  // Mensaje de agradecimiento
  thankYouSection: {
    marginTop: 60,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 25,
    textAlign: 'center',
  },
  thankYouText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sección de información de empresa al final
  companyInfoFooter: {
    marginTop: 'auto',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    textAlign: 'center',
  },
  companyInfoFooterText: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 2,
  },
});

// Componente del documento PDF
const ReciboDocument = ({ data }) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header de la empresa con logo y info */}
        <View style={styles.companyHeader}>
          {/* Sección izquierda: logos en negro */}
          <View style={styles.companyLogosSection}>
            <Image source="/logo.png" style={styles.logoImage} />
            <Image source="/texto.png" style={styles.textoImage} />
          </View>

          {/* Sección derecha: info empresa en blanco */}
          <View style={styles.companyInfoHeaderSection}>
            <Text style={styles.companyName}>{data.company.name}</Text>
            <Text style={styles.companyDetails}>{data.company.cuit}</Text>
            <Text style={styles.companyDetails}>La Plata, Buenos Aires, Argentina</Text>
          </View>
        </View>

        {/* Header de recibo */}
        <View style={styles.receiptHeader}>
          {/* Lado izquierdo: Cliente */}
          <View style={styles.clientHeaderSection}>
            <Text style={styles.clientHeaderLabel}>A NOMBRE DE:</Text>
            <Text style={styles.clientHeaderName}>{data.client.name}</Text>
            {data.client.phone && <Text style={styles.clientHeaderPhone}>{data.client.phone}</Text>}
            {data.client.email && <Text style={styles.clientHeaderEmail}>{data.client.email}</Text>}
          </View>

          {/* Lado derecho: RECIBO */}
          <View style={styles.documentTitleSection}>
            <Text style={styles.documentTitle}>RECIBO</Text>
            <Text style={styles.documentInfo}>{data.invoice.date}</Text>
            <Text style={styles.documentSubtitle}>{data.invoice.number}</Text>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.colQuantity]}>Cantidad</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio</Text>
            <Text style={[styles.tableHeaderText, styles.colTotalLast]}>Total</Text>
          </View>

          {data.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index === data.items.length - 1 && styles.tableRowLast
              ]}
            >
              <View style={[styles.tableCell, styles.colItemContent]}>
                <Text>{item.description}</Text>
              </View>
              <View style={[styles.tableCell, styles.colQuantity]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCell, styles.colPrice]}>
                <Text>{formatearMoneda(item.unitPrice, data.moneda)}</Text>
              </View>
              <View style={[styles.tableCell, styles.colTotalLast]}>
                <Text>{formatearMoneda(item.amount, data.moneda)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalsHeader}>
              <Text style={styles.totalsHeaderText}>Total</Text>
              <Text style={[styles.totalsHeaderText, { borderRightWidth: 0 }]}>Monto</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatearMoneda(calcularTotal(), data.moneda)}
              </Text>
            </View>
          </View>
        </View>

        {/* Espacio para firmar */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine}>
            <Text>Firma</Text>
          </View>
        </View>

        {/* Mensaje de agradecimiento */}
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>¡GRACIAS POR TU COMPRA!</Text>
        </View>

        {/* Información de la Empresa al Final */}
        <View style={styles.companyInfoFooter}>
          <Text style={styles.companyInfoFooterText}>
            {data.company.name} • {data.company.cuit} • {data.company.phone} • INFO@UPDATETECH.COM.AR • WWW.UPDATETECH.COM.AR
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para convertir datos de recibo customizable al formato del documento
export const convertirReciboADocumento = (recibo) => {
  return {
    company: {
      name: "UPDATE TECH WW S.R.L",
      address: "Avenida 44 N° 862 1/2 Piso 4\nLa Plata, Buenos Aires, Argentina",
      phone: "+54 221 359-9837",
      cuit: "CUIT: 30-71850553-2"
    },
    invoice: {
      number: recibo.numero_recibo,
      date: new Date(recibo.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    client: {
      name: recibo.cliente_nombre || 'Cliente No Especificado',
      address: recibo.cliente_direccion || '',
      phone: recibo.cliente_telefono || '',
      email: recibo.cliente_email || ''
    },
    items: (recibo.items || []).map(item => ({
      description: item.descripcion,
      quantity: item.cantidad || 1,
      unitPrice: item.precio_unitario || 0,
      amount: item.precio_total || 0
    })),
    discount: recibo.descuento || 0,
    moneda: recibo.moneda || 'USD',
    metodoPago: recibo.metodo_pago || 'efectivo'
  };
};

// Función para generar y abrir el PDF en nueva pestaña
export const generarYDescargarRecibo = async (recibo) => {
  try {
    const reciboData = convertirReciboADocumento(recibo);
    const blob = await pdf(<ReciboDocument data={reciboData} />).toBlob();

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);

    return {
      success: true,
      message: 'Recibo abierto en nueva pestaña'
    };
  } catch (error) {
    console.error('Error generando recibo PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default ReciboDocument;
