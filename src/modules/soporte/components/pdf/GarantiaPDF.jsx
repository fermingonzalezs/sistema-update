import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer';
import InterRegular from '../../../../../public/Inter/static/Inter_18pt-Regular.ttf'
import InterBold from '../../../../../public/Inter/static/Inter_18pt-Bold.ttf'
import InterItalic from '../../../../../public/Inter/static/Inter_18pt-Italic.ttf'
import HeligthonSignature from '../../../../../public/fonts/Heligthon Signature.otf'
import { determinarTipoDocumento, calcularFechaVencimiento, generarTextoLegalPagare } from '../../../../shared/utils/documentTypeUtils';
import { generarCopyParaPDF } from '../../../../shared/utils/pdfCopyUtils';

// Registrar las fuentes ANTES de los estilos
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

// Estilos profesionales mejorados para el PDF - Versión compacta (MISMO ESTILO QUE RECIBO)
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

  // Sección de información de recibo
  receiptInfoSection: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    backgroundColor: '#FFFFFF',
  },

  // Información del cliente
  clientSection: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 40,
    paddingHorizontal: 25,
    marginTop: 20,
  },
  clientColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 'normal',
  },
  clientInfo: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.6,
    fontFamily: 'Inter',
  },
  clientName: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  // Tabla de productos
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
  tableCellBold: {
    fontSize: 8,
    color: '#1F2937',
    fontFamily: 'Inter',
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
  serialText: {
    fontSize: 7,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 2,
  },

  // Columnas de la tabla con mejor distribución para garantías
  colItem: {
    width: '40%',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  colItemContent: {
    width: '40%',
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
  colGarantia: {
    width: '20%',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  colPrice: {
    width: '15%',
    textAlign: 'center',
  },
  colPriceLast: {
    width: '15%',
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
  discountRow: {
    backgroundColor: '#E5E7EB',
  },
  discountLabel: {
    color: '#000000',
  },
  discountValue: {
    color: '#000000',
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

  // Footer
  footer: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'left',
    lineHeight: 1.4,
    marginBottom: 3,
    textTransform: 'uppercase',
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
    alignItems: 'center',
  },
  signatureLineBar: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginTop: 4,
  },
  signatureText: {
    fontSize: 32,
    color: '#9CA3AF',
    fontFamily: 'Heligthon',
    textAlign: 'center',
    marginBottom: 18,
  },
  signatureLabelGarantia: {
    fontSize: 7,
    color: '#000000',
    fontFamily: 'Inter',
    textAlign: 'center',
    paddingTop: 4,
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
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  pagareTitle: {
    fontSize: 8,
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  vencimientoFecha: {
    fontSize: 7,
    fontFamily: 'Inter',
    color: '#DC2626',
    textTransform: 'uppercase',
  },

  // Sección de información de garantía
  warrantySection: {
    marginTop: 15,
    marginBottom: 15,
  },
  warrantyTitle: {
    fontSize: 8,
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
  },
  importantTitle: {
    fontSize: 6,
    fontFamily: 'Inter',
    color: '#DC2626',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  importantText: {
    fontSize: 5,
    color: '#374151',
    lineHeight: 1.3,
    fontFamily: 'Inter',
    marginBottom: 3,
    textAlign: 'justify',
  },

  // Secciones de condiciones de garantía
  condicionesSection: {
    marginTop: 25,
    marginHorizontal: 25,
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
  },
  condicionesHeader: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
  },
  condicionesHeaderText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  condicionesContent: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  condicionesText: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Inter',
    marginBottom: 4,
    textAlign: 'justify',
  },
  condicionesBullet: {
    fontSize: 6,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Inter',
    marginBottom: 3,
    marginLeft: 10,
    textAlign: 'justify',
  },

});

// Componente del documento PDF de Garantía (MISMO FORMATO QUE RECIBO)
const GarantiaDocument = ({ data, tipoDocumento }) => {
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
        {/* Header de la empresa con logo y info */}
        <View style={styles.companyHeader}>
          {/* Sección izquierda: logos */}
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

        {/* Header de garantía */}
        <View style={styles.receiptHeader}>
          {/* Lado izquierdo: Cliente */}
          <View style={styles.clientHeaderSection}>
            <Text style={styles.clientHeaderLabel}>A NOMBRE DE:</Text>
            <Text style={styles.clientHeaderName}>{data.client.name}</Text>
            {data.client.phone && <Text style={styles.clientHeaderPhone}>{data.client.phone}</Text>}
            {data.client.email && <Text style={styles.clientHeaderEmail}>{data.client.email}</Text>}
          </View>

          {/* Lado derecho: GARANTÍA */}
          <View style={styles.documentTitleSection}>
            <Text style={styles.documentTitle}>GARANTÍA</Text>
            <Text style={styles.documentInfo}>{data.invoice.date}</Text>
            <Text style={styles.documentSubtitle}>{data.invoice.number}</Text>
          </View>
        </View>


        {/* Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.colSerial]}>Serial</Text>
            <Text style={[styles.tableHeaderText, styles.colGarantia]}>Garantía</Text>
            <Text style={[styles.tableHeaderText, styles.colPriceLast]}>Precio</Text>
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
              <View style={[styles.tableCell, styles.colSerial]}>
                <Text>{item.serial || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colGarantia]}>
                <Text>{item.garantia || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colPriceLast]}>
                <Text>{formatearMoneda(item.unitPrice, data.moneda)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CONDICIONES DE GARANTÍA */}
        <View style={styles.condicionesSection}>
          <View style={styles.condicionesHeader}>
            <Text style={styles.condicionesHeaderText}>CONDICIONES DE GARANTÍA</Text>
          </View>
          <View style={styles.condicionesContent}>
            <Text style={styles.condicionesText}>
              LA EMPRESA acompaña a cada uno de sus productos con un certificado de garantía, comprometiéndose a reparar o reemplazar cualquier parte que, a criterio del servicio técnico especializado, resulte defectuosa de fabricación. La garantía será efectiva únicamente en nuestras oficinas.
            </Text>
            <Text style={styles.condicionesText}>
              Esta garantía NO da el derecho a exigir la sustitución de la totalidad del elemento o de sus partes, ni el reintegro del importe pagado por el producto. Tampoco cubre funcionamientos originados por causas ajenas al producto o por las fallas del producto. La garantía es única y sólo cubre defectos de fabricación; no contempla fallas debidas a mal degradación de los componentes por el uso, rotura, suciedad, errores en la operación, instalación defectuosa, etc.
            </Text>
            <Text style={styles.condicionesText}>
              Para efectuar cualquier reclamo, el cliente deberá presentar el comprobante original de compra junto con el certificado de garantía.
            </Text>
          </View>
        </View>

        {/* IMPORTANTE */}
        <View style={styles.condicionesSection}>
          <View style={styles.condicionesHeader}>
            <Text style={styles.condicionesHeaderText}>IMPORTANTE</Text>
          </View>
          <View style={styles.condicionesContent}>
            <Text style={styles.condicionesText}>
              Han de verse que se producen reclamos por supuestas fallas de productos en garantía, que resulten infundados y demanden un plus en horas de servicio técnico, de investigación y/o reinstalación. LA EMPRESA COBRARÁ dicho trabajo.
            </Text>
            <Text style={styles.condicionesText}>
              Si dentro de las 48 horas hábiles de comprado el producto, se detectara una falla evidente de fabricación, el cliente tiene el derecho a recibir un reemplazo sin tener que esperar.
            </Text>
            <Text style={styles.condicionesText}>
              Pasadas estas 48 horas, el tiempo que demore la reparación y/o reemplazo del producto, será de 72 horas hábiles como mínimo.
            </Text>
          </View>
        </View>

        {/* CAUSALES DE ANULACIÓN DE LA GARANTÍA */}
        <View style={styles.condicionesSection}>
          <View style={styles.condicionesHeader}>
            <Text style={styles.condicionesHeaderText}>CAUSALES DE ANULACIÓN DE LA GARANTÍA</Text>
          </View>
          <View style={styles.condicionesContent}>
            <Text style={styles.condicionesBullet}>• Si el producto ha sido abierto.</Text>
            <Text style={styles.condicionesBullet}>• Incorrecta manipulación y/o configuración (cuando corresponda).</Text>
            <Text style={styles.condicionesBullet}>• Si se han alterado inscripciones tales como números de serie, modelo, etiquetas de cualquier tipo.</Text>
            <Text style={styles.condicionesBullet}>• Si el producto presenta oxidación, abolladuras o daños físicos.</Text>
          </View>
        </View>

        {/* Espacio para firmar */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureText}>Update Tech</Text>
            <View style={styles.signatureLineBar} />
            <Text style={styles.signatureLabelGarantia}>Firma</Text>
          </View>
        </View>

        {/* Información de la Empresa al Final */}
        <View style={styles.companyInfoFooter}>
          <Text style={styles.companyInfoFooterText}>
            {data.company.name} • {data.company.cuit} • {data.company.phone} • INFO@UPDATETECH.COM.AR
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para convertir datos de venta al formato de garantía (MISMO FORMATO QUE RECIBO)
export const convertirVentaAGarantia = (transaccion) => {
  return {
    company: {
      name: "UPDATE TECH WW S.R.L",
      address: "Avenida 44 N° 862 1/2 Piso 4\nLa Plata, Buenos Aires, Argentina",
      phone: "+54 221 359-9837",
      cuit: "CUIT: 30-71850553-2"
    },
    invoice: {
      number: transaccion.numero_transaccion?.startsWith('VEN-')
        ? transaccion.numero_transaccion.replace('VEN-', 'GAR-')
        : `GAR-${String(transaccion.numero_transaccion).padStart(6, '0')}`,
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
      // Generar copy simplificado para PDF usando función compartida
      let descripcion;
      try {
        descripcion = generarCopyParaPDF(item);
      } catch (error) {
        console.error('❌ Error en generarCopyParaPDF:', error);
        descripcion = item.modelo_producto || 'Producto sin especificar';
      }

      return {
        description: descripcion,
        serial: item.serial_producto || item.numero_serie || 'N/A',
        garantia: item.garantia || 'N/A', // Usar directamente el campo garantia de venta_items
        unitPrice: item.precio_unitario || 0,
        amount: item.precio_total || 0
      };
    }),
    discount: transaccion.descuento || 0,
    moneda: transaccion.moneda_pago || 'USD',
    metodoPago: transaccion.metodo_pago || 'efectivo'
  };
};

// Función mejorada para generar y abrir el PDF de garantía en nueva pestaña
export const generarYDescargarGarantia = async (transaccion, ventanaAbierta = null) => {
  try {
    const garantiaData = convertirVentaAGarantia(transaccion);
    const tipoDocumento = determinarTipoDocumento(transaccion.metodo_pago);
    const blob = await pdf(<GarantiaDocument data={garantiaData} tipoDocumento={tipoDocumento} />).toBlob();

    const url = URL.createObjectURL(blob);

    // Si se pasó una ventana pre-abierta, usarla; si no, abrir nueva
    if (ventanaAbierta && !ventanaAbierta.closed) {
      ventanaAbierta.location.href = url;
    } else {
      window.open(url, '_blank');
    }

    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);

    return {
      success: true,
      mensaje: `Garantía abierta en nueva pestaña`
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
export const generarYDescargarGarantiaProducto = async (producto, cliente = {}, datosVenta = {}, ventanaAbierta = null) => {
  try {
    console.log('🔍 [GARANTIA] Datos recibidos:', { producto, cliente, datosVenta });

    // Construir una transacción simulada con el formato correcto
    const transaccionSimulada = {
      numero_transaccion: datosVenta.numeroTransaccion || 'N/A',
      fecha_venta: datosVenta.fechaVenta || new Date(),
      cliente_nombre: cliente.nombre || 'Cliente No Especificado',
      cliente_direccion: cliente.direccion || '',
      cliente_telefono: cliente.telefono || '',
      cliente_email: cliente.email || '',
      venta_items: [{
        copy: producto.copy || 'Producto sin especificar', // Copy completo con condición
        copy_documento: producto.copy_documento || producto.copy || 'Producto sin especificar', // Copy limpio para documentos
        modelo_producto: producto.copy || 'Producto sin especificar',
        cantidad: 1,
        precio_unitario: producto.precio_venta_usd || 0,
        precio_total: producto.precio_venta_usd || 0,
        serial_producto: producto.serial_producto || producto.numero_serie || null,
        tipo_producto: producto.tipo_producto || 'computadora',
        garantia: producto.garantia || 'N/A' // Usar el campo garantia directamente
      }],
      descuento: 0,
      moneda_pago: 'USD',
      metodo_pago: datosVenta.metodoPago || 'efectivo'
    };

    console.log('🔍 [GARANTIA] Transacción simulada:', transaccionSimulada);

    const resultado = await generarYDescargarGarantia(transaccionSimulada, ventanaAbierta);
    console.log('🔍 [GARANTIA] Resultado:', resultado);

    return resultado;
  } catch (error) {
    console.error('❌ [GARANTIA] Error generando garantía de producto individual:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default GarantiaDocument;
