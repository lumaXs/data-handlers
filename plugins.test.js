import { describe, it, expect } from 'vitest'
import { normalize, validate } from 'data-handlers'

import './plugins/data-handlers-cpf/index.js'
import './plugins/data-handlers-cnpj/index.js'
import './plugins/data-handlers-phone/index.js'
import './plugins/data-handlers-cep/index.js'
import './plugins/data-handlers-slug/index.js'

// ─────────────────────────────────────────────
// Plugin: CPF
// ─────────────────────────────────────────────

describe('plugin: cpf', () => {
    describe('normalize()', () => {
        it('formata CPF apenas com dígitos', () => {
            expect(normalize({ type: 'cpf', value: '11144477735' })).toBe('111.444.777-35')
        })

        it('formata CPF já formatado', () => {
            expect(normalize({ type: 'cpf', value: '111.444.777-35' })).toBe('111.444.777-35')
        })

        it('lança TypeError para CPF com todos dígitos iguais', () => {
            expect(() => normalize({ type: 'cpf', value: '00000000000' })).toThrow(TypeError)
            expect(() => normalize({ type: 'cpf', value: '11111111111' })).toThrow(TypeError)
            expect(() => normalize({ type: 'cpf', value: '99999999999' })).toThrow(TypeError)
        })

        it('lança TypeError para CPF com dígito verificador errado', () => {
            expect(() => normalize({ type: 'cpf', value: '11144477700' })).toThrow(TypeError)
        })

        it('lança TypeError para CPF com menos de 11 dígitos', () => {
            expect(() => normalize({ type: 'cpf', value: '1234567' })).toThrow(TypeError)
        })

        it('lança TypeError para string vazia', () => {
            expect(() => normalize({ type: 'cpf', value: '' })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'cpf', value: '00000000000' }))
                .toThrow('[normalize:cpf]')
        })
    })

    describe('validate()', () => {
        it('retorna { valid: true } para CPF válido', () => {
            const result = validate({ type: 'cpf', value: '11144477735' })
            expect(result.valid).toBe(true)
            expect(result.value).toBe('111.444.777-35')
            expect(result.error).toBeNull()
        })

        it('retorna { valid: false } para CPF inválido', () => {
            const result = validate({ type: 'cpf', value: '00000000000' })
            expect(result.valid).toBe(false)
            expect(result.value).toBeNull()
            expect(result.error).toContain('[normalize:cpf]')
        })

        it('nunca lança', () => {
            expect(() => validate({ type: 'cpf', value: '00000000000' })).not.toThrow()
            expect(() => validate({ type: 'cpf', value: '' })).not.toThrow()
        })
    })
})

// ─────────────────────────────────────────────
// Plugin: CNPJ
// ─────────────────────────────────────────────

describe('plugin: cnpj', () => {
    describe('normalize()', () => {
        it('formata CNPJ apenas com dígitos', () => {
            expect(normalize({ type: 'cnpj', value: '11222333000181' })).toBe('11.222.333/0001-81')
        })

        it('formata CNPJ já formatado', () => {
            expect(normalize({ type: 'cnpj', value: '11.222.333/0001-81' })).toBe('11.222.333/0001-81')
        })

        it('lança TypeError para CNPJ com todos dígitos iguais', () => {
            expect(() => normalize({ type: 'cnpj', value: '00000000000000' })).toThrow(TypeError)
            expect(() => normalize({ type: 'cnpj', value: '11111111111111' })).toThrow(TypeError)
        })

        it('lança TypeError para CNPJ com dígito verificador errado', () => {
            expect(() => normalize({ type: 'cnpj', value: '11222333000100' })).toThrow(TypeError)
        })

        it('lança TypeError para CNPJ com menos de 14 dígitos', () => {
            expect(() => normalize({ type: 'cnpj', value: '1122233300' })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'cnpj', value: '00000000000000' }))
                .toThrow('[normalize:cnpj]')
        })
    })

    describe('validate()', () => {
        it('retorna { valid: true } para CNPJ válido', () => {
            const result = validate({ type: 'cnpj', value: '11222333000181' })
            expect(result.valid).toBe(true)
            expect(result.value).toBe('11.222.333/0001-81')
            expect(result.error).toBeNull()
        })

        it('retorna { valid: false } para CNPJ inválido', () => {
            const result = validate({ type: 'cnpj', value: '00000000000000' })
            expect(result.valid).toBe(false)
            expect(result.value).toBeNull()
            expect(result.error).toContain('[normalize:cnpj]')
        })

        it('nunca lança', () => {
            expect(() => validate({ type: 'cnpj', value: '00000000000000' })).not.toThrow()
        })
    })
})

// ─────────────────────────────────────────────
// Plugin: Phone
// ─────────────────────────────────────────────

