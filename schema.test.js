import { describe, it, expect } from 'vitest'
import { schema } from 'data-handlers'

describe('schema()', () => {
  // ─── .parse() ────────────────────────────────────────────────────────────
  describe('.parse()', () => {
    it('normaliza objeto válido', () => {
      const s = schema({ name: 'name', doc: 'cpf' })
      const result = s.parse({ name: 'JOAO SILVA', doc: '11144477735' })
      expect(result.name).toBe('Joao Silva')
      expect(result.doc).toBe('111.444.777-35')
    })

    it('lança SchemaError para objeto inválido', () => {
      const s = schema({ name: 'name' })
      expect(() => s.parse({ name: '' })).toThrow('SchemaError')
    })

    it('SchemaError contém .errors', () => {
      const s = schema({ name: 'name', doc: 'cpf' })
      try {
        s.parse({ name: '', doc: '000' })
      } catch (err) {
        expect(err.errors).toHaveProperty('name')
        expect(err.errors).toHaveProperty('doc')
      }
    })

    it('suporta opções por campo', () => {
      const s = schema({
        amount: {
          type: 'number',
          options: { style: 'currency', currency: 'BRL', locale: 'pt-BR' },
        },
      })
      const r = s.parse({ amount: 99.9 })
      expect(r.amount).toMatch(/R\$/)
    })
  })

  // ─── .safeParse() ────────────────────────────────────────────────────────
  describe('.safeParse()', () => {
    it('retorna { success: true } para objeto válido', () => {
      const s = schema({ name: 'name' })
      const r = s.safeParse({ name: 'joao' })
      expect(r.success).toBe(true)
      expect(r.data?.name).toBe('Joao')
      expect(r.errors).toBeNull()
    })

    it('retorna { success: false } para objeto inválido', () => {
      const s = schema({ name: 'name' })
      const r = s.safeParse({ name: '' })
      expect(r.success).toBe(false)
      expect(r.data).toBeNull()
      expect(r.errors).toHaveProperty('name')
    })

    it('nunca lança', () => {
      const s = schema({ name: 'name' })
      expect(() => s.safeParse({ name: '' })).not.toThrow()
      expect(() => s.safeParse(null)).not.toThrow()
      expect(() => s.safeParse('string')).not.toThrow()
    })
  })

  // ─── optional / default ──────────────────────────────────────────────────
  describe('optional e default', () => {
    it('campo optional permite null/undefined', () => {
      const s = schema({
        name: 'name',
        phone: { type: 'phone', optional: true },
      })
      const r = s.safeParse({ name: 'joao' })
      expect(r.success).toBe(true)
      expect(r.data?.phone).toBeNull()
    })

    it('campo com default usa valor padrão quando ausente', () => {
      const s = schema({
        name: 'name',
        country: { type: 'slug', default: 'brasil' },
      })
      const r = s.safeParse({ name: 'joao' })
      expect(r.success).toBe(true)
      expect(r.data?.country).toBe('brasil')
    })

    it('campo obrigatório ausente gera erro', () => {
      const s = schema({ name: 'name', doc: 'cpf' })
      const r = s.safeParse({ name: 'joao' })
      expect(r.success).toBe(false)
      expect(r.errors).toHaveProperty('doc')
    })
  })

  // ─── .extend() ───────────────────────────────────────────────────────────
  describe('.extend()', () => {
    it('adiciona campos sem modificar o original', () => {
      const base = schema({ name: 'name' })
      const extended = base.extend({ doc: 'cpf' })
      expect(Object.keys(extended.fields)).toContain('name')
      expect(Object.keys(extended.fields)).toContain('doc')
      expect(Object.keys(base.fields)).not.toContain('doc')
    })
  })

  // ─── .pick() / .omit() ───────────────────────────────────────────────────
  describe('.pick() e .omit()', () => {
    it('.pick() retorna apenas campos selecionados', () => {
      const s = schema({ name: 'name', doc: 'cpf', phone: 'phone' })
      const picked = s.pick('name', 'phone')
      expect(Object.keys(picked.fields)).toEqual(['name', 'phone'])
    })

    it('.omit() remove campos', () => {
      const s = schema({ name: 'name', doc: 'cpf', phone: 'phone' })
      const omitted = s.omit('phone')
      expect(Object.keys(omitted.fields)).not.toContain('phone')
      expect(Object.keys(omitted.fields)).toContain('name')
    })
  })

  // ─── .partial() ──────────────────────────────────────────────────────────
  describe('.partial()', () => {
    it('torna todos os campos opcionais', () => {
      const s = schema({ name: 'name', doc: 'cpf' }).partial()
      const r = s.safeParse({})
      expect(r.success).toBe(true)
    })
  })

  // ─── tipo inválido no shape ───────────────────────────────────────────────
  describe('validação do shape', () => {
    it('lança ao definir schema com tipo desconhecido', () => {
      expect(() => schema({ campo: 'tipo-inexistente' })).toThrow(TypeError)
    })
  })
})
