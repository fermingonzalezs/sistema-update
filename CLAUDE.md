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
├── components/          # Shared UI components (only global/cross-module)
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

## **File Organization by Module - MANDATORY RULES**

### **Module-Specific Organization**
**CRITICAL RULE**: All files related to a specific business domain MUST be located within their corresponding module directory. No exceptions.

**Module Structure Pattern**:
```
src/modules/[module_name]/
├── components/         # React components specific to this module
├── hooks/             # Custom hooks for this module
├── utils/             # Utility functions for this module
├── services/          # API services (if needed)
└── lib/               # Module-specific libraries (if needed)
```

### **Mandatory Organization Rules**
1. **Contabilidad (Accounting)**: ALL accounting-related files → `src/modules/contabilidad/`
   - Components: Chart of accounts, journal entries, balance sheets, etc.
   - Hooks: `useLibroDiario.js`, `usePlanCuentas.js`, etc.
   - Utils: Accounting calculations, validations, formatters
   - PDF Reports: Balance sheets, income statements, etc.

2. **Ventas (Sales)**: ALL sales-related files → `src/modules/ventas/`
   - Components: Inventory, customers, shopping cart, sales processing
   - Hooks: `useVentas.js`, `useInventario.js`, `useClientes.js`
   - Utils: Price calculations, currency conversions, validations
   - PDF Reports: Sales receipts, quotations

3. **Soporte (Support)**: ALL support-related files → `src/modules/soporte/`
   - Components: Repairs, equipment testing, parts management
   - Hooks: `useReparaciones.js`, `useTesteo.js`
   - Utils: Repair calculations, status management
   - PDF Reports: Repair quotations, service orders

4. **Importaciones (Imports)**: ALL import-related files → `src/modules/importaciones/`
   - Components: Import tracking, supplier management, quotations
   - Hooks: `useImportaciones.js`, `useProveedores.js`
   - Utils: Cost calculations, shipping estimates
   - Services: External API integrations

5. **Administración (Administration)**: ALL admin-related files → `src/modules/administracion/`
   - Components: Analytics, reports, user management, system config
   - Hooks: `useAnalytics.js`, `useUsuarios.js`
   - Utils: Statistical calculations, data aggregation

### **Global Components Exception**
Only the following types of components should remain in `src/components/`:
- **Layout components**: Headers, sidebars, navigation (used across all modules)
- **UI primitives**: Buttons, modals, form elements (truly generic)
- **Auth components**: Login, authentication flows
- **Shared utilities**: Currency display, date formatting (used by multiple modules)

### **Import Path Standards**
```javascript
// ✅ CORRECT: Module-specific imports
import { useLibroDiario } from '../hooks/useLibroDiario'
import BalanceSheet from './BalanceSheet'

// ✅ CORRECT: Global component imports
import Layout from '../../../components/layout/Layout'
import { formatCurrency } from '../../../lib/utils'

// ❌ WRONG: Module components in global components
import AccountingReport from '../../../components/accounting/AccountingReport'
```

**ENFORCEMENT**: Any file found outside its proper module location will be moved during code reviews. This organization is non-negotiable and essential for maintainability.

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

## Data Normalization Standards

### Product Field Normalization
All product data across categories (notebooks, smartphones, accessories) follows standardized field values and validation rules defined in `/src/shared/constants/productConstants.js`.

#### CONDICION (Functional State) - 8 Standard Values
- **nuevo**: New/unused product
- **usado**: Used product in working condition
- **refurbished**: Refurbished/remanufactured product
- **reparacion**: Product currently under repair
- **reservado**: Reserved product (available for display)
- **prestado**: Loaned product (not available for sale)
- **sin_reparacion**: Product that cannot be repaired
- **uso_oficina**: Product for office use

#### ESTADO (Aesthetic Condition) - 5 Standard Grades
- **A+**: A+ (Excellent) - Like new condition
- **A**: A (Very Good) - Minor cosmetic wear
- **A-**: A- (Good) - Light usage marks
- **B+**: B+ (Regular) - Noticeable wear but fully functional
- **B**: B (Functional) - Heavy wear but works correctly

#### UBICACION (Location/Branch) - 3 Standard Values
- **la_plata**: LA PLATA branch
- **mitre**: MITRE branch
- **servicio_tecnico**: SERVICIO TÉCNICO branch

### Implementation Details

#### Constants and Validation Functions
```javascript
// Import standardized constants
import {
  CONDICIONES, CONDICIONES_ARRAY, CONDICIONES_LABELS,
  ESTADOS, ESTADOS_ARRAY, ESTADOS_LABELS,
  UBICACIONES, UBICACIONES_ARRAY, UBICACIONES_LABELS,
  getCondicionColor, getEstadoColor, getUbicacionLabel,
  isValidCondicion, isValidEstado, isValidUbicacion,
  normalizeCondicion, normalizeUbicacion
} from '../../../shared/constants/productConstants';
```

