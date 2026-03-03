import { describe, it, expect } from 'vitest'
import { normalize, validate } from 'data-handlers'
import { register, createPlugin } from './src/main.js'

// ─────────────────────────────────────────────
// normalize()
// ─────────────────────────────────────────────

describe('normalize()', () => {
    describe('type: "name"', () => {
        it('normaliza nome simples', () => {
            expect(normalize({ type: 'name', value: 'john doe' })).toBe('John Doe')
        })

        it('normaliza nome com espaços extras', () => {
            expect(normalize({ type: 'name', value: '  joão   da   silva  ' })).toBe('João Da Silva')
        })

        it('normaliza nome em caixa alta', () => {
            expect(normalize({ type: 'name', value: 'MARIA SILVA' })).toBe('Maria Silva')
        })

        it('normaliza nome em caixa baixa', () => {
            expect(normalize({ type: 'name', value: 'pedro souza' })).toBe('Pedro Souza')
        })

        it('lança TypeError para string vazia', () => {
            expect(() => normalize({ type: 'name', value: '' })).toThrow(TypeError)
        })

        it('lança TypeError para string só com espaços', () => {
            expect(() => normalize({ type: 'name', value: '   ' })).toThrow(TypeError)
        })

        it('lança TypeError para número', () => {
            expect(() => normalize({ type: 'name', value: 123 })).toThrow(TypeError)
        })

        it('lança TypeError para null', () => {
            expect(() => normalize({ type: 'name', value: null })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'name', value: '' }))
                .toThrow('[normalize:name]')
        })
    })

    describe('type: "number"', () => {
        it('formata número com locale padrão (en-US)', () => {
            expect(normalize({ type: 'number', value: 1234567.89 })).toBe('1,234,567.89')
        })

        it('formata número com locale pt-BR', () => {
            expect(normalize({ type: 'number', value: 1234567.89, options: { locale: 'pt-BR' } }))
                .toBe('1.234.567,89')
        })

        it('formata como moeda USD', () => {
            expect(normalize({ type: 'number', value: 42, options: { locale: 'en-US', style: 'currency', currency: 'USD' } }))
                .toBe('$42.00')
        })

        it('formata como moeda BRL', () => {
            expect(normalize({ type: 'number', value: 9.9, options: { locale: 'pt-BR', style: 'currency', currency: 'BRL' } }))
                .toBe('R$\u00a09,90')
        })

        it('formata como porcentagem', () => {
            expect(normalize({ type: 'number', value: 0.753, options: { style: 'percent', maximumFractionDigits: 1 } }))
                .toBe('75.3%')
        })

        it('formata zero', () => {
            expect(normalize({ type: 'number', value: 0 })).toBe('0')
        })

        it('formata número negativo', () => {
            expect(normalize({ type: 'number', value: -99.5, options: { locale: 'pt-BR' } }))
                .toBe('-99,5')
        })

        it('lança TypeError para NaN', () => {
            expect(() => normalize({ type: 'number', value: NaN })).toThrow(TypeError)
        })

        it('lança TypeError para Infinity', () => {
            expect(() => normalize({ type: 'number', value: Infinity })).toThrow(TypeError)
        })

        it('lança TypeError para string numérica', () => {
            expect(() => normalize({ type: 'number', value: '123' })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'number', value: NaN }))
                .toThrow('[normalize:number]')
        })
    })

    describe('type: "date"', () => {
        it('formata Date object com locale pt-BR', () => {
            expect(normalize({ type: 'date', value: new Date(2026, 2, 1), options: { locale: 'pt-BR' } }))
                .toBe('01/03/2026')
        })

        it('formata Date object com data longa pt-BR', () => {
            expect(normalize({
                type: 'date',
                value: new Date(2026, 2, 1),
                options: { locale: 'pt-BR', year: 'numeric', month: 'long', day: 'numeric' },
            })).toBe('1 de março de 2026')
        })

        it('formata string ISO com horário explícito (evita drift de timezone)', () => {
            expect(normalize({ type: 'date', value: '2024-06-15T12:00:00', options: { locale: 'en-US', year: 'numeric', month: 'numeric', day: 'numeric' } }))
                .toBe('6/15/2024')
        })

        it('formata timestamp numérico', () => {
            const ts = new Date(2024, 0, 1).getTime()
            const result = normalize({ type: 'date', value: ts, options: { locale: 'pt-BR' } })
            expect(result).toBe('01/01/2024')
        })

        it('lança TypeError para string inválida', () => {
            expect(() => normalize({ type: 'date', value: 'data-invalida' })).toThrow(TypeError)
        })

        it('lança TypeError para valor inválido', () => {
            expect(() => normalize({ type: 'date', value: 'abc' })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'date', value: 'invalido' }))
                .toThrow('[normalize:date]')
        })
    })

    describe('tipo desconhecido', () => {
        it('lança TypeError para tipo não registrado', () => {
            expect(() => normalize({ type: 'inexistente', value: 'x' })).toThrow(TypeError)
        })

        it('mensagem lista os tipos disponíveis', () => {
            expect(() => normalize({ type: 'inexistente', value: 'x' }))
                .toThrow('Available:')
        })

        it('mensagem contém o prefixo correto', () => {
            expect(() => normalize({ type: 'inexistente', value: 'x' }))
                .toThrow('[normalize]')
        })

        it('type é case-insensitive', () => {
            expect(normalize({ type: 'NAME', value: 'john doe' })).toBe('John Doe')
        })

        it('type ignora espaços extras', () => {
            expect(normalize({ type: '  name  ', value: 'john doe' })).toBe('John Doe')
        })
    })
})

