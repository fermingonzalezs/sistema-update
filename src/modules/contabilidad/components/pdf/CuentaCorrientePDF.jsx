import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer';
import InterRegular from '../../../../../public/Inter/static/Inter_18pt-Regular.ttf'
import InterBold from '../../../../../public/Inter/static/Inter_18pt-Bold.ttf'

// Registrar la fuente ANTES de los estilos
Font.register({
    family: 'Inter',
    fonts: [
        {
            src: InterRegular,
            fontWeight: 'normal',
        },
        {
            src: InterBold,
            fontWeight: 'bold',
        }
    ]
});

// Estilos profesionales - Basado en RemitoPDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        paddingVertical: 0,
        paddingHorizontal: 0,
        fontFamily: 'Inter',
        fontSize: 8,
        lineHeight: 1.2,
        flex: 1,
    },

    // Header de la empresa
    companyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
        paddingVertical: 7,
        paddingHorizontal: 25,
        backgroundColor: '#000000',
        width: '100%',
    },
    companyLogosSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoImage: {
        width: 35,
        height: 35,
    },
    textoImage: {
        width: 85,
    },
    companyInfoHeaderSection: {
        flexDirection: 'column',
        justifyContent: 'center',
        paddingHorizontal: 0,
        alignItems: 'flex-end',
    },
    companyName: {
        fontSize: 12,
        fontFamily: 'Inter',
        color: '#FFFFFF',
        marginBottom: 10,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        textAlign: 'right',
    },
    companyDetails: {
        fontSize: 7,
        color: '#FFFFFF',
        lineHeight: 1.4,
        fontFamily: 'Inter',
        marginBottom: 6,
        textAlign: 'right',
    },

    // Header del documento
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 25,
        paddingVertical: 15,
        marginBottom: 20,
    },
    documentTitleSection: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    documentTitle: {
        fontSize: 16,
        fontFamily: 'Inter',
        color: '#000000',
        marginTop: 0,
        marginBottom: 8,
        paddingTop: 0,
        paddingBottom: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        textAlign: 'right',
    },
    documentSubtitle: {
        fontSize: 8,
        color: '#000000',
        fontFamily: 'Inter',
        marginBottom: 6,
        marginTop: 6,
        textAlign: 'right',
    },
    documentInfo: {
        fontSize: 8,
        color: '#000000',
        textAlign: 'right',
        fontFamily: 'Inter',
        marginBottom: 0,
    },

    // Cliente info lado izquierdo del header
    clientHeaderSection: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    clientHeaderLabel: {
        fontSize: 7,
        fontFamily: 'Inter',
        color: '#000000',
        marginBottom: 4,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
    },
    clientHeaderName: {
        fontSize: 8,
        fontFamily: 'Inter',
        color: '#000000',
        marginBottom: 4,
        marginTop: 4,
    },
    clientHeaderPhone: {
        fontSize: 8,
        fontFamily: 'Inter',
        color: '#000000',
        marginBottom: 4,
    },
    clientHeaderEmail: {
        fontSize: 8,
        fontFamily: 'Inter',
        color: '#000000',
    },

    // Tabla de movimientos
    table: {
        marginBottom: 25,
        marginHorizontal: 25,
        backgroundColor: '#F3F4F6',
        borderWidth: 0.5,
        borderColor: '#FFFFFF',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: '#000000',
        borderBottomWidth: 0.5,
        borderBottomColor: '#FFFFFF',
    },
    tableHeaderText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontFamily: 'Inter',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        textAlign: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#FFFFFF',
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        paddingVertical: 8,
        paddingHorizontal: 8,
        minHeight: 20,
        marginBottom: 0.5,
    },
    tableRowLast: {
        borderBottomWidth: 0,
    },
    tableCell: {
        fontSize: 7,
        color: '#374151',
        justifyContent: 'center',
        textAlign: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#FFFFFF',
        paddingHorizontal: 4,
    },
    tableCellDescription: {
        fontSize: 7,
        color: '#374151',
        lineHeight: 1.3,
        textAlign: 'left',
        borderRightWidth: 0.5,
        borderRightColor: '#FFFFFF',
        paddingHorizontal: 4,
    },

    // Columnas
    colFecha: { width: '15%', textAlign: 'center' },
    colConcepto: { width: '40%', textAlign: 'center' },
    colDebe: { width: '15%', textAlign: 'center' },
    colHaber: { width: '15%', textAlign: 'center' },
    colSaldo: { width: '15%', textAlign: 'center', borderRightWidth: 0 },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 25,
        right: 25,
        borderTopWidth: 0.5,
        borderTopColor: '#000000',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 7,
        color: '#374151',
        fontFamily: 'Inter',
        textAlign: 'center',
    },
});

