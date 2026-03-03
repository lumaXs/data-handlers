import { nameHandler } from '../handlers/nameHandler.js'
import { numberHandler } from '../handlers/numberHandler.js'
import { dateHandler } from '../handlers/dateHandler.js'

/**
 * Normalizes a type identifier to a lowercase trimmed string.
 *
 * @param {string} type - The type identifier to format.
 * @returns {string} The trimmed, lowercased type string.
 * @throws {TypeError} If `type` is not a string.
 *
 * @example
 * formatType('  Name  ') // → 'name'
 */
export const formatType = (type) => {
    if (typeof type !== 'string') {
        throw new TypeError('[normalize] Type must be a string')
    }

    return type.trim().toLowerCase()
}

/**
 * Registry mapping type keys to their corresponding handler functions.
 * Built-in types: `'name'`, `'number'`, `'date'`.
 * Can be extended at runtime via {@link register} or {@link createPlugin}.
 *
 * @type {Map<string, Function>}
 */
export const registry = new Map([
    ['name', nameHandler],
    ['number', numberHandler],
    ['date', dateHandler],
])

/**
 * Registers a custom handler for a given type.
 * Overwrites the existing handler if the type is already registered.
 *
 * @param {string} type - The type identifier to register (case-insensitive, trimmed).
 * @param {Function} handler - The handler function to associate with the type.
 * @throws {TypeError} If `handler` is not a function.
 *
 * @example
 * register('phone', (value) => value.replace(/\D/g, ''))
 */
export function register(type, handler) {
    if (typeof handler !== 'function') {
        throw new TypeError('[normalize] Handler must be a function')
    }

    const key = formatType(type)
    registry.set(key, handler)
}

/**
 * Semantic alias for {@link register}. Intended for plugin authors.
 * Prefer this when publishing a standalone `data-handlers-*` plugin.
 *
 * @type {typeof register}
 *
 * @example
 * // inside data-handlers-cpf
 * import { createPlugin } from 'data-handlers'
 * createPlugin('cpf', cpfHandler)
 */
export const createPlugin = register
