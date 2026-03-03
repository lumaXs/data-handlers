/**
 * Palavras mantidas em minúsculo por padrão (conectivos pt-BR + en).
 * @type {Set<string>}
 */
const DEFAULT_LOWERCASE = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e',
    'of', 'the', 'and', 'at', 'in', 'on',
])

/**
 * Normaliza um nome para Title Case.
 * - Conectivos (de, da, do, of, the...) ficam em minúsculo, exceto o 1º token
 * - Acentos tratados via toLocaleUpperCase('pt-BR')
 * - Colapsa espaços extras
 *
 * @param {string} value
 * @param {{ lowerCaseWords?: string[] }} [options]
 * @returns {string}
 * @throws {TypeError}
 *
 * @example
 * nameHandler('  emerson   ribeiro  ')  // 'Emerson Ribeiro'
 * nameHandler('maria das dores')        // 'Maria das Dores'
 * nameHandler('joao de paula', { lowerCaseWords: [] }) // 'Joao De Paula'
 */
export const nameHandler = (value, options = {}) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(
            `[normalize:name] Expected non-empty string. Received: ${
                typeof value === 'string' ? `"${value}"` : typeof value
            }`
        )
    }

    const lowerSet =
        options.lowerCaseWords !== undefined
            ? new Set(options.lowerCaseWords.map((w) => w.toLowerCase()))
            : DEFAULT_LOWERCASE

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word, index) => {
            if (index !== 0 && lowerSet.has(word)) return word
            return word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
        })
        .join(' ')
}
