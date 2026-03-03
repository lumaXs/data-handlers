import { registry, formatType, register, registerAliases, createPlugin } from './src/main.js'
import './plugins/index.js'

/**
 * Normaliza um valor usando o handler registrado para o tipo fornecido.
 *
 * @param {{ type: string, value: *, options?: Object }} params
 * @returns {string}
 * @throws {TypeError}
 *
 * @example
 * normalize({ type: 'name', value: '  joao  ' }) // 'Joao'
 * normalize({ type: 'date', value: new Date(), options: { dateStyle: 'long', locale: 'pt-BR' } })
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
 * Valida um valor sem lançar. Retorna { valid, value, error }.
 *
 * @param {{ type: string, value: *, options?: Object }} params
 * @returns {{ valid: boolean, value: string|null, error: string|null }}
 *
 * @example
 * validate({ type: 'cpf', value: '111.444.777-35' })
 * // { valid: true, value: '111.444.777-35', error: null }
 */
export function validate({ type, value, options }) {
    try {
        const result = normalize({ type, value, options })
        return { valid: true, value: result, error: null }
    } catch (err) {
        return { valid: false, value: null, error: err.message }
    }
}

export { handlers }               from './api/handlers.js'
export { schema, SchemaError }    from './schema/index.js'
export { registry, formatType, register, registerAliases, createPlugin }
