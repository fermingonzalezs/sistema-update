import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../../../../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../../../../Roboto/static/Roboto-Bold.ttf'

// Registrar la fuente
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
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  companyInfo: {
    flex: 1,
  },
  
  companyName: {
    fontSize: 18,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 5,
  },
  
  companyDetails: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 5,
  },
  
  documentInfo: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  
  periodInfo: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    marginBottom: 20,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  
  periodText: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Roboto',
    marginBottom: 5,
  },
  
  periodDetails: {
    fontSize: 9,
    color: '#6B7280',
  },
  
  // Resumen Cards
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  
  summaryTitle: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  
  summaryValue: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  
  // Tabla
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 20,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 30,
  },
  
  tableRowEven: {
    backgroundColor: '#F8FAFC',
  },
  
  tableRowLast: {
    borderBottomWidth: 0,
  },
  
  tableCell: {
    fontSize: 8,
    color: '#374151',
    textAlign: 'center',
    justifyContent: 'center',
  },
  
  tableCellLeft: {
    textAlign: 'left',
  },
  
  tableCellRight: {
    textAlign: 'right',
  },
  
  accountName: {
    fontSize: 8,
    color: '#1F2937',
    fontFamily: 'Roboto',
    marginBottom: 2,
  },
  
  accountType: {
    fontSize: 7,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  
  // Columnas de la tabla
  colCodigo: { width: '10%' },
  colCuenta: { width: '25%' },
  colSaldoInicial: { width: '11%' },
  colDebe: { width: '11%' },
  colHaber: { width: '11%' },
  colSaldoDeudor: { width: '11%' },
  colSaldoAcreedor: { width: '11%' },
  colMovs: { width: '10%' },
  
  // Totales
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  
  totalsText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Resumen por tipo
  typesSummary: {
    marginBottom: 20,
  },
  
  typesSummaryTitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 15,
  },
  
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  typeCard: {
    width: '18%',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  
  typeCardTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  
  typeCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  
  typeCardLabel: {
    fontSize: 7,
    color: '#6B7280',
  },
  
  typeCardValue: {
    fontSize: 7,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  
  typeCardDifference: {
    fontSize: 7,
    fontFamily: 'Roboto',
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  
  differenceOk: {
    color: '#10B981',
  },
  
  differenceError: {
    color: '#DC2626',
  },
});

// Componente del documento PDF
const BalanceSumasYSaldosDocument = ({ balance, resumen, fechaDesde, fechaHasta, filtroTipo }) => {
  const formatearMoneda = (valor) => {
    if (valor === 0) return '-';
    const numero = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(valor));
    return `US$ ${numero}`;
  };

  const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const obtenerTituloFiltro = () => {
    switch (filtroTipo) {
      case 'activo': return 'Activos';
      case 'pasivo': return 'Pasivos';
      case 'patrimonio': return 'Patrimonio';
      case 'ingreso': return 'Ingresos';
      case 'gasto': return 'Gastos';
      default: return 'Todas las cuentas';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="portrait">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
            <Text style={styles.companyDetails}>
              Avenida 44 N° 862 1/2 Piso 4{'\n'}
              La Plata, Buenos Aires, Argentina{'\n'}
              Tel: 221-641-9901 • CUIT: 30-71850553-2
            </Text>
          </View>
          <View>
            <Text style={styles.documentTitle}>Balance de Sumas y Saldos</Text>
            <Text style={styles.documentInfo}>
              Generado: {fechaGeneracion}{'\n'}
              Filtro: {obtenerTituloFiltro()}
            </Text>
          </View>
        </View>

        {/* Información del período */}
        <View style={styles.periodInfo}>
          <Text style={styles.periodText}>
            Período: {new Date(fechaDesde).toLocaleDateString('es-AR')} al {new Date(fechaHasta).toLocaleDateString('es-AR')}
          </Text>
          <Text style={styles.periodDetails}>
            {balance.length} cuentas • {resumen?.cantidadMovimientos || 0} movimientos contables
          </Text>
        </View>

        {/* Resumen */}
        {resumen && (
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Debe</Text>
              <Text style={styles.summaryValue}>{formatearMoneda(resumen.totalDebe)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Haber</Text>
              <Text style={styles.summaryValue}>{formatearMoneda(resumen.totalHaber)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Saldos Deudores</Text>
              <Text style={styles.summaryValue}>{formatearMoneda(resumen.totalSaldosDeudores)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Saldos Acreedores</Text>
              <Text style={styles.summaryValue}>{formatearMoneda(resumen.totalSaldosAcreedores)}</Text>
            </View>
          </View>
        )}

        {/* Tabla */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colCodigo]}>Código</Text>
            <Text style={[styles.tableHeaderText, styles.colCuenta]}>Cuenta</Text>
            <Text style={[styles.tableHeaderText, styles.colSaldoInicial]}>Saldo Inicial</Text>
            <Text style={[styles.tableHeaderText, styles.colDebe]}>Debe</Text>
            <Text style={[styles.tableHeaderText, styles.colHaber]}>Haber</Text>
            <Text style={[styles.tableHeaderText, styles.colSaldoDeudor]}>Saldo Deudor</Text>
            <Text style={[styles.tableHeaderText, styles.colSaldoAcreedor]}>Saldo Acreedor</Text>
            <Text style={[styles.tableHeaderText, styles.colMovs]}>Movs.</Text>
          </View>
          
          {balance.map((item, index) => (
            <View 
              key={item.cuenta.id} 
              style={[
                styles.tableRow,
                index % 2 === 1 && styles.tableRowEven,
                index === balance.length - 1 && styles.tableRowLast
              ]}
            >
              <View style={[styles.tableCell, styles.colCodigo]}>
                <Text>{item.cuenta.codigo}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLeft, styles.colCuenta]}>
                <Text style={styles.accountName}>{item.cuenta.nombre}</Text>
                <Text style={styles.accountType}>{item.cuenta.tipo}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellRight, styles.colSaldoInicial]}>
                <Text>{formatearMoneda(item.saldoInicial)}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellRight, styles.colDebe]}>
                <Text>{formatearMoneda(item.debeMovimientos)}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellRight, styles.colHaber]}>
                <Text>{formatearMoneda(item.haberMovimientos)}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellRight, styles.colSaldoDeudor]}>
                <Text>{item.esDeudor ? formatearMoneda(item.saldoFinal) : '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellRight, styles.colSaldoAcreedor]}>
                <Text>{item.esAcreedor ? formatearMoneda(item.saldoFinal) : '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colMovs]}>
                <Text>{item.cantidadMovimientos}</Text>
              </View>
            </View>
          ))}
          
          {/* Totales */}
          {resumen && (
            <View style={styles.totalsRow}>
              <View style={[styles.colCodigo, styles.colCuenta]}>
                <Text style={[styles.totalsText, styles.tableCellLeft]}>TOTALES</Text>
              </View>
              <View style={styles.colSaldoInicial}>
                <Text style={[styles.totalsText, styles.tableCellRight]}>
                  {formatearMoneda(resumen.totalDebeInicial)}
                </Text>
              </View>
              <View style={styles.colDebe}>
                <Text style={[styles.totalsText, styles.tableCellRight]}>
                  {formatearMoneda(resumen.totalDebe)}
                </Text>
              </View>
              <View style={styles.colHaber}>
                <Text style={[styles.totalsText, styles.tableCellRight]}>
                  {formatearMoneda(resumen.totalHaber)}
                </Text>
              </View>
              <View style={styles.colSaldoDeudor}>
                <Text style={[styles.totalsText, styles.tableCellRight]}>
                  {formatearMoneda(resumen.totalSaldosDeudores)}
                </Text>
              </View>
              <View style={styles.colSaldoAcreedor}>
                <Text style={[styles.totalsText, styles.tableCellRight]}>
                  {formatearMoneda(resumen.totalSaldosAcreedores)}
                </Text>
              </View>
              <View style={styles.colMovs}>
                <Text style={styles.totalsText}>
                  {resumen.cantidadMovimientos}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Resumen por tipo de cuenta */}
        {balance.length > 0 && (
          <View style={styles.typesSummary}>
            <Text style={styles.typesSummaryTitle}>Resumen por Tipo de Cuenta</Text>
            <View style={styles.typesGrid}>
              {['activo', 'pasivo', 'patrimonio', 'resultado positivo', 'resultado negativo'].map((tipo) => {
                const cuentasTipo = balance.filter(item => item.cuenta.tipo === tipo);
                const totalDebe = cuentasTipo.reduce((sum, item) => sum + item.debeMovimientos, 0);
                const totalHaber = cuentasTipo.reduce((sum, item) => sum + item.haberMovimientos, 0);
                const diferencia = totalDebe - totalHaber;
                const isBalanced = Math.abs(diferencia) < 0.01;
                
                return (
                  <View key={tipo} style={styles.typeCard}>
                    <Text style={styles.typeCardTitle}>{tipo}</Text>
                    <View style={styles.typeCardRow}>
                      <Text style={styles.typeCardLabel}>Cuentas:</Text>
                      <Text style={styles.typeCardValue}>{cuentasTipo.length}</Text>
                    </View>
                    <View style={styles.typeCardRow}>
                      <Text style={styles.typeCardLabel}>Debe:</Text>
                      <Text style={styles.typeCardValue}>{formatearMoneda(totalDebe)}</Text>
                    </View>
                    <View style={styles.typeCardRow}>
                      <Text style={styles.typeCardLabel}>Haber:</Text>
                      <Text style={styles.typeCardValue}>{formatearMoneda(totalHaber)}</Text>
                    </View>
                    <View style={styles.typeCardRow}>
                      <Text style={styles.typeCardLabel}>Diferencia:</Text>
                      <Text style={[
                        styles.typeCardValue,
                        styles.typeCardDifference,
                        isBalanced ? styles.differenceOk : styles.differenceError
                      ]}>
                        {formatearMoneda(diferencia)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado automáticamente por Sistema Update • {fechaGeneracion}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar y abrir el PDF en nueva pestaña
export const generarBalancePDF = async (balance, resumen, fechaDesde, fechaHasta, filtroTipo = 'todos') => {
  try {
    const blob = await pdf(
      <BalanceSumasYSaldosDocument 
        balance={balance} 
        resumen={resumen}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        filtroTipo={filtroTipo}
      />
    ).toBlob();
    
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
    
    return {
      success: true,
      message: 'Balance de Sumas y Saldos abierto en nueva pestaña'
    };
  } catch (error) {
    console.error('Error generando Balance PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default BalanceSumasYSaldosDocument;