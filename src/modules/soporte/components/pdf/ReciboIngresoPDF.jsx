import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer';
import InterRegular from '../../../../../public/Inter/static/Inter_18pt-Regular.ttf'
import InterBold from '../../../../../public/Inter/static/Inter_18pt-Bold.ttf'
import InterItalic from '../../../../../public/Inter/static/Inter_18pt-Italic.ttf'
import HeligthonSignature from '../../../../../public/fonts/Heligthon Signature.otf'

// Registrar fuentes
Font.register({
  family: 'Inter',
  fonts: [
    { src: InterRegular, fontWeight: 'normal' },
    { src: InterBold, fontWeight: 'bold' },
    { src: InterItalic, fontStyle: 'italic' }
  ]
});

Font.register({
  family: 'Heligthon',
  src: HeligthonSignature,
});

// Estilos - Mismo estilo visual que RemitoPDF
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
    alignItems: 'flex-end',
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
    marginBottom: 15,
  },
  documentTitleSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  documentTitle: {
    fontSize: 14,
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

  // Cliente info
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
    fontSize: 9,
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

  // Sección de información del equipo
  infoSection: {
    marginHorizontal: 25,
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  infoSectionTitle: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#9CA3AF',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#000000',
    width: 100,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#374151',
    flex: 1,
  },
  infoColumn: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  infoValueBlock: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#374151',
    lineHeight: 1.4,
    marginTop: 4,
  },

  // Tabla de equipo
  table: {
    marginBottom: 15,
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
    fontSize: 8,
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

  // Columnas de la tabla
  colTipo: { width: '15%' },
  colMarca: { width: '20%' },
  colModelo: { width: '35%' },
  colSerial: { width: '30%' },

  // Condiciones legales
  legalSection: {
    marginHorizontal: 25,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 0.5,
    borderColor: '#D97706',
  },
  legalTitle: {
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  legalText: {
    fontSize: 7,
    fontFamily: 'Inter',
    color: '#78350F',
    lineHeight: 1.4,
    marginBottom: 3,
  },

  // Espacio para firmar
  signatureSection: {
    marginTop: 40,
    marginBottom: 30,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    marginBottom: 20,
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

// Componente del PDF de Recibo de Ingreso
const ReciboIngresoPDFDocument = ({ reparacion }) => {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = fecha.split('-');
      const fechaLocal = new Date(year, month - 1, day);
      return fechaLocal.toLocaleDateString('es-AR');
    }
    return new Date(fecha).toLocaleDateString('es-AR');
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
            <Text style={styles.clientHeaderLabel}>NOMBRE Y APELLIDO</Text>
            <Text style={styles.clientHeaderName}>{reparacion.cliente_nombre || 'Sin especificar'}</Text>
            {reparacion.cliente_telefono && (
              <Text style={styles.clientHeaderPhone}>Tel: {reparacion.cliente_telefono}</Text>
            )}
            {reparacion.cliente_email && (
              <Text style={styles.clientHeaderEmail}>Email: {reparacion.cliente_email}</Text>
            )}
          </View>

          {/* Título y datos */}
          <View style={styles.documentTitleSection}>
            <Text style={styles.documentTitle}>RECIBO DE INGRESO</Text>
            <Text style={styles.documentSubtitle}>SERVICIO TÉCNICO</Text>
            <Text style={styles.documentInfo}>Nº {reparacion.numero || reparacion.id}</Text>
            <Text style={styles.documentInfo}>Fecha: {formatearFecha(reparacion.fecha_ingreso)}</Text>
          </View>
        </View>

        {/* Tabla de equipo */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colTipo]}>TIPO</Text>
            <Text style={[styles.tableHeaderText, styles.colMarca]}>MARCA</Text>
            <Text style={[styles.tableHeaderText, styles.colModelo]}>MODELO</Text>
            <Text style={[styles.tableHeaderText, styles.colSerial, { borderRightWidth: 0 }]}>SERIAL</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colTipo]}>
              {reparacion.equipo_tipo || '-'}
            </Text>
            <Text style={[styles.tableCell, styles.colMarca]}>
              {reparacion.equipo_marca || '-'}
            </Text>
            <Text style={[styles.tableCell, styles.colModelo]}>
              {reparacion.equipo_modelo || '-'}
            </Text>
            <Text style={[styles.tableCell, styles.colSerial, { borderRightWidth: 0 }]}>
              {reparacion.equipo_serial || '-'}
            </Text>
          </View>
        </View>

        {/* Información del servicio */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Detalle del Ingreso</Text>

          {reparacion.problema_reportado && (
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Problema Reportado:</Text>
              <Text style={styles.infoValueBlock}>{reparacion.problema_reportado}</Text>
            </View>
          )}

          {reparacion.accesorios_incluidos && (
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Accesorios Incluidos:</Text>
              <Text style={styles.infoValueBlock}>{reparacion.accesorios_incluidos}</Text>
            </View>
          )}

          {reparacion.observaciones && (
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Observaciones:</Text>
              <Text style={styles.infoValueBlock}>{reparacion.observaciones}</Text>
            </View>
          )}
        </View>

        {/* Sección de firmas */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={{ height: 60 }} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma del Cliente</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Update Tech</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Recibido por</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Este comprobante acredita la recepción del equipo para diagnóstico/reparación • Conserve este documento
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar y abrir el PDF
export const generarReciboIngreso = async (reparacion) => {
  try {
    const blob = await pdf(<ReciboIngresoPDFDocument reparacion={reparacion} />).toBlob();
    const url = URL.createObjectURL(blob);

    // Abrir en nueva pestaña
    window.open(url, '_blank');

    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);

    return { success: true };
  } catch (error) {
    console.error('Error al generar PDF de recibo de ingreso:', error);
    return { success: false, error: error.message };
  }
};

export default ReciboIngresoPDFDocument;
