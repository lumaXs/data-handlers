import { createPlugin } from '../../src/main.js'

/**
 * Converts a string into a URL-friendly slug.
 * Removes diacritics, replaces spaces with hyphens, strips invalid characters.
 *
 * @param {string} value - The raw string to slugify.
 * @returns {string} URL-safe slug string.
 * @throws {TypeError} If `value` is not a non-empty string.
 *
 * @example
 * slugHandler('Olá Mundo Legal!')  // → 'ola-mundo-legal'
 * slugHandler('Café & Chá')        // → 'cafe-cha'
 * slugHandler('  multiple   spaces  ') // → 'multiple-spaces'
 */
const slugHandler = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(
            `[normalize:slug] Expected non-empty string. Received: ${value}`
        )
    }

    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
        .replace(/\s+/g, '-')             // spaces become hyphens
        .replace(/[^a-z0-9-]/g, '')       // strip invalid chars
        .replace(/-+/g, '-')              // collapse multiple hyphens
        .replace(/^-|-$/g, '')            // trim leading/trailing hyphens
}

createPlugin('slug', slugHandler)
