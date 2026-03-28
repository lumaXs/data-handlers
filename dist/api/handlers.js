import { registry, formatType } from '../src/main.js';
// ─── Cache ────────────────────────────────────────────────────────────────────
const accessorCache = new Map();
function buildAccessor(type) {
    const normalize = (value, options) => {
        const handler = registry.get(type);
        if (!handler) {
            throw new TypeError(`[normalize] Unknown type: "${type}". Available: ${[...registry.keys()].join(', ')}.`);
        }
        return handler(value, options);
    };
    const validate = (value, options) => {
        try {
            return { valid: true, value: normalize(value, options), error: null };
        }
        catch (err) {
            return { valid: false, value: null, error: err.message };
        }
    };
    return Object.freeze({
        normalize,
        validate,
        parse: normalize,
        safe: validate,
    });
}
function getAccessor(type) {
    if (!accessorCache.has(type)) {
        accessorCache.set(type, buildAccessor(type));
    }
    return accessorCache.get(type);
}
// ─── Meta ─────────────────────────────────────────────────────────────────────
const meta = Object.freeze({
    get types() {
        return [...registry.keys()];
    },
    has(type) {
        return registry.has(formatType(type));
    },
});
// ─── Proxy ────────────────────────────────────────────────────────────────────
/**
 * Proxy fluente e case-insensitive para todos os handlers registrados.
 *
 * @example
 * handlers.name.normalize('  joao  ')     // 'Joao'
 * handlers.cpf.safe('111.444.777-35')     // { valid: true, ... }
 * handlers.has('cpf')                     // true
 * handlers.$.types                        // ['name', 'number', ...]
 */
export const handlers = new Proxy({}, {
    get(_, prop) {
        if (typeof prop !== 'string')
            return undefined;
        if (prop === '$')
            return meta;
        if (prop === 'types')
            return meta.types;
        if (prop === 'has')
            return (t) => registry.has(formatType(t));
        return getAccessor(formatType(prop));
    },
    set() {
        throw new TypeError('[handlers] Direct assignment not allowed. Use register() or registerAliases().');
    },
    has(_, prop) {
        if (typeof prop !== 'string')
            return false;
        if (['$', 'types', 'has'].includes(prop))
            return true;
        return registry.has(formatType(prop));
    },
    ownKeys() {
        return [...registry.keys(), '$', 'types', 'has'];
    },
    getOwnPropertyDescriptor(_, prop) {
        if (typeof prop === 'string') {
            const key = formatType(prop);
            if (registry.has(key) || ['$', 'types', 'has'].includes(prop)) {
                return { configurable: true, enumerable: true, writable: false };
            }
        }
        return undefined;
    },
});
//# sourceMappingURL=handlers.js.map