#### Database Migration
- **Applied**: `normalize_product_fields_step1` - Normalizes existing data across all product tables
- **Tables affected**: `inventario`, `celulares`, `otros`, `repuestos`
- **Legacy mapping**: Handles old formats like 'reparación' → 'reparacion', 'reacondicionado' → 'refurbished', 'rsn_idm_fixcenter' → 'servicio_tecnico'

#### Form Integration
- **Product input forms**: Use standardized dropdowns with normalized values
- **Validation**: Automatic validation in hooks prevents invalid values
- **Legacy support**: Normalization functions handle backward compatibility

#### Filter Integration
- **Catalog filters**: Display user-friendly labels while maintaining normalized values
- **Search functionality**: Supports both normalized and legacy formats
- **Color coding**: Consistent visual representation using predefined color schemes

### Usage Guidelines

#### In Components
```javascript
// ✅ CORRECT: Use constants for dropdowns
<select>
  {CONDICIONES_ARRAY.map(condicion => (
    <option key={condicion} value={condicion}>
      {CONDICIONES_LABELS[condicion]}
    </option>
  ))}
</select>

// ✅ CORRECT: Use helper functions for display
<span className={getCondicionColor(producto.condicion)}>
  {getCondicionLabel(producto.condicion)}
</span>
```

#### In Hooks/Services
```javascript
// ✅ CORRECT: Validate and normalize in data operations
const condicionNormalizada = normalizeCondicion(input.condicion);
if (!isValidCondicion(condicionNormalizada)) {
  throw new Error(`Invalid condition: ${input.condicion}`);
}
```

#### Database Constraints
All product tables enforce referential integrity through database constraints that only accept normalized values, ensuring data consistency at the storage level.

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

#### Estilo de Tablas ESTÁNDAR OBLIGATORIO:
TODAS las tablas deben seguir ESTRICTAMENTE este estilo sin excepción:
```jsx
<table className="w-full">
  <thead className="bg-slate-800 text-white">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Columna</th>
      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Datos</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-200">
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
      <td className="px-4 py-3 text-sm text-slate-800">Contenido</td>
    </tr>
  </tbody>
  {/* Footer de totales si aplica */}
  <tfoot className="bg-slate-800 text-white">
    <tr>
      <td className="px-4 py-3 text-sm font-semibold">TOTALES</td>
    </tr>
  </tfoot>
</table>
```

**Características obligatorias de las tablas**:
- Header: `bg-slate-800 text-white` (fondo slate oscuro, texto blanco)
- Footer de totales: `bg-slate-800 text-white` (igual que header)
- Filas alternadas: `bg-white` y `bg-slate-50`
- Divisores: `divide-y divide-slate-200`
- Padding: `px-4 py-3` en todas las celdas
- Headers: `text-xs font-medium uppercase tracking-wider`
- Contenido: `text-sm` con colores apropiados (text-slate-800, text-slate-600, etc.)

**Botones desplegables de tablas (Historial, etc.)**:
Los botones que despliegan tablas también deben usar el mismo estilo slate:
```jsx
<button
  onClick={toggleFunction}
  className="w-full p-4 bg-slate-800 text-white flex justify-center items-center hover:bg-slate-700 transition-colors"
>
  <h5 className="font-semibold flex items-center">
    <IconComponent size={18} className="mr-2" />
    TEXTO EN MAYÚSCULAS ({count})
    <ChevronRight className={`w-5 h-5 transition-transform ml-2 ${isOpen ? 'rotate-90' : ''}`} />
  </h5>
</button>
```

Este estilo se basa en BalanceSumasYSaldosSection.jsx y debe aplicarse consistentemente.

#### Headers de Sección ESTÁNDAR OBLIGATORIO:
TODOS los headers de sección deben seguir ESTRICTAMENTE este estilo basado en LibroDiarioSection.jsx:
```jsx
{/* Header */}
<div className="bg-slate-800 p-6 text-white">
  <div className="flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <IconoSeccion size={28} />
      <div>
        <p className="text-gray-300 mt-1">Descripción de la sección</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      {/* Botones de acción como PDF, vistas, etc. */}
      <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors">
        <Plus size={18} />
        Acción Principal
      </button>
    </div>
  </div>
</div>
```

