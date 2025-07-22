# Sistema Update - Business Management Application

## Project Overview

**Sistema Update** is a comprehensive business management web application built with React 19 and Supabase. It serves as an integrated enterprise solution for a technology retail and repair business, managing sales, inventory, accounting, technical support, and import/export operations.

### Business Domain
- Technology retail operations (computers, smartphones, accessories)
- Repair and technical support services
- Import/export operations
- Financial accounting and reporting
- Multi-location inventory management

### Key Features
- Multi-module architecture with role-based access control
- Real-time inventory tracking with dual currency support (USD/ARS)
- Professional document generation (PDF receipts, quotations, reports)
- Comprehensive accounting system with chart of accounts
- Technical support workflow management
- Import/export tracking and supplier management

## Technical Architecture

### Core Technology Stack
- **Frontend**: React 19.1.0 with Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.7 with custom configuration
- **Backend**: Supabase 2.49.8 (PostgreSQL-based BaaS)
- **PDF Generation**: @react-pdf/renderer, jsPDF
- **Email Services**: @emailjs/browser
- **AI Integration**: @anthropic-ai/sdk, claude
- **Charts**: recharts for data visualization

### Architecture Patterns
- **Modular Design**: Domain-driven module separation
- **Custom Hooks**: Specialized hooks per business domain
- **Provider Pattern**: Global state management via React Context
- **Component Composition**: Shared layout and utility components

### Project Structure
```
src/
├── components/          # Shared UI components
├── lib/                # Utilities and configurations
├── modules/            # Business domain modules
│   ├── administracion/  # Admin functions
│   ├── contabilidad/   # Accounting system
│   ├── importaciones/  # Import/export operations
│   ├── inventario/     # Inventory management
│   ├── soporte/        # Technical support
│   └── ventas/         # Sales management
├── pages/              # Route components
└── App.jsx             # Main application component
```

## Business Modules

### 1. Ventas (Sales Module)
**Location**: `src/modules/ventas/`

**Key Components**:
- `InventarioSection.jsx` - Computer inventory management
- `CelularesSection.jsx` - Smartphone inventory
- `ProcesarVentaSection.jsx` - Sales processing
- `ClientesSection.jsx` - Customer management
- `CarritoWidget.jsx` - Shopping cart functionality

**Key Features**:
- Multi-product inventory browsing
- Real-time shopping cart with stock validation
- Customer selection and creation
- Dual currency pricing (USD/ARS)
- PDF receipt generation
- Current accounts integration

**Custom Hooks**:
- `useInventario.js` - Inventory data management
- `useVentas.js` - Sales operations
- `useCelulares.js` - Smartphone-specific logic

### 2. Contabilidad (Accounting Module)
**Location**: `src/modules/contabilidad/`

**Key Components**:
- `PlanCuentasSection.jsx` - Chart of Accounts management
- `LibroDiarioSection.jsx` - General Journal entries
- `EstadoSituacionPatrimonialSection.jsx` - Balance Sheet reporting
- `EstadoResultadosSection.jsx` - Income Statement reporting
- `GastosOperativosSection.jsx` - Operating Expenses tracking
- `CuentasCorrientesSection.jsx` - Current Accounts management

**Key Features**:
- Plan de Cuentas (Chart of Accounts)
- Libro Diario (General Journal)
- Estado de Situación Patrimonial (Balance Sheet)
- Estado de Resultados (Income Statement)  
- Gastos Operativos (Operating Expenses)
- Cuentas Corrientes (Current Accounts)
- Conciliación de Caja (Cash Reconciliation)

**Custom Hooks**:
- `useEstadoSituacionPatrimonial.js` - Balance Sheet data processing
- `useEstadoResultados.js` - Income Statement calculations
- `usePlanCuentas.js` - Chart of Accounts operations
- `useLibroDiario.js` - Journal entry management

### 3. Soporte (Support Module)
**Location**: `src/modules/soporte/`

**Key Features**:
- Equipment repair management
- Parts inventory control
- Equipment testing workflows
- Warranty tracking
- Repair quotations and documentation

### 4. Importaciones (Import Module)
**Location**: `src/modules/importaciones/`

**Key Features**:
- Supplier quotation management
- Purchase order tracking
- In-transit inventory
- Import history and reporting

### 5. Administración (Administration Module)
**Location**: `src/modules/administracion/`

