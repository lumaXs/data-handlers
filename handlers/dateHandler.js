/**
 * Formats a date value into a localized string.
 *
 * @param {Date|string|number} value - A Date object or any value accepted by the Date constructor.
 * @param {Object} [options={}] - Formatting options.
 * @param {string} [options.locale='en-US'] - A BCP 47 language tag (e.g. `'pt-BR'`, `'en-US'`).
 * @param {...Intl.DateTimeFormatOptions} [options] - Any additional options passed to `Intl.DateTimeFormat`.
 * @returns {string} The formatted date string.
 * @throws {TypeError} If `value` cannot be parsed into a valid date.
 *
 * @example
 * dateHandler('2024-01-15', { locale: 'pt-BR', dateStyle: 'long' })
 * // → '15 de janeiro de 2024'
 */
export const dateHandler = (value, options = {}) => {
    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
        throw new TypeError(
            `[normalize:date] Expected date string or Date object. Received: ${value}`
        )
    }

    const { locale = 'en-US', ...formatOptions } = options

    return new Intl.DateTimeFormat(locale, formatOptions).format(date)
}
