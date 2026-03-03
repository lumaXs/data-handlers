import { createPlugin } from '../../src/main.js'

/**
 * Formats a Brazilian phone number.
 * Supports landlines (10 digits) and mobile numbers (11 digits).
 *
 * @param {string|number} value - Raw phone number (formatted or digits only).
 * @returns {string} Formatted phone: `(00) 0000-0000` or `(00) 00000-0000`.
 * @throws {TypeError} If the phone number is invalid.
 *
 * @example
 * phoneHandler('11987654321')    // → '(11) 98765-4321'
 * phoneHandler('1134567890')     // → '(11) 3456-7890'
 * phoneHandler('(11) 98765-4321') // → '(11) 98765-4321'
 */
const phoneHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')

    if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }

    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }

    throw new TypeError(
        `[normalize:phone] Expected 10 or 11 digit Brazilian phone number. Received: ${value}`
    )
}

createPlugin('phone', phoneHandler)
