/**
 * Normalizes a full name string to Title Case, trimming extra whitespace.
 *
 * @param {string} value - The raw name string to normalize.
 * @returns {string} The normalized name in Title Case with collapsed spaces.
 * @throws {TypeError} If `value` is not a non-empty string.
 *
 * @example
 * nameHandler('  john   doe  ')
 * // → 'John Doe'
 */
export const nameHandler = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(
            `[normalize:name] Expected non-empty string. Received: ${value}`
        )
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(' ')
}
