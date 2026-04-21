import { createPlugin } from '../../src/main.js'

export interface ColorHandlerOptions {
   /** @default 'hex' */
   format?: 'hex' | 'hex-upper' | 'rgb' | 'rgb-object'
}

const HEX_RE = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
const RGB_RE = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i

const hexExpand = (h: string): string =>
   h.length === 3
      ? h.charAt(0) +
        h.charAt(0) +
        h.charAt(1) +
        h.charAt(1) +
        h.charAt(2) +
        h.charAt(2)
      : h

const rgbToHex = (r: string, g: string, b: string): string =>
   [r, g, b].map(n => Number(n).toString(16).padStart(2, '0')).join('')

const colorHandler = (
   value: unknown,
   options: ColorHandlerOptions = {},
): string => {
   if (typeof value !== 'string' || !value.trim()) {
      throw new TypeError(
         `[normalize:color] Expected non-empty string. Received: ${value}`,
      )
   }

   const fmt = options.format ?? 'hex'
   const hexMatch = HEX_RE.exec(value.trim())
   const rgbMatch = RGB_RE.exec(value.trim())
   let hex = ''

   if (hexMatch) {
      hex = hexExpand(hexMatch[1] ?? '')
   } else if (rgbMatch) {
      const r = rgbMatch[1] ?? '0'
      const g = rgbMatch[2] ?? '0'
      const b = rgbMatch[3] ?? '0'
      if ([r, g, b].some(n => Number(n) > 255)) {
         throw new TypeError(
            `[normalize:color] RGB values must be 0-255. Received: ${value}`,
         )
      }
      hex = rgbToHex(r, g, b)
   } else {
      throw new TypeError(
         `[normalize:color] Unrecognized color format. Received: ${value}`,
      )
   }

   const r = parseInt(hex.slice(0, 2), 16)
   const g = parseInt(hex.slice(2, 4), 16)
   const b = parseInt(hex.slice(4, 6), 16)

   if (fmt === 'rgb') return `rgb(${r}, ${g}, ${b})`
   if (fmt === 'hex-upper') return `#${hex.toUpperCase()}`
   if (fmt === 'rgb-object') return `{"r":${r},"g":${g},"b":${b}}`
   return `#${hex.toLowerCase()}`
}

createPlugin('color', colorHandler)
