import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext';

// Layout
import Layout from './shared/components/layout/Layout';

// Ruta protegida por sección
const ProtectedRoute = ({ section, children }) => {
    const { hasAccess } = useAuthContext();
    if (!hasAccess(section)) {
        return <Navigate to="/catalogo" replace />;
    }
    return children;
};

// Ventas
import { Clientes, Listas, Catalogo, RegistrarVentaSection } from './modules/ventas/components';
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
                <Route path="clientes" element={<Clientes />} />
                <Route path="registrar-venta" element={<RegistrarVentaSection />} />
                <Route path="ventas" element={<VentasPage />} />

                {/* Soporte */}
                <Route path="reparaciones" element={<ProtectedRoute section="soporte"><ReparacionesMain /></ProtectedRoute>} />
                <Route path="testeo-equipos" element={<ProtectedRoute section="soporte"><TesteoEquiposSection /></ProtectedRoute>} />
                <Route path="auditoria" element={<ProtectedRoute section="soporte"><AuditPanel /></ProtectedRoute>} />

                {/* Administración */}
                <Route path="ingreso-equipos" element={<ProtectedRoute section="administracion"><IngresoEquiposSection /></ProtectedRoute>} />
                <Route path="recuento-stock" element={<ProtectedRoute section="administracion"><RecuentoStockSection /></ProtectedRoute>} />
                <Route path="garantias" element={<ProtectedRoute section="administracion"><GarantiasSection /></ProtectedRoute>} />
                <Route path="recibos" element={<ProtectedRoute section="administracion"><RecibosSection /></ProtectedRoute>} />
                <Route path="comisiones" element={<ProtectedRoute section="administracion"><ComisionesPage /></ProtectedRoute>} />
                <Route path="tablero" element={<ProtectedRoute section="administracion"><TableroGeneralSection /></ProtectedRoute>} />
                <Route path="reportes" element={<ProtectedRoute section="administracion"><DashboardReportesSection /></ProtectedRoute>} />

                {/* Compras */}
                <Route path="compras" element={<ProtectedRoute section="compras"><ComprasSection /></ProtectedRoute>} />
                <Route path="proveedores" element={<ProtectedRoute section="compras"><ProveedoresSection /></ProtectedRoute>} />
                <Route path="importaciones" element={<ProtectedRoute section="compras"><ImportacionesSection /></ProtectedRoute>} />

                {/* Contabilidad */}
                <Route path="cuentas-corrientes" element={<ProtectedRoute section="contabilidad"><CuentasCorrientesSection /></ProtectedRoute>} />
                <Route path="contabilidad">
                    <Route path="ratios" element={<ProtectedRoute section="contabilidad"><RatiosSection /></ProtectedRoute>} />
                    <Route path="plan-cuentas" element={<ProtectedRoute section="contabilidad"><PlanCuentasSection /></ProtectedRoute>} />
                    <Route path="libro-diario" element={<ProtectedRoute section="contabilidad"><LibroDiarioSection /></ProtectedRoute>} />
                    <Route path="libro-mayor" element={<ProtectedRoute section="contabilidad"><LibroMayorSection /></ProtectedRoute>} />
                    <Route path="conciliacion" element={<ProtectedRoute section="contabilidad"><ConciliacionCajaSection /></ProtectedRoute>} />
                    <Route path="cuentas-auxiliares" element={<ProtectedRoute section="contabilidad"><CuentasAuxiliaresSection /></ProtectedRoute>} />
                    <Route path="balance" element={<ProtectedRoute section="contabilidad"><BalanceSumasYSaldosSection /></ProtectedRoute>} />
                    <Route path="situacion-patrimonial" element={<ProtectedRoute section="contabilidad"><EstadoSituacionPatrimonialSection /></ProtectedRoute>} />
                    <Route path="resultados" element={<ProtectedRoute section="contabilidad"><EstadoResultadosSection /></ProtectedRoute>} />
                </Route>



                {/* 404 - redirect to catalogo */}
                <Route path="*" element={<Navigate to="/catalogo" replace />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
