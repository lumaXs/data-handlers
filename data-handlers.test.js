import { describe, it, expect } from 'vitest'
import { normalize, validate, register, registerAliases, createPlugin, handlers } from 'data-handlers'

// ─── normalize() ─────────────────────────────────────────────────────────────

describe('normalize()', () => {
    describe('type: "name"', () => {
        it('normaliza nome simples', () => {
            expect(normalize({ type: 'name', value: 'john doe' })).toBe('John Doe')
        })
        it('normaliza com espaços extras', () => {
            expect(normalize({ type: 'name', value: '  joão   da   silva  ' })).toBe('João da Silva')
        })
        it('normaliza caixa alta', () => {
            expect(normalize({ type: 'name', value: 'MARIA SILVA' })).toBe('Maria Silva')
        })
        it('respeita conectivos pt-BR', () => {
            expect(normalize({ type: 'name', value: 'maria das dores' })).toBe('Maria das Dores')
        })
        it('desabilita conectivos com lowerCaseWords: []', () => {
            expect(normalize({ type: 'name', value: 'joao de paula', options: { lowerCaseWords: [] } }))
                .toBe('Joao De Paula')
        })
        it('lança TypeError para string vazia', () => {
            expect(() => normalize({ type: 'name', value: '' })).toThrow(TypeError)
        })
        it('lança TypeError para número', () => {
            expect(() => normalize({ type: 'name', value: 123 })).toThrow(TypeError)
        })
        it('mensagem contém prefixo correto', () => {
            expect(() => normalize({ type: 'name', value: '' })).toThrow('[normalize:name]')
        })
    })

    describe('type: "number"', () => {
        it('formata com locale pt-BR (padrão)', () => {
            expect(normalize({ type: 'number', value: 1234567.89 })).toBe('1.234.567,89')
        })
        it('formata como moeda BRL', () => {
            expect(normalize({ type: 'number', value: 9.9, options: { locale: 'pt-BR', style: 'currency', currency: 'BRL' } }))
                .toMatch(/R\$/)
        })
        it('formata como porcentagem', () => {
            expect(normalize({ type: 'number', value: 0.753, options: { style: 'percent', maximumFractionDigits: 1 } }))
                .toContain('%')
        })
        it('lança TypeError para string numérica', () => {
            expect(() => normalize({ type: 'number', value: '123' })).toThrow(TypeError)
        })
        it('lança RangeError para NaN', () => {
            expect(() => normalize({ type: 'number', value: NaN })).toThrow(RangeError)
        })
        it('lança RangeError para Infinity', () => {
            expect(() => normalize({ type: 'number', value: Infinity })).toThrow(RangeError)
        })
        it('mensagem contém prefixo correto', () => {
            expect(() => normalize({ type: 'number', value: NaN })).toThrow('[normalize:number]')
        })
    })

    describe('type: "date"', () => {
        it('formata Date com locale pt-BR', () => {
            expect(normalize({ type: 'date', value: new Date(2026, 2, 1), options: { locale: 'pt-BR' } }))
                .toBe('01/03/2026')
        })
        it('formata data longa pt-BR', () => {
            expect(normalize({ type: 'date', value: new Date(2026, 2, 1), options: { locale: 'pt-BR', dateStyle: 'long' } }))
                .toBe('1 de março de 2026')
        })
        it('formata timestamp numérico', () => {
            const ts = new Date(2024, 0, 1).getTime()
            expect(normalize({ type: 'date', value: ts, options: { locale: 'pt-BR' } })).toBe('01/01/2024')
        })
        it('lança TypeError para string inválida', () => {
            expect(() => normalize({ type: 'date', value: 'data-invalida' })).toThrow(TypeError)
        })
        it('mensagem contém prefixo correto', () => {
            expect(() => normalize({ type: 'date', value: 'invalido' })).toThrow('[normalize:date]')
        })
    })

    describe('tipo desconhecido / case-insensitive', () => {
        it('lança TypeError para tipo não registrado', () => {
            expect(() => normalize({ type: 'inexistente', value: 'x' })).toThrow(TypeError)
        })
        it('type é case-insensitive', () => {
            expect(normalize({ type: 'NAME', value: 'john doe' })).toBe('John Doe')
        })
        it('type ignora espaços extras', () => {
            expect(normalize({ type: '  name  ', value: 'john doe' })).toBe('John Doe')
        })
    })
})

