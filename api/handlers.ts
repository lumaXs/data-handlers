import { registry, formatType } from '../src/main.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidateResult {
  valid: boolean
  value: string | null
  error: string | null
}

export interface TypeAccessor {
  normalize(value: unknown, options?: Record<string, unknown>): string
  validate(value: unknown, options?: Record<string, unknown>): ValidateResult
  /** Alias de normalize */
  parse(value: unknown, options?: Record<string, unknown>): string
  /** Alias de validate */
  safe(value: unknown, options?: Record<string, unknown>): ValidateResult
}

export interface HandlersMeta {
  readonly types: string[]
  has(type: string): boolean
}

export type HandlersProxy = {
  readonly $: HandlersMeta
  readonly types: string[]
  has(type: string): boolean
} & Record<string, TypeAccessor>

// ─── Cache ────────────────────────────────────────────────────────────────────

const accessorCache = new Map<string, TypeAccessor>()

function buildAccessor(type: string): TypeAccessor {
  const normalize = (value: unknown, options?: Record<string, unknown>): string => {
    const handler = registry.get(type)
    if (!handler) {
      throw new TypeError(
        `[normalize] Unknown type: "${type}". Available: ${[...registry.keys()].join(', ')}.`,
      )
    }
    return handler(value, options) as string
  }

  const validate = (value: unknown, options?: Record<string, unknown>): ValidateResult => {
    try {
      return { valid: true, value: normalize(value, options), error: null }
    } catch (err) {
      return { valid: false, value: null, error: (err as Error).message }
    }
  }

  return Object.freeze({ normalize, validate, parse: normalize, safe: validate })
}

function getAccessor(type: string): TypeAccessor {
  if (!accessorCache.has(type)) {
    accessorCache.set(type, buildAccessor(type))
  }
  return accessorCache.get(type)!
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: HandlersMeta = Object.freeze({
  get types() { return [...registry.keys()] },
  has(type: string) { return registry.has(formatType(type)) },
})

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
export const handlers = new Proxy({} as HandlersProxy, {
  get(_, prop: string | symbol) {
    if (typeof prop !== 'string') return undefined
    if (prop === '$')     return meta
    if (prop === 'types') return meta.types
    if (prop === 'has')   return (t: string) => registry.has(formatType(t))
    return getAccessor(formatType(prop))
  },

  set() {
    throw new TypeError(
      '[handlers] Direct assignment not allowed. Use register() or registerAliases().',
    )
  },

  has(_, prop: string | symbol) {
    if (typeof prop !== 'string') return false
    if (['$', 'types', 'has'].includes(prop)) return true
    return registry.has(formatType(prop))
  },

  ownKeys() {
    return [...registry.keys(), '$', 'types', 'has']
  },

  getOwnPropertyDescriptor(_, prop: string | symbol) {
    if (typeof prop === 'string') {
      const key = formatType(prop)
      if (registry.has(key) || ['$', 'types', 'has'].includes(prop)) {
        return { configurable: true, enumerable: true, writable: false }
      }
    }
    return undefined
  },
})
