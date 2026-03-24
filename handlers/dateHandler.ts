export type DateInput = Date | string | number

export interface DateHandlerOptions extends Intl.DateTimeFormatOptions {
  /** BCP 47 locale. @default 'pt-BR' */
  locale?: string
  /**
   * Formato de saída especial.
   * - `'iso'` — retorna string ISO 8601
   * - omitido — usa Intl.DateTimeFormat
   */
  format?: 'iso'
}

/**
 * Formata uma data em string localizada.
 * Aceita: Date, string ISO e timestamp numérico em ms.
 *
 * @example
 * dateHandler(new Date('2024-01-15'), { dateStyle: 'long', locale: 'pt-BR' })
 * // '15 de janeiro de 2024'
 */
export const dateHandler = (value: unknown, options: DateHandlerOptions = {}): string => {
  let date: Date

  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'number' && Number.isInteger(value)) {
    date = new Date(value)
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value)
  } else {
    throw new TypeError(
      `[normalize:date] Expected Date, ISO string, or ms timestamp. Received: ${typeof value}`,
    )
  }

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `[normalize:date] Could not parse into a valid date. Received: ${JSON.stringify(value)}`,
    )
  }

  const { locale = 'pt-BR', format, ...formatOptions } = options
  if (format === 'iso') return date.toISOString()

  return new Intl.DateTimeFormat(locale, formatOptions).format(date)
}