**Key Features**:
- Sales analytics dashboard
- Commission calculations
- Stock counting and reports
- System configuration

## Authentication & Security

### Role-Based Access Control
- **Admin**: Full system access
- **Ventas**: Sales, inventory, clients, shopping cart
- **Soporte**: Equipment loading, repairs, parts, testing
- **Contabilidad**: Accounting, expenses, current accounts

### Security Implementation
- Supabase authentication with custom verification
- Section-level access control in `src/lib/auth.js`
- Protected routes with permission validation
- Local storage for session persistence

### User Management
Authentication context in `src/lib/AuthContext.jsx` provides:
- User login/logout functionality
- Role-based component rendering
- Session management
- Permission checking utilities

## Database Integration

### Supabase Configuration
```javascript
// src/lib/supabase.js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Data Management Patterns
- Real-time subscriptions for inventory updates
- Custom hooks for CRUD operations per module
- Error handling with user-friendly messages
- Loading states throughout the application

### Key Database Tables
- `inventario_computadoras` - Computer inventory
- `inventario_celulares` - Smartphone inventory
- `ventas` - Sales transactions
- `clientes` - Customer information
- `plan_cuentas` - Chart of accounts
- `asientos_contables` - Accounting journal entries
- `movimientos_contables` - Detailed accounting movements (debe/haber por cuenta)
- `reparaciones` - Repair records
- `importaciones` - Import tracking
- `gastos_operativos` - Operating expenses
- `cuentas_corrientes` - Current accounts

## Key Business Workflows

### Sales Process
1. **Product Selection** - Browse inventory by category
2. **Cart Management** - Add items with quantity validation
3. **Customer Selection** - Choose or create customer
4. **Payment Processing** - Multiple payment methods and currencies
5. **Documentation** - Generate PDF receipts
6. **Inventory Update** - Real-time stock adjustment

### Dual Currency System
- Real-time USD/ARS exchange rate integration
- Price display in both currencies
- Automatic conversion for financial calculations
- Currency preference per transaction

### PDF Document Generation
- Sales receipts with company branding
- Repair quotations and service orders
- Financial reports and statements
- Inventory reports and stock counts

## Development Guidelines

### Code Conventions
- Use functional components with hooks
- Follow modular architecture patterns
- Implement proper error handling
- Use TypeScript-style prop validation
- Maintain consistent naming conventions

### UI/UX Design Standards - SISTEMA RESTRICTIVO OBLIGATORIO
TODAS las interfaces deben seguir ESTRICTAMENTE este sistema de diseño. No se permiten excepciones.

#### Paleta de Colores RESTRICTIVA (SOLO ESTOS 4 COLORES BASE):
- **Emerald (#10b981)** - Color primario para elementos activos, botones principales y estados positivos
- **Slate-800 (#1e293b)** - Color oscuro para sidebar, header y texto principal
- **Slate-200 (#e2e8f0)** - Color claro para bordes, divisores y elementos sutiles
- **Blanco (#ffffff)** - Fondo de tarjetas y contenedores principales

**RESTRICCIÓN CRÍTICA**: No se pueden usar otros colores fuera de estos 4. Todas las variaciones deben ser tonos de estos colores base (slate-50, slate-100, slate-300, slate-400, slate-500, slate-600, slate-700 para grises; emerald-100, emerald-500, emerald-600, emerald-700 para verdes).

#### Tipografía OBLIGATORIA:
- **Fuente**: Sistema font stack únicamente
- **Jerarquía**: `font-semibold` para títulos, `font-medium` para texto normal, `font-normal` para secundario
- **Tamaños**: `text-lg` (títulos), `text-base` (normal), `text-sm` (secundario), `text-xs` (etiquetas)

#### Bordes y Espaciado ESTRICTOS:
- **Border radius**: ÚNICAMENTE `rounded` (4px) - PROHIBIDO usar `rounded-lg`, `rounded-xl` o mayores
- **Espaciado**: Sistema de 8px (`p-4`, `p-6`, `gap-4`, `gap-6`, `m-4`, `m-6`)
- **Bordes**: Siempre `border-slate-200`, grosor estándar (`border`)

#### Estructura Visual OBLIGATORIA:
- **Fondo general**: Blanco o `bg-slate-50` (tonos muy claros de slate)
- **Contenedores**: Fondo blanco con `border border-slate-200`
- **Elementos oscuros**: `bg-slate-800` para crear contraste
- **Elementos activos/seleccionados**: Emerald en sus variaciones

#### Componentes Base ESTANDARIZADOS:
- **Tarjetas**: `bg-white border border-slate-200 rounded`
- **Botones primarios**: `bg-emerald-600 hover:bg-emerald-700 text-white`
- **Botones secundarios**: `bg-slate-600 hover:bg-slate-700 text-white`
- **Texto**: `text-slate-800` (principal), `text-slate-500` (secundario), `text-slate-400` (terciario)

#### Estados Interactivos ESTANDARIZADOS:
- **Hover**: Transiciones suaves con `transition-colors`
- **Seleccionado**: `bg-emerald-600` o `text-emerald-600`
- **Deshabilitado**: Tonos slate más claros

#### Iconografía ESTRICTA:
- **Librería**: Lucide React únicamente
- **Tamaños**: `w-4 h-4` (pequeños), `w-5 h-5` (medianos), `w-6 h-6` (grandes)
- **Colores**: slate para neutral, emerald para positivo, slate-800 para prominente

#### Header Standards OBLIGATORIOS:
TODOS los headers de sección deben seguir EXACTAMENTE este patrón:
```jsx
<div className="bg-white rounded border border-slate-200 mb-4">
  <div className="p-6 bg-slate-800 text-white">
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <IconComponent className="w-6 h-6" />
        <div>
          <h2 className="text-2xl font-semibold">Título Sección</h2>
          <p className="text-slate-300 mt-1">Descripción opcional</p>
        </div>
      </div>
      {/* Botones opcionales */}
    </div>
  </div>
