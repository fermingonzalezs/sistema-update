import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { formatearMonto } from '../../../../shared/utils/formatters';
import RobotoRegular from '../../../../Roboto/static/Roboto-Regular.ttf';
import RobotoBold from '../../../../Roboto/static/Roboto-Bold.ttf';

// Registrar la fuente Roboto
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

// Estilos para el PDF
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
    textAlign: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 5,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 8,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  dateRange: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  asientoContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
  },
  asientoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
  },
  asientoNumber: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  asientoDate: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  asientoDescription: {
    fontSize: 11,
    fontFamily: 'Roboto',
    flex: 1,
    marginLeft: 15,
    color: '#1F2937',
  },
  movimientosContainer: {
    marginLeft: 10,
  },
  movimientoRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    alignItems: 'center',
  },
  cuentaColumn: {
    width: '60%',
    paddingRight: 10,
  },
  cuentaCodigo: {
    fontSize: 8,
    fontFamily: 'Roboto',
    backgroundColor: '#E2E8F0',
    padding: 2,
    marginBottom: 2,
  },
  cuentaNombre: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  debeColumn: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 10,
  },
  haberColumn: {
    width: '20%',
    textAlign: 'right',
  },
  amount: {
    fontSize: 9,
    fontFamily: 'Roboto',
  },
  debeAmount: {
    color: '#DC2626',
  },
  haberAmount: {
    color: '#059669',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    color: 'white',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  notasContainer: {
    marginTop: 5,
    marginLeft: 10,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
  },
  notasLabel: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 2,
  },
  notasText: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.3,
    fontFamily: 'Roboto',
  },
  totalesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
  },
  totalesTitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1F2937',
  },
  totalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalesLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  totalesValue: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    fontFamily: 'Roboto',
  },
});

const LibroDiarioPDF = ({ asientos, fechaDesde, fechaHasta }) => {
  // Formatear fechas para mostrar
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calcular totales generales
  const totalGeneral = asientos.reduce((sum, asiento) => sum + (asiento.total_debe || 0), 0);
  const fechaActual = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
          <Text style={styles.title}>LIBRO DIARIO</Text>
          <Text style={styles.subtitle}>Registro cronológico de operaciones contables</Text>
          {(fechaDesde || fechaHasta) && (
            <Text style={styles.dateRange}>
              Período: {fechaDesde ? formatFecha(fechaDesde) : 'Desde el inicio'} - {fechaHasta ? formatFecha(fechaHasta) : 'Hasta la fecha'}
            </Text>
          )}
        </View>

        {/* Headers de tabla */}
        <View style={styles.tableHeader}>
          <View style={[styles.cuentaColumn]}>
            <Text style={styles.tableHeaderText}>Cuenta</Text>
          </View>
          <View style={styles.debeColumn}>
            <Text style={styles.tableHeaderText}>Debe</Text>
          </View>
          <View style={styles.haberColumn}>
            <Text style={styles.tableHeaderText}>Haber</Text>
          </View>
        </View>

        {/* Asientos */}
        {asientos.map((asiento) => (
          <View key={asiento.id} style={styles.asientoContainer} wrap={false}>
            {/* Header del asiento */}
            <View style={styles.asientoHeader}>
              <Text style={styles.asientoNumber}>N° {asiento.numero}</Text>
              <Text style={styles.asientoDescription}>{asiento.descripcion}</Text>
              <Text style={styles.asientoDate}>{formatFecha(asiento.fecha)}</Text>
            </View>

            {/* Movimientos */}
            <View style={styles.movimientosContainer}>
              {asiento.movimientos_contables?.map((mov, index) => (
                <View key={index} style={styles.movimientoRow}>
                  <View style={styles.cuentaColumn}>
                    <Text style={styles.cuentaCodigo}>{mov.plan_cuentas?.codigo}</Text>
                    <Text style={styles.cuentaNombre}>{mov.plan_cuentas?.nombre}</Text>
                  </View>

                  <View style={styles.debeColumn}>
                    {mov.debe > 0 && (
                      <Text style={[styles.amount, styles.debeAmount]}>
                        {formatearMonto(mov.debe, 'USD')}
                      </Text>
                    )}
                  </View>

                  <View style={styles.haberColumn}>
                    {mov.haber > 0 && (
                      <Text style={[styles.amount, styles.haberAmount]}>
                        {formatearMonto(mov.haber, 'USD')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Notas del asiento */}
            {asiento.notas && (
              <View style={styles.notasContainer}>
                <Text style={styles.notasLabel}>Notas:</Text>
                <Text style={styles.notasText}>{asiento.notas}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Totales */}
        <View style={styles.totalesContainer}>
          <Text style={styles.totalesTitle}>Resumen del Período</Text>
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>Total de asientos:</Text>
            <Text style={styles.totalesValue}>{asientos.length}</Text>
          </View>
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>Movimiento total:</Text>
            <Text style={styles.totalesValue}>{formatearMonto(totalGeneral, 'USD')}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Libro Diario generado el {fechaActual} - Sistema Update</Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar y descargar el PDF
export const descargarLibroDiarioPDF = async (asientos, fechaDesde, fechaHasta) => {
  try {
    const blob = await pdf(<LibroDiarioPDF asientos={asientos} fechaDesde={fechaDesde} fechaHasta={fechaHasta} />).toBlob();

    // Crear nombre del archivo con fechas
    const rangoFechas = fechaDesde && fechaHasta
      ? `${fechaDesde}_${fechaHasta}`
      : fechaDesde
        ? `desde_${fechaDesde}`
        : fechaHasta
          ? `hasta_${fechaHasta}`
          : 'completo';

    const nombreArchivo = `libro_diario_${rangoFechas}.pdf`;

    // Crear URL del blob
    const url = URL.createObjectURL(blob);

    // Abrir en nueva pestaña
    window.open(url, '_blank');

    // Crear enlace de descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ PDF del Libro Diario descargado:', nombreArchivo);
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    throw error;
  }
};

export default LibroDiarioPDF;