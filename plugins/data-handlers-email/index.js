import { createPlugin } from '../../src/main.js'

// RFC 5322 simplificado — cobre 99.9% dos casos reais sem ser ilegível
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/**
 * Normaliza e valida um endereço de e-mail.
 * Normalização: trim + lowercase.
 *
 * @param {string} value
 * @param {{ caseSensitive?: boolean }} [options]
 * @returns {string} E-mail normalizado
 * @throws {TypeError}
 *
 * @example
 * emailHandler('  User@Example.COM  ')  // 'user@example.com'
 * emailHandler('invalido')              // throws TypeError
 */
const emailHandler = (value, options = {}) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`[normalize:email] Expected non-empty string. Received: ${value}`)
    }

    const normalized = options.caseSensitive ? value.trim() : value.trim().toLowerCase()

    if (!EMAIL_RE.test(normalized)) {
        throw new TypeError(`[normalize:email] Invalid email address. Received: ${value}`)
    }

    return normalized
}

createPlugin('email', emailHandler)