</div>
```

#### Stats Cards OBLIGATORIAS:
Usar SIEMPRE el objeto Tarjeta para diseñar tarjetas de datos.
NUNCA poner padding o margen entre el elemento activo y el resto de la aplicacion (sidebar/header).

**ESTE SISTEMA ES OBLIGATORIO EN TODOS LOS COMPONENTES Y PÁGINAS SIN EXCEPCIÓN**

### Component Structure
```javascript
// Standard component pattern
import React from 'react'
import { useModuleHook } from '../hooks/useModuleHook'

const ComponentName = ({ prop1, prop2 }) => {
  const { data, loading, error, actions } = useModuleHook()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  )
}

export default ComponentName
```

### Custom Hook Pattern
```javascript
// Standard hook pattern
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export const useModuleName = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
      
      if (error) throw error
      setData(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}
```

### Data Consistency Standards
- **Currency Formatting**: Always display amounts with proper thousand separators and decimal places
- **Date Formatting**: Use consistent date formats throughout (DD/MM/YYYY for displays, YYYY-MM-DD for database)
- **Account Codes**: Follow hierarchical numbering system (1.xx.xxx for Assets, 2.xx.xxx for Liabilities, etc.)
- **Transaction Validation**: Ensure all accounting entries maintain double-entry bookkeeping principles
- **Error Handling**: Provide clear, user-friendly error messages for business rule violations

### Testing Approach
- Use React Testing Library for component tests
- Test custom hooks with @testing-library/react-hooks
- Mock Supabase client for integration tests
- Validate accounting calculations and business rules
- Test currency conversion accuracy
- Run tests with: `npm test`

## Development Environment

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project

### Environment Variables
Create `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Server Configuration
- Development server runs on port 5173
- Configured for external access (0.0.0.0)
- Supports ngrok tunneling for remote testing

## Deployment

### Build Process
1. Run `npm run build` to create production build
2. Files are generated in `dist/` directory
3. Serve static files with any web server

### Environment Configuration
- Ensure all environment variables are set
- Configure Supabase project settings
- Set up proper CORS policies

## Recent Development Activity

### Current Work (Based on Git Status)
- General system improvements and bug fixes
- Enhanced inventory filtering capabilities
- Dual currency system implementation
- Chart of accounts enhancements
- Sales processing refinements in:
  - `src/modules/ventas/components/CelularesSection.jsx`
  - `src/modules/ventas/components/InventarioSection.jsx`
  - `src/modules/ventas/components/OtrosSection.jsx`
  - `src/modules/ventas/components/ProcesarVentaSection.jsx`
  - `src/modules/ventas/hooks/useInventario.js`

