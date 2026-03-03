import { createPlugin } from '../../src/main.js'

/**
 * Formats a Brazilian ZIP code (CEP).
 *
 * @param {string|number} value - Raw CEP (formatted or digits only).
 * @returns {string} Formatted CEP: `00000-000`.
 * @throws {TypeError} If the CEP does not contain exactly 8 digits.
 *
 * @example
 * cepHandler('01310100')   // → '01310-100'
 * cepHandler('01310-100')  // → '01310-100'
 */
const cepHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')

    if (digits.length !== 8) {
        throw new TypeError(
            `[normalize:cep] Expected 8 digit CEP. Received: ${value}`
        )
    }

    return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
}

createPlugin('cep', cepHandler)
