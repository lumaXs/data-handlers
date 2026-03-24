export interface UuidHandlerOptions {
    /** Versão UUID esperada. null = qualquer versão válida. @default null */
    version?: 1 | 3 | 4 | 5 | 7 | null;
    /** Retorna em maiúsculas. @default false */
    uppercase?: boolean;
}
export declare const uuidHandler: (value: unknown, options?: UuidHandlerOptions) => string;
//# sourceMappingURL=uuidHandler.d.ts.map