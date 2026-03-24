export interface NumberHandlerOptions extends Intl.NumberFormatOptions {
    /** BCP 47 locale. @default 'pt-BR' */
    locale?: string;
}
/**
 * Formata um número finito em string localizada.
 *
 * @example
 * numberHandler(1234567.89, { style: 'currency', currency: 'BRL', locale: 'pt-BR' })
 * // 'R$ 1.234.567,89'
 */
export declare const numberHandler: (value: unknown, options?: NumberHandlerOptions) => string;
//# sourceMappingURL=numberHandler.d.ts.map