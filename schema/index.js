import { registry, formatType } from '../src/main.js'

/**
 * Erro lançado por schema.parse() quando a validação falha.
 * Contém `.errors` com o mapa campo → mensagem.
 *
 * @example
 * try {
 *   userSchema.parse({ name: '' })
 * } catch (err) {
 *   if (err instanceof SchemaError) console.log(err.errors)
 * }
 */
export class SchemaError extends Error {
    /**
     * @param {Object<string, string>} errors - Mapa campo → mensagem de erro
     */
    constructor(errors) {
        const detail = Object.entries(errors)
            .map(([k, v]) => `  ${k}: ${v}`)
            .join('\n')
        super(`SchemaError: Validation failed:\n${detail}`)
        this.name   = 'SchemaError'
        this.errors = errors
    }
}

/**
 * @typedef {Object} FieldConfig
 * @property {string}  type               - Tipo registrado (ex: 'name', 'cpf')
 * @property {boolean} [optional=false]   - Se true, campo undefined/null é permitido
 * @property {*}       [default]          - Valor padrão quando undefined
 * @property {Object}  [options]          - Opções repassadas ao handler
 * @property {string}  [label]            - Nome legível para mensagens de erro
 */

/**
 * @typedef {Object} SchemaParseResult
 * @property {boolean}                success
 * @property {Object|null}            data    - Objeto normalizado (se success)
 * @property {Object<string,string>|null} errors - Mapa campo->mensagem (se !success)
 */

/**
 * Define o schema de um campo. Aceita string curta ou objeto com opções.
 *
 * @param {string | FieldConfig} field
 * @returns {FieldConfig}
 */
function resolveField(field) {
    if (typeof field === 'string') {
        return { type: field }
    }
    if (field && typeof field === 'object' && typeof field.type === 'string') {
        return field
    }
    throw new TypeError('[schema] Field must be a type string or { type, optional, default, options }')
}

/**
 * Cria um schema de validação/normalização de objetos.
 *
 * @param {Object<string, string | FieldConfig>} shape - Definição dos campos
 * @returns {{ parse: Function, safeParse: Function, fields: Object }}
 *
 * @example
 * const userSchema = schema({
 *   name:     'name',
 *   document: 'cpf',
 *   phone:    { type: 'phone', optional: true },
 *   amount:   { type: 'number', options: { style: 'currency', currency: 'BRL', locale: 'pt-BR' } }
 * })
 *
 * userSchema.parse({ name: 'JOAO SILVA', document: '11144477735', amount: 99.9 })
 * // { name: 'Joao Silva', document: '111.444.777-35', amount: 'R$ 99,90' }
 *
 * userSchema.safeParse({ name: '', document: 'invalido' })
 * // { success: false, data: null, errors: { name: '...', document: '...' } }
 */
export function schema(shape) {
    // Pré-valida o shape em tempo de definição (fail fast)
    const fields = {}
    for (const [key, def] of Object.entries(shape)) {
        fields[key] = resolveField(def)
        const typeKey = formatType(fields[key].type)
        if (!registry.has(typeKey)) {
            throw new TypeError(
                `[schema] Unknown type "${typeKey}" for field "${key}". ` +
                `Available: ${[...registry.keys()].join(', ')}.`
            )
        }
    }

    /**
     * Executa o schema. Retorna o objeto normalizado ou lança SchemaError.
     *
     * @param {Object} input
     * @returns {Object} Objeto normalizado
     * @throws {SchemaError}
     */
    function parse(input) {
        const result = safeParse(input)
        if (!result.success) {
            throw new SchemaError(result.errors)
        }
        return result.data
    }

    /**
     * Executa o schema sem lançar. Retorna { success, data, errors }.
     *
     * @param {Object} input
     * @returns {SchemaParseResult}
     */
    function safeParse(input) {
        if (input === null || typeof input !== 'object') {
            return {
                success: false,
                data: null,
                errors: { _input: '[schema] Expected a plain object.' },
            }
        }

        const data   = {}
        const errors = {}

        for (const [key, field] of Object.entries(fields)) {
            const typeKey = formatType(field.type)
            const handler = registry.get(typeKey)
            let raw = input[key]

            // Aplica default se undefined
            if (raw === undefined && 'default' in field) {
                raw = field.default
            }

            // Campos opcionais: null/undefined passam sem normalização
            if ((raw === undefined || raw === null) && field.optional) {
                data[key] = raw ?? null
                continue
            }

            // Campo obrigatório ausente
            if (raw === undefined || raw === null) {
                const label = field.label ?? key
                errors[key] = `[schema:${typeKey}] Field "${label}" is required.`
                continue
            }

            try {
                data[key] = handler(raw, field.options)
            } catch (err) {
                errors[key] = err.message
            }
        }

        if (Object.keys(errors).length > 0) {
            return { success: false, data: null, errors }
        }

        return { success: true, data, errors: null }
    }

    /**
     * Retorna um novo schema com campos adicionais / sobrescritos.
     * Similar ao z.extend() do Zod.
     *
     * @param {Object<string, string | FieldConfig>} extraShape
     * @returns {ReturnType<schema>}
     */
    function extend(extraShape) {
        return schema({ ...shape, ...extraShape })
    }

    /**
     * Retorna um novo schema com apenas os campos especificados.
     *
     * @param {...string} keys
     * @returns {ReturnType<schema>}
     */
    function pick(...keys) {
        const picked = {}
        for (const k of keys) {
            if (shape[k] !== undefined) picked[k] = shape[k]
        }
        return schema(picked)
    }

    /**
     * Retorna um novo schema sem os campos especificados.
     *
     * @param {...string} keys
     * @returns {ReturnType<schema>}
     */
    function omit(...keys) {
        const omitted = { ...shape }
        for (const k of keys) delete omitted[k]
        return schema(omitted)
    }

    /**
     * Retorna o mesmo schema com todos os campos marcados como optional.
     * @returns {ReturnType<schema>}
     */
    function partial() {
        const partialShape = {}
        for (const [k, v] of Object.entries(shape)) {
            partialShape[k] = { ...resolveField(v), optional: true }
        }
        return schema(partialShape)
    }

    return Object.freeze({ parse, safeParse, extend, pick, omit, partial, fields })
}
