# Sistema Update - AI Agent Guidelines

## Project Overview

**Sistema Update** is a comprehensive business management web application for a technology retail and repair business. Built with React 19 and Supabase, it manages sales, inventory, accounting, technical support, import/export, and local purchases across multiple branches (La Plata, Mitre, Servicio Técnico) with dual currency support (USD/ARS).

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19.2.1 + Vite 6.3.5 |
| Routing | React Router DOM 7.10.1 |
| Styling | Tailwind CSS 4.1.7 |
| Backend | Supabase 2.49.8 (PostgreSQL) |
| Icons | lucide-react (ONLY icon library allowed) |
| PDF | @react-pdf/renderer, jsPDF |
| Charts | recharts |
| Email | resend |
| Excel | xlsx-js-style, jszip |

## Project Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Root with AuthProvider + AppProvider
├── routes.jsx                  # Role-based protected routes
├── components/                 # Global cross-module components
│   ├── auth/                   # Login, SetupPassword
│   ├── currency/               # Currency conversion display
│   └── index.js
├── context/                    # Global contexts
│   ├── AuthContext.jsx         # Authentication + access control
│   └── AppContext.jsx          # Global state (inventory, cart, sales)
├── hooks/                      # Global hooks (useAuth, useFotoPrincipal)
├── lib/                        # Core utilities (supabase client, warranties)
├── services/                   # Global services (pricing, database utils)
├── utils/                      # Global utilities (downloadUtils)
├── shared/                     # Shared resources between modules
│   ├── components/
│   │   ├── base/               # LoadingSpinner, ProductModal
│   │   ├── layout/             # Layout, Header, Sidebar, Tarjeta, CarritoWidget
│   │   ├── modals/             # ModalProducto
│   │   └── ui/                 # MarcaSelector, MetodoPagoSelector
│   ├── config/                 # timezone.js (date handling)
│   ├── constants/              # productConstants, paymentMethods, etc.
│   ├── hooks/                  # useCurrency, useSupabaseEntity
│   ├── services/               # auditService, cotizacionService
│   └── utils/                  # formatters, currency, validators
└── modules/                    # Business domain modules (STRICT separation)
    ├── administracion/         # Analytics, reports, stock counting
    ├── compras/                # Local purchases, suppliers, weighing
    ├── contabilidad/           # Full accounting system
    ├── importaciones/          # Import tracking, boxes, logistics
    ├── soporte/                # Repairs, testing, audit, warranties
    └── ventas/                 # Catalog, clients, sales processing
```

## Module Organization Rules (MANDATORY)

1. **ALL business-domain files MUST live in their module directory** - no exceptions
2. **Only truly cross-module components** go in `src/components/` or `src/shared/components/`
3. Each module follows this pattern:
   ```
   src/modules/[module]/
   ├── components/    # Module-specific React components
   ├── hooks/         # Custom hooks for this module
   ├── utils/         # Utility functions
   ├── services/      # API services (if needed)
   └── pdf/           # PDF generators (if needed)
   ```

## Design System (STRICT - NO EXCEPTIONS)

### Colors (ONLY these 4 base colors)
- **Emerald (#10b981)** - Primary active, buttons, positive states
- **Slate-800 (#1e293b)** - Dark for sidebar, header, main text
- **Slate-200 (#e2e8f0)** - Borders, dividers, subtle elements
- **White (#ffffff)** - Card backgrounds, containers

### Typography
- Font: System font stack only
- `font-semibold` for titles, `font-medium` for normal, `font-normal` for secondary
- Sizes: `text-lg` (titles), `text-base` (normal), `text-sm` (secondary), `text-xs` (labels)

### Borders & Spacing
- Border radius: **ONLY** `rounded` (4px) - NO `rounded-lg`, `rounded-xl`, etc.
- Spacing: 8px system (`p-4`, `p-6`, `gap-4`, `gap-6`)
- Borders: always `border-slate-200`

### Standard Components
```jsx
// Cards
<div className="bg-white border border-slate-200 rounded">

// Primary buttons
<button className="bg-emerald-600 hover:bg-emerald-700 text-white">

// Secondary buttons
<button className="bg-slate-600 hover:bg-slate-700 text-white">

// Text colors
text-slate-800 (primary), text-slate-500 (secondary), text-slate-400 (tertiary)
```

### Tables (MANDATORY style)
```jsx
<table className="w-full">
  <thead className="bg-slate-800 text-white">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">...</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-200">
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
      <td className="px-4 py-3 text-sm text-slate-800">...</td>
    </tr>
  </tbody>
  <tfoot className="bg-slate-800 text-white">...</tfoot>