#### Filtros ESTÁNDAR OBLIGATORIO:
TODOS los filtros deben seguir ESTRICTAMENTE este estilo:
```jsx
{/* Filtros */}
<div className="bg-gray-50 p-4 border-b">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Desde
      </label>
      <input
        type="date"
        value={filtroFechaDesde}
        onChange={(e) => setFiltroFechaDesde(e.target.value)}
        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Hasta
      </label>
      <input
        type="date"
        value={filtroFechaHasta}
        onChange={(e) => setFiltroFechaHasta(e.target.value)}
        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Descripción/Filtro
      </label>
      <input
        type="text"
        value={filtroDescripcion}
        onChange={(e) => setFiltroDescripcion(e.target.value)}
        placeholder="Buscar en descripción..."
        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
      />
    </div>
    <div className="flex items-end">
      <button
        onClick={limpiarFiltros}
        className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm"
      >
        Limpiar Filtros
      </button>
    </div>
  </div>
</div>
```

**Características obligatorias de Headers y Filtros**:
- Header: `bg-slate-800 p-6 text-white` (fondo slate oscuro con padding)
- Filtros: `bg-gray-50 p-4 border-b` (fondo gris claro con borde inferior)
- Labels: `text-sm font-medium text-gray-700 mb-1`
- Inputs: `border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600`
- Botón Limpiar: `bg-slate-700 text-white rounded hover:bg-black`
- Grid responsive: `grid grid-cols-1 md:grid-cols-4 gap-4`

Este estilo se basa en LibroDiarioSection.jsx y debe aplicarse consistentemente.

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

### Accounting Calculations - MANDATORY CENTRALIZED FUNCTIONS

**CRITICAL**: All accounting calculations MUST use the centralized functions in `/src/modules/contabilidad/utils/saldosUtils.js`. Do NOT create new calculation logic in individual components or hooks.

#### Core Functions (Always Use These):

1. **`calcularSaldoCuenta(debe, haber, tipoCuenta)`**
   - Calculates account balance according to accounting nature
   - **Debit accounts** (Assets, Expenses): `debe - haber`
   - **Credit accounts** (Liabilities, Equity, Revenue): `haber - debe`
   - Returns signed number (positive = normal balance, negative = abnormal balance)

2. **`calcularTotalCategoria(movimientos, filtroCuentas)`** ⭐ USE THIS FOR ALL TOTALS
   - Calculates total for a category of accounts from movements
   - Handles account nature automatically using `calcularSaldoCuenta`
   - **MUST be used** in: Ratios, Estado de Resultados, Balance, Analysis, etc.

   ```javascript
   // Example: Calculate CMV (Cost of Goods Sold) - Category 5.0
   const cmv = calcularTotalCategoria(movimientos, '5.0');

   // Example: Calculate Purchases (Inventory) - Category 1.1.04
   const compras = calcularTotalCategoria(movimientos, '1.1.04');

   // Example: Custom filter function
   const gastos = calcularTotalCategoria(movimientos, (mov) =>
     mov.plan_cuentas?.codigo?.startsWith('6.1')
   );
   ```

#### Account Types and Their Nature:
- **Activo** (Asset): Debit nature → `debe - haber`
- **Pasivo** (Liability): Credit nature → `haber - debe`
- **Patrimonio** (Equity): Credit nature → `haber - debe`
- **Resultado Positivo** (Revenue/Income): Credit nature → `haber - debe`
- **Resultado Negativo** (Expenses/Costs): Debit nature → `debe - haber`

#### Usage Rules:
1. **Never** calculate totals manually with `reduce` and `debe - haber`
2. **Always** use `calcularTotalCategoria` for category totals
3. **Always** use `calcularSaldoCuenta` for individual account balances
4. **Check** the account type (tipoCuenta) from `plan_cuentas` table
5. **Import** from: `import { calcularTotalCategoria, calcularSaldoCuenta } from '../utils/saldosUtils'`

#### Common Mistakes to Avoid:
❌ **WRONG**:
```javascript
const cmv = movimientos
  .filter(m => m.plan_cuentas?.codigo?.startsWith('5.0'))
  .reduce((sum, m) => sum + parseFloat(m.debe || 0) - parseFloat(m.haber || 0), 0);
```

✅ **CORRECT**:
```javascript
const cmv = calcularTotalCategoria(movimientos, '5.0');
```

#### Why This Matters:
- **CMV** (5.0.xx) is "resultado negativo" (debit nature): balance = debe - haber
- **Compras** (1.1.04.xx) is "activo" (debit nature): balance = debe - haber
- **Ventas** (4.0.xx) is "resultado positivo" (credit nature): balance = haber - debe
- Manual calculations often miss the account nature, leading to incorrect totals

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

## Date Handling Standards - MANDATORY