describe('plugin: phone', () => {
    describe('normalize()', () => {
        it('formata celular com 11 dígitos', () => {
            expect(normalize({ type: 'phone', value: '11987654321' })).toBe('(11) 98765-4321')
        })

        it('formata fixo com 10 dígitos', () => {
            expect(normalize({ type: 'phone', value: '1134567890' })).toBe('(11) 3456-7890')
        })

        it('formata número já formatado (celular)', () => {
            expect(normalize({ type: 'phone', value: '(11) 98765-4321' })).toBe('(11) 98765-4321')
        })

        it('formata número já formatado (fixo)', () => {
            expect(normalize({ type: 'phone', value: '(11) 3456-7890' })).toBe('(11) 3456-7890')
        })

        it('lança TypeError para número com dígitos insuficientes', () => {
            expect(() => normalize({ type: 'phone', value: '119876' })).toThrow(TypeError)
        })

        it('lança TypeError para número com dígitos demais', () => {
            expect(() => normalize({ type: 'phone', value: '119876543210000' })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'phone', value: '123' }))
                .toThrow('[normalize:phone]')
        })
    })

    describe('validate()', () => {
        it('retorna { valid: true } para celular válido', () => {
            const result = validate({ type: 'phone', value: '11987654321' })
            expect(result.valid).toBe(true)
            expect(result.value).toBe('(11) 98765-4321')
        })

        it('retorna { valid: true } para fixo válido', () => {
            const result = validate({ type: 'phone', value: '1134567890' })
            expect(result.valid).toBe(true)
            expect(result.value).toBe('(11) 3456-7890')
        })

        it('retorna { valid: false } para número inválido', () => {
            const result = validate({ type: 'phone', value: '123' })
            expect(result.valid).toBe(false)
            expect(result.error).toContain('[normalize:phone]')
        })

        it('nunca lança', () => {
            expect(() => validate({ type: 'phone', value: '123' })).not.toThrow()
        })
    })
})

// ─────────────────────────────────────────────
// Plugin: CEP
// ─────────────────────────────────────────────

describe('plugin: cep', () => {
    describe('normalize()', () => {
        it('formata CEP apenas com dígitos', () => {
            expect(normalize({ type: 'cep', value: '01310100' })).toBe('01310-100')
        })

        it('formata CEP já formatado', () => {
            expect(normalize({ type: 'cep', value: '01310-100' })).toBe('01310-100')
        })

        it('lança TypeError para CEP com menos de 8 dígitos', () => {
            expect(() => normalize({ type: 'cep', value: '0131010' })).toThrow(TypeError)
        })

        it('lança TypeError para CEP com mais de 8 dígitos', () => {
            expect(() => normalize({ type: 'cep', value: '013101000' })).toThrow(TypeError)
        })

        it('lança TypeError para string vazia', () => {
            expect(() => normalize({ type: 'cep', value: '' })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'cep', value: '123' }))
                .toThrow('[normalize:cep]')
        })
    })

    describe('validate()', () => {
        it('retorna { valid: true } para CEP válido', () => {
            const result = validate({ type: 'cep', value: '01310100' })
            expect(result.valid).toBe(true)
            expect(result.value).toBe('01310-100')
        })

        it('retorna { valid: false } para CEP inválido', () => {
            const result = validate({ type: 'cep', value: '123' })
            expect(result.valid).toBe(false)
            expect(result.error).toContain('[normalize:cep]')
        })

        it('nunca lança', () => {
            expect(() => validate({ type: 'cep', value: '123' })).not.toThrow()
        })
    })
})

// ─────────────────────────────────────────────
// Plugin: Slug
// ─────────────────────────────────────────────

describe('plugin: slug', () => {
    describe('normalize()', () => {
        it('converte string simples em slug', () => {
            expect(normalize({ type: 'slug', value: 'Olá Mundo Legal!' })).toBe('ola-mundo-legal')
        })

        it('remove acentos e caracteres especiais', () => {
            expect(normalize({ type: 'slug', value: 'Café & Chá' })).toBe('cafe-cha')
        })

        it('colapsa múltiplos espaços e hífens', () => {
            expect(normalize({ type: 'slug', value: 'muito   espaço   aqui' })).toBe('muito-espaco-aqui')
        })

        it('remove hífen no início e no fim', () => {
            expect(normalize({ type: 'slug', value: '!titulo incrível!' })).toBe('titulo-incrivel')
        })

        it('mantém números no slug', () => {
            expect(normalize({ type: 'slug', value: 'post 42 top' })).toBe('post-42-top')
        })

        it('lança TypeError para string vazia', () => {
            expect(() => normalize({ type: 'slug', value: '' })).toThrow(TypeError)
        })

        it('lança TypeError para string só com espaços', () => {
            expect(() => normalize({ type: 'slug', value: '   ' })).toThrow(TypeError)
        })

        it('lança TypeError para número', () => {
            expect(() => normalize({ type: 'slug', value: 123 })).toThrow(TypeError)
        })

        it('mensagem de erro contém o prefixo correto', () => {
            expect(() => normalize({ type: 'slug', value: '' }))
                .toThrow('[normalize:slug]')
        })
    })

    describe('validate()', () => {
        it('retorna { valid: true } para string válida', () => {
            const result = validate({ type: 'slug', value: 'Olá Mundo' })
            expect(result.valid).toBe(true)
            expect(result.value).toBe('ola-mundo')
        })

        it('retorna { valid: false } para string vazia', () => {
            const result = validate({ type: 'slug', value: '' })
            expect(result.valid).toBe(false)
            expect(result.error).toContain('[normalize:slug]')
        })

        it('nunca lança', () => {
            expect(() => validate({ type: 'slug', value: '' })).not.toThrow()
        })
    })
})
