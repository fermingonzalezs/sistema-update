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

  documentInfo: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 1.4,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  resultFinalLabel: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },

  resultFinalValue: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },

  balanceStatus: {
    padding: 15,
    paddingTop: 10,
    alignItems: 'center',
  },

  balanceStatusText: {
    fontSize: 10,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },

  balanceOk: {
    color: '#10B981',
  },

  balanceError: {
    color: '#DC2626',
  },

  diferenceText: {
    fontSize: 9,
    color: '#DC2626',
    marginTop: 3,
    textAlign: 'center',
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
  
  // Verificación ecuación contable
  equationSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  
  equationTitle: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 8,
  },
  
  equationText: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 3,
  },
  
  balanceStatus: {
    fontSize: 9,
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginTop: 8,
  },
  
  balanceOk: {
    color: '#10B981',
  },
  
  balanceError: {
    color: '#DC2626',
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
            <Text style={styles.companyDetails}>
              44 N° 862 1/2 Piso 4, La Plata{'\n'}
              Bartolomé Mitre 797 Piso 14 Oficina 1{'\n'}
              CUIT: 30-71850553-2
            </Text>
          </View>
          <View>
            <Text style={styles.documentInfo}>
              Generado: {fechaGeneracion}
            </Text>
          </View>
        </View>

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

          <View style={styles.resultFinal}>
            <Text style={styles.resultFinalLabel}>
              {formatearMoneda(data.totalActivos)} = {formatearMoneda(data.totalPasivos)} + {formatearMoneda(data.totalPatrimonio)} =
            </Text>
            <Text style={styles.resultFinalValue}>
              {formatearMoneda(data.totalPasivos + data.totalPatrimonio)}
            </Text>
          </View>

          <View style={styles.balanceStatus}>
            <Text style={[
              styles.balanceStatusText,
              ecuacionBalanceada ? styles.balanceOk : styles.balanceError
            ]}>
              {ecuacionBalanceada ? '✓ Balance Equilibrado' : '⚠ Balance Desequilibrado'}
            </Text>
            {!ecuacionBalanceada && (
              <Text style={styles.diferenceText}>
                Diferencia: {formatearMoneda(Math.abs(diferencia))}
              </Text>
            )}
          </View>
        </View>

        {/* Layout de dos columnas para Balance */}
        <View style={{ flexDirection: 'row', gap: 15 }}>
          {/* COLUMNA IZQUIERDA - ACTIVOS */}
          <View style={{ flex: 1 }}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ACTIVOS</Text>
                <Text style={styles.sectionTotal}>{formatearMoneda(data.totalActivos)}</Text>
              </View>
              <View style={styles.accountsTable}>
                {(data.activos || []).map((grupo, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.accountRow,
                      index % 2 === 1 && styles.accountRowEven,
                      index === data.activos.length - 1 && styles.accountRowLast
                    ]}
                  >
                    <View style={styles.accountCode}>
                      <Text>{grupo.codigoNivel3}</Text>
                    </View>
                    <View style={styles.accountName}>
                      <Text>{grupo.nombre}</Text>
                    </View>
                    <View style={styles.accountAmount}>
                      <Text>{formatearMoneda(grupo.saldoTotal)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* COLUMNA DERECHA - PASIVOS Y PATRIMONIO */}
          <View style={{ flex: 1 }}>
            {/* PASIVOS */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>PASIVOS</Text>
                <Text style={styles.sectionTotal}>{formatearMoneda(data.totalPasivos)}</Text>
              </View>
              <View style={styles.accountsTable}>
                {(data.pasivos || []).map((grupo, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.accountRow,
                      index % 2 === 1 && styles.accountRowEven,
                      index === data.pasivos.length - 1 && styles.accountRowLast
                    ]}
                  >
                    <View style={styles.accountCode}>
                      <Text>{grupo.codigoNivel3}</Text>
                    </View>
                    <View style={styles.accountName}>
                      <Text>{grupo.nombre}</Text>
                    </View>
                    <View style={styles.accountAmount}>
                      <Text>{formatearMoneda(grupo.saldoTotal)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* PATRIMONIO NETO */}
            <View style={styles.sectionContainer}>
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