**CRITICAL**: All date operations MUST use the centralized functions to prevent timezone bugs where dates appear one day off (due to UTC interpretation in Argentina timezone UTC-3).

### 📁 Archivos de Configuración de Timezone:
- **Principal (USAR SIEMPRE)**: `/src/shared/config/timezone.js` - Sistema completo de manejo de fechas/horas
- **Legacy (Compatibilidad)**: `/src/shared/utils/formatters.js` - Funciones antiguas redirigidas al nuevo sistema
- **Guía Completa**: `/src/shared/config/TIMEZONE_GUIDE.md` - Ejemplos y casos de uso

### ❌ NUNCA Uses Estos Patrones:
```javascript
// INCORRECTO - causa problemas de timezone
new Date().toISOString().split('T')[0]           // Para fecha actual
new Date(fecha).toISOString().split('T')[0]      // Para formatear fechas
new Date('2024-12-31')                           // Para parsear fechas (interpreta UTC)

// INCORRECTO - formateo manual
const fecha = new Date();
const str = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
```

### ✅ SIEMPRE Usa las Funciones Centralizadas:
```javascript
// Para NUEVOS desarrollos, usar el módulo timezone.js
import {
  obtenerFechaArgentina,      // Fecha actual YYYY-MM-DD
  obtenerTimestampActual,      // Timestamp ISO para created_at/updated_at
  parsearFechaLocal,           // String YYYY-MM-DD → Date
  formatearFechaLocal,         // Date → String YYYY-MM-DD
  formatearFechaDisplay,       // String/Date → DD/MM/YYYY para UI
  formatearTimestampDisplay,   // Timestamp → DD/MM/YYYY HH:mm:ss para UI
  sumarDias,                   // Cálculos de fechas
  diferenciaEnDias,            // Diferencia entre fechas
  primerDiaMesActual,          // Primer día del mes
  ultimoDiaMesActual,          // Último día del mes
  esFechaValida                // Validación de fechas
} from '../shared/config/timezone';

// Para código EXISTENTE (legacy), también funcionan desde formatters.js
import {
  obtenerFechaLocal,           // = obtenerFechaArgentina
  parseFechaLocal,             // = parsearFechaLocal
  formatearFechaParaInput,     // = formatearFechaLocal
  formatearFechaReporte        // = formatearFechaDisplay
} from '../shared/utils/formatters';
```

### Casos de Uso Más Comunes:

#### 1. Fecha actual para formularios
```javascript
import { obtenerFechaArgentina } from '../shared/config/timezone';
const [fecha, setFecha] = useState(obtenerFechaArgentina());
```

#### 2. Timestamp para created_at/updated_at
```javascript
import { obtenerTimestampActual } from '../shared/config/timezone';
const registro = {
  ...data,
  created_at: obtenerTimestampActual(),
  updated_at: obtenerTimestampActual()
};
```

#### 3. Mostrar fecha al usuario
```javascript
import { formatearFechaDisplay } from '../shared/config/timezone';
<p>Fecha: {formatearFechaDisplay(venta.fecha)}</p>
```

#### 4. Mostrar timestamp completo
```javascript
import { formatearTimestampDisplay } from '../shared/config/timezone';
<p>Creado: {formatearTimestampDisplay(registro.created_at)}</p>
```

#### 5. Cálculos con fechas
```javascript
import { sumarDias, primerDiaMesActual, ultimoDiaMesActual } from '../shared/config/timezone';

const vencimiento = sumarDias('2024-12-01', 30);  // "2024-12-31"
const mesDesde = primerDiaMesActual();            // "2024-12-01"
const mesHasta = ultimoDiaMesActual();            // "2024-12-31"
```

### Tabla de Referencia Rápida:
| Función | Uso | Retorna | Ejemplo |
|---------|-----|---------|---------|
| `obtenerFechaArgentina()` | Fecha actual | `"2024-12-31"` | Valores por defecto en forms |
| `obtenerTimestampActual()` | Timestamp actual | ISO string | created_at/updated_at |
| `parsearFechaLocal(str)` | String → Date | `Date` | Parsear inputs de usuario |
| `formatearFechaLocal(date)` | Date → String | `"2024-12-31"` | Para inputs type="date" |
| `formatearFechaDisplay(str\|date)` | Mostrar fecha | `"31/12/2024"` | Display en UI |
| `formatearTimestampDisplay(ts)` | Mostrar timestamp | `"31/12/2024 18:30:00"` | Display en UI |

### 📚 Documentación Completa:
Para ejemplos detallados, casos de uso específicos y solución de problemas, consultar `/src/shared/config/TIMEZONE_GUIDE.md`

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