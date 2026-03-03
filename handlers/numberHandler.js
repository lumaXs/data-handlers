/**
 * Formats a finite number into a localized string.
 *
 * @param {number} value - The number to format. Must be a finite number.
 * @param {Object} [options={}] - Formatting options.
 * @param {string} [options.locale='en-US'] - A BCP 47 language tag (e.g. `'pt-BR'`, `'de-DE'`).
 * @param {...Intl.NumberFormatOptions} [options] - Any additional options passed to `Intl.NumberFormat`.
 * @returns {string} The formatted number string.
 * @throws {TypeError} If `value` is not a finite number.
 *
 * @example
 * numberHandler(1234567.89, { locale: 'pt-BR', style: 'currency', currency: 'BRL' })
 * // → 'R$ 1.234.567,89'
 */
export const numberHandler = (value, options = {}) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError(
            `[normalize:number] Expected finite number. Received: ${value}`
        )
    }

    const { locale = 'en-US', ...formatOptions } = options

    return new Intl.NumberFormat(locale, formatOptions).format(value)
}
