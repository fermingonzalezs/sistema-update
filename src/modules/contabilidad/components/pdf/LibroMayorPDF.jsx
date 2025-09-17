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
  cuentaInfo: {
    fontSize: 16,
    fontFamily: 'Roboto',
    marginBottom: 8,
    color: '#1F2937',
  },
  dateRange: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
  },
  estadisticaItem: {
    flex: 1,
    textAlign: 'center',
  },
  estadisticaLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
    fontFamily: 'Roboto',
  },
  estadisticaValue: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  table: {
    width: 'auto',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeaderRow: {
    backgroundColor: '#1F2937',
    color: 'white',
  },
  tableSaldoInicialRow: {
    backgroundColor: '#F8FAFC',
  },
  tableTotalRow: {
    backgroundColor: '#F8FAFC',
  },
  tableCol: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableColFirst: {
    borderLeftWidth: 0,
  },
  tableColLast: {
    borderRightWidth: 0,
  },
  tableColDate: {
    width: '12%',
  },
  tableColAsiento: {
    width: '12%',
  },
  tableColDescripcion: {
    width: '34%',
  },
  tableColDebe: {
    width: '14%',
    textAlign: 'right',
  },
  tableColHaber: {
    width: '14%',
    textAlign: 'right',
  },
  tableColSaldo: {
    width: '14%',
    textAlign: 'right',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableCellTotal: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  tableCellSaldoInicial: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#6B7280',
  },
  asientoNumero: {
    fontSize: 8,
    fontFamily: 'Roboto',
    backgroundColor: '#ECFDF5',
    padding: 2,
    color: '#059669',
  },
  montoPositivo: {
    color: '#059669',
    fontWeight: 'bold',
  },
  montoNegativo: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  montoNeutral: {
    color: '#374151',
    fontWeight: 'bold',
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

const LibroMayorPDF = ({ libroMayor, fechaDesde, fechaHasta }) => {
  // Formatear fechas para mostrar
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFechaCompleta = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fechaActual = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Determinar el color del saldo
  const getSaldoColor = (saldo) => {
    if (saldo > 0) return styles.montoPositivo;
    if (saldo < 0) return styles.montoNegativo;
    return styles.montoNeutral;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
          <Text style={styles.title}>LIBRO MAYOR</Text>
          <Text style={styles.cuentaInfo}>
            {libroMayor.cuenta.codigo} - {libroMayor.cuenta.nombre}
          </Text>
          {(fechaDesde || fechaHasta) && (
            <Text style={styles.dateRange}>
              Período: {fechaDesde ? formatFechaCompleta(fechaDesde) : 'Desde el inicio'} - {fechaHasta ? formatFechaCompleta(fechaHasta) : 'Hasta la fecha'}
            </Text>
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.estadisticasContainer}>
          <View style={styles.estadisticaItem}>
            <Text style={styles.estadisticaLabel}>Total Debe</Text>
            <Text style={styles.estadisticaValue}>{formatearMonto(libroMayor.totalDebe, 'USD')}</Text>
          </View>
          <View style={styles.estadisticaItem}>
            <Text style={styles.estadisticaLabel}>Total Haber</Text>
            <Text style={styles.estadisticaValue}>{formatearMonto(libroMayor.totalHaber, 'USD')}</Text>
          </View>
          <View style={styles.estadisticaItem}>
            <Text style={styles.estadisticaLabel}>Saldo Final</Text>
            <Text style={[styles.estadisticaValue, getSaldoColor(libroMayor.saldoFinal)]}>
              {formatearMonto(Math.abs(libroMayor.saldoFinal), 'USD')}
            </Text>
          </View>
          <View style={styles.estadisticaItem}>
            <Text style={styles.estadisticaLabel}>Movimientos</Text>
            <Text style={styles.estadisticaValue}>{libroMayor.movimientos.length}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={[styles.tableCol, styles.tableColFirst, styles.tableColDate]}>
              <Text style={styles.tableCellHeader}>Fecha</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColAsiento]}>
              <Text style={styles.tableCellHeader}>Asiento</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColDescripcion]}>
              <Text style={styles.tableCellHeader}>Descripción</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColDebe]}>
              <Text style={styles.tableCellHeader}>Debe</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColHaber]}>
              <Text style={styles.tableCellHeader}>Haber</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColLast, styles.tableColSaldo]}>
              <Text style={styles.tableCellHeader}>Saldo</Text>
            </View>
          </View>

          {/* Saldo inicial si hay filtro de fecha */}
          {fechaDesde && (
            <View style={[styles.tableRow, styles.tableSaldoInicialRow]}>
              <View style={[styles.tableCol, styles.tableColFirst, styles.tableColDate]}>
                <Text style={styles.tableCellSaldoInicial}>-</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColAsiento]}>
                <Text style={styles.tableCellSaldoInicial}>-</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColDescripcion]}>
                <Text style={styles.tableCellSaldoInicial}>SALDO INICIAL</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColDebe]}>
                <Text style={styles.tableCellSaldoInicial}></Text>
              </View>
              <View style={[styles.tableCol, styles.tableColHaber]}>
                <Text style={styles.tableCellSaldoInicial}></Text>
              </View>
              <View style={[styles.tableCol, styles.tableColLast, styles.tableColSaldo]}>
                <Text style={[styles.tableCellSaldoInicial, getSaldoColor(libroMayor.saldoInicial)]}>
                  {formatearMonto(Math.abs(libroMayor.saldoInicial), 'USD')}
                </Text>
              </View>
            </View>
          )}

          {/* Movimientos */}
          {libroMayor.movimientos.map((mov, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.tableColFirst, styles.tableColDate]}>
                <Text style={styles.tableCell}>{formatFecha(mov.asientos_contables.fecha)}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColAsiento]}>
                <Text style={styles.asientoNumero}>N° {mov.asientos_contables.numero}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColDescripcion]}>
                <Text style={styles.tableCell}>{mov.asientos_contables.descripcion.substring(0, 60)}{mov.asientos_contables.descripcion.length > 60 ? '...' : ''}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColDebe]}>
                <Text style={styles.tableCell}>
                  {mov.debe > 0 ? formatearMonto(mov.debe, 'USD') : ''}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.tableColHaber]}>
                <Text style={styles.tableCell}>
                  {mov.haber > 0 ? formatearMonto(mov.haber, 'USD') : ''}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.tableColLast, styles.tableColSaldo]}>
                <Text style={[styles.tableCell, getSaldoColor(mov.saldoActual)]}>
                  {formatearMonto(Math.abs(mov.saldoActual), 'USD')}
                </Text>
              </View>
            </View>
          ))}

          {/* Totales */}
          <View style={[styles.tableRow, styles.tableTotalRow]}>
            <View style={[styles.tableCol, styles.tableColFirst, styles.tableColDate]}>
              <Text style={styles.tableCellTotal}></Text>
            </View>
            <View style={[styles.tableCol, styles.tableColAsiento]}>
              <Text style={styles.tableCellTotal}></Text>
            </View>
            <View style={[styles.tableCol, styles.tableColDescripcion]}>
              <Text style={styles.tableCellTotal}>TOTALES DEL PERÍODO</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColDebe]}>
              <Text style={styles.tableCellTotal}>{formatearMonto(libroMayor.totalDebe, 'USD')}</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColHaber]}>
              <Text style={styles.tableCellTotal}>{formatearMonto(libroMayor.totalHaber, 'USD')}</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColLast, styles.tableColSaldo]}>
              <Text style={[styles.tableCellTotal, getSaldoColor(libroMayor.saldoFinal)]}>
                {formatearMonto(Math.abs(libroMayor.saldoFinal), 'USD')}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Libro Mayor generado el {fechaActual} - Sistema Update</Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar y descargar el PDF
export const descargarLibroMayorPDF = async (libroMayor, fechaDesde, fechaHasta) => {
  try {
    const blob = await pdf(<LibroMayorPDF libroMayor={libroMayor} fechaDesde={fechaDesde} fechaHasta={fechaHasta} />).toBlob();

    // Crear nombre del archivo con información de la cuenta y fechas
    const cuentaCodigo = libroMayor.cuenta.codigo.replace(/\./g, '_');
    const rangoFechas = fechaDesde && fechaHasta
      ? `${fechaDesde}_${fechaHasta}`
      : fechaDesde
        ? `desde_${fechaDesde}`
        : fechaHasta
          ? `hasta_${fechaHasta}`
          : 'completo';

    const nombreArchivo = `libro_mayor_${cuentaCodigo}_${rangoFechas}.pdf`;

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

    console.log('✅ PDF del Libro Mayor descargado:', nombreArchivo);
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    throw error;
  }
};

export default LibroMayorPDF;