export interface NameHandlerOptions {
    /** Palavras mantidas em minúsculo. Passe [] para desabilitar. */
    lowerCaseWords?: string[];
}
/**
 * Normaliza um nome para Title Case.
 * - Conectivos (de, da, do, of, the...) ficam em minúsculo, exceto o 1º token
 * - Acentos tratados via toLocaleUpperCase('pt-BR')
 * - Colapsa espaços extras
 *
 * @example
 * nameHandler('  emerson   ribeiro  ')  // 'Emerson Ribeiro'
 * nameHandler('maria das dores')        // 'Maria das Dores'
 */
export declare const nameHandler: (value: unknown, options?: NameHandlerOptions) => string;
//# sourceMappingURL=nameHandler.d.ts.map