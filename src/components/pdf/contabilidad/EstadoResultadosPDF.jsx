import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../../../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../../../Roboto/static/Roboto-Bold.ttf'
import { formatearMonto } from '../../../shared/utils/formatters';

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
    marginBottom: 2,
  },
  
  summaryDetail: {
    fontSize: 7,
    color: '#6B7280',
  },
  
  // Secciones de cuentas
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
  
  // Resultado final
  resultSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  
  resultTitle: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  
  resultCalculation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingVertical: 3,
  },
  
  resultLabel: {
    fontSize: 10,
    color: '#374151',
  },
  
  resultValue: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  
  resultFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  resultFinalLabel: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  
  resultFinalValue: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  
  utilidadPositiva: {
    color: '#10B981',
  },
  
  utilidadNegativa: {
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
const EstadoResultadosDocument = ({ data, fechaDesde, fechaHasta }) => {
  const formatearMoneda = (monto) => formatearMonto(monto, 'USD');
  
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
              Avenida 44 N° 862 1/2 Piso 4{'\n'}
              La Plata, Buenos Aires, Argentina{'\n'}
              Tel: 221-641-9901 • CUIT: 30-71850553-2
            </Text>
          </View>
          <View>
            <Text style={styles.documentTitle}>Estado de Resultados</Text>
            <Text style={styles.documentInfo}>
              Generado: {fechaGeneracion}
            </Text>
          </View>
        </View>

        {/* Información del período */}
        <View style={styles.periodInfo}>
          <Text style={styles.periodText}>
            Período: {new Date(fechaDesde).toLocaleDateString('es-AR')} al {new Date(fechaHasta).toLocaleDateString('es-AR')}
          </Text>
        </View>

        {/* Resumen */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Ingresos</Text>
            <Text style={styles.summaryValue}>{formatearMoneda(data.totalIngresos)}</Text>
            <Text style={styles.summaryDetail}>{data.ingresos?.length || 0} conceptos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Egresos</Text>
            <Text style={styles.summaryValue}>{formatearMoneda(data.totalGastos)}</Text>
            <Text style={styles.summaryDetail}>{data.gastos?.length || 0} conceptos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {data.utilidadNeta >= 0 ? 'Utilidad Neta' : 'Pérdida Neta'}
            </Text>
            <Text style={styles.summaryValue}>{formatearMoneda(data.utilidadNeta)}</Text>
            <Text style={styles.summaryDetail}>
              {data.utilidadNeta >= 0 ? 'Positivo' : 'Negativo'}
            </Text>
          </View>
        </View>

        {/* INGRESOS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>INGRESOS</Text>
            <Text style={styles.sectionTotal}>{formatearMoneda(data.totalIngresos)}</Text>
          </View>
          <View style={styles.accountsTable}>
            {(data.ingresos || []).map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.accountRow,
                  index % 2 === 1 && styles.accountRowEven,
                  index === data.ingresos.length - 1 && styles.accountRowLast
                ]}
              >
                <View style={styles.accountCode}>
                  <Text>{item.cuenta.codigo}</Text>
                </View>
                <View style={styles.accountName}>
                  <Text>{item.cuenta.nombre}</Text>
                </View>
                <View style={styles.accountAmount}>
                  <Text>{formatearMoneda(item.monto)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* EGRESOS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EGRESOS</Text>
            <Text style={styles.sectionTotal}>{formatearMoneda(data.totalGastos)}</Text>
          </View>
          <View style={styles.accountsTable}>
            {(data.gastos || []).map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.accountRow,
                  index % 2 === 1 && styles.accountRowEven,
                  index === data.gastos.length - 1 && styles.accountRowLast
                ]}
              >
                <View style={styles.accountCode}>
                  <Text>{item.cuenta.codigo}</Text>
                </View>
                <View style={styles.accountName}>
                  <Text>{item.cuenta.nombre}</Text>
                </View>
                <View style={styles.accountAmount}>
                  <Text>{formatearMoneda(item.monto)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Resultado del Ejercicio */}
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>RESULTADO DEL EJERCICIO</Text>
          
          <View style={styles.resultCalculation}>
            <Text style={styles.resultLabel}>TOTAL INGRESOS</Text>
            <Text style={styles.resultValue}>{formatearMoneda(data.totalIngresos)}</Text>
          </View>
          
          <View style={styles.resultCalculation}>
            <Text style={styles.resultLabel}>TOTAL EGRESOS</Text>
            <Text style={styles.resultValue}>({formatearMoneda(data.totalGastos)})</Text>
          </View>
          
          <View style={styles.resultFinal}>
            <Text style={styles.resultFinalLabel}>
              {data.utilidadNeta >= 0 ? 'UTILIDAD NETA' : 'PÉRDIDA NETA'}
            </Text>
            <Text style={[
              styles.resultFinalValue,
              data.utilidadNeta >= 0 ? styles.utilidadPositiva : styles.utilidadNegativa
            ]}>
              {formatearMoneda(data.utilidadNeta)}
            </Text>
          </View>
        </View>

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
export const generarEstadoResultadosPDF = async (estadoResultados, fechaDesde, fechaHasta) => {
  try {
    const blob = await pdf(
      <EstadoResultadosDocument 
        data={estadoResultados} 
        fechaDesde={fechaDesde} 
        fechaHasta={fechaHasta} 
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
      message: 'Estado de Resultados abierto en nueva pestaña'
    };
  } catch (error) {
    console.error('Error generando Estado de Resultados PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default EstadoResultadosDocument;