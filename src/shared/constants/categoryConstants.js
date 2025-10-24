// Constantes para categorías de productos "otros"

// Categorías normalizadas
export const CATEGORIAS_OTROS = {
  ACCESORIOS: 'ACCESORIOS',
  MONITORES: 'MONITORES',
  COMPONENTES: 'COMPONENTES',
  FUNDAS_TEMPLADOS: 'FUNDAS_TEMPLADOS',
  TABLETS: 'TABLETS',
  APPLE: 'APPLE',
  MOUSE_TECLADOS: 'MOUSE_TECLADOS',
  AUDIO: 'AUDIO',
  ALMACENAMIENTO: 'ALMACENAMIENTO',
  CAMARAS: 'CAMARAS',
  CONSOLAS: 'CONSOLAS',
  GAMING: 'GAMING',
  DRONES: 'DRONES',
  WATCHES: 'WATCHES',
  PLACAS_VIDEO: 'PLACAS_VIDEO',
  STREAMING: 'STREAMING',
  REDES: 'REDES',
  BAGS_CASES: 'BAGS_CASES',
  CABLES_CARGADORES: 'CABLES_CARGADORES',
  REPUESTOS: 'REPUESTOS'
};

export const CATEGORIAS_OTROS_ARRAY = Object.values(CATEGORIAS_OTROS);

// Labels para mostrar en la UI
export const CATEGORIAS_OTROS_LABELS = {
  ACCESORIOS: 'Accesorios',
  MONITORES: 'Monitores',
  COMPONENTES: 'Componentes',
  FUNDAS_TEMPLADOS: 'Fundas/Templados',
  TABLETS: 'Tablets',
  APPLE: 'Apple',
  MOUSE_TECLADOS: 'Mouse/Teclados',
  AUDIO: 'Audio',
  ALMACENAMIENTO: 'Almacenamiento',
  CAMARAS: 'Cámaras',
  CONSOLAS: 'Consolas',
  GAMING: 'Gaming',
  DRONES: 'Drones',
  WATCHES: 'Watches',
  PLACAS_VIDEO: 'Placas de Video',
  STREAMING: 'Streaming',
  REDES: 'Redes',
  BAGS_CASES: 'Bags/Cases',
  CABLES_CARGADORES: 'Cables/Cargadores',
  REPUESTOS: 'Repuestos'
};


// Función para normalizar categoría
export const normalizeCategoria = (categoria) => {
  if (!categoria) return CATEGORIAS_OTROS.ACCESORIOS;

  const categoriaLower = categoria.toLowerCase().trim();

  // Si ya es una categoría válida (case insensitive)
  const categoriaUpper = categoria.toUpperCase();
  if (CATEGORIAS_OTROS_ARRAY.includes(categoriaUpper)) {
    return categoriaUpper;
  }

  // Mapear desde categoría legacy
  return CATEGORIA_MAPPING[categoriaLower] || CATEGORIAS_OTROS.ACCESORIOS;
};

// Función para validar categoría
export const isValidCategoria = (categoria) => {
  return CATEGORIAS_OTROS_ARRAY.includes(categoria);
};

// Función para obtener label de categoría
export const getCategoriaLabel = (categoria) => {
  return CATEGORIAS_OTROS_LABELS[categoria] || categoria;
};