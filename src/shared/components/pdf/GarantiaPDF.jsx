import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Estilos para el PDF de garantía
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 40,
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  empresa: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1F2937',
    textDecoration: 'underline',
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#374151',
    textDecoration: 'underline',
  },
  datosContainer: {
    marginBottom: 25,
  },
  datoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  datoLabel: {
    width: '30%',
    fontWeight: 'bold',
    color: '#4B5563',
  },
  datoValue: {
    width: '70%',
    color: '#1F2937',
    borderBottom: 1,
    borderBottomColor: '#D1D5DB',
    paddingBottom: 2,
  },
  parrafo: {
    marginBottom: 12,
    textAlign: 'justify',
    color: '#374151',
  },
  lista: {
    marginLeft: 15,
    marginBottom: 12,
  },
  listaItem: {
    marginBottom: 8,
    color: '#374151',
  },
  subLista: {
    marginLeft: 20,
    marginTop: 5,
  },
  subListaItem: {
    marginBottom: 5,
    color: '#374151',
  },
  destacado: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  contactoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactoTitulo: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
    textAlign: 'center',
  },
  contactoLinea: {
    marginBottom: 5,
    textAlign: 'center',
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
});

const GarantiaPDF = ({ producto, numeroSerie, cliente, fechaCompra, plazoGarantia }) => {
  const fechaActual = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.empresa}>UPDATE TECH WW SRL</Text>
          <Text style={styles.titulo}>CERTIFICADO DE GARANTÍA</Text>
        </View>

        {/* Datos del producto */}
        <Text style={styles.seccionTitulo}>Datos del producto</Text>
        <View style={styles.datosContainer}>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>Producto:</Text>
            <Text style={styles.datoValue}>{producto || ''}</Text>
          </View>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>Número de serie:</Text>
            <Text style={styles.datoValue}>{numeroSerie || ''}</Text>
          </View>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>Cliente:</Text>
            <Text style={styles.datoValue}>{cliente || ''}</Text>
          </View>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>Fecha de compra:</Text>
            <Text style={styles.datoValue}>{fechaCompra || ''}</Text>
          </View>
          <View style={styles.datoRow}>
            <Text style={styles.datoLabel}>Plazo de garantía:</Text>
            <Text style={styles.datoValue}>{plazoGarantia || ''}</Text>
          </View>
        </View>

        {/* Alcance de la garantía */}
        <Text style={styles.seccionTitulo}>Alcance de la garantía</Text>
        <Text style={styles.parrafo}>
          Update Tech WW SRL acompaña cada producto con un certificado de garantía, comprometiéndose a reparar o reemplazar cualquier parte que, a criterio de nuestro Servicio Técnico, presente defectos de fabricación.
        </Text>
        <Text style={styles.parrafo}>
          La garantía será válida únicamente en nuestras sucursales oficiales (La Plata y CABA) y bajo evaluación técnica previa.
        </Text>

        {/* Exclusiones de la garantía */}
        <Text style={styles.seccionTitulo}>Exclusiones de la garantía</Text>
        <Text style={styles.parrafo}>
          <Text style={styles.destacado}>La garantía no cubre:</Text>
        </Text>

        <View style={styles.lista}>
          <Text style={styles.listaItem}>• Reemplazo total del producto ni devolución del importe abonado.</Text>
          <Text style={styles.listaItem}>• <Text style={styles.destacado}>Fallas ocasionadas por:</Text></Text>
          <View style={styles.subLista}>
            <Text style={styles.subListaItem}>◦ Uso indebido, golpes, caídas o manipulación incorrecta.</Text>
            <Text style={styles.subListaItem}>◦ Instalaciones defectuosas, errores de operación o suciedad.</Text>
            <Text style={styles.subListaItem}>◦ Degradación natural de componentes por uso (ej. batería, teclado, ventiladores).</Text>
          </View>
          <Text style={styles.listaItem}>• <Text style={styles.destacado}>Productos que presenten:</Text></Text>
          <View style={styles.subLista}>
            <Text style={styles.subListaItem}>◦ Apertura no autorizada o alteración de sus componentes.</Text>
            <Text style={styles.subListaItem}>◦ Números de serie, etiquetas o inscripciones alteradas.</Text>
            <Text style={styles.subListaItem}>◦ Oxidación, humedad, abolladuras o daños físicos.</Text>
          </View>
        </View>

        {/* Procedimiento de reclamo */}
        <Text style={styles.seccionTitulo}>Procedimiento de reclamo</Text>
        <View style={styles.lista}>
          <Text style={styles.listaItem}>• Presentar el comprobante original de compra junto con este certificado de garantía.</Text>
          <Text style={styles.listaItem}>• El Servicio Técnico de Update evaluará el equipo y determinará la validez de la garantía.</Text>
          <Text style={styles.listaItem}>• <Text style={styles.destacado}>En caso de corresponder:</Text></Text>
          <View style={styles.subLista}>
            <Text style={styles.subListaItem}>◦ Dentro de las 48 horas hábiles posteriores a la compra, si se detecta una falla de fabricación evidente, el cliente tiene derecho a un reemplazo inmediato.</Text>
            <Text style={styles.subListaItem}>◦ Pasado ese plazo, el tiempo estimado para reparación o reemplazo de piezas involucradas será de 72 horas hábiles en adelante, sujeto a disponibilidad de repuestos y complejidad del diagnóstico.</Text>
          </View>
        </View>

        {/* Importante */}
        <Text style={styles.seccionTitulo}>Importante</Text>
        <View style={styles.lista}>
          <Text style={styles.listaItem}>• Reclamos infundados que requieran tiempo de diagnóstico, reinstalación o servicios no cubiertos, podrán generar un cargo adicional por servicio técnico.</Text>
          <Text style={styles.listaItem}>• No se otorgan equipos de reemplazo durante el período de reparación, salvo excepción expresa.</Text>
        </View>

        {/* Contacto oficial */}
        <View style={styles.contactoContainer}>
          <Text style={styles.contactoTitulo}>Contacto oficial</Text>
          <Text style={styles.contactoLinea}><Text style={styles.destacado}>La Plata:</Text> 221-641-9901 – Av. 44 Nº 862, Piso 4</Text>
          <Text style={styles.contactoLinea}><Text style={styles.destacado}>CABA:</Text> 221-637-6129 – Bartolomé Mitre 797, piso 14</Text>
          <Text style={styles.contactoLinea}><Text style={styles.destacado}>Email:</Text> hola@somosupdate.com</Text>
          <Text style={styles.contactoLinea}><Text style={styles.destacado}>Web:</Text> www.updatetech.store</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Certificado de garantía generado el {fechaActual} - Update Tech WW SRL</Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar y descargar el PDF de garantía
export const descargarGarantiaPDF = async (datosGarantia) => {
  try {
    const {
      producto = '',
      numeroSerie = '',
      cliente = '',
      fechaCompra = '',
      plazoGarantia = ''
    } = datosGarantia;

    const blob = await pdf(
      <GarantiaPDF
        producto={producto}
        numeroSerie={numeroSerie}
        cliente={cliente}
        fechaCompra={fechaCompra}
        plazoGarantia={plazoGarantia}
      />
    ).toBlob();

    // Crear nombre del archivo
    const clienteNombre = cliente.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const numeroSerieLimpio = numeroSerie.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    const nombreArchivo = `garantia_${clienteNombre}_${numeroSerieLimpio}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Crear enlace de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ PDF de garantía descargado:', nombreArchivo);
  } catch (error) {
    console.error('❌ Error generando PDF de garantía:', error);
    throw error;
  }
};

export default GarantiaPDF;