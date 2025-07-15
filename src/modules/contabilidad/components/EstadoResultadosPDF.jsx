import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { formatearMonto } from '../../../shared/utils/formatters';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.3,
  },
  
  // Header
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 15,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  periodInfo: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Sección de resumen
  summarySection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  
  // Secciones de cuentas
  accountSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#1F2937',
    padding: 12,
    marginBottom: 0,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: '#FFFFFF',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  
  // Tabla de cuentas
  accountTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accountCode: {
    width: '15%',
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: 2,
    textAlign: 'center',
  },
  accountName: {
    width: '65%',
    fontSize: 9,
    color: '#374151',
    paddingLeft: 8,
  },
  accountAmount: {
    width: '20%',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  
  // Footer
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Metadatos
  metadata: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 7,
    color: '#D1D5DB',
  },
});

// Componente del documento PDF
const EstadoResultadosDocument = ({ data }) => {
  const formatearMoneda = (valor) => formatearMonto(valor, 'USD');
  
  const fechaFormateada = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
          <Text style={styles.companyDetails}>
            Avenida 44 N° 862 1/2 Piso 4 • La Plata, Buenos Aires, Argentina
          </Text>
          <Text style={styles.companyDetails}>
            Tel: 221-641-9901 • CUIT: 30-71850553-2
          </Text>
          <Text style={styles.reportTitle}>ESTADO DE RESULTADOS</Text>
          <Text style={styles.periodInfo}>
            Período: {fechaFormateada(data.fechaDesde)} al {fechaFormateada(data.fechaHasta)}
          </Text>
        </View>

        {/* Resumen ejecutivo */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>RESUMEN EJECUTIVO</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Ingresos:</Text>
            <Text style={styles.summaryValue}>{formatearMoneda(data.totalIngresos)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Egresos:</Text>
            <Text style={styles.summaryValue}>{formatearMoneda(data.totalGastos)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>
              {data.utilidadNeta >= 0 ? 'UTILIDAD NETA:' : 'PÉRDIDA NETA:'}
            </Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>
              {formatearMoneda(data.utilidadNeta)}
            </Text>
          </View>
        </View>

        {/* Sección de Ingresos */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>INGRESOS</Text>
          <Text style={styles.sectionSubtitle}>
            {data.ingresos.length} conceptos • {formatearMoneda(data.totalIngresos)}
          </Text>
          
          <View style={styles.accountTable}>
            {data.ingresos.map((item, index) => (
              <View key={index} style={styles.accountRow}>
                <Text style={styles.accountCode}>{item.cuenta.codigo}</Text>
                <Text style={styles.accountName}>{item.cuenta.nombre}</Text>
                <Text style={styles.accountAmount}>{formatearMoneda(item.monto)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sección de Egresos */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>EGRESOS</Text>
          <Text style={styles.sectionSubtitle}>
            {data.gastos.length} conceptos • {formatearMoneda(data.totalGastos)}
          </Text>
          
          <View style={styles.accountTable}>
            {data.gastos.map((item, index) => (
              <View key={index} style={styles.accountRow}>
                <Text style={styles.accountCode}>{item.cuenta.codigo}</Text>
                <Text style={styles.accountName}>{item.cuenta.nombre}</Text>
                <Text style={styles.accountAmount}>{formatearMoneda(item.monto)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Resultado del Ejercicio */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>RESULTADO DEL EJERCICIO</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Ingresos:</Text>
            <Text style={styles.summaryValue}>{formatearMoneda(data.totalIngresos)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Egresos:</Text>
            <Text style={styles.summaryValue}>({formatearMoneda(data.totalGastos)})</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold', fontSize: 12 }]}>
              {data.utilidadNeta >= 0 ? 'UTILIDAD NETA:' : 'PÉRDIDA NETA:'}
            </Text>
            <Text style={[styles.summaryValue, { fontSize: 14, fontWeight: 'bold' }]}>
              {formatearMoneda(data.utilidadNeta)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Documento generado el {fechaActual} • Para uso interno
          </Text>
          <Text>
            UPDATE TECH WW SRL • Sistema de Gestión Contable
          </Text>
        </View>

        {/* Metadatos */}
        <Text style={styles.metadata}>
          Estado de Resultados • Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

// Función para generar y abrir el PDF en nueva pestaña
export const generarEstadoResultadosPDF = async (estadoResultados) => {
  try {
    const blob = await pdf(<EstadoResultadosDocument data={estadoResultados} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Cleanup después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
    
    return {
      success: true,
      message: 'Estado de Resultados PDF abierto en nueva pestaña'
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