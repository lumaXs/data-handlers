import { createPlugin } from '../../src/main.js'

/**
 * Converte uma string em slug URL-friendly.
 * Remove diacríticos, substitui espaços por hífens, strip de inválidos.
 *
 * @param {string} value
 * @param {{ separator?: string }} [options]
 * @returns {string}
 * @throws {TypeError}
 *
 * @example
 * slugHandler('Olá Mundo Legal!')   // 'ola-mundo-legal'
 * slugHandler('Café & Chá')         // 'cafe-cha'
 * slugHandler('Post Incrível', { separator: '_' }) // 'post_incrivel'
 */
const slugHandler = (value, options = {}) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`[normalize:slug] Expected non-empty string. Received: ${value}`)
    }

    const sep = options.separator ?? '-'

    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, sep)
        .replace(new RegExp(`[^a-z0-9${sep.replace(/[-]/g, '\\-')}]`, 'g'), '')
        .replace(new RegExp(`${sep}+`, 'g'), sep)
        .replace(new RegExp(`^${sep}|${sep}$`, 'g'), '')
}

createPlugin('slug', slugHandler)
