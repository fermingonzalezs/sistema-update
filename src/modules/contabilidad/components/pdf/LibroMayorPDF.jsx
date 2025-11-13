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

// Función para calcular estilos dinámicos basados en cantidad de movimientos
const getStyles = (cantidadMovimientos) => {
  // Calcular font size dinámico
  let fontSize, paddingVertical;

  if (cantidadMovimientos <= 15) {
    fontSize = 9;
    paddingVertical = 4;
  } else if (cantidadMovimientos <= 30) {
    fontSize = 8;
    paddingVertical = 3;
  } else if (cantidadMovimientos <= 50) {
    fontSize = 7;
    paddingVertical = 2;
  } else {
    fontSize = 6;
    paddingVertical = 1;
  }

  return { fontSize, paddingVertical };
};

// Estilos para el PDF
const createStyles = (dinamicos) => StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 10,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.2,
  },

  // Header de la empresa
  companyHeader: {
    textAlign: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  cuentaInfo: {
    fontSize: 11,
    fontFamily: 'Roboto',
    marginBottom: 3,
    color: '#1F2937',
  },
  dateRange: {
    fontSize: 8,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  estadisticaItem: {
    flex: 1,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingHorizontal: 8,
  },
  estadisticaItem_last: {
    borderRightWidth: 0,
  },
  estadisticaLabel: {
    fontSize: 7,
    color: '#6B7280',
    marginBottom: 3,
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  estadisticaValue: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#1F2937',
    fontWeight: 'bold',
  },
  table: {
    width: 'auto',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 30,
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
    paddingVertical: dinamicos.paddingVertical,
    paddingHorizontal: 6,
  },
  tableColFirst: {
    borderLeftWidth: 0,
  },
  tableColLast: {
    borderRightWidth: 0,
  },
  tableColDate: {
    width: '12%',
    textAlign: 'center',
  },
  tableColAsiento: {
    width: '12%',
    textAlign: 'center',
  },
  tableColDescripcion: {
    width: '34%',
    textAlign: 'left',
  },
  tableColDescripcionHeader: {
    width: '34%',
    textAlign: 'center',
  },
  tableColDebe: {
    width: '14%',
    textAlign: 'center',
  },
  tableColHaber: {
    width: '14%',
    textAlign: 'center',
  },
  tableColSaldo: {
    width: '14%',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: dinamicos.fontSize,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  tableCellHeader: {
    fontSize: dinamicos.fontSize - 1,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  tableCellTotal: {
    fontSize: dinamicos.fontSize + 1,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  tableCellSaldoInicial: {
    fontSize: dinamicos.fontSize,
    fontFamily: 'Roboto',
    color: '#6B7280',
  },
  asientoNumero: {
    fontSize: dinamicos.fontSize,
    fontFamily: 'Roboto',
    color: '#374151',
  },
  montoPositivo: {
    color: '#374151',
    fontWeight: 'bold',
  },
  montoNegativo: {
    color: '#374151',
    fontWeight: 'bold',
  },
  montoNeutral: {
    color: '#374151',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 5,
    left: 10,
    right: 10,
    textAlign: 'center',
    fontSize: 7,
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 5,
    fontFamily: 'Roboto',
  },
});

const LibroMayorPDF = ({ libroMayor, fechaDesde, fechaHasta }) => {
  // Calcular estilos dinámicos basados en cantidad de movimientos
  const dinamicos = getStyles(libroMayor.movimientos?.length || 0);
  const styles = createStyles(dinamicos);

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
      <Page size="A4" style={styles.page} orientation="portrait">
        {/* Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
          <Text style={styles.title}>
            RESUMEN CUENTA: {libroMayor.cuenta.codigo} - {libroMayor.cuenta.nombre}
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
            <Text style={styles.estadisticaValue}>
              {formatearMonto(Math.abs(libroMayor.saldoFinal), 'USD')}
            </Text>
          </View>
          <View style={[styles.estadisticaItem, styles.estadisticaItem_last]}>
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
            <View style={[styles.tableCol, styles.tableColDescripcionHeader]}>
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