import { nameHandler }   from '../handlers/nameHandler.js'
import { numberHandler } from '../handlers/numberHandler.js'
import { dateHandler }   from '../handlers/dateHandler.js'

/**
 * Normaliza o identificador de tipo: trim + lowercase.
 * Toda a API é case-insensitive por design.
 * handlers.Name === handlers.name === handlers.NAME
 *
 * @param {string} type
 * @returns {string}
 */
export const formatType = (type) => {
    if (typeof type !== 'string') {
        throw new TypeError('[normalize] Type must be a string')
    }
    return type.trim().toLowerCase()
}

/**
 * Registry central: chave normalizada -> handler.
 * Tipos embutidos: 'name', 'number', 'date'.
 * @type {Map<string, Function>}
 */
export const registry = new Map([
    ['name',   nameHandler],
    ['number', numberHandler],
    ['date',   dateHandler],
])

/**
 * Registra um handler para um tipo (sobrescreve se já existir).
 * @param {string}   type
 * @param {Function} handler
 */
export function register(type, handler) {
    if (typeof handler !== 'function') {
        throw new TypeError('[normalize] Handler must be a function')
    }
    registry.set(formatType(type), handler)
}

/**
 * Mapeia aliases extras para o mesmo handler de um tipo já registrado.
 *
 * @param {string}    type    - Tipo principal já registrado
 * @param {...string} aliases - Aliases adicionais
 * @throws {TypeError} Se o tipo principal não existir
 *
 * @example
 * registerAliases('name', 'nome', 'fullName')
 * handlers.nome.normalize('joao silva') // 'Joao Silva'
 */
export function registerAliases(type, ...aliases) {
    const key = formatType(type)
    const handler = registry.get(key)
    if (!handler) {
        throw new TypeError(
            `[normalize] Cannot alias unknown type: "${key}". Register it first.`
        )
    }
    for (const alias of aliases) {
        registry.set(formatType(alias), handler)
    }
}

/**
 * Alias semântico de register() para autores de plugins.
 * @type {typeof register}
 */
export const createPlugin = register
