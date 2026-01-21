import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer';
import InterRegular from '../../../../public/Inter/static/Inter_18pt-Regular.ttf'
import InterBold from '../../../../public/Inter/static/Inter_18pt-Bold.ttf'
import InterItalic from '../../../../public/Inter/static/Inter_18pt-Italic.ttf'
import HeligthonSignature from '../../../../public/fonts/Heligthon Signature.otf'

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
    },
    {
      src: InterItalic,
      fontStyle: 'italic',
    }
  ]
});

Font.register({
  family: 'Heligthon',
  src: HeligthonSignature,
});

// Estilos profesionales para el Remito PDF - Basado en ReciboPDF
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

  // Sección de información del remito (fecha entrega, quien retira, observaciones)
  remitoInfo: {
    marginHorizontal: 25,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  remitoInfoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  remitoInfoColumn: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  remitoInfoLabel: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#000000',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  remitoInfoValue: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#374151',
    flexWrap: 'wrap',
    flex: 1,
  },
  remitoInfoValueBlock: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#374151',
    lineHeight: 1.4,
    marginTop: 4,
  },

  // Tabla de productos (sin precios)
  table: {
    marginBottom: 25,
    marginHorizontal: 25,
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

  // Columnas de la tabla para remito (ID, Descripción, Serial, Cantidad)
  colId: {
    width: '10%',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  colDescription: {
    width: '50%',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  colSerial: {
    width: '25%',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  colQuantity: {
    width: '15%',
    textAlign: 'center',
  },
  colQuantityLast: {
    width: '15%',
    textAlign: 'center',
    borderRightWidth: 0,
  },

  // Espacio para firmar
  signatureSection: {
    marginTop: 80,
    marginBottom: 30,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    marginBottom: 5,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#000000',
    fontFamily: 'Inter',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  signatureText: {
    fontSize: 32,
    color: '#9CA3AF',
    fontFamily: 'Heligthon',
    textAlign: 'center',
    marginBottom: 18,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#374151',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

// Componente del PDF de Remito
const RemitoPDFDocument = ({ remito }) => {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header de la empresa */}
        <View style={styles.companyHeader}>
          <View style={styles.companyLogosSection}>
            <Image source="/logo.png" style={styles.logoImage} />
            <Image source="/texto.png" style={styles.textoImage} />
          </View>
          <View style={styles.companyInfoHeaderSection}>
            <Text style={styles.companyName}>UPDATE TECH WW S.R.L</Text>
            <Text style={styles.companyDetails}>CUIT: 30-71850553-2</Text>
            <Text style={styles.companyDetails}>La Plata, Buenos Aires, Argentina</Text>
          </View>
        </View>

        {/* Header del documento */}
        <View style={styles.receiptHeader}>
          {/* Cliente info */}
          <View style={styles.clientHeaderSection}>
            <Text style={styles.clientHeaderLabel}>CLIENTE</Text>
            <Text style={styles.clientHeaderName}>{remito.cliente_nombre}</Text>
            {remito.cliente_telefono && (
              <Text style={styles.clientHeaderPhone}>Tel: {remito.cliente_telefono}</Text>
            )}
            {remito.cliente_email && (
              <Text style={styles.clientHeaderEmail}>Email: {remito.cliente_email}</Text>
            )}
          </View>

          {/* Título y datos del remito */}
          <View style={styles.documentTitleSection}>
            <Text style={styles.documentTitle}>REMITO</Text>
            <Text style={styles.documentSubtitle}>Nº {remito.numero_recibo}</Text>
            <Text style={styles.documentInfo}>Fecha: {formatearFecha(remito.fecha)}</Text>
          </View>
        </View>

        {/* Información específica del remito */}
        {(remito.fecha_entrega || remito.quien_retira || remito.observaciones) && (
          <View style={styles.remitoInfo}>
            {remito.fecha_entrega && (
              <View style={styles.remitoInfoRow}>
                <Text style={styles.remitoInfoLabel}>Fecha de Entrega:</Text>
                <Text style={styles.remitoInfoValue}>{formatearFecha(remito.fecha_entrega)}</Text>
              </View>
            )}
            {remito.quien_retira && (
              <View style={styles.remitoInfoRow}>
                <Text style={styles.remitoInfoLabel}>Retira:</Text>
                <Text style={styles.remitoInfoValue}>{remito.quien_retira}</Text>
              </View>
            )}
            {remito.observaciones && (
              <View style={styles.remitoInfoColumn}>
                <Text style={styles.remitoInfoLabel}>Observaciones:</Text>
                <Text style={styles.remitoInfoValueBlock}>{remito.observaciones}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tabla de productos */}
        <View style={styles.table}>
          {/* Header de la tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colId]}>ID</Text>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>DESCRIPCIÓN</Text>
            <Text style={[styles.tableHeaderText, styles.colSerial]}>SERIAL</Text>
            <Text style={[styles.tableHeaderText, styles.colQuantityLast]}>CANT.</Text>
          </View>

          {/* Filas de productos */}
          {remito.items?.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index === remito.items.length - 1 && styles.tableRowLast
              ]}
            >
              <Text style={[styles.tableCell, styles.colId]}>{index + 1}</Text>
              <Text style={[styles.tableCellDescription, styles.colDescription]}>
                {item.descripcion}
              </Text>
              <Text style={[styles.tableCell, styles.colSerial]}>
                {item.serial || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.colQuantityLast]}>
                {item.cantidad}
              </Text>
            </View>
          ))}
        </View>

        {/* Sección de firmas */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma y Aclaración</Text>
            <Text style={styles.signatureLabel}>Recibí Conforme</Text>
            {remito.quien_retira && (
              <Text style={[styles.signatureLabel, { marginTop: 4, fontSize: 7 }]}>
                ({remito.quien_retira})
              </Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Update Tech</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>FIRMA Y ACLARACIÓN</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Este remito no tiene validez fiscal • Documento generado electrónicamente
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar y descargar el remito
export const generarYDescargarRemito = async (remito) => {
  try {
    const blob = await pdf(<RemitoPDFDocument remito={remito} />).toBlob();
    const url = URL.createObjectURL(blob);

    // Abrir en nueva pestaña
    window.open(url, '_blank');

    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);

    return { success: true };
  } catch (error) {
    console.error('Error al generar PDF del remito:', error);
    return { success: false, error: error.message };
  }
};

export default RemitoPDFDocument;