### Common Development Tasks
- Adding new inventory categories
- Implementing new report types
- Enhancing user permissions
- Optimizing database queries
- Improving UI/UX across modules

## Troubleshooting

### Common Issues
1. **Supabase Connection**: Check environment variables and network connectivity
2. **Permission Denied**: Verify user roles and RLS policies
3. **PDF Generation**: Ensure all required data is available before generation
4. **Currency Conversion**: Check exchange rate API availability

### Debug Commands
```bash
# Check Supabase connection
npm run dev -- --debug

# Test database queries
# Use Supabase dashboard SQL editor

# Check build issues
npm run build --verbose
```

## Future Enhancements

### Planned Features
- Mobile app version
- Advanced reporting dashboard
- Integration with external accounting systems
- Multi-location inventory management
- Automated backup and recovery

### Technical Improvements
- Implement TypeScript for better type safety
- Add comprehensive test coverage
- Optimize performance with React.memo
- Implement offline functionality
- Add real-time notifications

## Problemas Conocidos y Soluciones en Desarrollo

### Problema: Sidebar desaparece al hacer clic en botones de filtro de fechas (VentasSection)

**Descripción del problema:**
- Al hacer clic en los botones "Último mes" y "Todos los períodos" en el historial de ventas (VentasSection), la sidebar desaparece completamente
- El problema persiste incluso después de optimizaciones de rendimiento
- La sidebar no vuelve a aparecer hasta refrescar la página

**Investigación realizada:**
1. **Optimización de rendimiento**: Se implementó `useMemo` para el filtrado de ventas y se redujo el límite de resultados de 1000 a 300
2. **Prevención de propagación de eventos**: Se agregó `event.preventDefault()` y `event.stopPropagation()` en los botones problemáticos
3. **Debugging exhaustivo**: Se agregaron logs detallados en Layout.jsx para rastrear cambios de estado

**Soluciones implementadas temporales:**
1. **Verificación automática**: Layout.jsx ahora verifica cada 500ms si la sidebar está abierta en desktop y la reabre si es necesario
2. **Botón de emergencia mejorado**: El botón de restaurar sidebar en Header.jsx ahora es más visible (color emerald, texto "SIDEBAR")
3. **Función de forzado**: Se implementó `forceSidebarOpen()` para restauración manual
4. **Logging de DOM**: Se agregó verificación DOM para detectar si la sidebar desaparece completamente

**Archivos modificados:**
- `src/modules/administracion/components/VentasSection.jsx`: Prevención de eventos, debugging
- `src/shared/components/layout/Layout.jsx`: Verificación automática, logging
- `src/shared/components/layout/Header.jsx`: Botón de emergencia mejorado

**Causa raíz identificada:**
Al comparar los botones que funcionan vs los problemáticos, se encontró que:
- **Botones que funcionan** ("Hoy", "Última semana", "Este mes"): Funciones onClick simples y síncronas
- **Botones problemáticos** ("Último mes", "Todos los períodos"): Contenían lógica compleja, async/await, preventDefault, stopPropagation, console.logs, setTimeout y estados adicionales

**Solución implementada:**
1. **Simplificación de botones problemáticos**: Se removió toda la lógica compleja y se dejaron como funciones simples idénticas a los botones que funcionan
2. **Eliminación de código innecesario**: Se removió el estado `procesandoFiltros`, useMemo complicado, y debugging excesivo
3. **Estructura unificada**: Todos los botones ahora tienen la estructura: `onClick={() => { /* lógica simple de setFechaInicio/setFechaFin */ }}`

**Estado actual:**
- ✅ **SOLUCIONADO** - Los botones "Último mes" y "Todos los períodos" ahora usan la misma estructura simple que los botones que funcionan
- Se mantuvieron las protecciones en Layout.jsx como respaldo (verificación cada 1 segundo, botón de emergencia)
- El problema se debía a la complejidad adicional en los event handlers, no al volumen de datos o rendimiento

**Archivos corregidos:**
- `src/modules/administracion/components/VentasSection.jsx`: Simplificación de botones problemáticos
- `src/shared/components/layout/Layout.jsx`: Protecciones de respaldo mantenidas
- `src/shared/components/layout/Header.jsx`: Botón de emergencia mejorado mantenido

---

*This documentation is maintained to help developers understand and work with the Sistema Update application. Update this file as the project evolves.*