// ─────────────────────────────────────────────
// validate()
// ─────────────────────────────────────────────

describe('validate()', () => {
    it('retorna { valid: true } para valor válido', () => {
        const result = validate({ type: 'name', value: 'John Doe' })
        expect(result.valid).toBe(true)
        expect(result.value).toBe('John Doe')
        expect(result.error).toBeNull()
    })

    it('retorna { valid: false } para valor inválido', () => {
        const result = validate({ type: 'name', value: '' })
        expect(result.valid).toBe(false)
        expect(result.value).toBeNull()
        expect(result.error).toContain('[normalize:name]')
    })

    it('nunca lança — mesmo com valor inválido', () => {
        expect(() => validate({ type: 'name', value: '' })).not.toThrow()
        expect(() => validate({ type: 'number', value: NaN })).not.toThrow()
        expect(() => validate({ type: 'date', value: 'invalido' })).not.toThrow()
        expect(() => validate({ type: 'inexistente', value: 'x' })).not.toThrow()
    })

    it('retorna o valor formatado quando válido', () => {
        const result = validate({ type: 'number', value: 1234, options: { locale: 'pt-BR' } })
        expect(result.valid).toBe(true)
        expect(result.value).toBe('1.234')
    })

    it('retorna erro para tipo desconhecido', () => {
        const result = validate({ type: 'inexistente', value: 'x' })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('[normalize]')
    })

    it('retorna { valid: false } para número inválido', () => {
        const result = validate({ type: 'number', value: NaN })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('[normalize:number]')
    })

    it('retorna { valid: false } para data inválida', () => {
        const result = validate({ type: 'date', value: 'invalido' })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('[normalize:date]')
    })
})

// ─────────────────────────────────────────────
// register()
// ─────────────────────────────────────────────

describe('register()', () => {
    it('registra um handler customizado', () => {
        register('upper', (value) => String(value).toUpperCase())
        expect(normalize({ type: 'upper', value: 'hello' })).toBe('HELLO')
    })

    it('sobrescreve handler existente', () => {
        register('upper', (value) => String(value).toLowerCase())
        expect(normalize({ type: 'upper', value: 'HELLO' })).toBe('hello')
    })

    it('type é case-insensitive no register', () => {
        register('MYTAG', (value) => `tag:${value}`)
        expect(normalize({ type: 'mytag', value: 'test' })).toBe('tag:test')
        expect(normalize({ type: 'MYTAG', value: 'test' })).toBe('tag:test')
    })

    it('lança TypeError se handler não for função', () => {
        expect(() => register('invalido', 'não sou função')).toThrow(TypeError)
        expect(() => register('invalido', null)).toThrow(TypeError)
        expect(() => register('invalido', 123)).toThrow(TypeError)
    })

    it('mensagem de erro contém o prefixo correto', () => {
        expect(() => register('x', 'nope')).toThrow('[normalize]')
    })
})

// ─────────────────────────────────────────────
// createPlugin()
// ─────────────────────────────────────────────

describe('createPlugin()', () => {
    it('é um alias funcional de register()', () => {
        createPlugin('greet', (value) => `Olá, ${value}!`)
        expect(normalize({ type: 'greet', value: 'Mundo' })).toBe('Olá, Mundo!')
    })

    it('lança TypeError se handler não for função', () => {
        expect(() => createPlugin('bad', 42)).toThrow(TypeError)
    })

    it('plugin registrado via createPlugin é acessível via normalize e validate', () => {
        createPlugin('reverse', (value) => String(value).split('').reverse().join(''))

        expect(normalize({ type: 'reverse', value: 'data-handlers' })).toBe('sreldnah-atad')

        const result = validate({ type: 'reverse', value: 'axis' })
        expect(result.valid).toBe(true)
        expect(result.value).toBe('sixa')
    })
})
