import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Svg, Rect, G, Path } from '@react-pdf/renderer';
import RobotoRegular from '../../../Roboto/static/Roboto-Regular.ttf';
import RobotoBold from '../../../Roboto/static/Roboto-Bold.ttf';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: RobotoRegular, fontWeight: 'normal' },
    { src: RobotoBold, fontWeight: 'bold' },
  ]
});

const USD = (val) =>
  `U$D ${parseFloat(val || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

// Eliminar emojis y caracteres no soportados por Roboto en react-pdf
const stripEmojis = (str) =>
  (str || '').replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1F9FF}]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF]/gu, '').trim();

const SUCURSAL_LABELS = {
  la_plata: 'LA PLATA',
  mitre: 'MITRE',
  servicio_tecnico: 'SERVICIO TÉCNICO',
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 25,
    paddingBottom: 40,
    paddingHorizontal: 25,
    fontFamily: 'Roboto',
    fontSize: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 3 },
  companyDetails: { fontSize: 7.5, color: '#6B7280', lineHeight: 1.5 },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', textAlign: 'right' },
  reportSub: { fontSize: 9, color: '#10b981', textAlign: 'right', marginTop: 3, fontWeight: 'bold' },
  reportDate: { fontSize: 8, color: '#6B7280', textAlign: 'right', marginTop: 3 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: '#f8fafc', padding: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  summaryCardAmber: { flex: 1, backgroundColor: '#fffbeb', padding: 8, borderWidth: 1, borderColor: '#fde68a', alignItems: 'center' },
  summaryCardGreen: { flex: 1, backgroundColor: '#ecfdf5', padding: 8, borderWidth: 1, borderColor: '#a7f3d0', alignItems: 'center' },
  summaryLabel: { fontSize: 6.5, color: '#6B7280', textTransform: 'uppercase', marginBottom: 3, textAlign: 'center' },
  summaryValue: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  summaryValueAmber: { fontSize: 10, fontWeight: 'bold', color: '#d97706' },
  summaryValueGreen: { fontSize: 10, fontWeight: 'bold', color: '#059669' },

  tableHeader: { flexDirection: 'row', backgroundColor: '#475569', paddingVertical: 4, paddingHorizontal: 5 },
  tableHeaderCell: { fontSize: 6.5, color: '#FFFFFF', fontWeight: 'bold', textTransform: 'uppercase' },

  catHeader: { backgroundColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 8, marginTop: 10 },
  catHeaderLeft: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  catHeaderRight: { fontSize: 9, color: '#FFFFFF', textAlign: 'right' },

  subCatHeader: { backgroundColor: '#334155', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 },
  subCatLeft: { fontSize: 7.5, fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' },

  tableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowEven: { backgroundColor: '#f8fafc' },
  tableRowDiff: { backgroundColor: '#fff7ed' },
  tableRowMissing: { backgroundColor: '#fef2f2' },
  tableCell: { fontSize: 7.5, color: '#374151' },
  tableCellDiff: { fontSize: 7.5, color: '#d97706', fontWeight: 'bold' },
  tableCellMissing: { fontSize: 7.5, color: '#dc2626', fontWeight: 'bold' },
  tableCellOk: { fontSize: 7.5, color: '#059669', fontWeight: 'bold' },

  subtotalRow: { flexDirection: 'row', backgroundColor: '#e2e8f0', paddingVertical: 4, paddingHorizontal: 5, borderTopWidth: 1, borderTopColor: '#cbd5e1' },
  subtotalCell: { fontSize: 7.5, color: '#1e293b', fontWeight: 'bold' },

  catTotalRow: { flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 7, paddingHorizontal: 8 },
  catTotalCell: { fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' },

  grandTotalRow: { flexDirection: 'row', backgroundColor: '#059669', paddingVertical: 7, paddingHorizontal: 5, marginTop: 12 },
  grandTotalCell: { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' },

  diffSectionHeader: { backgroundColor: '#b45309', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 8, marginTop: 10 },
  diffSectionHeaderText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },

  footer: { position: 'absolute', bottom: 15, left: 25, right: 25, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6 },
  footerText: { fontSize: 6.5, color: '#9CA3AF' },
  pageNumber: { fontSize: 6.5, color: '#9CA3AF' },
});

// Column widths
const C = {
  producto:    { flex: 3 },
  sis:         { width: 35, textAlign: 'center' },
  cont:        { width: 35, textAlign: 'center' },
  dif:         { width: 35, textAlign: 'center' },
  compra:      { width: 75, textAlign: 'right' },
  venta:       { width: 75, textAlign: 'right' },
  totalCompra: { width: 82, textAlign: 'right' },
  totalVenta:  { width: 82, textAlign: 'right' },
};

const TableColHeader = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.tableHeaderCell, C.producto]}>Producto</Text>
    <Text style={[styles.tableHeaderCell, C.sis]}>Sis.</Text>
    <Text style={[styles.tableHeaderCell, C.cont]}>Cont.</Text>
    <Text style={[styles.tableHeaderCell, C.dif]}>Dif.</Text>
    <Text style={[styles.tableHeaderCell, C.compra]}>P. Compra USD</Text>
    <Text style={[styles.tableHeaderCell, C.venta]}>P. Venta USD</Text>
    <Text style={[styles.tableHeaderCell, C.totalCompra]}>T. Compra USD</Text>
    <Text style={[styles.tableHeaderCell, C.totalVenta]}>T. Venta USD</Text>
  </View>
);

const ItemRow = ({ item, index, useSistema = false }) => {
  const dif = item.stockContado - item.stockSistema;
  const rowStyle = dif < 0 ? styles.tableRowMissing : dif > 0 ? styles.tableRowDiff : (index % 2 === 1 ? styles.tableRowEven : {});
  const difStyle = dif < 0 ? styles.tableCellMissing : dif > 0 ? styles.tableCellDiff : styles.tableCellOk;
  const difText = dif > 0 ? `+${dif}` : `${dif}`;
  const stockParaTotales = useSistema ? item.stockSistema : item.stockContado;
  const tCompra = (item.precioCompra || 0) * stockParaTotales;
  const tVenta  = (item.precioVenta  || 0) * stockParaTotales;
  return (
    <View style={[styles.tableRow, rowStyle]}>
      <View style={C.producto}>
        <Text style={styles.tableCell}>{stripEmojis(item.nombre)}</Text>
        {item.observaciones ? (
          <Text style={{ fontSize: 6.5, color: '#92400e', marginTop: 1 }}>
            * {item.observaciones}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.tableCell, C.sis]}>{item.stockSistema}</Text>
      <Text style={[styles.tableCell, C.cont]}>{item.stockContado}</Text>
      <Text style={[difStyle, C.dif]}>{difText}</Text>
      <Text style={[styles.tableCell, C.compra]}>{USD(item.precioCompra)}</Text>
      <Text style={[styles.tableCell, C.venta]}>{USD(item.precioVenta)}</Text>
      <Text style={[styles.tableCell, C.totalCompra]}>{USD(tCompra)}</Text>
      <Text style={[styles.tableCell, C.totalVenta]}>{USD(tVenta)}</Text>
    </View>
  );
};

const SubtotalRow = ({ label, totalStock, totalDifs, totalCompra, totalVenta }) => (
  <View style={styles.subtotalRow}>
    <Text style={[styles.subtotalCell, C.producto]}>SUBTOTAL {label}</Text>
    <Text style={[styles.subtotalCell, C.sis]}></Text>
    <Text style={[styles.subtotalCell, C.cont]}>{totalStock}</Text>
    <Text style={[styles.subtotalCell, C.dif]}>{totalDifs !== 0 ? (totalDifs > 0 ? `+${totalDifs}` : `${totalDifs}`) : '—'}</Text>
    <Text style={[styles.subtotalCell, C.compra]}></Text>
    <Text style={[styles.subtotalCell, C.venta]}></Text>
    <Text style={[styles.subtotalCell, C.totalCompra]}>{USD(totalCompra)}</Text>
    <Text style={[styles.subtotalCell, C.totalVenta]}>{USD(totalVenta)}</Text>
  </View>
);

const CatTotalRow = ({ label, totalStock, totalDifs, totalCompra, totalVenta }) => (
  <View style={styles.catTotalRow}>
    <Text style={[styles.catTotalCell, C.producto]}>TOTAL {label}</Text>
    <Text style={[styles.catTotalCell, C.sis]}></Text>
    <Text style={[styles.catTotalCell, C.cont]}>{totalStock}</Text>
    <Text style={[styles.catTotalCell, C.dif]}>{totalDifs !== 0 ? (totalDifs > 0 ? `+${totalDifs}` : `${totalDifs}`) : '—'}</Text>
    <Text style={[styles.catTotalCell, C.compra]}></Text>
    <Text style={[styles.catTotalCell, C.venta]}></Text>
    <Text style={[styles.catTotalCell, C.totalCompra]}>{USD(totalCompra)}</Text>
    <Text style={[styles.catTotalCell, C.totalVenta]}>{USD(totalVenta)}</Text>
  </View>
);

// Pie chart (same as StockTotalPDF)
const SLICE_COLORS = ['#1e293b','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6','#a855f7','#0ea5e9','#eab308','#64748b','#059669','#dc2626','#7c3aed','#d97706','#475569'];
const PIE_H=335,PIE_R=82,PIE_CY=110,TOTAL_Y=PIE_CY+PIE_R+6,TOTAL_H=24,LEG_START=TOTAL_Y+TOTAL_H+4,LEG_ITEM_H=12;

const PieChartSVG = ({ title, data, width }) => {
  const total = data.reduce((s, d) => s + (d.compra || 0), 0);
  const cx = width / 2;
  const multiCol = data.length > 8;
  let angle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const pct = total > 0 ? (item.compra || 0) / total : 0;
    const sweep = pct * 2 * Math.PI;
    const sa = angle; const ea = angle + sweep; angle = ea;
    const x1 = cx + PIE_R * Math.cos(sa); const y1 = PIE_CY + PIE_R * Math.sin(sa);
    const x2 = cx + PIE_R * Math.cos(ea); const y2 = PIE_CY + PIE_R * Math.sin(ea);
    const large = sweep > Math.PI ? 1 : 0;
    const path = pct > 0 ? `M ${cx} ${PIE_CY} L ${x1} ${y1} A ${PIE_R} ${PIE_R} 0 ${large} 1 ${x2} ${y2} Z` : null;
    return { ...item, path, color: SLICE_COLORS[i % SLICE_COLORS.length], pct };
  });
  const col1 = multiCol ? slices.slice(0, Math.ceil(slices.length / 2)) : slices;
  const col2 = multiCol ? slices.slice(Math.ceil(slices.length / 2)) : [];
  return (
    <Svg width={width} height={PIE_H}>
      <Rect x={0} y={0} width={width} height={22} fill="#1e293b" />
      <Text x={cx} y={15} style={{ fontSize: 9, fill: '#FFFFFF', fontFamily: 'Roboto', fontWeight: 'bold', textAnchor: 'middle' }}>{title}</Text>
      {slices.filter(s => s.path).map((s, i) => (
        <G key={i}><Path d={s.path} fill={s.color} stroke="#FFFFFF" strokeWidth={0.8} /></G>
      ))}
      <Rect x={cx - 70} y={TOTAL_Y} width={140} height={TOTAL_H} fill="#f1f5f9" />
      <Text x={cx} y={TOTAL_Y + 9} style={{ fontSize: 7, fill: '#64748b', fontFamily: 'Roboto', textAnchor: 'middle' }}>TOTAL COMPRA (CONTADO)</Text>
      <Text x={cx} y={TOTAL_Y + 20} style={{ fontSize: 10, fill: '#1e293b', fontFamily: 'Roboto', fontWeight: 'bold', textAnchor: 'middle' }}>{USD(total)}</Text>
      {col1.map((s, i) => { const lx=6,ly=LEG_START+i*LEG_ITEM_H,label=s.label.length>17?s.label.substring(0,17)+'…':s.label; return (<G key={i}><Rect x={lx} y={ly} width={7} height={7} fill={s.color}/><Text x={lx+10} y={ly+6.5} style={{fontSize:6,fill:'#374151',fontFamily:'Roboto'}}>{label}  {USD(s.compra)}</Text></G>); })}
      {col2.map((s, i) => { const lx=width/2+4,ly=LEG_START+i*LEG_ITEM_H,label=s.label.length>17?s.label.substring(0,17)+'…':s.label; return (<G key={i}><Rect x={lx} y={ly} width={7} height={7} fill={s.color}/><Text x={lx+10} y={ly+6.5} style={{fontSize:6,fill:'#374151',fontFamily:'Roboto'}}>{label}  {USD(s.compra)}</Text></G>); })}
    </Svg>
  );
};

const RecuentoSesionDocument = ({ secciones, resumenGeneral, sesion, fechaGeneracion, chartsData }) => {
  const sucursalLabel = SUCURSAL_LABELS[sesion.sucursal] || sesion.sucursal?.toUpperCase() || '';
  const todasLasDiferencias = secciones.flatMap(s =>
    (s.subsecciones || []).flatMap(sub => sub.items.filter(i => i.stockContado !== i.stockSistema))
    .concat((s.items || []).filter(i => i.stockContado !== i.stockSistema))
  );

  return (
    <Document>
      {/* Página principal */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>UPDATE TECH WW SRL</Text>
            <Text style={styles.companyDetails}>
              44 N° 862 1/2 Piso 4, La Plata{'\n'}
              Bartolomé Mitre 797 Piso 14 Of. 1, CABA{'\n'}
              CUIT: 30-71850553-2
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.reportTitle}>RECUENTO DE STOCK</Text>
            <Text style={styles.reportSub}>SUCURSAL: {sucursalLabel}</Text>
            <Text style={styles.reportDate}>
              Fecha recuento: {sesion.fecha}  |  Usuario: {sesion.usuario || '—'}{'\n'}
              Generado: {fechaGeneracion}
            </Text>
          </View>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Productos</Text>
            <Text style={styles.summaryValue}>{resumenGeneral.totalProductos}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Stock Contado</Text>
            <Text style={styles.summaryValue}>{resumenGeneral.totalContado} uds</Text>
          </View>
          <View style={styles.summaryCardAmber}>
            <Text style={styles.summaryLabel}>Con Diferencias</Text>
            <Text style={styles.summaryValueAmber}>{resumenGeneral.totalConDif}</Text>
          </View>
          <View style={styles.summaryCardGreen}>
            <Text style={styles.summaryLabel}>Sin Diferencias</Text>
            <Text style={styles.summaryValueGreen}>{resumenGeneral.totalSinDif}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>T. Compra (cont.)</Text>
            <Text style={styles.summaryValue}>{USD(resumenGeneral.totalCompra)}</Text>
          </View>
          <View style={styles.summaryCardGreen}>
            <Text style={styles.summaryLabel}>T. Venta (cont.)</Text>
            <Text style={styles.summaryValueGreen}>{USD(resumenGeneral.totalVenta)}</Text>
          </View>
        </View>

        {/* Tarjetas por categoría */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          {secciones.map((sec) => (
            <View key={sec.nombre} style={{ flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', padding: 7 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, textAlign: 'center', textTransform: 'uppercase' }}>{sec.nombre}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={{ flex: 1, backgroundColor: '#334155', padding: 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 5.5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Productos</Text>
                  <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#FFFFFF' }}>
                    {sec.subsecciones ? sec.subsecciones.reduce((s, sub) => s + sub.items.length, 0) : (sec.items || []).length}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#334155', padding: 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 5.5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Contado</Text>
                  <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#FFFFFF' }}>{sec.totalContado}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: sec.totalDifs !== 0 ? '#78350f' : '#064e3b', padding: 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 5.5, color: sec.totalDifs !== 0 ? '#fde68a' : '#6ee7b7', textTransform: 'uppercase', marginBottom: 3 }}>Difs.</Text>
                  <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#FFFFFF' }}>{sec.totalDifs}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#064e3b', padding: 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 5.5, color: '#6ee7b7', textTransform: 'uppercase', marginBottom: 3 }}>PV</Text>
                  <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#FFFFFF' }}>{USD(sec.totalVenta)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TableColHeader />

        {secciones.map((seccion) => (
          <View key={seccion.nombre}>
            <View style={styles.catHeader}>
              <Text style={styles.catHeaderLeft}>{seccion.nombre}</Text>
              <Text style={styles.catHeaderRight}>
                Contado: {seccion.totalContado} uds  |  Difs: {seccion.totalDifs}  |  Compra: {USD(seccion.totalCompra)}  |  Venta: {USD(seccion.totalVenta)}
              </Text>
            </View>

            {seccion.subsecciones ? (
              seccion.subsecciones.map((sub) => (
                <View key={sub.nombre}>
                  <View style={styles.subCatHeader}>
                    <Text style={styles.subCatLeft}>{sub.nombre}</Text>
                  </View>
                  {sub.items.map((item, idx) => <ItemRow key={idx} item={item} index={idx} />)}
                  <SubtotalRow label={sub.nombre} totalStock={sub.totalContado} totalDifs={sub.totalDifs} totalCompra={sub.totalCompra} totalVenta={sub.totalVenta} />
                </View>
              ))
            ) : (
              (seccion.items || []).map((item, idx) => <ItemRow key={idx} item={item} index={idx} />)
            )}

            <CatTotalRow label={seccion.nombre} totalStock={seccion.totalContado} totalDifs={seccion.totalDifs} totalCompra={seccion.totalCompra} totalVenta={seccion.totalVenta} />
          </View>
        ))}

        {/* Grand total */}
        <View style={styles.grandTotalRow}>
          <Text style={[styles.grandTotalCell, C.producto]}>TOTAL GENERAL</Text>
          <Text style={[styles.grandTotalCell, C.sis]}></Text>
          <Text style={[styles.grandTotalCell, C.cont]}>{resumenGeneral.totalContado}</Text>
          <Text style={[styles.grandTotalCell, C.dif]}>{resumenGeneral.totalDifs !== 0 ? (resumenGeneral.totalDifs > 0 ? `+${resumenGeneral.totalDifs}` : `${resumenGeneral.totalDifs}`) : '—'}</Text>
          <Text style={[styles.grandTotalCell, C.compra]}></Text>
          <Text style={[styles.grandTotalCell, C.venta]}></Text>
          <Text style={[styles.grandTotalCell, C.totalCompra]}>{USD(resumenGeneral.totalCompra)}</Text>
          <Text style={[styles.grandTotalCell, C.totalVenta]}>{USD(resumenGeneral.totalVenta)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>UPDATE TECH WW SRL — Recuento de Stock {sucursalLabel} — {sesion.fecha} — Uso interno</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Página de diferencias (solo si hay) */}
      {todasLasDiferencias.length > 0 && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={{ backgroundColor: '#b45309', paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
              RESUMEN DE DIFERENCIAS — {sucursalLabel} — {sesion.fecha}
            </Text>
          </View>

          <TableColHeader />

          {todasLasDiferencias.map((item, idx) => <ItemRow key={idx} item={item} index={idx} useSistema={true} />)}

          <View style={{ flexDirection: 'row', backgroundColor: '#b45309', paddingVertical: 7, paddingHorizontal: 8, marginTop: 8 }}>
            <Text style={[styles.grandTotalCell, C.producto]}>TOTAL DIFERENCIAS</Text>
            <Text style={[styles.grandTotalCell, C.sis]}></Text>
            <Text style={[styles.grandTotalCell, C.cont]}>{todasLasDiferencias.reduce((s, i) => s + i.stockContado, 0)}</Text>
            <Text style={[styles.grandTotalCell, C.dif]}>{todasLasDiferencias.reduce((s, i) => s + (i.stockContado - i.stockSistema), 0)}</Text>
            <Text style={[styles.grandTotalCell, C.compra]}></Text>
            <Text style={[styles.grandTotalCell, C.venta]}></Text>
            <Text style={[styles.grandTotalCell, C.totalCompra]}>{USD(todasLasDiferencias.reduce((s, i) => s + (i.precioCompra || 0) * i.stockSistema, 0))}</Text>
            <Text style={[styles.grandTotalCell, C.totalVenta]}>{USD(todasLasDiferencias.reduce((s, i) => s + (i.precioVenta || 0) * i.stockSistema, 0))}</Text>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>UPDATE TECH WW SRL — Recuento de Stock {sucursalLabel} — {sesion.fecha} — Uso interno</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </Page>
      )}

      {/* Página de gráficos */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={{ backgroundColor: '#1e293b', paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
            ANÁLISIS DE STOCK CONTADO POR CATEGORÍA — {sucursalLabel}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <PieChartSVG title="NOTEBOOKS"  data={chartsData.notebooks}  width={260} />
          <PieChartSVG title="CELULARES"  data={chartsData.celulares}  width={260} />
          <PieChartSVG title="OTROS"      data={chartsData.otros}      width={260} />
        </View>
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>UPDATE TECH WW SRL — Recuento de Stock {sucursalLabel} — {sesion.fecha} — Uso interno</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

// ── Data builder ─────────────────────────────────────────────────────────────
const buildSecciones = (recuentos) => {
  // recuentos: array de recuentos_stock de la sesión, cada uno con productos_contados[]
  const porCategoria = { notebooks: [], celulares: [], otros: [] };

  recuentos.forEach(r => {
    const cat = r.categoria;
    const items = Array.isArray(r.productos_contados) ? r.productos_contados : [];
    if (cat === 'notebooks') porCategoria.notebooks.push(...items);
    else if (cat === 'celulares') porCategoria.celulares.push(...items);
    else porCategoria.otros.push(...items);
  });

  // NOTEBOOKS — agrupados por subcategoria
  const nbPorSub = {};
  porCategoria.notebooks.forEach(item => {
    const sub = (item.subcategoria || 'GENERAL').toUpperCase();
    if (!nbPorSub[sub]) nbPorSub[sub] = [];
    nbPorSub[sub].push(item);
  });
  const nbSubsecciones = Object.entries(nbPorSub).sort(([a],[b])=>a.localeCompare(b)).map(([sub, items]) => {
    const totalContado = items.reduce((s, i) => s + (i.stockContado || 0), 0);
    const totalDifs = items.reduce((s, i) => s + ((i.stockContado || 0) - (i.stockSistema || 0)), 0);
    const totalCompra = items.reduce((s, i) => s + (i.precioCompra || 0) * (i.stockContado || 0), 0);
    const totalVenta  = items.reduce((s, i) => s + (i.precioVenta  || 0) * (i.stockContado || 0), 0);
    return { nombre: sub, items, totalContado, totalDifs, totalCompra, totalVenta };
  });

  // CELULARES — sin subcategoría
  const celItems = porCategoria.celulares;
  const celContado = celItems.reduce((s, i) => s + (i.stockContado || 0), 0);
  const celDifs    = celItems.reduce((s, i) => s + ((i.stockContado||0)-(i.stockSistema||0)), 0);
  const celCompra  = celItems.reduce((s, i) => s + (i.precioCompra||0)*(i.stockContado||0), 0);
  const celVenta   = celItems.reduce((s, i) => s + (i.precioVenta ||0)*(i.stockContado||0), 0);

  // OTROS — agrupados por subcategoria
  const otrosPorSub = {};
  porCategoria.otros.forEach(item => {
    const sub = (item.subcategoria || 'OTROS').toUpperCase();
    if (!otrosPorSub[sub]) otrosPorSub[sub] = [];
    otrosPorSub[sub].push(item);
  });
  const otrosSubsecciones = Object.entries(otrosPorSub).sort(([a],[b])=>a.localeCompare(b)).map(([sub, items]) => {
    const totalContado = items.reduce((s, i) => s + (i.stockContado || 0), 0);
    const totalDifs = items.reduce((s, i) => s + ((i.stockContado||0)-(i.stockSistema||0)), 0);
    const totalCompra = items.reduce((s, i) => s + (i.precioCompra||0)*(i.stockContado||0), 0);
    const totalVenta  = items.reduce((s, i) => s + (i.precioVenta ||0)*(i.stockContado||0), 0);
    return { nombre: sub, items, totalContado, totalDifs, totalCompra, totalVenta };
  });

  const secciones = [];

  if (nbSubsecciones.length > 0) {
    const nbContado = nbSubsecciones.reduce((s,sub)=>s+sub.totalContado,0);
    const nbDifs = nbSubsecciones.reduce((s,sub)=>s+sub.totalDifs,0);
    secciones.push({ nombre: 'NOTEBOOKS', subsecciones: nbSubsecciones, totalContado: nbContado, totalDifs: nbDifs, totalCompra: nbSubsecciones.reduce((s,sub)=>s+sub.totalCompra,0), totalVenta: nbSubsecciones.reduce((s,sub)=>s+sub.totalVenta,0) });
  }
  if (celItems.length > 0) {
    secciones.push({ nombre: 'CELULARES', items: celItems, totalContado: celContado, totalDifs: celDifs, totalCompra: celCompra, totalVenta: celVenta });
  }
  if (otrosSubsecciones.length > 0) {
    const otrosContado = otrosSubsecciones.reduce((s,sub)=>s+sub.totalContado,0);
    const otrosDifs = otrosSubsecciones.reduce((s,sub)=>s+sub.totalDifs,0);
    secciones.push({ nombre: 'OTROS', subsecciones: otrosSubsecciones, totalContado: otrosContado, totalDifs: otrosDifs, totalCompra: otrosSubsecciones.reduce((s,sub)=>s+sub.totalCompra,0), totalVenta: otrosSubsecciones.reduce((s,sub)=>s+sub.totalVenta,0) });
  }

  const todosItems = [...porCategoria.notebooks, ...porCategoria.celulares, ...porCategoria.otros];
  const conDif = todosItems.filter(i => (i.stockContado||0) !== (i.stockSistema||0)).length;
  const resumenGeneral = {
    totalProductos: todosItems.length,
    totalContado:   todosItems.reduce((s,i)=>s+(i.stockContado||0),0),
    totalConDif:    conDif,
    totalSinDif:    todosItems.length - conDif,
    totalDifs:      todosItems.reduce((s,i)=>s+((i.stockContado||0)-(i.stockSistema||0)),0),
    totalCompra:    todosItems.reduce((s,i)=>s+(i.precioCompra||0)*(i.stockContado||0),0),
    totalVenta:     todosItems.reduce((s,i)=>s+(i.precioVenta ||0)*(i.stockContado||0),0),
  };

  // Charts
  const chartsNotebooks = nbSubsecciones.map(sub => ({ label: sub.nombre, compra: sub.totalCompra, venta: sub.totalVenta, stock: sub.totalContado }));
  const celPorCat = {};
  porCategoria.celulares.forEach(i => {
    const cat = (i.subcategoria || 'SIN CATEGORÍA').toUpperCase();
    if (!celPorCat[cat]) celPorCat[cat] = { compra: 0, venta: 0, stock: 0 };
    celPorCat[cat].compra += (i.precioCompra||0)*(i.stockContado||0);
    celPorCat[cat].venta  += (i.precioVenta ||0)*(i.stockContado||0);
    celPorCat[cat].stock  += (i.stockContado||0);
  });
  const chartsCelulares = Object.entries(celPorCat).map(([label,vals])=>({label,...vals})).sort((a,b)=>b.compra-a.compra);
  const chartsOtros = otrosSubsecciones.map(sub => ({ label: sub.nombre, compra: sub.totalCompra, venta: sub.totalVenta, stock: sub.totalContado }));

  return { secciones, resumenGeneral, chartsData: { notebooks: chartsNotebooks, celulares: chartsCelulares, otros: chartsOtros } };
};

export const generarRecuentoSesionPDF = async (sesion, recuentos) => {
  const fechaGeneracion = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const { secciones, resumenGeneral, chartsData } = buildSecciones(recuentos);

  try {
    const blob = await pdf(
      <RecuentoSesionDocument
        secciones={secciones}
        resumenGeneral={resumenGeneral}
        sesion={sesion}
        fechaGeneracion={fechaGeneracion}
        chartsData={chartsData}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    return { success: true };
  } catch (error) {
    console.error('Error generando PDF de recuento:', error);
    return { success: false, error: error.message };
  }
};

export default RecuentoSesionDocument;
