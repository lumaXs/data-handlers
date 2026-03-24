/**
 * Formata um número finito em string localizada.
 *
 * @example
 * numberHandler(1234567.89, { style: 'currency', currency: 'BRL', locale: 'pt-BR' })
 * // 'R$ 1.234.567,89'
 */
export const numberHandler = (value, options = {}) => {
    if (typeof value !== 'number') {
        throw new TypeError(`[normalize:number] Expected a number. Received: ${typeof value}`);
    }
    if (!Number.isFinite(value)) {
        throw new RangeError(`[normalize:number] Value must be a finite number. Received: ${value}`);
    }
    const { locale = 'pt-BR', ...formatOptions } = options;
    return new Intl.NumberFormat(locale, formatOptions).format(value);
};
//# sourceMappingURL=numberHandler.js.map