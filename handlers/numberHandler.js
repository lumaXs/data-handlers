/**
 * Formata um número finito em string localizada.
 *
 * Erros distintos e acionáveis:
 *   TypeError  – value não é do tipo number
 *   RangeError – value é NaN ou Infinity
 *
 * @param {number} value
 * @param {{ locale?: string } & Intl.NumberFormatOptions} [options]
 * @returns {string}
 *
 * @example
 * numberHandler(1234567.89, { style: 'currency', currency: 'BRL', locale: 'pt-BR' })
 * // 'R$ 1.234.567,89'
 *
 * @example
 * numberHandler(0.42, { style: 'percent' })
 * // '42%'
 */
export const numberHandler = (value, options = {}) => {
    if (typeof value !== 'number') {
        throw new TypeError(
            `[normalize:number] Expected a number. Received: ${typeof value}`
        )
    }
    if (!Number.isFinite(value)) {
        throw new RangeError(
            `[normalize:number] Value must be a finite number. Received: ${value}`
        )
    }

    const { locale = 'pt-BR', ...formatOptions } = options
    return new Intl.NumberFormat(locale, formatOptions).format(value)
}
