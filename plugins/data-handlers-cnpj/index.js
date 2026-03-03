import { createPlugin } from '../../src/main.js'

/**
 * Valida CNPJ brasileiro usando o algoritmo oficial de dígito verificador.
 * @param {string} cnpj
 * @returns {boolean}
 */
const isValidCNPJ = (cnpj) => {
    const d = cnpj.replace(/\D/g, '')
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
    const calc = (factor) => {
        let sum = 0, pos = factor - 7
        for (let i = factor; i >= 1; i--) {
            sum += Number(d[factor - i]) * pos--
            if (pos < 2) pos = 9
        }
        return sum % 11 < 2 ? 0 : 11 - (sum % 11)
    }
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}

/**
 * Valida e formata um CNPJ brasileiro.
 *
 * @param {string|number} value - CNPJ bruto (com ou sem formatação)
 * @returns {string} CNPJ formatado: 00.000.000/0000-00
 * @throws {TypeError}
 *
 * @example
 * cnpjHandler('11222333000181')     // '11.222.333/0001-81'
 * cnpjHandler('11.222.333/0001-81') // '11.222.333/0001-81'
 */
const cnpjHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')
    if (!isValidCNPJ(digits)) {
        throw new TypeError(`[normalize:cnpj] Invalid CNPJ. Received: ${value}`)
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

createPlugin('cnpj', cnpjHandler)
