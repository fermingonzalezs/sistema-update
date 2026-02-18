import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../../../../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../../../../Roboto/static/Roboto-Bold.ttf'
import { formatearMonto, formatearFechaReporte } from '../../../../shared/utils/formatters';

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
  
  generatedInfo: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 15,
  },

  titleSection: {
    backgroundColor: '#1e293b',
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },

  mainTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    marginBottom: 8,
    textAlign: 'center',
  },

  dateText: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // Resumen
  resultSection: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  summaryHeader: {
    backgroundColor: '#1e293b',
    padding: 12,
    marginBottom: 0,
  },

  summaryHeaderText: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  resultFinal: {
    padding: 15,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
  },

  resultFinalValue: {
    fontSize: 15,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },

  // Secciones principales
  sectionContainer: {
    marginBottom: 15,
  },
  
  sectionHeader: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    padding: 12,
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
  },
  
  sectionTotal: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
  },
  
  // Tabla de cuentas
  accountsTable: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
  },
  
  accountRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 25,
  },
  
  accountRowEven: {
    backgroundColor: '#F8FAFC',
  },
  
  accountRowLast: {
    borderBottomWidth: 0,
  },
  
  accountCode: {
    width: '20%',
    fontSize: 8,
    color: '#6B7280',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },
  
  accountName: {
    width: '60%',
    fontSize: 9,
    color: '#374151',
    justifyContent: 'center',
  },
  
  accountAmount: {
    width: '20%',
    fontSize: 9,
    color: '#1F2937',
    textAlign: 'right',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },

  // Grupo nivel 3 (header de grupo)
  groupRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 24,
    backgroundColor: '#F1F5F9',
  },

  groupCode: {
    width: '20%',
    fontSize: 9,
    color: '#1E293B',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },

  groupName: {
    width: '55%',
    fontSize: 9,
    color: '#1E293B',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },

  groupAmount: {
    width: '25%',
    fontSize: 9,
    color: '#1E293B',
    textAlign: 'right',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },

  // Cuentas detalle dentro de un grupo
  detailRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    minHeight: 20,
  },

  detailRowEven: {
    backgroundColor: '#FAFBFC',
  },

  detailCode: {
    width: '20%',
    fontSize: 8,
    color: '#6B7280',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },

  detailName: {
    width: '55%',
    fontSize: 8,
    color: '#4B5563',
    justifyContent: 'center',
  },

  detailAmount: {
    width: '25%',
    fontSize: 8,
    color: '#374151',
    textAlign: 'right',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },
  
  // Componentes de la ecuación
  equationComponent: {
    alignItems: 'center',
  },

  equationLabel: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Roboto',
  },

  equationOperator: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Roboto',
    paddingTop: 2,
  },

  // Tarjeta única de balance
  balanceCardWrap: {
    alignItems: 'center',
    paddingBottom: 14,
  },

  balanceSingleCardGreen: {
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    minWidth: 160,
  },

  balanceSingleCardRed: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    minWidth: 160,
  },

  balanceSingleStatusGreen: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#166534',
    marginBottom: 4,
    textAlign: 'center',
  },

  balanceSingleStatusRed: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#991B1B',
    marginBottom: 4,
    textAlign: 'center',
  },

  balanceSingleAmountGreen: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#15803D',
  },

  balanceSingleAmountRed: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#B91C1C',
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
});

