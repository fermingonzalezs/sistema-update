import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import InterRegular from '../../../../../public/Inter/static/Inter_18pt-Regular.ttf'
import InterBold from '../../../../../public/Inter/static/Inter_18pt-Bold.ttf'

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

// Estilos profesionales mejorados para el PDF de garantía
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

  // Header de la empresa (NEGRO con logo)
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
    paddingHorizontal: 0,
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

  // Header de garantía con número
  warrantyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 25,
    paddingVertical: 15,
    marginBottom: 20,
  },
  warrantyHeaderLeft: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  warrantyHeaderLabel: {
    fontSize: 7,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
  },
  warrantyHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    marginTop: 6,
    marginBottom: 0,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  warrantyHeaderRight: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  warrantyNumber: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 6,
  },
  warrantyDate: {
    fontSize: 8,
    fontFamily: 'Inter',
    color: '#000000',
  },

  // Información del cliente (2 columnas)
  clientSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 40,
    paddingHorizontal: 25,
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
  clientInfoRow: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.6,
    fontFamily: 'Inter',
    marginBottom: 4,
  },

  // Información del producto (tabla)
  productSection: {
    marginHorizontal: 25,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  productHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1F2937',
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
  },
  productHeaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: 'bold',
  },
  productContent: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  productColumn: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: '#E5E7EB',
    paddingHorizontal: 8,
  },
  productColumnLast: {
    flex: 1,
    paddingHorizontal: 8,
  },
  productLabel: {
    fontSize: 7,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  productValue: {
    fontSize: 9,
    fontFamily: 'Inter',
    color: '#1F2937',
    fontWeight: 'bold',
  },

  // Términos y condiciones
  termsSection: {
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  termsSectionTitle: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.5,
    fontFamily: 'Inter',
    marginBottom: 10,
    textAlign: 'justify',
  },
  termsList: {
    marginLeft: 10,
    marginBottom: 12,
  },
  termsListItem: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.5,
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  termsSubList: {
    marginLeft: 20,
    marginTop: 4,
  },
  termsSubListItem: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Inter',
    marginBottom: 4,
  },

  // Sección importante (con borde rojo)
  importantSection: {
    marginHorizontal: 25,
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  importantTitle: {
    fontSize: 9,
    fontFamily: 'Inter',
    color: '#DC2626',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: 'bold',
  },
  importantText: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Inter',
    marginBottom: 4,
    textAlign: 'justify',
  },

  // Causales de anulación
  annulationSection: {
    paddingHorizontal: 25,
    marginBottom: 15,
  },

  // Espacio para firma
  signatureSection: {
    marginTop: 20,
    marginBottom: 20,
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

  // Mensaje de cierre
  closingMessage: {
    marginBottom: 20,
    paddingHorizontal: 25,
    textAlign: 'center',
  },
  closingText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.5,
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#6B7280',
    lineHeight: 1.4,
    fontFamily: 'Inter',
  },
});

