/**
 * Formata uma data em string localizada.
 * Aceita: Date, string ISO e timestamp numérico em ms.
 *
 * @param {Date|string|number} value
 * @param {{ locale?: string } & Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 * @throws {TypeError}
 *
 * @example
 * dateHandler(new Date('2024-01-15'), { dateStyle: 'long', locale: 'pt-BR' })
 * // '15 de janeiro de 2024'
 *
 * @example
 * dateHandler(1735689600000, { dateStyle: 'short', locale: 'pt-BR' })
 * // '01/01/2025'
 */
export const dateHandler = (value, options = {}) => {
    let date

    if (value instanceof Date) {
        date = value
    } else if (typeof value === 'number' && Number.isInteger(value)) {
        // Timestamp Unix em ms (ex: Date.now() ou 1735689600000)
        date = new Date(value)
    } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value)
    } else {
        throw new TypeError(
            `[normalize:date] Expected Date, ISO string, or ms timestamp. Received: ${typeof value}`
        )
    }

    if (Number.isNaN(date.getTime())) {
        throw new TypeError(
            `[normalize:date] Could not parse into a valid date. Received: ${JSON.stringify(value)}`
        )
    }

    const { locale = 'pt-BR', ...formatOptions } = options
    return new Intl.DateTimeFormat(locale, formatOptions).format(date)
}
