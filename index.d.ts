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

// ---------------------------------------------------------------------------
// Schema inference
// ---------------------------------------------------------------------------

/**
 * Resolve o tipo de saída de um campo individual.
 * - Campo com optional + default → sempre string (default garante presença)
 * - Campo com optional sem default → string | null
 * - Campo obrigatório → string
 */
type FieldOutput<F extends string | FieldConfig> =
   F extends string
      ? string
      : F extends { optional: true; default: unknown }
         ? string
         : F extends { optional: true }
            ? string | null
            : string

/** Chaves obrigatórias do shape (incluindo optional com default) */
type RequiredKeys<TShape extends SchemaShape> = {
   [K in keyof TShape]: TShape[K] extends { optional: true }
      ? TShape[K] extends { default: unknown } ? K : never
      : K
}[keyof TShape]

/** Chaves opcionais do shape (optional sem default) */
type OptionalKeys<TShape extends SchemaShape> = {
   [K in keyof TShape]: TShape[K] extends { optional: true }
      ? TShape[K] extends { default: unknown } ? never : K
      : never
}[keyof TShape]

/**
 * Infere o tipo de saída de um schema a partir do seu shape.
 *
 * @example
 * const userSchema = schema({ name: 'name', phone: { type: 'phone', optional: true } })
 * type User = InferSchema<typeof userSchema>
 * // { name: string; phone?: string | null }
 */
export type InferSchema<TShape extends SchemaShape> =
   { [K in RequiredKeys<TShape> & string]:  FieldOutput<TShape[K]> } &
   { [K in OptionalKeys<TShape> & string]?: FieldOutput<TShape[K]> }

/** Transforma todos os campos de um shape em opcionais (usado por .partial()) */
type MakePartialShape<TShape extends SchemaShape> = {
   [K in keyof TShape]: TShape[K] extends string
      ? { type: TShape[K]; optional: true }
      : TShape[K] extends FieldConfig
         ? TShape[K] & { optional: true }
         : never
}

// ---------------------------------------------------------------------------
// Schema interface
// ---------------------------------------------------------------------------

export type SchemaParseResult<T = Record<string, string>> =
   | { success: true;  data: T;    errors: null }
   | { success: false; data: null; errors: Record<string, string> }

export interface Schema<TShape extends SchemaShape = SchemaShape> {
   /**
    * Normaliza e retorna o objeto tipado.
    * Lança SchemaError se algum campo for inválido.
    */
   parse(input: unknown): InferSchema<TShape>

   /**
    * Normaliza sem lançar.
    * Retorna `{ success: true, data }` ou `{ success: false, errors }`.
    */
   safeParse(input: unknown): SchemaParseResult<InferSchema<TShape>>

   /**
    * Estende o schema com campos adicionais.
    * Imutável — retorna novo schema.
    * @example
    * userSchema.extend({ cep: 'cep' })
    */
   extend<TExtra extends SchemaShape>(extra: TExtra): Schema<TShape & TExtra>

   /**
    * Retorna novo schema com apenas os campos especificados.
    * @example
    * userSchema.pick('name', 'email')
    */
   pick<K extends keyof TShape & string>(...keys: K[]): Schema<Pick<TShape, K>>

   /**
    * Retorna novo schema sem os campos especificados.
    * @example
    * userSchema.omit('password')
    */
   omit<K extends keyof TShape & string>(...keys: K[]): Schema<Omit<TShape, K>>

   /**
    * Retorna novo schema com todos os campos como optional.
    * Útil para PATCH parcial.
    * @example
    * const updateSchema = userSchema.partial()
    */
   partial(): Schema<MakePartialShape<TShape>>

   /** Mapa dos campos resolvidos */
   readonly fields: Record<string, FieldConfig>
}

/**
 * Cria um schema de validação/normalização de objetos.
 * O tipo de saída é inferido automaticamente do shape.
 *
 * @example
 * const userSchema = schema({
 *   name:     'name',
 *   document: 'cpf',
 *   phone:    { type: 'phone', optional: true },
 *   amount:   { type: 'number', options: { style: 'currency', currency: 'BRL', locale: 'pt-BR' } }
 * })
 *
 * const result = userSchema.safeParse(body)
 * if (result.success) {
 *   result.data.name     // string
 *   result.data.phone    // string | null
 *   result.data.amount   // string
 * }
 */
export function schema<TShape extends SchemaShape>(shape: TShape): Schema<TShape>

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
   /**
    * Formato de saída especial.
    * - `'iso'` — retorna string ISO 8601 (ex: `2026-03-06T00:00:00.000Z`)
    * - omitido — usa `Intl.DateTimeFormat` com as demais options
    */
   format?: 'iso'
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

export interface PasswordHandlerOptions {
   /** Comprimento mínimo. @default 8 */
   minLength?: number
   /** Exige ao menos uma letra maiúscula. @default true */
   requireUppercase?: boolean
   /** Exige ao menos uma letra minúscula. @default true */
   requireLowercase?: boolean
   /** Exige ao menos um número. @default false */
   requireNumber?: boolean
   /** Exige ao menos um caractere especial (!@#$%...). @default true */
   requireSpecial?: boolean
}

export interface UrlHandlerOptions {
   /**
    * Protocolos aceitos.
    * @default ['http', 'https']
    * @example ['https'] // só HTTPS
    * @example ['http', 'https', 'ftp']
    */
   protocols?: string[]
}

export interface UuidHandlerOptions {
   /**
    * Versão UUID esperada. null = qualquer versão válida.
    * Suportadas: 1, 3, 4, 5, 7.
    * @default null
    */
   version?: 1 | 3 | 4 | 5 | 7 | null
   /** Retorna o UUID em maiúsculas. @default false */
   uppercase?: boolean
}

export interface AnyHandlerOptions {
   /**
    * Se informado, exige que o valor seja exatamente esse tipo primitivo.
    * Aceita os mesmos valores que o operador `typeof`.
    * @example { demandType: 'number' } // só aceita numbers
    */
   demandType?: 'string' | 'number' | 'boolean' | 'object' | 'bigint'
   /**
    * Callback de transformação/validação customizada.
    * Executado após `demandType` (se ambos forem passados).
    * Pode retornar um valor diferente ou lançar TypeError se inválido.
    * @example
    * { transform: (v) => Math.max(0, Math.min(100, v)) } // clamp 0-100
    * { transform: (v) => { if (!Array.isArray(v)) throw new TypeError('...'); return v } }
    */
   transform?: (value: unknown) => unknown
}

// ---------------------------------------------------------------------------
// Internal (uso avançado)
// ---------------------------------------------------------------------------

export declare const registry: Map<string, Handler>
export declare function formatType(type: string): string
