// Constantes para categorías de productos "otros"

// Categorías normalizadas
export const CATEGORIAS_OTROS = {
  DESKTOP: 'DESKTOP',
  ACCESORIOS: 'ACCESORIOS',
  MONITORES: 'MONITORES',
  COMPONENTES: 'COMPONENTES',
  FUNDAS_TEMPLADOS: 'FUNDAS_TEMPLADOS',
  TABLETS: 'TABLETS',
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
  MEMORIA: 'MEMORIA',
  REPUESTOS: 'REPUESTOS'
};

export const CATEGORIAS_OTROS_ARRAY = Object.values(CATEGORIAS_OTROS).sort();

// Labels para mostrar en la UI
export const CATEGORIAS_OTROS_LABELS = {
  DESKTOP: 'Desktop',
  ACCESORIOS: 'Accesorios',
  MONITORES: 'Monitores',
  COMPONENTES: 'Componentes',
  FUNDAS_TEMPLADOS: 'Fundas/Templados',
  TABLETS: 'Tablets',
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
  MEMORIA: 'Memoria',
  REPUESTOS: 'Repuestos'
};

// Mapeo de categorías legacy a normalizadas
const CATEGORIA_MAPPING = {
  // Minúsculas a mayúsculas
  'desktop': CATEGORIAS_OTROS.DESKTOP,
  'accesorios': CATEGORIAS_OTROS.ACCESORIOS,
  'monitores': CATEGORIAS_OTROS.MONITORES,
  'componentes': CATEGORIAS_OTROS.COMPONENTES,
  'fundas_templados': CATEGORIAS_OTROS.FUNDAS_TEMPLADOS,
  'fundas y templados': CATEGORIAS_OTROS.FUNDAS_TEMPLADOS,
  'fundas/templados': CATEGORIAS_OTROS.FUNDAS_TEMPLADOS,
  'tablets': CATEGORIAS_OTROS.TABLETS,
  'mouse_teclados': CATEGORIAS_OTROS.MOUSE_TECLADOS,
  'mouse y teclados': CATEGORIAS_OTROS.MOUSE_TECLADOS,
  'mouse/teclados': CATEGORIAS_OTROS.MOUSE_TECLADOS,
  'audio': CATEGORIAS_OTROS.AUDIO,
  'almacenamiento': CATEGORIAS_OTROS.ALMACENAMIENTO,
  'camaras': CATEGORIAS_OTROS.CAMARAS,
  'cámaras': CATEGORIAS_OTROS.CAMARAS,
  'consolas': CATEGORIAS_OTROS.CONSOLAS,
  'gaming': CATEGORIAS_OTROS.GAMING,
  'drones': CATEGORIAS_OTROS.DRONES,
  'watches': CATEGORIAS_OTROS.WATCHES,
  'relojes': CATEGORIAS_OTROS.WATCHES,
  'placas_video': CATEGORIAS_OTROS.PLACAS_VIDEO,
  'placas de video': CATEGORIAS_OTROS.PLACAS_VIDEO,
  'gpu': CATEGORIAS_OTROS.PLACAS_VIDEO,
  'streaming': CATEGORIAS_OTROS.STREAMING,
  'redes': CATEGORIAS_OTROS.REDES,
  'bags_cases': CATEGORIAS_OTROS.BAGS_CASES,
  'bags y cases': CATEGORIAS_OTROS.BAGS_CASES,
  'bags/cases': CATEGORIAS_OTROS.BAGS_CASES,
  'mochilas': CATEGORIAS_OTROS.BAGS_CASES,
  'cables_cargadores': CATEGORIAS_OTROS.CABLES_CARGADORES,
  'cables y cargadores': CATEGORIAS_OTROS.CABLES_CARGADORES,
  'cables/cargadores': CATEGORIAS_OTROS.CABLES_CARGADORES,
  'cargadores': CATEGORIAS_OTROS.CABLES_CARGADORES,
  'cables': CATEGORIAS_OTROS.CABLES_CARGADORES,
  'memoria': CATEGORIAS_OTROS.MEMORIA,
  'ram': CATEGORIAS_OTROS.MEMORIA,
  'repuestos': CATEGORIAS_OTROS.REPUESTOS,
  // Apple como categoría heredada
  'apple': CATEGORIAS_OTROS.ACCESORIOS
};


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