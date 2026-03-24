export interface PasswordHandlerOptions {
    /** Comprimento mínimo. @default 8 */
    minLength?: number;
    /** Exige ao menos uma letra maiúscula. @default true */
    requireUppercase?: boolean;
    /** Exige ao menos uma letra minúscula. @default true */
    requireLowercase?: boolean;
    /** Exige ao menos um número. @default false */
    requireNumber?: boolean;
    /** Exige ao menos um caractere especial. @default true */
    requireSpecial?: boolean;
}
export declare const passwordHandler: (value: unknown, options?: PasswordHandlerOptions) => string;
//# sourceMappingURL=passwordHandler.d.ts.map