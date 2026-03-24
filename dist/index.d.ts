import { registry, formatType, register, registerAliases, createPlugin } from './src/main.js';
import './plugins/index.js';
export type { HandlerFn } from './src/main.js';
export type { ValidateResult, TypeAccessor, HandlersMeta, HandlersProxy } from './api/handlers.js';
export type { FieldConfig, SchemaShape, InferSchema, SchemaParseResult } from './schema/index.js';
export type { NameHandlerOptions } from './handlers/nameHandler.js';
export type { NumberHandlerOptions } from './handlers/numberHandler.js';
export type { DateHandlerOptions, DateInput } from './handlers/dateHandler.js';
export type { PasswordHandlerOptions } from './handlers/passwordHandler.js';
export type { UrlHandlerOptions } from './handlers/urlHandler.js';
export type { UuidHandlerOptions } from './handlers/uuidHandler.js';
export type { AnyHandlerOptions } from './handlers/anyHandler.js';
export type { EmailHandlerOptions } from './plugins/data-handlers-email/index.js';
export type { SlugHandlerOptions } from './plugins/data-handlers-slug/index.js';
export type { ColorHandlerOptions } from './plugins/data-handlers-color/index.js';
export type { RgHandlerOptions } from './plugins/data-handlers-rg/index.js';
export { registry, formatType, register, registerAliases, createPlugin };
export { handlers } from './api/handlers.js';
export { Schema, schema, SchemaError } from './schema/index.js';
export interface NormalizeParams<TValue = unknown> {
    type: string;
    value: TValue;
    options?: Record<string, unknown>;
}
export interface ValidateParams<TValue = unknown> {
    type: string;
    value: TValue;
    options?: Record<string, unknown>;
}
/**
 * Normaliza um valor usando o handler do tipo. Lança se inválido.
 *
 * @example
 * normalize({ type: 'name', value: '  joao  ' }) // 'Joao'
 */
export declare function normalize<TValue = unknown>({ type, value, options }: NormalizeParams<TValue>): string;
/**
 * Valida sem lançar. Retorna `{ valid, value, error }`.
 *
 * @example
 * validate({ type: 'cpf', value: '111.444.777-35' })
 * // { valid: true, value: '111.444.777-35', error: null }
 */
export declare function validate<TValue = unknown>({ type, value, options }: ValidateParams<TValue>): {
    valid: boolean;
    value: string;
    error: null;
} | {
    valid: boolean;
    value: null;
    error: string;
};
//# sourceMappingURL=index.d.ts.map