// Componente principal del documento PDF
const EstadoSituacionPatrimonialDocument = ({ data, fechaCorte }) => {
  const formatearMoneda = (monto) => formatearMonto(monto, 'USD');
  
  const diferencia = data.totalActivos - (data.totalPasivos + data.totalPatrimonio);
  const ecuacionBalanceada = Math.abs(diferencia) < 0.01;
  
  const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Generado: fecha — arriba del contenedor principal */}
        <Text style={styles.generatedInfo}>
          Generado: {fechaGeneracion}
        </Text>

        {/* Título y fecha con fondo slate */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>ESTADO DE SITUACIÓN PATRIMONIAL</Text>
          <Text style={styles.dateText}>
            Fecha de Corte: {formatearFechaReporte(fechaCorte)}
          </Text>
        </View>

        {/* Resumen */}
        <View style={styles.resultSection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryHeaderText}>ECUACIÓN PATRIMONIAL</Text>
          </View>

          {/* Montos con labels debajo de cada componente */}
          <View style={styles.resultFinal}>
            <View style={styles.equationComponent}>
              <Text style={styles.resultFinalValue}>{formatearMoneda(data.totalActivos)}</Text>
              <Text style={styles.equationLabel}>ACTIVO</Text>
            </View>
            <Text style={styles.equationOperator}>=</Text>
            <View style={styles.equationComponent}>
              <Text style={styles.resultFinalValue}>{formatearMoneda(data.totalPasivos)}</Text>
              <Text style={styles.equationLabel}>PASIVO</Text>
            </View>
            <Text style={styles.equationOperator}>+</Text>
            <View style={styles.equationComponent}>
              <Text style={styles.resultFinalValue}>{formatearMoneda(data.totalPatrimonio)}</Text>
              <Text style={styles.equationLabel}>PATRIMONIO NETO</Text>
            </View>
          </View>

          {/* Tarjeta única de estado de balance */}
          <View style={styles.balanceCardWrap}>
            <View style={ecuacionBalanceada ? styles.balanceSingleCardGreen : styles.balanceSingleCardRed}>
              <Text style={ecuacionBalanceada ? styles.balanceSingleStatusGreen : styles.balanceSingleStatusRed}>
                {ecuacionBalanceada ? 'BALANCE EQUILIBRADO' : 'BALANCE DESEQUILIBRADO'}
              </Text>
              <Text style={ecuacionBalanceada ? styles.balanceSingleAmountGreen : styles.balanceSingleAmountRed}>
                {formatearMoneda(Math.abs(diferencia))}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTIVOS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader} minPresenceAhead={250}>
            <Text style={styles.sectionTitle}>ACTIVOS</Text>
            <Text style={styles.sectionTotal}>{formatearMoneda(data.totalActivos)}</Text>
          </View>
          <View style={styles.accountsTable}>
            {(data.activos || []).map((grupo, index) => (
              <View key={index} wrap={false}>
                {/* Header del grupo */}
                <View style={styles.groupRow}>
                  <View style={styles.groupCode}>
                    <Text>{grupo.codigoNivel3}</Text>
                  </View>
                  <View style={styles.groupName}>
                    <Text>{grupo.nombre}</Text>
                  </View>
                  <View style={styles.groupAmount}>
                    <Text>{formatearMoneda(grupo.saldoTotal)}</Text>
                  </View>
                </View>
                {/* Cuentas individuales del grupo */}
                {(grupo.cuentas || []).map((cuenta, cIdx) => (
                  <View
                    key={cIdx}
                    style={[
                      styles.detailRow,
                      cIdx % 2 === 1 && styles.detailRowEven,
                    ]}
                  >
                    <View style={styles.detailCode}>
                      <Text>{cuenta.cuenta?.codigo}</Text>
                    </View>
                    <View style={styles.detailName}>
                      <Text>{cuenta.cuenta?.nombre}</Text>
                    </View>
                    <View style={styles.detailAmount}>
                      <Text>{formatearMoneda(cuenta.saldo)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* PASIVOS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader} minPresenceAhead={250}>
            <Text style={styles.sectionTitle}>PASIVOS</Text>
            <Text style={styles.sectionTotal}>{formatearMoneda(data.totalPasivos)}</Text>
          </View>
          <View style={styles.accountsTable}>
            {(data.pasivos || []).map((grupo, index) => (
              <View key={index} wrap={false}>
                {/* Header del grupo */}
                <View style={styles.groupRow}>
                  <View style={styles.groupCode}>
                    <Text>{grupo.codigoNivel3}</Text>
                  </View>
                  <View style={styles.groupName}>
                    <Text>{grupo.nombre}</Text>
                  </View>
                  <View style={styles.groupAmount}>
                    <Text>{formatearMoneda(grupo.saldoTotal)}</Text>
                  </View>
                </View>
                {/* Cuentas individuales del grupo */}
                {(grupo.cuentas || []).map((cuenta, cIdx) => (
                  <View
                    key={cIdx}
                    style={[
                      styles.detailRow,
                      cIdx % 2 === 1 && styles.detailRowEven,
                    ]}
                  >
                    <View style={styles.detailCode}>
                      <Text>{cuenta.cuenta?.codigo}</Text>
                    </View>
                    <View style={styles.detailName}>
                      <Text>{cuenta.cuenta?.nombre}</Text>
                    </View>
                    <View style={styles.detailAmount}>
                      <Text>{formatearMoneda(cuenta.saldo)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* PATRIMONIO NETO */}
        <View style={styles.sectionContainer} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PATRIMONIO NETO</Text>
            <Text style={styles.sectionTotal}>{formatearMoneda(data.totalPatrimonio)}</Text>
          </View>
          <View style={styles.accountsTable}>
            {(data.patrimonio || []).map((item, index) => (
              <View
                key={index}
                style={[
                  styles.accountRow,
                  index % 2 === 1 && styles.accountRowEven,
                  index === data.patrimonio.length - 1 && styles.accountRowLast
                ]}
              >
                <View style={styles.accountCode}>
                  <Text>{item.cuenta.codigo}</Text>
                </View>
                <View style={styles.accountName}>
                  <Text>{item.cuenta.nombre}</Text>
                </View>
                <View style={styles.accountAmount}>
                  <Text>{formatearMoneda(item.saldo)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar y abrir el PDF en nueva pestaña
export const generarYAbrirEstadoSituacionPatrimonial = async (balance, fechaCorte) => {
  try {
    const blob = await pdf(
      <EstadoSituacionPatrimonialDocument 
        data={balance} 
        fechaCorte={fechaCorte} 
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
      message: 'Estado de Situación Patrimonial abierto en nueva pestaña'
    };
  } catch (error) {
    console.error('Error generando PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default EstadoSituacionPatrimonialDocument;