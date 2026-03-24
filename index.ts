import { registry, formatType, register, registerAliases, createPlugin } from './src/main.js'
import './plugins/index.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type { HandlerFn }                              from './src/main.js'
export type { ValidateResult, TypeAccessor,
              HandlersMeta, HandlersProxy }            from './api/handlers.js'
export type { FieldConfig, SchemaShape,
              InferSchema, SchemaParseResult }         from './schema/index.js'
export type { NameHandlerOptions }                     from './handlers/nameHandler.js'
export type { NumberHandlerOptions }                   from './handlers/numberHandler.js'
export type { DateHandlerOptions, DateInput }          from './handlers/dateHandler.js'
export type { PasswordHandlerOptions }                 from './handlers/passwordHandler.js'
export type { UrlHandlerOptions }                      from './handlers/urlHandler.js'
export type { UuidHandlerOptions }                     from './handlers/uuidHandler.js'
export type { AnyHandlerOptions }                      from './handlers/anyHandler.js'
export type { EmailHandlerOptions }                    from './plugins/data-handlers-email/index.js'
export type { SlugHandlerOptions }                     from './plugins/data-handlers-slug/index.js'
export type { ColorHandlerOptions }                    from './plugins/data-handlers-color/index.js'
export type { RgHandlerOptions }                       from './plugins/data-handlers-rg/index.js'

// ─── Core exports ─────────────────────────────────────────────────────────────

export { registry, formatType, register, registerAliases, createPlugin }
export { handlers }                  from './api/handlers.js'
export { Schema, schema, SchemaError } from './schema/index.js'

// ─── Top-level helpers ────────────────────────────────────────────────────────

export interface NormalizeParams<TValue = unknown> {
  type: string
  value: TValue
  options?: Record<string, unknown>
}

export interface ValidateParams<TValue = unknown> {
  type: string
  value: TValue
  options?: Record<string, unknown>
}

/**
 * Normaliza um valor usando o handler do tipo. Lança se inválido.
 *
 * @example
 * normalize({ type: 'name', value: '  joao  ' }) // 'Joao'
 */
export function normalize<TValue = unknown>({ type, value, options }: NormalizeParams<TValue>): string {
  const key = formatType(type)
  const handler = registry.get(key)
  if (!handler) {
    throw new TypeError(
      `[normalize] Unknown type: ${key}. Available: ${[...registry.keys()].join(', ')}.`,
    )
  }
  return handler(value, options) as string
}

/**
 * Valida sem lançar. Retorna `{ valid, value, error }`.
 *
 * @example
 * validate({ type: 'cpf', value: '111.444.777-35' })
 * // { valid: true, value: '111.444.777-35', error: null }
 */
export function validate<TValue = unknown>({ type, value, options }: ValidateParams<TValue>) {
  try {
    const result = normalize({ type, value, ...(options !== undefined ? { options } : {}) })
    return { valid: true, value: result, error: null }
  } catch (err) {
    return { valid: false, value: null, error: (err as Error).message }
  }
}