</table>
```

### Section Headers (MANDATORY style)
```jsx
<div className="bg-slate-800 p-6 text-white">
  <div className="flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <Icon size={28} />
      <div>
        <h2 className="text-2xl font-semibold">Title</h2>
        <p className="text-gray-300 mt-1">Description</p>
      </div>
    </div>
    {/* Action buttons */}
  </div>
</div>
```

### Filters (MANDATORY style)
```jsx
<div className="bg-gray-50 p-4 border-b">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
      <input className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600" />
    </div>
  </div>
</div>
```

### Modal Overlays (MANDATORY)
ALL modal overlays MUST use `backdrop-blur-sm`:
```jsx
<div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
  {/* Modal content */}
</div>
```

## Code Patterns

### Component Pattern
```jsx
import React from 'react'
import { useModuleHook } from '../hooks/useModuleHook'

const ComponentName = ({ prop1, prop2 }) => {
  const { data, loading, error, actions } = useModuleHook()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="component-container">
      {/* Content */}
    </div>
  )
}

export default ComponentName
```

### Custom Hook Pattern
```jsx
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

  useEffect(() => { fetchData() }, [])

  return { data, loading, error, refetch: fetchData }
}
```

## Critical Rules

### Date Handling (MANDATORY)
ALWAYS use `src/shared/config/timezone.js`:
```jsx
import {
  obtenerFechaArgentina,      // Current date YYYY-MM-DD
  obtenerTimestampActual,      // ISO timestamp for created_at/updated_at
  formatearFechaDisplay,       // Display as DD/MM/YYYY
  formatearTimestampDisplay,   // Display as DD/MM/YYYY HH:mm:ss
  sumarDias,                   // Date calculations
  primerDiaMesActual,          // First day of current month
  ultimoDiaMesActual           // Last day of current month
} from '../shared/config/timezone'
```
NEVER use `new Date().toISOString().split('T')[0]` - causes timezone bugs in Argentina (UTC-3).

### Accounting Calculations (MANDATORY)
ALWAYS use `src/modules/contabilidad/utils/saldosUtils.js`:
```jsx
import { calcularSaldoCuenta, calcularTotalCategoria } from '../utils/saldosUtils'

// For category totals
const cmv = calcularTotalCategoria(movimientos, '5.0')

// For individual account balances
const saldo = calcularSaldoCuenta(debe, haber, tipoCuenta)
```
NEVER calculate totals manually with reduce - misses account nature (debit/credit).

### Database Security (MANDATORY)
ALL new tables MUST have RLS enabled immediately:
```sql
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;
```

### Product Field Normalization
Use constants from `src/shared/constants/productConstants.js`:
- **CONDICION** (8 values): nuevo, usado, refurbished, reparacion, reservado, prestado, sin_reparacion, uso_oficina
- **ESTADO** (5 values): A+, A, A-, B+, B
- **UBICACION** (3 values): la_plata, mitre, servicio_tecnico

```jsx
import { CONDICIONES_ARRAY, CONDICIONES_LABELS, getCondicionColor } from '../../../shared/constants/productConstants'
```

## Development Scripts

```bash
npm run dev          # Dev server on port 5173 (0.0.0.0)
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Access Roles

- **admin**: Full system access
- **ventas**: Sales, inventory, clients, cart
- **soporte**: Repairs, testing, parts, audit
- **contabilidad**: Accounting, expenses, current accounts
- **compras**: Local purchases, suppliers
- **revendedor**: Reseller access

## Import Path Standards

```jsx
// CORRECT: Module-specific imports
import { useLibroDiario } from '../hooks/useLibroDiario'
import BalanceSheet from './BalanceSheet'

// CORRECT: Global component imports
import Layout from '../../../components/layout/Layout'
import { formatCurrency } from '../../../lib/utils'

// WRONG: Module components in global components
import AccountingReport from '../../../components/accounting/AccountingReport'
```

## Common Pitfalls to Avoid

1. **Date timezone bugs**: Always use timezone.js functions
2. **Accounting calculation errors**: Always use saldosUtils.js
3. **Missing RLS**: Always enable RLS on new tables
4. **Wrong colors**: Only use the 4 base colors (emerald + slate)
5. **Wrong border radius**: Only use `rounded` (4px)
6. **Wrong icon library**: Only use lucide-react
7. **Files in wrong location**: Business files MUST be in their module
8. **Manual accounting totals**: Use `calcularTotalCategoria()` not reduce
9. **Modal without blur**: All modal overlays need `backdrop-blur-sm`
10. **Missing loading/error states**: Always handle loading and error in components
