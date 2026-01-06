# Guía de Manejo de Fechas y Horas - Argentina (UTC-3)

## 🚨 REGLAS OBLIGATORIAS

### ❌ NUNCA uses estos patrones:
```javascript
// INCORRECTO - causa problemas de timezone
new Date().toISOString().split('T')[0]           // Para fecha actual
new Date(fecha).toISOString().split('T')[0]      // Para formatear fechas
new Date('2024-12-31')                           // Para parsear fechas (interpreta UTC)

// INCORRECTO - formateo manual
const fecha = new Date();
const str = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
```

### ✅ SIEMPRE usa las funciones centralizadas:
```javascript
import {
  obtenerFechaArgentina,
  parsearFechaLocal,
  formatearFechaLocal,
  formatearFechaDisplay,
  obtenerTimestampActual
} from '../shared/config/timezone';
```

---

## 📋 Casos de Uso Comunes

### 1. Obtener fecha actual para valores por defecto en formularios
```javascript
// ✅ CORRECTO
import { obtenerFechaArgentina } from '../shared/config/timezone';

const [fecha, setFecha] = useState(obtenerFechaArgentina());

<input
  type="date"
  value={fecha}
  onChange={(e) => setFecha(e.target.value)}
/>
```

### 2. Obtener timestamp actual para created_at/updated_at
```javascript
// ✅ CORRECTO - Para campos timestamp completos
import { obtenerTimestampActual } from '../shared/config/timezone';

const nuevoRegistro = {
  ...data,
  created_at: obtenerTimestampActual(),
  updated_at: obtenerTimestampActual()
};
```

### 3. Parsear fecha string (YYYY-MM-DD) a Date
```javascript
// ✅ CORRECTO
import { parsearFechaLocal } from '../shared/config/timezone';

const fechaString = '2024-12-31';
const fechaDate = parsearFechaLocal(fechaString); // Date object en zona local
```

### 4. Formatear Date a string YYYY-MM-DD (para inputs o DB)
```javascript
// ✅ CORRECTO
import { formatearFechaLocal } from '../shared/config/timezone';

const fecha = new Date();
const fechaString = formatearFechaLocal(fecha); // "2024-12-31"

<input type="date" value={fechaString} />
```

### 5. Mostrar fecha al usuario (DD/MM/YYYY)
```javascript
// ✅ CORRECTO
import { formatearFechaDisplay } from '../shared/config/timezone';

// Desde string
const displayFecha = formatearFechaDisplay('2024-12-31'); // "31/12/2024"

// Desde Date
const displayFecha = formatearFechaDisplay(new Date()); // "31/12/2024"

<p>Fecha: {formatearFechaDisplay(venta.fecha)}</p>
```

### 6. Mostrar timestamp completo (DD/MM/YYYY HH:mm:ss)
```javascript
// ✅ CORRECTO
import { formatearTimestampDisplay } from '../shared/config/timezone';

const timestamp = formatearTimestampDisplay(registro.created_at);
// "31/12/2024 15:30:45"

<p>Creado: {formatearTimestampDisplay(registro.created_at)}</p>
```

### 7. Cálculos con fechas
```javascript
// ✅ CORRECTO
import {
  sumarDias,
  diferenciaEnDias,
  primerDiaMesActual,
  ultimoDiaMesActual
} from '../shared/config/timezone';

// Sumar 30 días a una fecha
const fechaVencimiento = sumarDias('2024-12-01', 30); // "2024-12-31"

// Diferencia entre fechas
const dias = diferenciaEnDias('2024-12-01', '2024-12-31'); // 30

// Rangos de mes actual
const [fechaInicio, setFechaInicio] = useState(primerDiaMesActual());
const [fechaFin, setFechaFin] = useState(ultimoDiaMesActual());
```

### 8. Validar fechas
```javascript
// ✅ CORRECTO
import { esFechaValida } from '../shared/config/timezone';

if (!esFechaValida(inputFecha)) {
  alert('Fecha inválida');
  return;
}
```

---

## 📁 Ejemplo Completo: Formulario con Fechas

