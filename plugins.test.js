import { describe, it, expect } from 'vitest'
import { normalize, validate } from 'data-handlers'

import './dist/plugins/data-handlers-cpf/index.js'
import './dist/plugins/data-handlers-cnpj/index.js'
import './dist/plugins/data-handlers-phone/index.js'
import './dist/plugins/data-handlers-cep/index.js'
import './dist/plugins/data-handlers-slug/index.js'
import './dist/plugins/data-handlers-email/index.js'
import './dist/plugins/data-handlers-rg/index.js'
import './dist/plugins/data-handlers-color/index.js'

// ─── CPF ─────────────────────────────────────────────────────────────────────
describe('plugin: cpf', () => {
    it('formata CPF com dígitos', () => expect(normalize({ type: 'cpf', value: '11144477735' })).toBe('111.444.777-35'))
    it('formata CPF já formatado', () => expect(normalize({ type: 'cpf', value: '111.444.777-35' })).toBe('111.444.777-35'))
    it('lança para dígitos repetidos', () => expect(() => normalize({ type: 'cpf', value: '00000000000' })).toThrow(TypeError))
    it('lança para dígito verificador errado', () => expect(() => normalize({ type: 'cpf', value: '11144477700' })).toThrow(TypeError))
    it('validate retorna { valid: true }', () => {
        const r = validate({ type: 'cpf', value: '11144477735' })
        expect(r.valid).toBe(true)
        expect(r.value).toBe('111.444.777-35')
    })
    it('validate retorna { valid: false }', () => {
        const r = validate({ type: 'cpf', value: '00000000000' })
        expect(r.valid).toBe(false)
    })
})

// ─── CNPJ ────────────────────────────────────────────────────────────────────
describe('plugin: cnpj', () => {
    it('formata CNPJ com dígitos', () => expect(normalize({ type: 'cnpj', value: '11222333000181' })).toBe('11.222.333/0001-81'))
    it('formata CNPJ já formatado', () => expect(normalize({ type: 'cnpj', value: '11.222.333/0001-81' })).toBe('11.222.333/0001-81'))
    it('lança para dígitos repetidos', () => expect(() => normalize({ type: 'cnpj', value: '00000000000000' })).toThrow(TypeError))
    it('validate funciona', () => {
        const r = validate({ type: 'cnpj', value: '11222333000181' })
        expect(r.valid).toBe(true)
    })
})

// ─── CEP ─────────────────────────────────────────────────────────────────────
describe('plugin: cep', () => {
    it('formata CEP com dígitos', () => expect(normalize({ type: 'cep', value: '01310100' })).toBe('01310-100'))
    it('formata CEP já formatado', () => expect(normalize({ type: 'cep', value: '01310-100' })).toBe('01310-100'))
    it('lança para CEP incompleto', () => expect(() => normalize({ type: 'cep', value: '0131010' })).toThrow(TypeError))
})

// ─── Phone ───────────────────────────────────────────────────────────────────
describe('plugin: phone', () => {
    it('formata celular (11 dígitos)', () => expect(normalize({ type: 'phone', value: '11987654321' })).toBe('(11) 98765-4321'))
    it('formata fixo (10 dígitos)', () => expect(normalize({ type: 'phone', value: '1134567890' })).toBe('(11) 3456-7890'))
    it('lança para número inválido', () => expect(() => normalize({ type: 'phone', value: '123' })).toThrow(TypeError))
})

// ─── Slug ────────────────────────────────────────────────────────────────────
describe('plugin: slug', () => {
    it('gera slug básico', () => expect(normalize({ type: 'slug', value: 'Olá Mundo Legal!' })).toBe('ola-mundo-legal'))
    it('remove acentos', () => expect(normalize({ type: 'slug', value: 'Café & Chá' })).toBe('cafe-cha'))
    it('suporta separador customizado', () => expect(normalize({ type: 'slug', value: 'Post Incrível', options: { separator: '_' } })).toBe('post_incrivel'))
    it('lança para string vazia', () => expect(() => normalize({ type: 'slug', value: '' })).toThrow(TypeError))
})

// ─── Email ───────────────────────────────────────────────────────────────────
describe('plugin: email', () => {
    it('normaliza email (lowercase + trim)', () => {
        expect(normalize({ type: 'email', value: '  User@Example.COM  ' })).toBe('user@example.com')
    })
    it('aceita email válido', () => {
        expect(normalize({ type: 'email', value: 'joao@empresa.com.br' })).toBe('joao@empresa.com.br')
    })
    it('lança para email inválido', () => {
        expect(() => normalize({ type: 'email', value: 'invalido' })).toThrow(TypeError)
        expect(() => normalize({ type: 'email', value: 'sem@dominio' })).toThrow(TypeError)
    })
    it('validate funciona', () => {
        const r = validate({ type: 'email', value: 'ok@test.com' })
        expect(r.valid).toBe(true)
    })
})

// ─── RG ──────────────────────────────────────────────────────────────────────
describe('plugin: rg', () => {
    it('formata RG de 9 dígitos', () => {
        expect(normalize({ type: 'rg', value: '123456789' })).toBe('12.345.678-9')
    })
    it('formata RG terminado em X', () => {
        expect(normalize({ type: 'rg', value: '12345678X' })).toBe('12.345.678-X')
    })
    it('lança para formato inválido', () => {
        expect(() => normalize({ type: 'rg', value: '123' })).toThrow(TypeError)
    })
})

// ─── Color ───────────────────────────────────────────────────────────────────
describe('plugin: color', () => {
    it('normaliza hex shorthand', () => expect(normalize({ type: 'color', value: '#abc' })).toBe('#aabbcc'))
    it('normaliza hex completo', () => expect(normalize({ type: 'color', value: '#FF0080' })).toBe('#ff0080'))
    it('converte rgb() para hex', () => expect(normalize({ type: 'color', value: 'rgb(255,0,128)' })).toBe('#ff0080'))
    it('converte para rgb com option', () => {
        expect(normalize({ type: 'color', value: '#ff0080', options: { format: 'rgb' } })).toBe('rgb(255, 0, 128)')
    })
    it('lança para formato inválido', () => {
        expect(() => normalize({ type: 'color', value: 'vermelho' })).toThrow(TypeError)
    })
})
