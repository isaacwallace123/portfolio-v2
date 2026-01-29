/**
 * Generates a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validates a slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

/**
 * Formats a date for input[type="date"]
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Parses array input (comma-separated)
 */
export function parseArrayInput(input: string): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * Joins array for input display
 */
export function joinArrayForInput(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return '';
  return arr.join(', ');
}
