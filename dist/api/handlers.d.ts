export interface ValidateResult {
    valid: boolean;
    value: string | null;
    error: string | null;
}
export interface TypeAccessor {
    normalize(value: unknown, options?: Record<string, unknown>): string;
    validate(value: unknown, options?: Record<string, unknown>): ValidateResult;
    /** Alias de normalize */
    parse(value: unknown, options?: Record<string, unknown>): string;
    /** Alias de validate */
    safe(value: unknown, options?: Record<string, unknown>): ValidateResult;
}
export interface HandlersMeta {
    readonly types: string[];
    has(type: string): boolean;
}
export type HandlersProxy = {
    readonly $: HandlersMeta;
    readonly types: string[];
    has(type: string): boolean;
} & Record<string, TypeAccessor>;
/**
 * Proxy fluente e case-insensitive para todos os handlers registrados.
 *
 * @example
 * handlers.name.normalize('  joao  ')     // 'Joao'
 * handlers.cpf.safe('111.444.777-35')     // { valid: true, ... }
 * handlers.has('cpf')                     // true
 * handlers.$.types                        // ['name', 'number', ...]
 */
export declare const handlers: HandlersProxy;
//# sourceMappingURL=handlers.d.ts.map