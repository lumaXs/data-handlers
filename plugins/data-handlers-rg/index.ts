import { createPlugin } from '../../src/main.js'

export interface RgHandlerOptions {
  format?: 'sp' | 'digits'
}

const rgHandler = (value: unknown, options: RgHandlerOptions = {}): string => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError(
      `[normalize:rg] Expected string or number. Received: ${typeof value}`,
    )
  }

  const raw = String(value)
    .trim()
    .toUpperCase()
    .replace(/[.\-\s]/g, '')

  if (!/^\d{7,9}$|^\d{8}X$/.test(raw)) {
    throw new TypeError(
      `[normalize:rg] Invalid RG format. Expected 7-9 digits (optionally ending in X). Received: ${value}`,
    )
  }

  if (options.format === 'digits') return raw

  const digits = raw.slice(0, -1)
  const last = raw.slice(-1)
  const padded = digits.padStart(8, '0')
  return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5, 8)}-${last}`
}

createPlugin('rg', rgHandler)
