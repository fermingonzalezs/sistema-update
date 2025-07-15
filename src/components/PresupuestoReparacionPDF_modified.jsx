import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import RobotoRegular from '../Roboto/static/Roboto-Regular.ttf'
import RobotoBold from '../Roboto/static/Roboto-Bold.ttf'

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
  companyAddress: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  
  // Título del documento
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  
  // Información del cliente
  clientSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clientColumn: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  clientValue: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  
  // Información del equipo
  equipmentSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  equipmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  equipmentColumn: {
    flex: 1,
  },
  equipmentLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  equipmentValue: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Roboto',
  },
  
  // Tabla de servicios
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    padding: 8,
  },
  tableColDescHeader: {
    width: '40%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    padding: 8,
  },
  tableColPriceHeader: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    padding: 8,
  },
  tableCol: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  tableColDesc: {
    width: '40%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  tableColPrice: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#1F2937',
    textAlign: 'center',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'left',
  },
  tableCellRight: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'right',
  },
  
  // Totales
  totalsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginRight: 15,
    fontFamily: 'Roboto',
  },
  totalValue: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Roboto',
    minWidth: 80,
    textAlign: 'right',
  },
  finalTotal: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'Roboto',
    minWidth: 80,
    textAlign: 'right',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingTop: 5,
  },
  
  // Condiciones y términos
  conditionsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  conditionsTitle: {
    fontSize: 11,
    color: '#1F2937',
    fontFamily: 'Roboto',
    marginBottom: 10,
  },
  conditionsText: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 5,
    lineHeight: 1.4,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
});

// Función para convertir datos de reparación a formato de presupuesto
const convertirReparacionAPresupuesto = (reparacion, presupuesto) => {
  const presupuestoData = typeof presupuesto === 'string' ? JSON.parse(presupuesto) : presupuesto;
  
  return {
    numeroPresupuesto: `REP-${reparacion.id.toString().padStart(4, '0')}`,
    fecha: new Date().toLocaleDateString('es-AR'),
    validez: '30 días',
    cliente: {
      nombre: reparacion.cliente_nombre || 'Cliente',
      telefono: reparacion.cliente_telefono || 'No especificado',
      email: reparacion.cliente_email || 'No especificado',
    },
    equipo: {
      tipo: reparacion.equipo || 'Equipo',
      modelo: reparacion.modelo || 'No especificado',
      serial: reparacion.serial || 'No especificado',
      problema: reparacion.problema_reportado || 'No especificado',
      accesorios: reparacion.accesorios_incluidos || 'Ninguno',
    },
    servicios: presupuestoData.servicios || [],
    repuestos: presupuestoData.repuestos || [],
    subtotal: presupuestoData.subtotal || 0,
    descuento: presupuestoData.descuento || 0,
    total: presupuestoData.total || 0,
    observaciones: presupuestoData.observaciones || '',
    condiciones: presupuestoData.condiciones || [
      'Presupuesto válido por 30 días',
      'Los repuestos quedan garantizados por 90 días',
      'El servicio técnico tiene 180 días de garantía',
      'Se requiere 50% de seña para comenzar el trabajo',
      'Los equipos no retirados en 60 días se consideran abandonados'
    ]
  };
};

