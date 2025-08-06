/**
 * Gera um slug amigável para URLs a partir de um nome
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD") // Decompose unicode characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics/accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim() // Remove leading/trailing whitespace
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Valida se um slug é válido
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length > 0;
}

/**
 * Normaliza um slug para garantir que está no formato correto
 */
export function normalizeSlug(slug: string): string {
  return generateSlug(slug);
}