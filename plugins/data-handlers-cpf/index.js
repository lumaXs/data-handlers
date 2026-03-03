import { createPlugin } from '../../src/main.js'

/**
 * Valida CPF brasileiro usando o algoritmo oficial de dígito verificador.
 * @param {string} cpf
 * @returns {boolean}
 */
const isValidCPF = (cpf) => {
    const d = cpf.replace(/\D/g, '')
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
    const calc = (f) => d.slice(0, f - 1).split('').reduce((s, v, i) => s + Number(v) * (f - i), 0)
    const mod  = (n) => ((n * 10) % 11) % 10
    return mod(calc(10)) === Number(d[9]) && mod(calc(11)) === Number(d[10])
}

/**
 * Valida e formata um CPF brasileiro.
 *
 * @param {string|number} value - CPF bruto (com ou sem formatação)
 * @returns {string} CPF formatado: 000.000.000-00
 * @throws {TypeError}
 *
 * @example
 * cpfHandler('11144477735')    // '111.444.777-35'
 * cpfHandler('111.444.777-35') // '111.444.777-35'
 */
const cpfHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')
    if (!isValidCPF(digits)) {
        throw new TypeError(`[normalize:cpf] Invalid CPF. Received: ${value}`)
    }
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

createPlugin('cpf', cpfHandler)
