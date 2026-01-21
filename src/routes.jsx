import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import Layout from './shared/components/layout/Layout';

// Ventas
import { Clientes, Listas, ListasRevendedores, Catalogo, RegistrarVentaSection } from './modules/ventas/components';
import ListadoTotalSection from './modules/ventas/components/ListadoTotalSection';

// Soporte
import { ReparacionesMain, TesteoEquiposSection, AuditPanel } from './modules/soporte/components';

// Administración
import {
    VentasSection,
    ComisionesSection,
    DashboardReportesSection,
    RecuentoStockSection,
    GarantiasSection,
    IngresoEquiposSection,
    TableroGeneralSection,
    RecibosSection
} from './modules/administracion/components';

// Contabilidad
import {
    RatiosSection,
    PlanCuentasSection,
    LibroDiarioSection,
    LibroMayorSection,
    ConciliacionCajaSection,
    EstadoSituacionPatrimonialSection,
    EstadoResultadosSection,
    CuentasCorrientesSection,
    BalanceSumasYSaldosSection,
    CuentasAuxiliaresSection
} from './modules/contabilidad/components';

// Compras
import ComprasSection from './modules/compras/components/ComprasSection';
import ProveedoresSection from './modules/compras/components/ProveedoresSection';

// Importaciones
import { ImportacionesSection } from './modules/importaciones/components';



// Wrappers para pasar props desde context
import { useAppContext } from './context/AppContext';

// Wrapper components que usan context
const CatalogoPage = () => {
    const { handleAddToCart } = useAppContext();
    return <Catalogo onAddToCart={handleAddToCart} />;
};

const ListasPage = () => {
    const { computers, celulares, otros, computersLoading, celularesLoading, otrosLoading, computersError, celularesError, otrosError } = useAppContext();
    return (
        <Listas
            computers={computers}
            celulares={celulares}
            otros={otros}
            loading={computersLoading || celularesLoading || otrosLoading}
            error={computersError || celularesError || otrosError}
        />
    );
};

const ListasRevendedoresPage = () => {
    const { computers, celulares, otros, computersLoading, celularesLoading, otrosLoading, computersError, celularesError, otrosError } = useAppContext();
    return (
        <ListasRevendedores
            computers={computers}
            celulares={celulares}
            otros={otros}
            loading={computersLoading || celularesLoading || otrosLoading}
            error={computersError || celularesError || otrosError}
        />
    );
};

const VentasPage = () => {
    const { ventas, ventasLoading, ventasError, obtenerEstadisticas } = useAppContext();
    return (
        <VentasSection
            ventas={ventas}
            loading={ventasLoading}
            error={ventasError}
            onLoadStats={obtenerEstadisticas}
        />
    );
};

const ComisionesPage = () => {
    const { ventas, ventasLoading, ventasError, obtenerEstadisticas } = useAppContext();
    return (
        <ComisionesSection
            ventas={ventas}
            loading={ventasLoading}
            error={ventasError}
            onLoadStats={obtenerEstadisticas}
        />
    );
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                {/* Default redirect */}
                <Route index element={<Navigate to="/catalogo" replace />} />

                {/* Ventas */}
                <Route path="catalogo" element={<CatalogoPage />} />
                <Route path="stock" element={<ListadoTotalSection />} />
                <Route path="listas" element={<ListasPage />} />
                <Route path="listas-revendedores" element={<ListasRevendedoresPage />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="registrar-venta" element={<RegistrarVentaSection />} />
                <Route path="ventas" element={<VentasPage />} />

                {/* Soporte */}
                <Route path="reparaciones" element={<ReparacionesMain />} />
                <Route path="testeo-equipos" element={<TesteoEquiposSection />} />
                <Route path="auditoria" element={<AuditPanel />} />

                {/* Administración */}
                <Route path="ingreso-equipos" element={<IngresoEquiposSection />} />
                <Route path="recuento-stock" element={<RecuentoStockSection />} />
                <Route path="garantias" element={<GarantiasSection />} />
                <Route path="recibos" element={<RecibosSection />} />
                <Route path="comisiones" element={<ComisionesPage />} />
                <Route path="tablero" element={<TableroGeneralSection />} />
                <Route path="reportes" element={<DashboardReportesSection />} />

                {/* Compras */}
                <Route path="compras" element={<ComprasSection />} />
                <Route path="proveedores" element={<ProveedoresSection />} />
                <Route path="importaciones" element={<ImportacionesSection />} />

                {/* Contabilidad */}
                <Route path="cuentas-corrientes" element={<CuentasCorrientesSection />} />
                <Route path="contabilidad">
                    <Route path="ratios" element={<RatiosSection />} />
                    <Route path="plan-cuentas" element={<PlanCuentasSection />} />
                    <Route path="libro-diario" element={<LibroDiarioSection />} />
                    <Route path="libro-mayor" element={<LibroMayorSection />} />
                    <Route path="conciliacion" element={<ConciliacionCajaSection />} />
                    <Route path="cuentas-auxiliares" element={<CuentasAuxiliaresSection />} />
                    <Route path="balance" element={<BalanceSumasYSaldosSection />} />
                    <Route path="situacion-patrimonial" element={<EstadoSituacionPatrimonialSection />} />
                    <Route path="resultados" element={<EstadoResultadosSection />} />
                </Route>



                {/* 404 - redirect to catalogo */}
                <Route path="*" element={<Navigate to="/catalogo" replace />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
