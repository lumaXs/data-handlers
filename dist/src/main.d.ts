export type HandlerFn<TValue = unknown, TOptions = Record<string, unknown>> = (value: TValue, options?: TOptions) => unknown;
/**
 * Normaliza o identificador de tipo: trim + lowercase.
 * Toda a API é case-insensitive por design.
 */
export declare function formatType(type: string): string;
/**
 * Registry central: chave normalizada → handler.
 * Tipos embutidos: 'name', 'number', 'date', 'password', 'url', 'uuid', 'any'.
 */
export declare const registry: Map<string, HandlerFn<unknown, Record<string, unknown>>>;
/**
 * Registra um handler para um tipo (sobrescreve se já existir).
 */
export declare function register<TValue = unknown>(type: string, handler: HandlerFn<TValue>): void;
/**
 * Mapeia aliases extras para o mesmo handler de um tipo já registrado.
 *
 * @example
 * registerAliases('name', 'nome', 'fullName')
 */
export declare function registerAliases(type: string, ...aliases: string[]): void;
/** Alias semântico de register() para autores de plugins. */
export declare const createPlugin: typeof register;
//# sourceMappingURL=main.d.ts.map