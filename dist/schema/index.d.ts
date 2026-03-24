export interface FieldConfig {
    type: string;
    optional?: boolean;
    default?: unknown;
    options?: Record<string, unknown>;
    label?: string;
}
export type SchemaShape = Record<string, string | FieldConfig>;
type FieldOutput<F extends string | FieldConfig> = F extends string ? string : F extends {
    optional: true;
    default: unknown;
} ? string : F extends {
    optional: true;
} ? string | null : string;
type RequiredKeys<TShape extends SchemaShape> = {
    [K in keyof TShape]: TShape[K] extends {
        optional: true;
    } ? TShape[K] extends {
        default: unknown;
    } ? K : never : K;
}[keyof TShape];
type OptionalKeys<TShape extends SchemaShape> = {
    [K in keyof TShape]: TShape[K] extends {
        optional: true;
    } ? TShape[K] extends {
        default: unknown;
    } ? never : K : never;
}[keyof TShape];
export type InferSchema<TShape extends SchemaShape> = {
    [K in RequiredKeys<TShape> & string]: FieldOutput<TShape[K]>;
} & {
    [K in OptionalKeys<TShape> & string]?: FieldOutput<TShape[K]>;
};
export type SchemaParseResult<T = Record<string, string>> = {
    success: true;
    data: T;
    errors: null;
} | {
    success: false;
    data: null;
    errors: Record<string, string>;
};
type MakePartialShape<TShape extends SchemaShape> = {
    [K in keyof TShape]: TShape[K] extends string ? {
        type: TShape[K];
        optional: true;
    } : TShape[K] extends FieldConfig ? TShape[K] & {
        optional: true;
    } : never;
};
/**
 * Erro lançado por Schema.parse() quando a validação falha.
 *
 * @example
 * try {
 *   userSchema.parse({ name: '' })
 * } catch (err) {
 *   if (err instanceof SchemaError) console.log(err.errors)
 * }
 */
export declare class SchemaError extends Error {
    errors: Record<string, string>;
    constructor(errors: Record<string, string>);
}
/**
 * Schema de validação/normalização de objetos.
 *
 * @example
 * const userSchema = new Schema({
 *   name:     'name',
 *   document: 'cpf',
 *   phone:    { type: 'phone', optional: true },
 *   amount:   { type: 'number', options: { style: 'currency', currency: 'BRL', locale: 'pt-BR' } }
 * })
 *
 * userSchema.parse({ name: 'JOAO SILVA', document: '11144477735', amount: 99.9 })
 * // { name: 'Joao Silva', document: '111.444.777-35', amount: 'R$ 99,90' }
 */
export declare class Schema<TShape extends SchemaShape> {
    #private;
    constructor(shape: TShape);
    get fields(): Record<string, FieldConfig>;
    /**
     * Normaliza sem lançar. Retorna `{ success, data, errors }`.
     */
    safeParse(input: unknown): SchemaParseResult<InferSchema<TShape>>;
    /**
     * Normaliza e retorna o objeto tipado. Lança SchemaError se inválido.
     */
    parse(input: unknown): InferSchema<TShape>;
    /**
     * Estende o schema com campos adicionais. Imutável — retorna novo Schema.
     */
    extend<TExtra extends SchemaShape>(extra: TExtra): Schema<Omit<TShape, keyof TExtra> & TExtra>;
    /**
     * Retorna novo Schema com apenas os campos especificados.
     */
    pick<K extends keyof TShape & string>(...keys: K[]): Schema<Pick<TShape, K>>;
    /**
     * Retorna novo Schema sem os campos especificados.
     */
    omit<K extends keyof TShape & string>(...keys: K[]): Schema<Omit<TShape, K>>;
    /**
     * Retorna novo Schema com todos os campos marcados como optional.
     * Útil para PATCH parcial.
     */
    partial(): Schema<MakePartialShape<TShape>>;
}
/**
 * Factory para criar um Schema. Equivalente a `new Schema(shape)`.
 * Mantido para compatibilidade com a API anterior.
 *
 * @example
 * const userSchema = schema({ name: 'name', email: 'email' })
 * // equivalente a:
 * const userSchema = new Schema({ name: 'name', email: 'email' })
 */
export declare function schema<TShape extends SchemaShape>(shape: TShape): Schema<TShape>;
export {};
//# sourceMappingURL=index.d.ts.map