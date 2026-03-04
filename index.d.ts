// ============================================================================
// data-handlers — TypeScript Declarations
// v2.0 | Zero dependencies | MIT
// ============================================================================

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/**
 * Handler function: valida e/ou normaliza um valor.
 * Deve lançar erro descritivo quando o valor for inválido.
 */
export type Handler<
  TValue = unknown,
  TOptions extends Record<string, unknown> = Record<string, unknown>
> = (value: TValue, options?: TOptions) => string

export interface NormalizeParams<TValue = unknown> {
  type: string
  value: TValue
  options?: Record<string, unknown>
}

export interface ValidateResult {
  valid: boolean
  value: string | null
  error: string | null
}

// ---------------------------------------------------------------------------
// Top-level functions
// ---------------------------------------------------------------------------

/** Normaliza usando o handler do tipo. Lança se inválido. */
export function normalize<TValue = unknown>(params: NormalizeParams<TValue>): string

/** Valida sem lançar. Retorna { valid, value, error }. */
export function validate<TValue = unknown>(params: NormalizeParams<TValue>): ValidateResult

/** Registra um handler para um tipo (case-insensitive). Sobrescreve se existir. */
export function register<TValue = unknown>(type: string, handler: Handler<TValue>): void

/**
 * Mapeia aliases extras para o mesmo handler de um tipo já registrado.
 * @example
 * registerAliases('name', 'nome', 'fullName')
 */
export function registerAliases(type: string, ...aliases: string[]): void

/** Alias semântico de register() para autores de plugins. */
export declare const createPlugin: typeof register

// ---------------------------------------------------------------------------
// handlers proxy
// ---------------------------------------------------------------------------

export interface TypeAccessor {
  /** Normaliza — lança se inválido */
  normalize(value: unknown, options?: Record<string, unknown>): string
  /** Valida sem lançar */
  validate(value: unknown, options?: Record<string, unknown>): ValidateResult
  /** Alias de normalize (Zod-style .parse) */
  parse(value: unknown, options?: Record<string, unknown>): string
  /** Alias de validate (Zod-style .safe) */
  safe(value: unknown, options?: Record<string, unknown>): ValidateResult
}

export interface HandlersMeta {
  /** Todos os tipos registrados no momento da chamada */
  readonly types: string[]
  /** Verifica se um tipo existe (case-insensitive) */
  has(type: string): boolean
}

export type HandlersProxy = {
  /** Namespace meta: handlers.$.types, handlers.$.has('cpf') */
  readonly $: HandlersMeta
  readonly types: string[]
  has(type: string): boolean
} & Record<string, TypeAccessor>

/**
 * Proxy fluente e case-insensitive para todos os handlers registrados.
 *
 * @example
 * handlers.name.normalize('  joao  ')      // 'Joao'
 * handlers.name.parse('  joao  ')          // alias
 * handlers.cpf.safe('111.444.777-35')      // { valid: true, ... }
 * handlers.has('cpf')                      // true
 * handlers.types                           // ['name', 'number', ...]
 * handlers.$.types                         // meta namespace
 */
export declare const handlers: HandlersProxy

// ---------------------------------------------------------------------------
// Schema system
// ---------------------------------------------------------------------------

export interface FieldConfig {
  /** Tipo registrado (ex: 'name', 'cpf', 'number') */
  type: string
  /** Se true, null/undefined é aceito sem erro */
  optional?: boolean
  /** Valor padrão quando o campo for undefined */
  default?: unknown
  /** Opções repassadas ao handler */
  options?: Record<string, unknown>
  /** Rótulo legível para mensagens de erro */
  label?: string
}

export type SchemaShape = Record<string, string | FieldConfig>

export type SchemaParseResult<T = Record<string, string>> =
  | { success: true; data: T; errors: null }
  | { success: false; data: null; errors: Record<string, string> }

export interface Schema<TShape extends SchemaShape = SchemaShape> {
  /** Normaliza e retorna o objeto. Lança SchemaError se inválido. */
  parse(input: unknown): Record<string, unknown>
  /** Normaliza sem lançar. Retorna { success, data, errors }. */
  safeParse(input: unknown): SchemaParseResult
  /** Estende o schema com campos adicionais (imutável — retorna novo schema). */
  extend(extra: SchemaShape): Schema
  /** Retorna novo schema com apenas os campos especificados. */
  pick(...keys: string[]): Schema
  /** Retorna novo schema sem os campos especificados. */
  omit(...keys: string[]): Schema
  /** Retorna novo schema com todos os campos como optional. */
  partial(): Schema
  /** Mapa dos campos resolvidos */
  readonly fields: Record<string, FieldConfig>
}

/**
 * Cria um schema de validação/normalização de objetos.
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
 */
export function schema(shape: SchemaShape): Schema

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
export declare class SchemaError extends Error {
  errors: Record<string, string>
  constructor(errors: Record<string, string>)
}

// ---------------------------------------------------------------------------
// Handler option types
// ---------------------------------------------------------------------------

export interface NameHandlerOptions {
  /** Palavras a manter em minúsculo. Passe [] para desabilitar. */
  lowerCaseWords?: string[]
}

export interface NumberHandlerOptions extends Intl.NumberFormatOptions {
  /** BCP 47 locale. @default 'pt-BR' */
  locale?: string
}

export interface DateHandlerOptions extends Intl.DateTimeFormatOptions {
  /** BCP 47 locale. @default 'pt-BR' */
  locale?: string
}

export type DateInput = Date | string | number

export interface SlugHandlerOptions {
  /** Separador usado entre palavras. @default '-' */
  separator?: string
}

export interface ColorHandlerOptions {
  /** Formato de saída. @default 'hex' */
  format?: 'hex' | 'hex-upper' | 'rgb' | 'rgb-object'
}

export interface RgHandlerOptions {
  /** Formato de saída. @default 'sp' */
  format?: 'sp' | 'digits'
}

export interface EmailHandlerOptions {
  /** Se true, preserva capitalização original. @default false */
  caseSensitive?: boolean
}

// ---------------------------------------------------------------------------
// Internal (uso avançado)
// ---------------------------------------------------------------------------

export declare const registry: Map<string, Handler>
export declare function formatType(type: string): string