// ─── validate() ─────────────────────────────────────────────────────────────

describe('validate()', () => {
    it('retorna { valid: true } para valor válido', () => {
        const r = validate({ type: 'name', value: 'John Doe' })
        expect(r.valid).toBe(true)
        expect(r.value).toBe('John Doe')
        expect(r.error).toBeNull()
    })
    it('retorna { valid: false } para valor inválido', () => {
        const r = validate({ type: 'name', value: '' })
        expect(r.valid).toBe(false)
        expect(r.value).toBeNull()
        expect(r.error).toContain('[normalize:name]')
    })
    it('nunca lança', () => {
        expect(() => validate({ type: 'name', value: '' })).not.toThrow()
        expect(() => validate({ type: 'number', value: NaN })).not.toThrow()
        expect(() => validate({ type: 'date', value: 'invalido' })).not.toThrow()
        expect(() => validate({ type: 'inexistente', value: 'x' })).not.toThrow()
    })
})

// ─── register() / registerAliases() / createPlugin() ─────────────────────────

describe('register()', () => {
    it('registra handler customizado', () => {
        register('upper', (v) => String(v).toUpperCase())
        expect(normalize({ type: 'upper', value: 'hello' })).toBe('HELLO')
    })
    it('lança TypeError se handler não for função', () => {
        expect(() => register('invalido', 'nope')).toThrow(TypeError)
    })
})

describe('registerAliases()', () => {
    it('cria aliases para tipo existente', () => {
        registerAliases('name', 'nome', 'fullname')
        expect(normalize({ type: 'nome',     value: 'joao' })).toBe('Joao')
        expect(normalize({ type: 'fullname', value: 'joao' })).toBe('Joao')
    })
    it('lança para tipo inexistente', () => {
        expect(() => registerAliases('naoexiste', 'alias')).toThrow(TypeError)
    })
})

describe('createPlugin()', () => {
    it('é alias de register', () => {
        createPlugin('greet', (v) => `Olá, ${v}!`)
        expect(normalize({ type: 'greet', value: 'Mundo' })).toBe('Olá, Mundo!')
    })
})

// ─── handlers proxy ──────────────────────────────────────────────────────────

describe('handlers proxy', () => {
    it('.normalize() funciona', () => {
        expect(handlers.name.normalize('  joao  ')).toBe('Joao')
    })
    it('.parse() é alias de .normalize()', () => {
        expect(handlers.name.parse('  joao  ')).toBe('Joao')
    })
    it('.validate() não lança', () => {
        expect(() => handlers.name.validate('')).not.toThrow()
        expect(handlers.name.validate('').valid).toBe(false)
    })
    it('.safe() é alias de .validate()', () => {
        const r = handlers.cpf.safe('11144477735')
        expect(r.valid).toBe(true)
    })
    it('é case-insensitive', () => {
        expect(handlers.NAME.normalize('joao')).toBe('Joao')
        expect(handlers.Name.normalize('joao')).toBe('Joao')
    })
    it('handlers.has() funciona', () => {
        expect(handlers.has('cpf')).toBe(true)
        expect(handlers.has('inexistente')).toBe(false)
    })
    it('handlers.types lista os tipos', () => {
        expect(handlers.types).toContain('name')
        expect(handlers.types).toContain('cpf')
    })
    it('handlers.$ retorna meta namespace', () => {
        expect(handlers.$.has('cpf')).toBe(true)
        expect(handlers.$.types).toContain('name')
    })
    it('atribuição direta lança TypeError', () => {
        expect(() => { handlers.name = 'algo' }).toThrow(TypeError)
    })
})
