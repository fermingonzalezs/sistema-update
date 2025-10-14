// Constantes para categorías de productos "otros"

// Categorías normalizadas - 5 únicas permitidas
export const CATEGORIAS_OTROS = {
  ACCESORIOS: 'ACCESORIOS',
  MONITORES: 'MONITORES',
  PERIFERICOS: 'PERIFERICOS',
  COMPONENTES: 'COMPONENTES',
  FUNDAS_TEMPLADOS: 'FUNDAS_TEMPLADOS',
  TABLETS: 'TABLETS'
};

export const CATEGORIAS_OTROS_ARRAY = Object.values(CATEGORIAS_OTROS);

// Labels para mostrar en la UI
export const CATEGORIAS_OTROS_LABELS = {
  ACCESORIOS: 'Accesorios',
  MONITORES: 'Monitores',
  PERIFERICOS: 'Periféricos',
  COMPONENTES: 'Componentes',
  FUNDAS_TEMPLADOS: 'Fundas/Templados',
  TABLETS: 'Tablets'
};

// Mapeo de categorías legacy a nuevas categorías
export const CATEGORIA_MAPPING = {
  // gadgets, audio, apple y otros → ACCESORIOS
  'gadgets': CATEGORIAS_OTROS.ACCESORIOS,
  'audio': CATEGORIAS_OTROS.ACCESORIOS,
  'apple': CATEGORIAS_OTROS.ACCESORIOS,
  'otros': CATEGORIAS_OTROS.ACCESORIOS,

  // monitores se mantiene
  'monitores': CATEGORIAS_OTROS.MONITORES,

  // teclados y mouse → PERIFERICOS
  'teclados': CATEGORIAS_OTROS.PERIFERICOS,
  'mouse': CATEGORIAS_OTROS.PERIFERICOS,

  // procesadores y motherboards → COMPONENTES
  'procesadores': CATEGORIAS_OTROS.COMPONENTES,
  'motherboards': CATEGORIAS_OTROS.COMPONENTES,

  // fundas y templados
  'fundas': CATEGORIAS_OTROS.FUNDAS_TEMPLADOS,
  'templados': CATEGORIAS_OTROS.FUNDAS_TEMPLADOS,
  'fundas/templados': CATEGORIAS_OTROS.FUNDAS_TEMPLADOS
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