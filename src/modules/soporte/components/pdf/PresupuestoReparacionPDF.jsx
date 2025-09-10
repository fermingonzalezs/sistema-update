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

// Estilos profesionales para el PDF de reparaciones
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.3,
  },
  
  // Header de la empresa
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  companyDetails: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.4,
    fontFamily: 'Roboto',
  },
  
  // Header del documento
  documentTitleSection: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
    minWidth: 180,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 1,
  },
  documentSubtitle: {
    fontSize: 7,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Roboto',
  },
  documentInfo: {
    fontSize: 8,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 1.5,
    marginTop: 6,
    fontFamily: 'Roboto',
  },
  
  // Información del cliente y equipo
  clientSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 30,
  },
  clientColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 3,
  },
  clientInfo: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.5,
    fontFamily: 'Roboto',
  },
  clientName: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 3,
  },

  // Sección de diagnóstico
  diagnosticSection: {
    marginBottom: 18,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  diagnosticTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  diagnosticText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Roboto',
    marginBottom: 5,
  },
  
  // Tabla de servicios y repuestos
  table: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 30,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
    justifyContent: 'center',
  },
  tableCellBold: {
    fontSize: 8,
    color: '#1F2937',
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },
  tableCellDescription: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.3,
  },
  
  // Columnas de la tabla
  colDescription: {
    width: '50%',
    textAlign: 'left',
  },
  colQty: {
    width: '12%',
    textAlign: 'center',
  },
  colUnitPrice: {
    width: '19%',
    textAlign: 'right',
  },
  colAmount: {
    width: '19%',
    textAlign: 'right',
  },
  
  // Sección de totales
  totalsSection: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  totalsContainer: {
    width: '50%',
    minWidth: 180,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 8,
    color: '#6B7280',
    fontFamily: 'Roboto',
  },
  totalValue: {
    fontSize: 8,
    color: '#374151',
    fontFamily: 'Roboto',
    textAlign: 'right',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 6,
    borderRadius: 4,
  },
  finalTotalLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    letterSpacing: 0.3,
  },
  finalTotalValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    letterSpacing: 0.3,
  },

  // Sección de condiciones
  conditionsSection: {
    marginTop: 18,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
  },
  conditionsTitle: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  conditionItem: {
    fontSize: 7,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 2,
    fontFamily: 'Roboto',
  },

  // Observaciones
  observationsSection: {
    marginTop: 12,
    backgroundColor: '#FEF3F2',
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  observationsTitle: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  observationsText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Roboto',
  },
  
  // Footer
  footer: {
    marginTop: 25,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  legalText: {
    fontSize: 6,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 1.3,
  },
  signatureSection: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: '#9CA3AF',
    marginBottom: 3,
  },
  signatureText: {
    fontSize: 7,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  
  // Metadatos del documento
  metadata: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 7,
    color: '#D1D5DB',
  },
});

