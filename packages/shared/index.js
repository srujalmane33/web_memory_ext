/**
 * Shared validation rules, constants, and utilities for Web Memory
 */

export const MEMORY_TYPES = ['page', 'highlight', 'snippet', 'note'];

export const LIMITS = {
  TITLE_MAX_LENGTH: 300,
  SELECTED_TEXT_MAX_LENGTH: 20000,
  NOTE_MAX_LENGTH: 5000,
  TAG_MAX_LENGTH: 30,
  MAX_TAGS_COUNT: 20,
};

/**
 * Validates that a URL is non-empty and uses either http or https.
 * Rejects javascript:, data:, chrome:, and other schemes.
 * @param {string} rawUrl
 * @returns {boolean}
 */
export function isValidHttpUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safely extracts hostname/domain from a URL.
 * @param {string} rawUrl
 * @returns {string}
 */
export function extractDomain(rawUrl) {
  if (!isValidHttpUrl(rawUrl)) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Normalizes an array or comma-separated string of tags.
 * Deduplicates, lowercases, trims, and applies bounds.
 * @param {string[]|string} tagsInput
 * @returns {string[]}
 */
export function normalizeTags(tagsInput) {
  if (!tagsInput) return [];
  
  let list = [];
  if (Array.isArray(tagsInput)) {
    list = tagsInput;
  } else if (typeof tagsInput === 'string') {
    list = tagsInput.split(',');
  } else {
    return [];
  }

  const clean = [];
  const seen = new Set();

  for (const item of list) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().toLowerCase().slice(0, LIMITS.TAG_MAX_LENGTH);
    if (trimmed.length > 0 && !seen.has(trimmed)) {
      seen.add(trimmed);
      clean.push(trimmed);
      if (clean.length >= LIMITS.MAX_TAGS_COUNT) break;
    }
  }

  return clean;
}

/**
 * Sanitizes and caps text fields safely.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function sanitizeText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}