// Componente principal del documento PDF
const PresupuestoReparacionDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header de la empresa */}
      <View style={styles.companyHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>SISTEMA UPDATE</Text>
          <Text style={styles.companyAddress}>Tecnología • Reparaciones • Soporte</Text>
          <Text style={styles.companyContact}>📧 info@sistemaupdate.com | 📞 (011) 4444-5555</Text>
          <Text style={styles.companyContact}>📍 Av. Corrientes 1234, CABA</Text>
        </View>
        <View>
          <Text style={styles.companyContact}>Presupuesto N°: {data.numeroPresupuesto}</Text>
          <Text style={styles.companyContact}>Fecha: {data.fecha}</Text>
          <Text style={styles.companyContact}>Validez: {data.validez}</Text>
        </View>
      </View>

      {/* Título del documento */}
      <Text style={styles.documentTitle}>PRESUPUESTO DE REPARACIÓN</Text>

      {/* Información del cliente */}
      <View style={styles.clientSection}>
        <View style={styles.clientInfo}>
          <View style={styles.clientColumn}>
            <Text style={styles.clientLabel}>CLIENTE:</Text>
            <Text style={styles.clientValue}>{data.cliente.nombre}</Text>
          </View>
          <View style={styles.clientColumn}>
            <Text style={styles.clientLabel}>TELÉFONO:</Text>
            <Text style={styles.clientValue}>{data.cliente.telefono}</Text>
          </View>
          <View style={styles.clientColumn}>
            <Text style={styles.clientLabel}>EMAIL:</Text>
            <Text style={styles.clientValue}>{data.cliente.email}</Text>
          </View>
        </View>
      </View>

      {/* Información del equipo */}
      <View style={styles.equipmentSection}>
        <View style={styles.equipmentInfo}>
          <View style={styles.equipmentColumn}>
            <Text style={styles.equipmentLabel}>EQUIPO:</Text>
            <Text style={styles.equipmentValue}>{data.equipo.tipo}</Text>
          </View>
          <View style={styles.equipmentColumn}>
            <Text style={styles.equipmentLabel}>MODELO:</Text>
            <Text style={styles.equipmentValue}>{data.equipo.modelo}</Text>
          </View>
          <View style={styles.equipmentColumn}>
            <Text style={styles.equipmentLabel}>SERIAL:</Text>
            <Text style={styles.equipmentValue}>{data.equipo.serial}</Text>
          </View>
        </View>
        <View style={styles.equipmentInfo}>
          <View style={styles.equipmentColumn}>
            <Text style={styles.equipmentLabel}>PROBLEMA REPORTADO:</Text>
            <Text style={styles.equipmentValue}>{data.equipo.problema}</Text>
          </View>
          <View style={styles.equipmentColumn}>
            <Text style={styles.equipmentLabel}>ACCESORIOS:</Text>
            <Text style={styles.equipmentValue}>{data.equipo.accesorios}</Text>
          </View>
        </View>
      </View>

      {/* Tabla de servicios */}
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>CANT</Text>
          </View>
          <View style={styles.tableColDescHeader}>
            <Text style={styles.tableCellHeader}>DESCRIPCIÓN</Text>
          </View>
          <View style={styles.tableColPriceHeader}>
            <Text style={styles.tableCellHeader}>PRECIO UNIT</Text>
          </View>
          <View style={styles.tableColPriceHeader}>
            <Text style={styles.tableCellHeader}>SUBTOTAL</Text>
          </View>
        </View>

        {/* Servicios */}
        {data.servicios.map((servicio, index) => (
          <View style={styles.tableRow} key={`servicio-${index}`}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{servicio.cantidad}</Text>
            </View>
            <View style={styles.tableColDesc}>
              <Text style={styles.tableCellLeft}>{servicio.descripcion}</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableCellRight}>${servicio.precio.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableCellRight}>${servicio.subtotal.toLocaleString('es-AR')}</Text>
            </View>
          </View>
        ))}

        {/* Repuestos */}
        {data.repuestos.map((repuesto, index) => (
          <View style={styles.tableRow} key={`repuesto-${index}`}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{repuesto.cantidad}</Text>
            </View>
            <View style={styles.tableColDesc}>
              <Text style={styles.tableCellLeft}>{repuesto.descripcion}</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableCellRight}>${repuesto.precio.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableCellRight}>${repuesto.subtotal.toLocaleString('es-AR')}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>SUBTOTAL:</Text>
          <Text style={styles.totalValue}>${data.subtotal.toLocaleString('es-AR')}</Text>
        </View>
        {data.descuento > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>DESCUENTO:</Text>
            <Text style={styles.totalValue}>-${data.descuento.toLocaleString('es-AR')}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.finalTotal}>${data.total.toLocaleString('es-AR')}</Text>
        </View>
      </View>

      {/* Observaciones */}
      {data.observaciones && (
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsTitle}>OBSERVACIONES:</Text>
          <Text style={styles.conditionsText}>{data.observaciones}</Text>
        </View>
      )}

      {/* Condiciones */}
      <View style={styles.conditionsSection}>
        <Text style={styles.conditionsTitle}>CONDICIONES DE SERVICIO:</Text>
        {data.condiciones.map((condicion, index) => (
          <Text key={index} style={styles.conditionsText}>• {condicion}</Text>
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Sistema Update - Soluciones tecnológicas integrales | www.sistemaupdate.com
      </Text>
    </Page>
  </Document>
);

// Función exportada para generar y mostrar el presupuesto
export const generarYDescargarPresupuesto = async (reparacion, presupuesto) => {
  try {
    const presupuestoData = convertirReparacionAPresupuesto(reparacion, presupuesto);
    const blob = await pdf(<PresupuestoReparacionDocument data={presupuestoData} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const filename = `presupuesto-${presupuestoData.numeroPresupuesto}-${reparacion.cliente_nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Abrir en nueva pestaña en lugar de descargar
    window.open(url, '_blank');
    
    // Limpiar el URL después de un tiempo para liberar memoria
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    return {
      success: true,
      filename: filename
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