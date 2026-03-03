import { createPlugin } from '../../src/main.js'

const HEX_RE = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
const RGB_RE = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i

function hexExpand(h) {
    // Expande shorthand #abc -> #aabbcc
    return h.length === 3
        ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
        : h
}

function rgbToHex(r, g, b) {
    return [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
}

/**
 * Normaliza uma cor para o formato solicitado.
 * Aceita: #rgb, #rrggbb, rgb(r,g,b).
 *
 * @param {string} value
 * @param {{ format?: 'hex' | 'hex-upper' | 'rgb' | 'rgb-object' }} [options]
 * @returns {string|{r:number,g:number,b:number}}
 * @throws {TypeError}
 *
 * @example
 * colorHandler('#abc')              // '#aabbcc'
 * colorHandler('rgb(255,0,128)')    // '#ff0080'
 * colorHandler('#ff0080', { format: 'rgb' })  // 'rgb(255, 0, 128)'
 * colorHandler('#FF0080', { format: 'hex-upper' }) // '#FF0080'
 */
const colorHandler = (value, options = {}) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`[normalize:color] Expected non-empty string. Received: ${value}`)
    }

    let hex = ''
    const fmt = options.format ?? 'hex'

    const hexMatch = HEX_RE.exec(value.trim())
    const rgbMatch = RGB_RE.exec(value.trim())

    if (hexMatch) {
        hex = hexExpand(hexMatch[1])
    } else if (rgbMatch) {
        const [, r, g, b] = rgbMatch
        if ([r, g, b].some((n) => Number(n) > 255)) {
            throw new TypeError(`[normalize:color] RGB values must be 0-255. Received: ${value}`)
        }
        hex = rgbToHex(r, g, b)
    } else {
        throw new TypeError(`[normalize:color] Unrecognized color format. Received: ${value}`)
    }

    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)

    if (fmt === 'rgb')        return `rgb(${r}, ${g}, ${b})`
    if (fmt === 'hex-upper')  return `#${hex.toUpperCase()}`
    if (fmt === 'rgb-object') return `{"r":${r},"g":${g},"b":${b}}`
    return `#${hex.toLowerCase()}`
}

createPlugin('color', colorHandler)
