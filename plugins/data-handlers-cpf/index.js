import { createPlugin } from '../../src/main.js'

/**
 * Validates a Brazilian CPF number using the official verification digit algorithm.
 *
 * @param {string} cpf - Raw CPF string (formatted or digits only).
 * @returns {boolean}
 */
const isValidCPF = (cpf) => {
    const digits = cpf.replace(/\D/g, '')

    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

    const calc = (factor) =>
        digits
            .slice(0, factor - 1)
            .split('')
            .reduce((sum, d, i) => sum + Number(d) * (factor - i), 0)

    const mod = (n) => ((n * 10) % 11) % 10

    return (
        mod(calc(10)) === Number(digits[9]) &&
        mod(calc(11)) === Number(digits[10])
    )
}

/**
 * Validates and formats a Brazilian CPF number.
 *
 * @param {string|number} value - Raw CPF (formatted or digits only).
 * @returns {string} Formatted CPF: `000.000.000-00`.
 * @throws {TypeError} If the CPF is invalid.
 *
 * @example
 * cpfHandler('11144477735')   // → '111.444.777-35'
 * cpfHandler('111.444.777-35') // → '111.444.777-35'
 */
const cpfHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')

    if (!isValidCPF(digits)) {
        throw new TypeError(
            `[normalize:cpf] Invalid CPF. Received: ${value}`
        )
    }

    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

createPlugin('cpf', cpfHandler)
