import { registry, formatType, register, registerAliases, createPlugin } from './src/main.js';
import './plugins/index.js';
// ─── Core exports ─────────────────────────────────────────────────────────────
export { registry, formatType, register, registerAliases, createPlugin };
export { handlers } from './api/handlers.js';
export { Schema, schema, SchemaError } from './schema/index.js';
/**
 * Normaliza um valor usando o handler do tipo. Lança se inválido.
 *
 * @example
 * normalize({ type: 'name', value: '  joao  ' }) // 'Joao'
 */
export function normalize({ type, value, options }) {
    const key = formatType(type);
    const handler = registry.get(key);
    if (!handler) {
        throw new TypeError(`[normalize] Unknown type: ${key}. Available: ${[...registry.keys()].join(', ')}.`);
    }
    return handler(value, options);
}
/**
 * Valida sem lançar. Retorna `{ valid, value, error }`.
 *
 * @example
 * validate({ type: 'cpf', value: '111.444.777-35' })
 * // { valid: true, value: '111.444.777-35', error: null }
 */
export function validate({ type, value, options }) {
    try {
        const result = normalize({ type, value, ...(options !== undefined ? { options } : {}) });
        return { valid: true, value: result, error: null };
    }
    catch (err) {
        return { valid: false, value: null, error: err.message };
    }
}
//# sourceMappingURL=index.js.map