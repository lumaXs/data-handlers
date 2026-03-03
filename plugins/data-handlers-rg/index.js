import { createPlugin } from '../../src/main.js'

/**
 * Formata um RG brasileiro (Registro Geral).
 * Suporta RGs de 7, 8 e 9 dígitos (variam por estado).
 * Formato padrão SP: 00.000.000-X
 *
 * @param {string|number} value - RG bruto (com ou sem formatação)
 * @param {{ format?: 'sp' | 'digits' }} [options]
 * @returns {string} RG formatado
 * @throws {TypeError}
 *
 * @example
 * rgHandler('123456789')   // '12.345.678-9'
 * rgHandler('12.345.678-9') // '12.345.678-9'
 * rgHandler('12345678X')   // '12.345.678-X'
 */
const rgHandler = (value, options = {}) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(`[normalize:rg] Expected string or number. Received: ${typeof value}`)
    }

    const raw = String(value).trim().toUpperCase().replace(/[.\-\s]/g, '')

    // RG pode terminar em X (dígito verificador)
    if (!/^\d{7,9}$|^\d{8}X$/.test(raw)) {
        throw new TypeError(
            `[normalize:rg] Invalid RG format. Expected 7-9 digits (optionally ending in X). Received: ${value}`
        )
    }

    if (options.format === 'digits') return raw

    // Formata no padrão SP: 00.000.000-X
    const digits = raw.slice(0, -1)
    const last   = raw.slice(-1)
    const padded = digits.padStart(8, '0')
    return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5, 8)}-${last}`
}

createPlugin('rg', rgHandler)
