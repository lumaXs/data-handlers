export interface AnyHandlerOptions {
  /** Se informado, exige que o valor seja exatamente esse tipo primitivo. */
  demandType?: 'string' | 'number' | 'boolean' | 'object' | 'bigint'
  /** Callback de transformação/validação customizada. */
  transform?: (value: unknown) => unknown
}

export const anyHandler = (value: unknown, options: AnyHandlerOptions = {}): unknown => {
  if (value === null || value === undefined) {
    throw new TypeError('[normalize:any] Value cannot be null or undefined.')
  }

  const { demandType, transform } = options

  if (demandType !== undefined && typeof value !== demandType) {
    throw new TypeError(
      `[normalize:any] Expected type "${demandType}". Received: ${typeof value}`,
    )
  }

  if (transform !== undefined) {
    if (typeof transform !== 'function') {
      throw new TypeError('[normalize:any] options.transform must be a function.')
    }
    return transform(value)
  }

  return value
}
