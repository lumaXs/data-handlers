import { nameHandler } from '../handlers/nameHandler.js';
import { numberHandler } from '../handlers/numberHandler.js';
import { dateHandler } from '../handlers/dateHandler.js';
import { passwordHandler } from '../handlers/passwordHandler.js';
import { urlHandler } from '../handlers/urlHandler.js';
import { uuidHandler } from '../handlers/uuidHandler.js';
import { anyHandler } from '../handlers/anyHandler.js';
// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Normaliza o identificador de tipo: trim + lowercase.
 * Toda a API é case-insensitive por design.
 */
export function formatType(type) {
    if (typeof type !== 'string') {
        throw new TypeError('[normalize] Type must be a string');
    }
    return type.trim().toLowerCase();
}
// ─── Registry ─────────────────────────────────────────────────────────────────
/**
 * Registry central: chave normalizada → handler.
 * Tipos embutidos: 'name', 'number', 'date', 'password', 'url', 'uuid', 'any'.
 */
export const registry = new Map([
    ['name', nameHandler],
    ['number', numberHandler],
    ['date', dateHandler],
    ['password', passwordHandler],
    ['url', urlHandler],
    ['uuid', uuidHandler],
    ['any', anyHandler],
]);
/**
 * Registra um handler para um tipo (sobrescreve se já existir).
 */
export function register(type, handler) {
    if (typeof handler !== 'function') {
        throw new TypeError('[normalize] Handler must be a function');
    }
    registry.set(formatType(type), handler);
}
/**
 * Mapeia aliases extras para o mesmo handler de um tipo já registrado.
 *
 * @example
 * registerAliases('name', 'nome', 'fullName')
 */
export function registerAliases(type, ...aliases) {
    const key = formatType(type);
    const handler = registry.get(key);
    if (!handler) {
        throw new TypeError(`[normalize] Cannot alias unknown type: "${key}". Register it first.`);
    }
    for (const alias of aliases) {
        registry.set(formatType(alias), handler);
    }
}
/** Alias semântico de register() para autores de plugins. */
export const createPlugin = register;
//# sourceMappingURL=main.js.map