// Componente del documento PDF de garantía mejorado
const GarantiaPDF_Mejorado = ({
  producto,
  numeroSerie,
  cliente,
  fechaCompra,
  plazoGarantia,
  numeroGarantia,
  numeroVenta,
  clienteDNI,
  clienteDireccion,
  clienteEmail,
  clienteTelefono
}) => {
  const fechaActual = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Convertir plazo a días si viene en texto
  const calcularDias = (plazo) => {
    if (typeof plazo === 'number') return plazo;
    const textoLower = String(plazo).toLowerCase();
    if (textoLower.includes('1 año') || textoLower.includes('12 meses')) return 365;
    if (textoLower.includes('6 meses')) return 180;
    if (textoLower.includes('3 meses')) return 90;
    if (textoLower.includes('2 meses')) return 60;
    if (textoLower.includes('1 mes')) return 30;
    return 90; // Default
  };

  const diasGarantia = calcularDias(plazoGarantia);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header de la empresa con logo */}
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

        {/* Header de garantía */}
        <View style={styles.warrantyHeader}>
          <View style={styles.warrantyHeaderLeft}>
            <Text style={styles.warrantyHeaderLabel}>CERTIFICADO DE</Text>
            <Text style={styles.warrantyHeaderTitle}>GARANTÍA</Text>
          </View>

          <View style={styles.warrantyHeaderRight}>
            {numeroGarantia && <Text style={styles.warrantyNumber}>GT-{numeroGarantia}</Text>}
            <Text style={styles.warrantyDate}>{fechaActual}</Text>
            {numeroVenta && <Text style={styles.warrantyNumber}>N° Venta: REC-{String(numeroVenta).padStart(6, '0')}</Text>}
          </View>
        </View>

        {/* Información del cliente (2 columnas) */}
        <View style={styles.clientSection}>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>CLIENTE</Text>
            <Text style={styles.clientInfoRow}><Text style={{ fontWeight: 'bold' }}>Nombre:</Text> {cliente || 'N/A'}</Text>
            {clienteTelefono && <Text style={styles.clientInfoRow}><Text style={{ fontWeight: 'bold' }}>Teléfono:</Text> {clienteTelefono}</Text>}
            {clienteEmail && <Text style={styles.clientInfoRow}><Text style={{ fontWeight: 'bold' }}>Email:</Text> {clienteEmail}</Text>}
            {clienteDNI && <Text style={styles.clientInfoRow}><Text style={{ fontWeight: 'bold' }}>DNI:</Text> {clienteDNI}</Text>}
            {clienteDireccion && <Text style={styles.clientInfoRow}><Text style={{ fontWeight: 'bold' }}>Dirección:</Text> {clienteDireccion}</Text>}
          </View>

          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>INFORMACIÓN DE COMPRA</Text>
            <Text style={styles.clientInfoRow}><Text style={{ fontWeight: 'bold' }}>Fecha de Compra:</Text> {fechaCompra || 'N/A'}</Text>
          </View>
        </View>

        {/* Información del producto (tabla destacada) */}
        <View style={styles.productSection}>
          <View style={styles.productHeader}>
            <Text style={styles.productHeaderText}>INFORMACIÓN DEL PRODUCTO</Text>
          </View>
          <View style={styles.productContent}>
            <View style={styles.productColumn}>
              <Text style={styles.productLabel}>Producto</Text>
              <Text style={styles.productValue}>{producto || 'N/A'}</Text>
            </View>
            <View style={styles.productColumn}>
              <Text style={styles.productLabel}>N° de Serie</Text>
              <Text style={styles.productValue}>{numeroSerie || 'N/A'}</Text>
            </View>
            <View style={styles.productColumnLast}>
              <Text style={styles.productLabel}>Plazo de Garantía</Text>
              <Text style={styles.productValue}>{diasGarantia} días</Text>
            </View>
          </View>
        </View>

        {/* Alcance de la garantía */}
        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>Alcance de la Garantía</Text>
          <Text style={styles.termsText}>
            Update Tech WW SRL acompaña cada producto con un certificado de garantía, comprometiéndose a reparar o reemplazar cualquier parte que, a criterio de nuestro Servicio Técnico, presente defectos de fabricación.
          </Text>
          <Text style={styles.termsText}>
            La garantía será válida únicamente en nuestras sucursales oficiales (La Plata y CABA) y bajo evaluación técnica previa.
          </Text>
        </View>

        {/* Exclusiones de la garantía */}
        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>Exclusiones de la Garantía</Text>
          <Text style={styles.termsText}>
            <Text style={{ fontWeight: 'bold' }}>La garantía no cubre:</Text>
          </Text>
          <View style={styles.termsList}>
            <Text style={styles.termsListItem}>• Reemplazo total del producto ni devolución del importe abonado.</Text>
            <Text style={styles.termsListItem}>• <Text style={{ fontWeight: 'bold' }}>Fallas ocasionadas por:</Text></Text>
            <View style={styles.termsSubList}>
              <Text style={styles.termsSubListItem}>◦ Uso indebido, golpes, caídas o manipulación incorrecta.</Text>
              <Text style={styles.termsSubListItem}>◦ Instalaciones defectuosas, errores de operación o suciedad.</Text>
              <Text style={styles.termsSubListItem}>◦ Degradación natural de componentes por uso (ej. batería, teclado, ventiladores).</Text>
            </View>
            <Text style={styles.termsListItem}>• <Text style={{ fontWeight: 'bold' }}>Productos que presenten:</Text></Text>
            <View style={styles.termsSubList}>
              <Text style={styles.termsSubListItem}>◦ Apertura no autorizada o alteración de sus componentes.</Text>
              <Text style={styles.termsSubListItem}>◦ Números de serie, etiquetas o inscripciones alteradas.</Text>
              <Text style={styles.termsSubListItem}>◦ Oxidación, humedad, abolladuras o daños físicos.</Text>
            </View>
          </View>
        </View>

        {/* Sección IMPORTANTE */}
        <View style={styles.importantSection}>
          <Text style={styles.importantTitle}>IMPORTANTE</Text>
          <Text style={styles.importantText}>
            • Reclamos infundados que requieran tiempo de diagnóstico, reinstalación o servicios no cubiertos, podrán generar un cargo adicional por servicio técnico.
          </Text>
          <Text style={styles.importantText}>
            • No se otorgan equipos de reemplazo durante el período de reparación, salvo excepción expresa.
          </Text>
        </View>

        {/* Procedimiento de reclamo */}
        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>Procedimiento de Reclamo</Text>
          <View style={styles.termsList}>
            <Text style={styles.termsListItem}>• Presentar el comprobante original de compra junto con este certificado de garantía.</Text>
            <Text style={styles.termsListItem}>• El Servicio Técnico de Update evaluará el equipo y determinará la validez de la garantía.</Text>
            <Text style={styles.termsListItem}>• <Text style={{ fontWeight: 'bold' }}>En caso de corresponder:</Text></Text>
            <View style={styles.termsSubList}>
              <Text style={styles.termsSubListItem}>◦ Dentro de las 48 horas hábiles posteriores a la compra, si se detecta una falla de fabricación evidente, el cliente tiene derecho a un reemplazo inmediato.</Text>
              <Text style={styles.termsSubListItem}>◦ Pasado ese plazo, el tiempo estimado para reparación o reemplazo de piezas involucradas será de 72 horas hábiles en adelante, sujeto a disponibilidad de repuestos y complejidad del diagnóstico.</Text>
            </View>
          </View>
        </View>

        {/* Causales de anulación */}
        <View style={styles.annulationSection}>
          <Text style={styles.termsSectionTitle}>Causales de Anulación de Garantía</Text>
          <View style={styles.termsList}>
            <Text style={styles.termsListItem}>• Golpes, caídas o daños físicos visibles.</Text>
            <Text style={styles.termsListItem}>• Exposición a líquidos o humedad.</Text>
            <Text style={styles.termsListItem}>• Modificaciones o reparaciones realizadas por terceros no autorizados.</Text>
            <Text style={styles.termsListItem}>• Número de serie alterado, borrado o ilegible.</Text>
            <Text style={styles.termsListItem}>• Falta del presente certificado de garantía original.</Text>
          </View>
        </View>

        {/* Espacio para firma */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine}>
            <Text>Firma del Cliente</Text>
          </View>
        </View>

        {/* Mensaje de cierre */}
        <View style={styles.closingMessage}>
          <Text style={styles.closingText}>
            Conserve este certificado para hacer válida su garantía
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            UPDATE TECH WW S.R.L • CUIT: 30-71850553-2 • Tel: +54 221 359-9837 • INFO@UPDATETECH.COM.AR
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default GarantiaPDF_Mejorado;