```javascript
import React, { useState } from 'react';
import {
  obtenerFechaArgentina,
  formatearFechaDisplay,
  obtenerTimestampActual
} from '../shared/config/timezone';
import { supabase } from '../lib/supabase';

const FormularioVenta = () => {
  const [fecha, setFecha] = useState(obtenerFechaArgentina());
  const [monto, setMonto] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const venta = {
      fecha: fecha,                          // YYYY-MM-DD para DB
      monto: parseFloat(monto),
      created_at: obtenerTimestampActual(),  // Timestamp ISO
      updated_at: obtenerTimestampActual()
    };

    const { error } = await supabase
      .from('ventas')
      .insert([venta]);

    if (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Fecha de Venta</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <small>Formato: {formatearFechaDisplay(fecha)}</small>
      </div>

      <div>
        <label>Monto</label>
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
      </div>

      <button type="submit">Guardar Venta</button>
    </form>
  );
};

export default FormularioVenta;
```

---

## 📁 Ejemplo Completo: Tabla con Fechas

```javascript
import React, { useEffect, useState } from 'react';
import { formatearFechaDisplay, formatearTimestampDisplay } from '../shared/config/timezone';
import { supabase } from '../lib/supabase';

const TablaVentas = () => {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const fetchVentas = async () => {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .order('fecha', { ascending: false });

      if (!error) {
        setVentas(data);
      }
    };

    fetchVentas();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Fecha Venta</th>
          <th>Monto</th>
          <th>Creado</th>
        </tr>
      </thead>
      <tbody>
        {ventas.map(venta => (
          <tr key={venta.id}>
            <td>{formatearFechaDisplay(venta.fecha)}</td>
            <td>U${venta.monto}</td>
            <td>{formatearTimestampDisplay(venta.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TablaVentas;
```

---

## 🔄 Migración de Código Existente

### Si encuentras código así:
```javascript
// ❌ ANTES
const hoy = new Date().toISOString().split('T')[0];
const [fecha, setFecha] = useState(hoy);
```

### Cámbialo a:
```javascript
// ✅ DESPUÉS
import { obtenerFechaArgentina } from '../shared/config/timezone';
const [fecha, setFecha] = useState(obtenerFechaArgentina());
```

---

## 📦 Funciones Disponibles

| Función | Uso | Retorna | Ejemplo |
|---------|-----|---------|---------|
| `obtenerFechaArgentina()` | Fecha actual | `"2024-12-31"` | Valores por defecto |
| `obtenerTimestampActual()` | Timestamp actual | `"2024-12-31T18:30:00.000Z"` | created_at/updated_at |
| `parsearFechaLocal(str)` | String → Date | `Date` | Parsear inputs |
| `formatearFechaLocal(date)` | Date → String | `"2024-12-31"` | Para inputs/DB |
| `formatearFechaDisplay(str\|date)` | Mostrar fecha | `"31/12/2024"` | UI display |
| `formatearTimestampDisplay(str\|date)` | Mostrar timestamp | `"31/12/2024 18:30:00"` | UI display |
| `sumarDias(fecha, dias)` | Cálculo fechas | `"2024-12-31"` | Vencimientos |
| `diferenciaEnDias(f1, f2)` | Diferencia | `30` | Antigüedad |
| `primerDiaMesActual()` | Primer día mes | `"2024-12-01"` | Filtros |
| `ultimoDiaMesActual()` | Último día mes | `"2024-12-31"` | Filtros |
| `esFechaValida(str)` | Validación | `true/false` | Validaciones |

---

## 🎯 Resumen

1. **NUNCA** uses `new Date().toISOString().split('T')[0]`
2. **SIEMPRE** importa las funciones de `../shared/config/timezone`
3. **USA** `obtenerFechaArgentina()` para fechas actuales
4. **USA** `obtenerTimestampActual()` para timestamps completos
5. **USA** `parsearFechaLocal()` para convertir strings a Date
6. **USA** `formatearFechaDisplay()` para mostrar al usuario
7. **USA** `formatearTimestampDisplay()` para mostrar timestamps

---

## 🐛 Solución de Problemas

### Problema: "La fecha aparece un día antes"
- **Causa**: Estás usando `new Date('2024-12-31')` que interpreta como UTC
- **Solución**: Usa `parsearFechaLocal('2024-12-31')`

### Problema: "El timestamp muestra hora incorrecta"
- **Causa**: El navegador muestra en hora local automáticamente
- **Solución**: Usa `formatearTimestampDisplay()` para formatear correctamente

### Problema: "El input date muestra fecha incorrecta"
- **Causa**: Formateo incorrecto del Date a string
- **Solución**: Usa `formatearFechaLocal(date)` para convertir a YYYY-MM-DD

---

**🔧 Archivo de configuración**: `/src/shared/config/timezone.js`
**📚 Archivo de utilidades (legacy)**: `/src/shared/utils/formatters.js`
