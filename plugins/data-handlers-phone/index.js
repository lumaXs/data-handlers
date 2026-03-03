import { createPlugin } from '../../src/main.js'

/**
 * Formata número de telefone brasileiro.
 * Suporta fixo (10 dígitos) e celular (11 dígitos).
 *
 * @param {string|number} value - Número bruto (com ou sem formatação)
 * @returns {string} Telefone formatado: (00) 0000-0000 ou (00) 00000-0000
 * @throws {TypeError}
 *
 * @example
 * phoneHandler('11987654321')     // '(11) 98765-4321'
 * phoneHandler('1134567890')      // '(11) 3456-7890'
 */
const phoneHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')
    if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    throw new TypeError(
        `[normalize:phone] Expected 10 or 11-digit Brazilian phone number. Received: ${value}`
    )
}

createPlugin('phone', phoneHandler)
