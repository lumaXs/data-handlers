/**
 * A handler function responsible for validating and/or formatting a value.
 * Should throw a `TypeError` if the value is invalid.
 *
 * @template TValue - The expected input type.
 * @template TOptions - The options shape accepted by the handler.
 */
export type Handler<TValue = unknown, TOptions = Record<string, unknown>> = (
    value: TValue,
    options?: TOptions
) => string

/**
 * Parameters accepted by `normalize()` and `validate()`.
 */
export interface NormalizeParams<
    TValue = unknown,
    TOptions = Record<string, unknown>
> {
    /** Registered type identifier (case-insensitive). */
    type: string
    /** The value to normalize or validate. */
    value: TValue
    /** Optional options forwarded to the handler. */
    options?: TOptions
}

/**
 * Result returned by `validate()`.
 */
export interface ValidateResult {
    /** Whether the value passed handler validation. */
    valid: boolean
    /** The formatted/normalized value, or `null` if invalid. */
    value: string | null
    /** The error message, or `null` if valid. */
    error: string | null
}

/**
 * Normalizes a value using the handler registered for the given type.
 * Throws if the type is unknown or the value fails validation.
 */
export function normalize<
    TValue = unknown,
    TOptions = Record<string, unknown>
>(params: NormalizeParams<TValue, TOptions>): string

/**
 * Validates a value against its registered handler without throwing.
 * Returns a result object with `valid`, `value`, and `error` fields.
 */
export function validate<
    TValue = unknown,
    TOptions = Record<string, unknown>
>(params: NormalizeParams<TValue, TOptions>): ValidateResult

/**
 * Registers a custom handler for a given type.
 * Overwrites the existing handler if the type is already registered.
 */
export function register<
    TValue = unknown,
    TOptions = Record<string, unknown>
>(type: string, handler: Handler<TValue, TOptions>): void

/**
 * Semantic alias for `register()`. Intended for plugin authors.
 *
 * @example
 * // inside data-handlers-cpf
 * import { createPlugin } from 'data-handlers'
 * createPlugin('cpf', cpfHandler)
 */
export declare const createPlugin: typeof register
