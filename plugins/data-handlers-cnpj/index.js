import { createPlugin } from '../../src/main.js'

/**
 * Validates a Brazilian CNPJ number using the official verification digit algorithm.
 *
 * @param {string} cnpj - Raw CNPJ string (formatted or digits only).
 * @returns {boolean}
 */
const isValidCNPJ = (cnpj) => {
    const digits = cnpj.replace(/\D/g, '')

    if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false

    const calc = (factor) => {
        let sum = 0
        let pos = factor - 7

        for (let i = factor; i >= 1; i--) {
            sum += Number(digits[factor - i]) * pos--
            if (pos < 2) pos = 9
        }

        return sum % 11 < 2 ? 0 : 11 - (sum % 11)
    }

    return (
        calc(12) === Number(digits[12]) &&
        calc(13) === Number(digits[13])
    )
}

/**
 * Validates and formats a Brazilian CNPJ number.
 *
 * @param {string|number} value - Raw CNPJ (formatted or digits only).
 * @returns {string} Formatted CNPJ: `00.000.000/0000-00`.
 * @throws {TypeError} If the CNPJ is invalid.
 *
 * @example
 * cnpjHandler('11222333000181')       // → '11.222.333/0001-81'
 * cnpjHandler('11.222.333/0001-81')   // → '11.222.333/0001-81'
 */
const cnpjHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')

    if (!isValidCNPJ(digits)) {
        throw new TypeError(
            `[normalize:cnpj] Invalid CNPJ. Received: ${value}`
        )
    }

    return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5'
    )
}

createPlugin('cnpj', cnpjHandler)
