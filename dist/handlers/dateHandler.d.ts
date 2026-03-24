export type DateInput = Date | string | number;
export interface DateHandlerOptions extends Intl.DateTimeFormatOptions {
    /** BCP 47 locale. @default 'pt-BR' */
    locale?: string;
    /**
     * Formato de saída especial.
     * - `'iso'` — retorna string ISO 8601
     * - omitido — usa Intl.DateTimeFormat
     */
    format?: 'iso';
}
/**
 * Formata uma data em string localizada.
 * Aceita: Date, string ISO e timestamp numérico em ms.
 *
 * @example
 * dateHandler(new Date('2024-01-15'), { dateStyle: 'long', locale: 'pt-BR' })
 * // '15 de janeiro de 2024'
 */
export declare const dateHandler: (value: unknown, options?: DateHandlerOptions) => string;
//# sourceMappingURL=dateHandler.d.ts.map