const CuentaCorrientePDFDocument = ({ data }) => {
    const { cliente, movimientos, fechaEmision } = data;

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-AR');
    };

    const formatearMonto = (monto) => {
        // Formato: U$ 1.000 (sin decimales, punto para miles)
        const numero = new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto);
        return `U$ ${numero}`;
    };

    const formatearSaldo = (saldo) => {
        // Signos invertidos a pedido del usuario:
        // Deudor (positivo en DB) -> Mostrar como negativo (-)
        // Acreedor (negativo en DB) -> Mostrar como positivo (+)
        const valor = Math.abs(saldo);
        const signo = saldo > 0 ? '-' : saldo < 0 ? '+' : '';
        // Si es 0, no mostrar signo
        if (saldo === 0) return formatearMonto(0);
        return `${signo} ${formatearMonto(valor)}`;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header de la empresa */}
                <View style={styles.companyHeader}>
                    <View style={styles.companyLogosSection}>
                        <Image source="/logo.png" style={styles.logoImage} />
                        <Image source="/texto.png" style={styles.textoImage} />
                    </View>
                    <View style={styles.companyInfoHeaderSection}>
                        <Text style={styles.companyName}>UPDATE TECH WW S.R.L</Text>
                        <Text style={styles.companyDetails}>CUIT: 30-71850553-2</Text>
                        <Text style={styles.companyDetails}>La Plata, Buenos Aires, Argentina</Text>
                    </View>
                </View>

                {/* Header del documento */}
                <View style={styles.receiptHeader}>
                    {/* Cliente info */}
                    <View style={styles.clientHeaderSection}>
                        <Text style={styles.clientHeaderLabel}>CLIENTE</Text>
                        <Text style={styles.clientHeaderName}>{cliente.nombre} {cliente.apellido}</Text>
                        {cliente.telefono && (
                            <Text style={styles.clientHeaderPhone}>Tel: {cliente.telefono}</Text>
                        )}
                        {cliente.email && (
                            <Text style={styles.clientHeaderEmail}>Email: {cliente.email}</Text>
                        )}
                    </View>

                    {/* Título y datos */}
                    <View style={styles.documentTitleSection}>
                        <Text style={styles.documentTitle}>RESUMEN DE CUENTA</Text>
                        <Text style={styles.documentInfo}>Fecha de Emisión: {formatearFecha(fechaEmision)}</Text>
                        <Text style={[styles.documentInfo, { marginTop: 8, fontSize: 12, fontFamily: 'Inter' }]}>
                            SALDO ACTUAL: {formatearSaldo(cliente.saldo_total)}
                        </Text>
                    </View>
                </View>

                {/* Tabla de movimientos */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.colFecha]}>FECHA</Text>
                        <Text style={[styles.tableHeaderText, styles.colConcepto]}>CONCEPTO</Text>
                        <Text style={[styles.tableHeaderText, styles.colDebe]}>DÉBITO</Text>
                        <Text style={[styles.tableHeaderText, styles.colHaber]}>CRÉDITO</Text>
                        <Text style={[styles.tableHeaderText, styles.colSaldo]}>SALDO</Text>
                    </View>

                    {movimientos?.map((mov, index) => (
                        <View
                            key={index}
                            style={[
                                styles.tableRow,
                                index === movimientos.length - 1 && styles.tableRowLast
                            ]}
                        >
                            <Text style={[styles.tableCell, styles.colFecha]}>
                                {formatearFecha(mov.fecha_operacion)}
                            </Text>
                            <Text style={[styles.tableCellDescription, styles.colConcepto, { textAlign: 'center' }]}>
                                {mov.concepto}
                            </Text>
                            <Text style={[styles.tableCell, styles.colDebe]}>
                                {mov.tipo_movimiento === 'haber' ? formatearMonto(mov.monto) : '-'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colHaber]}>
                                {mov.tipo_movimiento === 'debe' ? formatearMonto(mov.monto) : '-'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colSaldo]}>
                                {formatearSaldo(mov.saldo_acumulado)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Este documento es un resumen de cuenta corriente y no tiene validez fiscal.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export const generarYDescargarResumenCuenta = async (data) => {
    try {
        const blob = await pdf(<CuentaCorrientePDFDocument data={data} />).toBlob();
        const url = URL.createObjectURL(blob);

        // Abrir en nueva pestaña
        window.open(url, '_blank');

        // Cleanup después de un tiempo
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10000);

        return { success: true };
    } catch (error) {
        console.error('Error al generar PDF de cuenta corriente:', error);
        return { success: false, error: error.message };
    }
};

export default CuentaCorrientePDFDocument;
