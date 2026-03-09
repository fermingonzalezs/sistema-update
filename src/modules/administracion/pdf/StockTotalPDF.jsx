import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font, Svg, Rect, G, Line, Path } from '@react-pdf/renderer';
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  companyName: {
    fontSize: 13,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  companyDetails: {
    fontSize: 7.5,
    color: '#6B7280',
    lineHeight: 1.5,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  reportDate: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  summaryCardGreen: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 6.5,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 3,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryValueGreen: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#059669',
  },

  // Table column header
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    paddingVertical: 4,
    paddingHorizontal: 5,
    marginBottom: 0,
  },
  tableHeaderCell: {
    fontSize: 6.5,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Main category header
  catHeader: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 10,
  },
  catHeaderLeft: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  catHeaderRight: {
    fontSize: 9,
    color: '#FFFFFF',
    textAlign: 'right',
  },

  // Subcategory header
  subCatHeader: {
    backgroundColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  subCatLeft: {
    fontSize: 7.5,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  subCatRight: {
    fontSize: 7,
    color: '#94a3b8',
  },

  // Table rows
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 7.5,
    color: '#374151',
  },

  // Subtotal row (subcategory)
  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  subtotalCell: {
    fontSize: 7.5,
    color: '#1e293b',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },

  // Category total row
  catTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  catTotalCell: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },

  // Grand total
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    paddingVertical: 7,
    paddingHorizontal: 5,
    marginTop: 12,
  },
  grandTotalCell: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6.5,
    color: '#9CA3AF',
  },
  pageNumber: {
    fontSize: 6.5,
    color: '#9CA3AF',
  },
});

// Column layout: used in every row
const C = {
  producto:    { flex: 3 },
  stock:       { width: 35, textAlign: 'center' },
  compra:      { width: 82, textAlign: 'right' },
  venta:       { width: 82, textAlign: 'right' },
  totalCompra: { width: 90, textAlign: 'right' },
  totalVenta:  { width: 90, textAlign: 'right' },
};

const TableColHeader = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.tableHeaderCell, C.producto]}>Producto</Text>
    <Text style={[styles.tableHeaderCell, C.stock]}>Stock</Text>
    <Text style={[styles.tableHeaderCell, C.compra]}>P. Compra USD</Text>
    <Text style={[styles.tableHeaderCell, C.venta]}>P. Venta USD</Text>
    <Text style={[styles.tableHeaderCell, C.totalCompra]}>T. Compra USD</Text>
    <Text style={[styles.tableHeaderCell, C.totalVenta]}>T. Venta USD</Text>
  </View>
);

const ItemRow = ({ item, index }) => (
  <View style={[styles.tableRow, index % 2 === 1 && styles.tableRowEven]}>
    <Text style={[styles.tableCell, C.producto]}>{item.nombre}</Text>
    <Text style={[styles.tableCell, C.stock]}>{item.stock}</Text>
    <Text style={[styles.tableCell, C.compra]}>{USD(item.compra)}</Text>
    <Text style={[styles.tableCell, C.venta]}>{USD(item.venta)}</Text>
    <Text style={[styles.tableCell, C.totalCompra]}>{USD(item.totalCompra)}</Text>
    <Text style={[styles.tableCell, C.totalVenta]}>{USD(item.totalVenta)}</Text>
  </View>
);

const SubtotalRow = ({ label, stock, totalCompra, totalVenta }) => (
  <View style={styles.subtotalRow}>
    <Text style={[styles.subtotalCell, C.producto]}>SUBTOTAL {label}</Text>
    <Text style={[styles.subtotalCell, C.stock]}>{stock}</Text>
    <Text style={[styles.subtotalCell, C.compra]}></Text>
    <Text style={[styles.subtotalCell, C.venta]}></Text>
    <Text style={[styles.subtotalCell, C.totalCompra]}>{USD(totalCompra)}</Text>
    <Text style={[styles.subtotalCell, C.totalVenta]}>{USD(totalVenta)}</Text>
  </View>
);

const CatTotalRow = ({ label, stock, totalCompra, totalVenta }) => (
  <View style={styles.catTotalRow}>
    <Text style={[styles.catTotalCell, C.producto]}>TOTAL {label}</Text>
    <Text style={[styles.catTotalCell, C.stock]}>{stock}</Text>
    <Text style={[styles.catTotalCell, C.compra]}></Text>
    <Text style={[styles.catTotalCell, C.venta]}></Text>
    <Text style={[styles.catTotalCell, C.totalCompra]}>{USD(totalCompra)}</Text>
    <Text style={[styles.catTotalCell, C.totalVenta]}>{USD(totalVenta)}</Text>
  </View>
);

