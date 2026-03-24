import { registry, formatType } from '../src/main.js';
// ─── SchemaError ──────────────────────────────────────────────────────────────
/**
 * Erro lançado por Schema.parse() quando a validação falha.
 *
 * @example
 * try {
 *   userSchema.parse({ name: '' })
 * } catch (err) {
 *   if (err instanceof SchemaError) console.log(err.errors)
 * }
 */
export class SchemaError extends Error {
    errors;
    constructor(errors) {
        const detail = Object.entries(errors)
            .map(([k, v]) => `  ${k}: ${v}`)
            .join('\n');
        super(`SchemaError: Validation failed:\n${detail}`);
        this.name = 'SchemaError';
        this.errors = errors;
    }
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveField(field) {
    if (typeof field === 'string')
        return { type: field };
    if (field && typeof field === 'object' && typeof field.type === 'string')
        return field;
    throw new TypeError('[schema] Field must be a type string or { type, optional, default, options }');
}
// ─── Schema class ─────────────────────────────────────────────────────────────
/**
 * Schema de validação/normalização de objetos.
 *
 * @example
 * const userSchema = new Schema({
 *   name:     'name',
 *   document: 'cpf',
 *   phone:    { type: 'phone', optional: true },
 *   amount:   { type: 'number', options: { style: 'currency', currency: 'BRL', locale: 'pt-BR' } }
 * })
 *
 * userSchema.parse({ name: 'JOAO SILVA', document: '11144477735', amount: 99.9 })
 * // { name: 'Joao Silva', document: '111.444.777-35', amount: 'R$ 99,90' }
 */
export class Schema {
    #shape;
    #fields;
    constructor(shape) {
        this.#shape = shape;
        this.#fields = {};
        // Fail fast: valida o shape em tempo de definição
        for (const [key, def] of Object.entries(shape)) {
            this.#fields[key] = resolveField(def);
            const typeKey = formatType(this.#fields[key].type);
            if (!registry.has(typeKey)) {
                throw new TypeError(`[schema] Unknown type "${typeKey}" for field "${key}". ` +
                    `Available: ${[...registry.keys()].join(', ')}.`);
            }
        }
    }
    // ─── Public ─────────────────────────────────────────────────────────────────
    get fields() {
        return { ...this.#fields };
    }
    /**
     * Normaliza sem lançar. Retorna `{ success, data, errors }`.
     */
    safeParse(input) {
        if (input === null || typeof input !== 'object') {
            return {
                success: false,
                data: null,
                errors: { _input: '[schema] Expected a plain object.' },
            };
        }
        const raw = input;
        const data = {};
        const errors = {};
        for (const [key, field] of Object.entries(this.#fields)) {
            const typeKey = formatType(field.type);
            const handler = registry.get(typeKey);
            let value = raw[key];
            if (value === undefined && 'default' in field)
                value = field.default;
            if ((value === undefined || value === null) && field.optional) {
                data[key] = value ?? null;
                continue;
            }
            if (value === undefined || value === null) {
                const label = field.label ?? key;
                errors[key] = `[schema:${typeKey}] Field "${label}" is required.`;
                continue;
            }
            try {
                data[key] = handler(value, field.options);
            }
            catch (err) {
                errors[key] = err.message;
            }
        }
        if (Object.keys(errors).length > 0) {
            return { success: false, data: null, errors };
        }
        return { success: true, data: data, errors: null };
    }
    /**
     * Normaliza e retorna o objeto tipado. Lança SchemaError se inválido.
     */
    parse(input) {
        const result = this.safeParse(input);
        if (!result.success)
            throw new SchemaError(result.errors);
        return result.data;
    }
    /**
     * Estende o schema com campos adicionais. Imutável — retorna novo Schema.
     */
    extend(extra) {
        return new Schema({ ...this.#shape, ...extra });
    }
    /**
     * Retorna novo Schema com apenas os campos especificados.
     */
    pick(...keys) {
        const picked = {};
        for (const k of keys) {
            if (this.#shape[k] !== undefined)
                picked[k] = this.#shape[k];
        }
        return new Schema(picked);
    }
    /**
     * Retorna novo Schema sem os campos especificados.
     */
    omit(...keys) {
        const result = { ...this.#shape };
        for (const k of keys)
            delete result[k];
        return new Schema(result);
    }
    /**
     * Retorna novo Schema com todos os campos marcados como optional.
     * Útil para PATCH parcial.
     */
    partial() {
        const partialShape = {};
        for (const [k, v] of Object.entries(this.#shape)) {
            ;
            partialShape[k] = {
                ...resolveField(v),
                optional: true,
            };
        }
        return new Schema(partialShape);
    }
}
// ─── Factory (backward compat) ────────────────────────────────────────────────
/**
 * Factory para criar um Schema. Equivalente a `new Schema(shape)`.
 * Mantido para compatibilidade com a API anterior.
 *
 * @example
 * const userSchema = schema({ name: 'name', email: 'email' })
 * // equivalente a:
 * const userSchema = new Schema({ name: 'name', email: 'email' })
 */
export function schema(shape) {
    return new Schema(shape);
}
//# sourceMappingURL=index.js.map