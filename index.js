import { registry, formatType, register, createPlugin } from './src/main.js'
import './plugins/index.js'

/**
 * Normalizes a value using the handler registered for the given type.
 *
 * @param {Object} params - The normalization parameters.
 * @param {string} params.type - The type identifier (e.g. `'name'`, `'number'`, `'date'`).
 * @param {*} params.value - The value to normalize.
 * @param {Object} [params.options] - Optional options forwarded to the handler.
 * @returns {string} The normalized/formatted value.
 * @throws {TypeError} If the type is unknown or the value fails handler validation.
 *
 * @example
 * normalize({ type: 'name', value: '  john doe  ' })
 * // → 'John Doe'
 *
 * @example
 * normalize({ type: 'date', value: '2024-01-15', options: { locale: 'pt-BR', dateStyle: 'short' } })
 * // → '15/01/2024'
 */
export function normalize({ type, value, options }) {
    const key = formatType(type)
    const handler = registry.get(key)

    if (!handler) {
        throw new TypeError(
            `[normalize] Unknown type: ${key}. Available: ${[...registry.keys()].join(', ')}.`
        )
    }

    return handler(value, options)
}

/**
 * Validates a value against the handler registered for the given type,
 * without throwing. Returns a result object instead.
 *
 * @param {Object} params - The validation parameters.
 * @param {string} params.type - The type identifier.
 * @param {*} params.value - The value to validate.
 * @param {Object} [params.options] - Optional options forwarded to the handler.
 * @returns {{ valid: boolean, value: string|null, error: string|null }}
 *
 * @example
 * validate({ type: 'cpf', value: '111.444.777-35' })
 * // → { valid: true, value: '111.444.777-35', error: null }
 *
 * @example
 * validate({ type: 'cpf', value: '000.000.000-00' })
 * // → { valid: false, value: null, error: '[normalize:cpf] Invalid CPF.' }
 */
export function validate({ type, value, options }) {
    try {
        const result = normalize({ type, value, options })
        return { valid: true, value: result, error: null }
    } catch (err) {
        return { valid: false, value: null, error: err.message }
    }
}

export { registry, formatType, register, createPlugin }
