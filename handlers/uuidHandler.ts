export interface UuidHandlerOptions {
  /** Versão UUID esperada. null = qualquer versão válida. @default null */
  version?: 1 | 3 | 4 | 5 | 7 | null
  /** Retorna em maiúsculas. @default false */
  uppercase?: boolean
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-9])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const VERSION_REGEX: Record<number, RegExp> = {
  1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
}

export const uuidHandler = (value: unknown, options: UuidHandlerOptions = {}): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(
      `[normalize:uuid] Expected non-empty string. Received: ${typeof value}`,
    )
  }

  const { version = null, uppercase = false } = options
  const normalized = value.trim()

  if (!UUID_REGEX.test(normalized)) {
    throw new TypeError(`[normalize:uuid] Invalid UUID format. Received: ${value}`)
  }

  if (version !== null) {
    const regex = VERSION_REGEX[version]
    if (!regex) {
      throw new TypeError(
        `[normalize:uuid] Unsupported version: ${version}. Supported: 1, 3, 4, 5, 7.`,
      )
    }
    if (!regex.test(normalized)) {
      throw new TypeError(`[normalize:uuid] Expected UUID v${version}. Received: ${value}`)
    }
  }

  return uppercase ? normalized.toUpperCase() : normalized.toLowerCase()
}
