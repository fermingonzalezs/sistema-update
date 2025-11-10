/**
 * Normalizes a string for search comparison:
 * - Removes accents/diacritics (á → a, ñ → n, etc.)
 * - Converts to lowercase
 * - Trims leading/trailing spaces
 * - Collapses multiple spaces into one
 *
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 *
 * @example
 * normalizeString('Álvaro  ') // 'alvaro'
 * normalizeString('MARÍA García') // 'maria garcia'
 */
export const normalizeString = (str) => {
  if (!str) return '';

  return str
    .normalize('NFD')                    // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')    // Remove diacritics
    .toLowerCase()                       // Convert to lowercase
    .trim()                              // Remove leading/trailing spaces
    .replace(/\s+/g, ' ');              // Collapse multiple spaces into one
};

/**
 * Checks if a client matches the search term
 * Searches in: nombre, apellido, full name, email, telefono, profesion
 * Uses normalized comparison (no accents, case-insensitive, trimmed spaces)
 *
 * @param {object} cliente - Client object with nombre, apellido, email, etc.
 * @param {string} searchTerm - Search term to match
 * @returns {boolean} True if client matches search term
 *
 * @example
 * clienteMatchesSearch(
 *   { nombre: 'Álvaro', apellido: 'Pérez', email: 'alvaro@example.com' },
 *   'alvaro  '
 * ) // true
 */
export const clienteMatchesSearch = (cliente, searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) return true;

  const normalizedSearch = normalizeString(searchTerm);

  // Build searchable fields
  const nombre = normalizeString(cliente.nombre || '');
  const apellido = normalizeString(cliente.apellido || '');
  const nombreCompleto = `${nombre} ${apellido}`.trim();
  const email = normalizeString(cliente.email || '');
  const telefono = normalizeString(cliente.telefono || '');
  const profesion = normalizeString(cliente.profesion || '');

  // Check if search term is in any field
  return (
    nombre.includes(normalizedSearch) ||
    apellido.includes(normalizedSearch) ||
    nombreCompleto.includes(normalizedSearch) ||
    email.includes(normalizedSearch) ||
    telefono.includes(normalizedSearch) ||
    profesion.includes(normalizedSearch)
  );
};
