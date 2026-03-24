export interface AnyHandlerOptions {
    /** Se informado, exige que o valor seja exatamente esse tipo primitivo. */
    demandType?: 'string' | 'number' | 'boolean' | 'object' | 'bigint';
    /** Callback de transformação/validação customizada. */
    transform?: (value: unknown) => unknown;
}
export declare const anyHandler: (value: unknown, options?: AnyHandlerOptions) => unknown;
//# sourceMappingURL=anyHandler.d.ts.map