// Componente del documento PDF de reparación
const PresupuestoReparacionDocument = ({ data }) => {
  const formatearMoneda = (valor, moneda = 'USD') => {
    const numero = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
    
    return moneda === 'USD' ? `US$ ${numero}` : `$ ${numero}`;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha || Date.now()).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header de la empresa */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
            <Text style={styles.companyDetails}>
              Avenida 44 N° 862 1/2 Piso 4{'\n'}
              La Plata, Buenos Aires, Argentina{'\n'}
              Tel: 221-641-9901 • CUIT: 30-71850553-2
            </Text>
          </View>
          <View style={styles.documentTitleSection}>
            <Text style={styles.documentTitle}>PRESUPUESTO</Text>
            <Text style={styles.documentSubtitle}>Reparación de Equipos</Text>
            <Text style={styles.documentInfo}>
              N° {data.numeroPresupuesto}{'\n'}
              Fecha: {formatearFecha(data.fecha)}{'\n'}
              Orden: {data.numeroOrden}
            </Text>
          </View>
        </View>

        {/* Información del cliente y equipo */}
        <View style={styles.clientSection}>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.clientName}>{data.cliente.nombre}</Text>
            <Text style={styles.clientInfo}>
              {data.cliente.telefono && `Tel: ${data.cliente.telefono}\n`}
              {data.cliente.email && `Email: ${data.cliente.email}\n`}
              {data.cliente.dni && `DNI: ${data.cliente.dni}\n`}
              {data.cliente.direccion && `Dirección: ${data.cliente.direccion}`}
            </Text>
          </View>
          <View style={styles.clientColumn}>
            <Text style={styles.sectionTitle}>Equipo</Text>
            <Text style={styles.clientInfo}>
              {data.equipo.tipo && `Tipo: ${data.equipo.tipo}\n`}
              {data.equipo.marca && `Marca: ${data.equipo.marca}\n`}
              {data.equipo.modelo && `Modelo: ${data.equipo.modelo}\n`}
              {data.equipo.serial && `Serial: ${data.equipo.serial}\n`}
              {data.equipo.accesorios && `Accesorios: ${data.equipo.accesorios}`}
            </Text>
          </View>
        </View>

        {/* Diagnóstico */}
        {(data.fallaReportada || data.diagnostico) && (
          <View style={styles.diagnosticSection}>
            {data.fallaReportada && (
              <>
                <Text style={styles.diagnosticTitle}>Falla Reportada</Text>
                <Text style={styles.diagnosticText}>{data.fallaReportada}</Text>
              </>
            )}
            {data.diagnostico && (
              <>
                <Text style={styles.diagnosticTitle}>Diagnóstico</Text>
                <Text style={styles.diagnosticText}>{data.diagnostico}</Text>
              </>
            )}
          </View>
        )}

        {/* Tabla de servicios y repuestos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>Precio Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Importe</Text>
          </View>
          
          {/* Servicios */}
          {data.servicios && data.servicios.map((servicio, index) => (
            <View 
              key={`servicio-${index}`} 
              style={[
                styles.tableRow,
                index === data.servicios.length - 1 && !data.repuestos?.length && styles.tableRowLast
              ]}
            >
              <View style={[styles.tableCellDescription, styles.colDescription]}>
                <Text>{servicio.nombre}</Text>
                {servicio.categoria && (
                  <Text style={{ fontSize: 7, color: '#6B7280', marginTop: 2 }}>
                    {servicio.categoria}
                  </Text>
                )}
              </View>
              <View style={[styles.tableCell, styles.colQty]}>
                <Text>{servicio.cantidad}</Text>
              </View>
              <View style={[styles.tableCellBold, styles.colUnitPrice]}>
                <Text>{formatearMoneda(servicio.precio, data.moneda)}</Text>
              </View>
              <View style={[styles.tableCellBold, styles.colAmount]}>
                <Text>{formatearMoneda(servicio.precio * servicio.cantidad, data.moneda)}</Text>
              </View>
            </View>
          ))}

          {/* Repuestos */}
          {data.repuestos && data.repuestos.map((repuesto, index) => (
            <View 
              key={`repuesto-${index}`} 
              style={[
                styles.tableRow,
                index === data.repuestos.length - 1 && styles.tableRowLast
              ]}
            >
              <View style={[styles.tableCellDescription, styles.colDescription]}>
                <Text>{repuesto.nombre}</Text>
                {repuesto.esTercero && (
                  <Text style={{ fontSize: 7, color: '#F59E0B', marginTop: 2 }}>
                    (Repuesto de tercero)
                  </Text>
                )}
              </View>
              <View style={[styles.tableCell, styles.colQty]}>
                <Text>{repuesto.cantidad}</Text>
              </View>
              <View style={[styles.tableCellBold, styles.colUnitPrice]}>
                <Text>{formatearMoneda(repuesto.precio, data.moneda)}</Text>
              </View>
              <View style={[styles.tableCellBold, styles.colAmount]}>
                <Text>{formatearMoneda(repuesto.precio * repuesto.cantidad, data.moneda)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal servicios</Text>
              <Text style={styles.totalValue}>
                {formatearMoneda(data.subtotalServicios, data.moneda)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal repuestos</Text>
              <Text style={styles.totalValue}>
                {formatearMoneda(data.subtotalRepuestos, data.moneda)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatearMoneda(data.subtotal, data.moneda)}
              </Text>
            </View>
            
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>TOTAL</Text>
              <Text style={styles.finalTotalValue}>
                {formatearMoneda(data.total, data.moneda)}
              </Text>
            </View>
          </View>
        </View>

        {/* Condiciones y garantías */}
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsTitle}>Condiciones y Garantías</Text>
          <Text style={styles.conditionItem}>
            • Validez del presupuesto: 15 días corridos desde la fecha de emisión
          </Text>
          <Text style={styles.conditionItem}>
            • Tiempo de entrega estimado: 5 a 10 días hábiles desde la aprobación del presupuesto
          </Text>
          <Text style={styles.conditionItem}>
            • Garantía: 90 días sobre el servicio realizado y repuestos instalados
          </Text>
          <Text style={styles.conditionItem}>
            • Forma de pago: 50% al aprobar el presupuesto, 50% al retirar el equipo
          </Text>
          <Text style={styles.conditionItem}>
            • Los repuestos de terceros pueden tener tiempos de entrega extendidos
          </Text>
        </View>

        {/* Observaciones */}
        {data.observaciones && (
          <View style={styles.observationsSection}>
            <Text style={styles.observationsTitle}>Observaciones Adicionales</Text>
            <Text style={styles.observationsText}>{data.observaciones}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.legalText}>
            Si el equipo no fuera retirado dentro de los 90 días, a partir de la fecha de ingreso al taller, 
            será considerado abandonado, perdiendo todo tipo de derecho de propiedad sobre el mismo y/o sobre 
            los materiales que contiene. De ello se dispondrá en el concepto de gastos por depósito y estadía.
          </Text>
          
          <Text style={styles.footerText}>
            Email: info@updatetech.com.ar • Web: www.updatetech.com.ar
          </Text>
          <Text style={styles.footerText}>
            UPDATE TECH WW SRL • {formatearFecha()}
          </Text>
          
          <View style={styles.signatureSection}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureText}>Firma y aclaración</Text>
            <Text style={styles.signatureText}>UPDATE TECH WW SRL</Text>
          </View>
        </View>

        {/* Metadatos */}
        <Text style={styles.metadata}>
          Doc ID: {data.numeroPresupuesto} • Página 1 de 1
        </Text>
      </Page>
    </Document>
  );
};

// Función para convertir datos de reparación al formato del presupuesto
export const convertirReparacionAPresupuesto = (reparacion, presupuesto) => {
  return {
    numeroPresupuesto: `UP-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
    numeroOrden: reparacion.numero || 'N/A',
    fecha: new Date(),
    
    cliente: {
      nombre: reparacion.cliente_nombre || 'Cliente no especificado',
      telefono: reparacion.cliente_telefono || '',
      email: reparacion.cliente_email || '',
      dni: reparacion.cliente_dni || '',
      direccion: reparacion.cliente_direccion || ''
    },
    
    equipo: {
      tipo: reparacion.equipo_tipo || '',
      marca: reparacion.equipo_marca || '',
      modelo: reparacion.equipo_modelo || '',
      serial: reparacion.equipo_serial || '',
      accesorios: reparacion.accesorios_incluidos || ''
    },
    
    fallaReportada: reparacion.problema_reportado || '',
    diagnostico: reparacion.diagnostico || '',
    
    servicios: presupuesto.servicios || [],
    repuestos: presupuesto.repuestos || [],
    
    subtotalServicios: presupuesto.subtotalServicios || 0,
    subtotalRepuestos: presupuesto.subtotalRepuestos || 0,
    subtotal: presupuesto.subtotal || 0,
    total: presupuesto.total || 0,
    
    observaciones: presupuesto.observaciones || '',
    moneda: 'USD'
  };
};

// Función para generar y descargar el PDF
export const generarYDescargarPresupuesto = async (reparacion, presupuesto) => {
  try {
    const presupuestoData = convertirReparacionAPresupuesto(reparacion, presupuesto);
    const blob = await pdf(<PresupuestoReparacionDocument data={presupuestoData} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presupuesto-${presupuestoData.numeroPresupuesto}-${reparacion.cliente_nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: link.download
    };
  } catch (error) {
    console.error('Error generando presupuesto PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default PresupuestoReparacionDocument;