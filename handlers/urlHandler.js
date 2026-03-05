/**
 * Valida e normaliza uma URL (trim + lowercase no host).
 *
 * @param {string} value
 * @param {{
 *   protocols?: string[],   // protocolos aceitos (padrão: ['http', 'https'])
 *   allowPath?: boolean,    // permite path (padrão: true)
 * }} [options]
 * @returns {string}
 * @throws {TypeError}
 *
 * @example
 * urlHandler('  HTTPS://Example.com/path  ')  // 'https://example.com/path'
 * urlHandler('ftp://example.com', { protocols: ['https'] }) // throws
 */
export const urlHandler = (value, options = {}) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(
      `[normalize:url] Expected non-empty string. Received: ${typeof value}`
    )
  }

  const {
    protocols = ['http', 'https'],
  } = options

  let parsed
  try {
    parsed = new URL(value.trim())
  } catch {
    throw new TypeError(
      `[normalize:url] Invalid URL. Received: ${value}`
    )
  }

  const protocol = parsed.protocol.replace(':', '')
  if (!protocols.includes(protocol)) {
    throw new TypeError(
      `[normalize:url] Protocol "${protocol}" not allowed. Allowed: ${protocols.join(', ')}. Received: ${value}`
    )
  }

  // Normaliza: lowercase no host, mantém path/query/hash como estão
  parsed.hostname = parsed.hostname.toLowerCase()

  return parsed.toString()
}

