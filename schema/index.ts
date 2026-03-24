import { registry, formatType } from '../src/main.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldConfig {
  type: string
  optional?: boolean
  default?: unknown
  options?: Record<string, unknown>
  label?: string
}

export type SchemaShape = Record<string, string | FieldConfig>

type FieldOutput<F extends string | FieldConfig> =
  F extends string
    ? string
    : F extends { optional: true; default: unknown }
      ? string
      : F extends { optional: true }
        ? string | null
        : string

type RequiredKeys<TShape extends SchemaShape> = {
  [K in keyof TShape]: TShape[K] extends { optional: true }
    ? TShape[K] extends { default: unknown } ? K : never
    : K
}[keyof TShape]

type OptionalKeys<TShape extends SchemaShape> = {
  [K in keyof TShape]: TShape[K] extends { optional: true }
    ? TShape[K] extends { default: unknown } ? never : K
    : never
}[keyof TShape]

export type InferSchema<TShape extends SchemaShape> =
  { [K in RequiredKeys<TShape> & string]:  FieldOutput<TShape[K]> } &
  { [K in OptionalKeys<TShape> & string]?: FieldOutput<TShape[K]> }

export type SchemaParseResult<T = Record<string, string>> =
  | { success: true;  data: T;    errors: null }
  | { success: false; data: null; errors: Record<string, string> }

type MakePartialShape<TShape extends SchemaShape> = {
  [K in keyof TShape]: TShape[K] extends string
    ? { type: TShape[K]; optional: true }
    : TShape[K] extends FieldConfig
      ? TShape[K] & { optional: true }
      : never
}

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
  errors: Record<string, string>

  constructor(errors: Record<string, string>) {
    const detail = Object.entries(errors)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')
    super(`SchemaError: Validation failed:\n${detail}`)
    this.name   = 'SchemaError'
    this.errors = errors
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveField(field: string | FieldConfig): FieldConfig {
  if (typeof field === 'string') return { type: field }
  if (field && typeof field === 'object' && typeof field.type === 'string') return field
  throw new TypeError(
    '[schema] Field must be a type string or { type, optional, default, options }',
  )
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
export class Schema<TShape extends SchemaShape> {
  #shape:  TShape
  #fields: Record<string, FieldConfig>

  constructor(shape: TShape) {
    this.#shape  = shape
    this.#fields = {}

    // Fail fast: valida o shape em tempo de definição
    for (const [key, def] of Object.entries(shape)) {
      this.#fields[key] = resolveField(def)
      const typeKey = formatType(this.#fields[key].type)
      if (!registry.has(typeKey)) {
        throw new TypeError(
          `[schema] Unknown type "${typeKey}" for field "${key}". ` +
          `Available: ${[...registry.keys()].join(', ')}.`,
        )
      }
    }
  }

  // ─── Public ─────────────────────────────────────────────────────────────────

  get fields(): Record<string, FieldConfig> {
    return { ...this.#fields }
  }

  /**
   * Normaliza sem lançar. Retorna `{ success, data, errors }`.
   */
  safeParse(input: unknown): SchemaParseResult<InferSchema<TShape>> {
    if (input === null || typeof input !== 'object') {
      return {
        success: false,
        data:    null,
        errors:  { _input: '[schema] Expected a plain object.' },
      }
    }

    const raw    = input as Record<string, unknown>
    const data   = {} as Record<string, unknown>
    const errors = {} as Record<string, string>

    for (const [key, field] of Object.entries(this.#fields)) {
      const typeKey = formatType(field.type)
      const handler = registry.get(typeKey)!
      let   value   = raw[key]

      if (value === undefined && 'default' in field) value = field.default

      if ((value === undefined || value === null) && field.optional) {
        data[key] = value ?? null
        continue
      }

      if (value === undefined || value === null) {
        const label = field.label ?? key
        errors[key] = `[schema:${typeKey}] Field "${label}" is required.`
        continue
      }

      try {
        data[key] = handler(value, field.options)
      } catch (err) {
        errors[key] = (err as Error).message
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, data: null, errors }
    }

    return { success: true, data: data as InferSchema<TShape>, errors: null }
  }

  /**
   * Normaliza e retorna o objeto tipado. Lança SchemaError se inválido.
   */
  parse(input: unknown): InferSchema<TShape> {
    const result = this.safeParse(input)
    if (!result.success) throw new SchemaError(result.errors)
    return result.data
  }

  /**
   * Estende o schema com campos adicionais. Imutável — retorna novo Schema.
   */
  extend<TExtra extends SchemaShape>(extra: TExtra): Schema<Omit<TShape, keyof TExtra> & TExtra> {
    return new Schema({ ...this.#shape, ...extra } as Omit<TShape, keyof TExtra> & TExtra)
  }

  /**
   * Retorna novo Schema com apenas os campos especificados.
   */
  pick<K extends keyof TShape & string>(...keys: K[]): Schema<Pick<TShape, K>> {
    const picked = {} as Pick<TShape, K>
    for (const k of keys) {
      if (this.#shape[k] !== undefined) picked[k] = this.#shape[k]
    }
    return new Schema(picked)
  }

  /**
   * Retorna novo Schema sem os campos especificados.
   */
  omit<K extends keyof TShape & string>(...keys: K[]): Schema<Omit<TShape, K>> {
    const result = { ...this.#shape }
    for (const k of keys) delete result[k]
    return new Schema(result as Omit<TShape, K>)
  }

  /**
   * Retorna novo Schema com todos os campos marcados como optional.
   * Útil para PATCH parcial.
   */
  partial(): Schema<MakePartialShape<TShape>> {
    const partialShape = {} as MakePartialShape<TShape>
    for (const [k, v] of Object.entries(this.#shape)) {
      ;(partialShape as Record<string, unknown>)[k] = {
        ...resolveField(v),
        optional: true,
      }
    }
    return new Schema(partialShape)
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
export function schema<TShape extends SchemaShape>(shape: TShape): Schema<TShape> {
  return new Schema(shape)
}