// ── Pie Chart (SVG) ──────────────────────────────────────────────────────────
const SLICE_COLORS = [
  '#1e293b', '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16',
  '#14b8a6', '#a855f7', '#0ea5e9', '#eab308', '#64748b',
  '#059669', '#dc2626', '#7c3aed', '#d97706', '#475569',
];

const PIE_H      = 335;
const PIE_R      = 82;
const PIE_CY     = 110;   // center Y
const TOTAL_Y    = PIE_CY + PIE_R + 6;   // total label top
const TOTAL_H    = 24;
const LEG_START  = TOTAL_Y + TOTAL_H + 4;
const LEG_ITEM_H = 12;

const PieChartSVG = ({ title, data, width }) => {
  const total    = data.reduce((s, d) => s + (d.compra || 0), 0);
  const cx       = width / 2;
  const multiCol = data.length > 8;

  // Build slices
  let angle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const pct   = total > 0 ? (item.compra || 0) / total : 0;
    const sweep = pct * 2 * Math.PI;
    const sa = angle;
    const ea = angle + sweep;
    angle    = ea;
    const x1 = cx + PIE_R * Math.cos(sa);
    const y1 = PIE_CY + PIE_R * Math.sin(sa);
    const x2 = cx + PIE_R * Math.cos(ea);
    const y2 = PIE_CY + PIE_R * Math.sin(ea);
    const large = sweep > Math.PI ? 1 : 0;
    const path  = pct > 0 ? `M ${cx} ${PIE_CY} L ${x1} ${y1} A ${PIE_R} ${PIE_R} 0 ${large} 1 ${x2} ${y2} Z` : null;
    return { ...item, path, color: SLICE_COLORS[i % SLICE_COLORS.length], pct };
  });

  const col1 = multiCol ? slices.slice(0, Math.ceil(slices.length / 2)) : slices;
  const col2 = multiCol ? slices.slice(Math.ceil(slices.length / 2))    : [];

  return (
    <Svg width={width} height={PIE_H}>
      {/* Title bar */}
      <Rect x={0} y={0} width={width} height={22} fill="#1e293b" />
      <Text x={cx} y={15} style={{ fontSize: 9, fill: '#FFFFFF', fontFamily: 'Roboto', fontWeight: 'bold', textAnchor: 'middle' }}>
        {title}
      </Text>

      {/* Slices */}
      {slices.filter(s => s.path).map((s, i) => (
        <G key={i}>
          <Path d={s.path} fill={s.color} stroke="#FFFFFF" strokeWidth={0.8} />
        </G>
      ))}

      {/* Total debajo del gráfico */}
      <Rect x={cx - 70} y={TOTAL_Y} width={140} height={TOTAL_H} fill="#f1f5f9" />
      <Text x={cx} y={TOTAL_Y + 9}  style={{ fontSize: 7, fill: '#64748b', fontFamily: 'Roboto', textAnchor: 'middle' }}>
        TOTAL COMPRA
      </Text>
      <Text x={cx} y={TOTAL_Y + 20} style={{ fontSize: 10, fill: '#1e293b', fontFamily: 'Roboto', fontWeight: 'bold', textAnchor: 'middle' }}>
        {USD(total)}
      </Text>

      {/* Legend — col 1 */}
      {col1.map((s, i) => {
        const lx = 6;
        const ly = LEG_START + i * LEG_ITEM_H;
        const label = s.label.length > 17 ? s.label.substring(0, 17) + '…' : s.label;
        return (
          <G key={i}>
            <Rect x={lx} y={ly} width={7} height={7} fill={s.color} />
            <Text x={lx + 10} y={ly + 6.5} style={{ fontSize: 6, fill: '#374151', fontFamily: 'Roboto' }}>
              {label}  {USD(s.compra)}
            </Text>
          </G>
        );
      })}

      {/* Legend — col 2 */}
      {col2.map((s, i) => {
        const lx = width / 2 + 4;
        const ly = LEG_START + i * LEG_ITEM_H;
        const label = s.label.length > 17 ? s.label.substring(0, 17) + '…' : s.label;
        return (
          <G key={i}>
            <Rect x={lx} y={ly} width={7} height={7} fill={s.color} />
            <Text x={lx + 10} y={ly + 6.5} style={{ fontSize: 6, fill: '#374151', fontFamily: 'Roboto' }}>
              {label}  {USD(s.compra)}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
};

// ── Main PDF Document ────────────────────────────────────────────────────────
const StockTotalDocument = ({ secciones, resumenGeneral, fechaGeneracion, chartsData }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>

      {/* Header — solo primera hoja */}
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
          <Text style={styles.reportTitle}>REPORTE DE STOCK TOTAL</Text>
          <Text style={styles.reportDate}>Generado: {fechaGeneracion}</Text>
        </View>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Productos</Text>
          <Text style={styles.summaryValue}>{resumenGeneral.totalProductos}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Stock Total</Text>
          <Text style={styles.summaryValue}>{resumenGeneral.totalStock} uds</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>PC Total</Text>
          <Text style={styles.summaryValue}>{USD(resumenGeneral.totalCompra)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>PV Total</Text>
          <Text style={styles.summaryValue}>{USD(resumenGeneral.totalVenta)}</Text>
        </View>
        <View style={styles.summaryCardGreen}>
          <Text style={styles.summaryLabel}>Margen Bruto</Text>
          <Text style={styles.summaryValueGreen}>{USD(resumenGeneral.totalVenta - resumenGeneral.totalCompra)}</Text>
        </View>
      </View>

      {/* Tarjetas por categoría */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
        {secciones.map((sec) => (
          <View key={sec.nombre} style={{ flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', padding: 7 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Roboto', fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, textAlign: 'center', textTransform: 'uppercase' }}>
              {sec.nombre}
            </Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={{ flex: 1, backgroundColor: '#334155', padding: 4, alignItems: 'center' }}>
                <Text style={{ fontSize: 5.5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Productos</Text>
                <Text style={{ fontSize: 8.5, fontFamily: 'Roboto', fontWeight: 'bold', color: '#FFFFFF' }}>
                  {sec.subsecciones
                    ? sec.subsecciones.reduce((s, sub) => s + sub.items.length, 0)
                    : sec.items.length}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#334155', padding: 4, alignItems: 'center' }}>
                <Text style={{ fontSize: 5.5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Stock</Text>
                <Text style={{ fontSize: 8.5, fontFamily: 'Roboto', fontWeight: 'bold', color: '#FFFFFF' }}>{sec.totalStock}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#0f3460', padding: 4, alignItems: 'center' }}>
                <Text style={{ fontSize: 5.5, color: '#93c5fd', textTransform: 'uppercase', marginBottom: 3 }}>PC</Text>
                <Text style={{ fontSize: 8.5, fontFamily: 'Roboto', fontWeight: 'bold', color: '#FFFFFF' }}>{USD(sec.totalCompra)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#064e3b', padding: 4, alignItems: 'center' }}>
                <Text style={{ fontSize: 5.5, color: '#6ee7b7', textTransform: 'uppercase', marginBottom: 3 }}>PV</Text>
                <Text style={{ fontSize: 8.5, fontFamily: 'Roboto', fontWeight: 'bold', color: '#FFFFFF' }}>{USD(sec.totalVenta)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Column headers */}
      <TableColHeader />

      {/* Sections */}
      {secciones.map((seccion) => (
        <View key={seccion.nombre}>
          {/* Main category header */}
          <View style={styles.catHeader}>
            <Text style={styles.catHeaderLeft}>{seccion.nombre}</Text>
            <Text style={styles.catHeaderRight}>
              {seccion.totalStock} uds          Compra: {USD(seccion.totalCompra)}          Venta: {USD(seccion.totalVenta)}          Margen: {USD(seccion.totalVenta - seccion.totalCompra)}
            </Text>
          </View>

          {seccion.subsecciones ? (
            seccion.subsecciones.map((sub) => (
              <View key={sub.nombre}>
                <View style={styles.subCatHeader}>
                  <Text style={styles.subCatLeft}>{sub.nombre}</Text>
                </View>
                {sub.items.map((item, idx) => (
                  <ItemRow key={idx} item={item} index={idx} />
                ))}
                <SubtotalRow
                  label={sub.nombre}
                  stock={sub.totalStock}
                  totalCompra={sub.totalCompra}
                  totalVenta={sub.totalVenta}
                />
              </View>
            ))
          ) : (
            seccion.items.map((item, idx) => (
              <ItemRow key={idx} item={item} index={idx} />
            ))
          )}

          <CatTotalRow
            label={seccion.nombre}
            stock={seccion.totalStock}
            totalCompra={seccion.totalCompra}
            totalVenta={seccion.totalVenta}
          />
        </View>
      ))}

      {/* Grand total */}
      <View style={styles.grandTotalRow}>
        <Text style={[styles.grandTotalCell, C.producto]}>TOTAL GENERAL</Text>
        <Text style={[styles.grandTotalCell, C.stock]}>{resumenGeneral.totalStock}</Text>
        <Text style={[styles.grandTotalCell, C.compra]}></Text>
        <Text style={[styles.grandTotalCell, C.venta]}></Text>
        <Text style={[styles.grandTotalCell, C.totalCompra]}>{USD(resumenGeneral.totalCompra)}</Text>
        <Text style={[styles.grandTotalCell, C.totalVenta]}>{USD(resumenGeneral.totalVenta)}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>UPDATE TECH WW SRL — Reporte de Stock Total — Uso interno / Gerencia</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </View>

    </Page>

    {/* ── Página de gráficos ── */}
    <Page size="A4" orientation="landscape" style={styles.page}>

      {/* Título */}
      <View style={{ backgroundColor: '#1e293b', paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Roboto', fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
          ANÁLISIS DE STOCK POR CATEGORÍA
        </Text>
      </View>

      {/* 3 gráficos de torta en fila */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <PieChartSVG title="NOTEBOOKS" data={chartsData.notebooks} width={260} />
        <PieChartSVG title="CELULARES" data={chartsData.celulares} width={260} />
        <PieChartSVG title="OTROS"     data={chartsData.otros}     width={260} />
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>UPDATE TECH WW SRL — Reporte de Stock Total — Uso interno / Gerencia</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </View>

    </Page>
  </Document>
);

// Data builder + PDF generator
export const generarStockTotalPDF = async (computers, celulares, otros) => {
  const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── NOTEBOOKS — todos los productos, agrupados por subcategoría (gaming, macbook, windows, etc.)
  const notebooksPorSub = {};
  computers.forEach(nb => {
    const sub = (nb.categoria || 'GENERAL').toUpperCase();
    if (!notebooksPorSub[sub]) notebooksPorSub[sub] = [];
    notebooksPorSub[sub].push(nb);
  });

  const notebooksSubsecciones = Object.entries(notebooksPorSub)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sub, items]) => {
      const mappedItems = items.map(nb => {
        const compra = nb.precio_costo_usd || 0;
        const venta  = nb.precio_venta_usd || 0;
        // Mismo copy que en el listado: modelo - procesador, ram, ssd, pantalla, placa_video, color
        const partes = [nb.procesador, nb.ram, nb.ssd, nb.pantalla, nb.placa_video, nb.color].filter(Boolean).join(', ');
        const nombre = partes ? `${nb.modelo} - ${partes}` : (nb.modelo || '');
        return { nombre, stock: 1, compra, venta, totalCompra: compra, totalVenta: venta };
      });
      const totalStock  = items.length;
      const totalCompra = mappedItems.reduce((s, i) => s + i.totalCompra, 0);
      const totalVenta  = mappedItems.reduce((s, i) => s + i.totalVenta, 0);
      return { nombre: sub, items: mappedItems, totalStock, totalCompra, totalVenta };
    });

  const nbTotalStock  = computers.length;
  const nbTotalCompra = notebooksSubsecciones.reduce((s, sub) => s + sub.totalCompra, 0);
  const nbTotalVenta  = notebooksSubsecciones.reduce((s, sub) => s + sub.totalVenta, 0);

  // ── CELULARES — todos los productos, sin subcategoría
  const celItems = celulares.map(cel => {
    const compra = cel.precio_compra_usd || 0;
    const venta  = cel.precio_venta_usd  || 0;
    // Copy del listado: modelo capacidad color [estado] [batería]
    let infoAdicional = '';
    if (cel.condicion === 'usado' || cel.condicion === 'refurbished') {
      const partes = [cel.estado, cel.bateria].filter(Boolean);
      if (partes.length) infoAdicional = ' ' + partes.join(' ');
    }
    const nombre = `${cel.modelo || ''} ${cel.capacidad || ''} ${cel.color || ''}${infoAdicional}`.trim();
    return { nombre, stock: 1, compra, venta, totalCompra: compra, totalVenta: venta };
  });

  const celTotalStock  = celulares.length;
  const celTotalCompra = celItems.reduce((s, i) => s + i.totalCompra, 0);
  const celTotalVenta  = celItems.reduce((s, i) => s + i.totalVenta, 0);

  // ── OTROS — todos los productos, agrupados por categoría (cada una = subcategoría)
  const otrosPorCat = {};
  otros.forEach(o => {
    const cat = (o.categoria || 'OTROS').toUpperCase();
    if (!otrosPorCat[cat]) otrosPorCat[cat] = [];
    otrosPorCat[cat].push(o);
  });

  const otrosSubsecciones = Object.entries(otrosPorCat)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, items]) => {
      const mappedItems = items.map(o => {
        const stock  = (o.cantidad_la_plata || 0) + (o.cantidad_mitre || 0);
        const compra = o.precio_compra_usd || 0;
        const venta  = o.precio_venta_usd  || 0;
        // Copy del listado: solo nombre_producto (sin marca adelante)
        const nombre = (o.nombre_producto || '').trim();
        return { nombre, stock, compra, venta, totalCompra: compra * stock, totalVenta: venta * stock };
      });
      const totalStock  = mappedItems.reduce((s, i) => s + i.stock, 0);
      const totalCompra = mappedItems.reduce((s, i) => s + i.totalCompra, 0);
      const totalVenta  = mappedItems.reduce((s, i) => s + i.totalVenta, 0);
      return { nombre: cat, items: mappedItems, totalStock, totalCompra, totalVenta };
    });

  const otrosTotalStock  = otrosSubsecciones.reduce((s, sub) => s + sub.totalStock, 0);
  const otrosTotalCompra = otrosSubsecciones.reduce((s, sub) => s + sub.totalCompra, 0);
  const otrosTotalVenta  = otrosSubsecciones.reduce((s, sub) => s + sub.totalVenta, 0);

  // ── Secciones finales
  const secciones = [
    {
      nombre: 'NOTEBOOKS',
      subsecciones: notebooksSubsecciones,
      totalStock: nbTotalStock,
      totalCompra: nbTotalCompra,
      totalVenta: nbTotalVenta,
    },
    {
      nombre: 'CELULARES',
      items: celItems,
      totalStock: celTotalStock,
      totalCompra: celTotalCompra,
      totalVenta: celTotalVenta,
    },
    {
      nombre: 'OTROS',
      subsecciones: otrosSubsecciones,
      totalStock: otrosTotalStock,
      totalCompra: otrosTotalCompra,
      totalVenta: otrosTotalVenta,
    },
  ];

  const resumenGeneral = {
    totalProductos: computers.length + celulares.length + otros.length,
    totalStock:  nbTotalStock  + celTotalStock  + otrosTotalStock,
    totalCompra: nbTotalCompra + celTotalCompra + otrosTotalCompra,
    totalVenta:  nbTotalVenta  + celTotalVenta  + otrosTotalVenta,
  };

  // ── Chart data ──────────────────────────────────────────────────────────────

  // NOTEBOOKS: una barra por subcategoría
  const chartsNotebooks = notebooksSubsecciones.map(sub => ({
    label:  sub.nombre,
    compra: sub.totalCompra,
    venta:  sub.totalVenta,
    stock:  sub.totalStock,
  }));

  // CELULARES: agrupar por categoría
  const celPorCat = {};
  celulares.forEach(cel => {
    const cat = (cel.categoria || 'SIN CATEGORÍA').toUpperCase();
    if (!celPorCat[cat]) celPorCat[cat] = { compra: 0, venta: 0, stock: 0 };
    celPorCat[cat].compra += cel.precio_compra_usd || 0;
    celPorCat[cat].venta  += cel.precio_venta_usd  || 0;
    celPorCat[cat].stock  += 1;
  });
  const chartsCelulares = Object.entries(celPorCat)
    .map(([label, vals]) => ({ label, ...vals }))
    .sort((a, b) => b.compra - a.compra);

  // OTROS: una barra por subcategoría
  const chartsOtros = otrosSubsecciones.map(sub => ({
    label:  sub.nombre,
    compra: sub.totalCompra,
    venta:  sub.totalVenta,
    stock:  sub.totalStock,
  }));

  const chartsData = {
    notebooks: chartsNotebooks,
    celulares: chartsCelulares,
    otros:     chartsOtros,
  };

  try {
    const blob = await pdf(
      <StockTotalDocument
        secciones={secciones}
        resumenGeneral={resumenGeneral}
        fechaGeneracion={fechaGeneracion}
        chartsData={chartsData}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 15000);

    return { success: true };
  } catch (error) {
    console.error('Error generando PDF de stock:', error);
    return { success: false, error: error.message };
  }
};

export default StockTotalDocument;
