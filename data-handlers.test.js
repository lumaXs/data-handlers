import { describe, it, expect } from 'vitest'
import { normalize, validate, register, registerAliases, createPlugin, handlers, schema } from 'data-handlers'

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
      expect(normalize({ type: 'nome', value: 'joao' })).toBe('Joao')
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

// ─── password ─────────────────────────────────────────────────────────────────

describe('type: "password"', () => {
   it('aceita senha válida com padrões default', () => {
      expect(normalize({ type: 'password', value: 'Senha@123' })).toBe('Senha@123')
   })
   it('lança se menor que minLength (default 8)', () => {
      expect(() => normalize({ type: 'password', value: 'Ab@1' })).toThrow('[normalize:password]')
   })
   it('lança se não tiver maiúscula', () => {
      expect(() => normalize({ type: 'password', value: 'senha@123' })).toThrow('[normalize:password]')
   })
   it('lança se não tiver minúscula', () => {
      expect(() => normalize({ type: 'password', value: 'SENHA@123' })).toThrow('[normalize:password]')
   })
   it('lança se não tiver especial', () => {
      expect(() => normalize({ type: 'password', value: 'SenhaABC1' })).toThrow('[normalize:password]')
   })
   it('aceita minLength customizado', () => {
      expect(normalize({ type: 'password', value: 'Abc@1234567890', options: { minLength: 12 } }))
         .toBe('Abc@1234567890')
   })
   it('lança com minLength customizado insuficiente', () => {
      expect(() => normalize({ type: 'password', value: 'Abc@1234', options: { minLength: 12 } }))
         .toThrow('[normalize:password]')
   })
   it('aceita sem especial quando requireSpecial: false', () => {
      expect(normalize({ type: 'password', value: 'SenhaABC1', options: { requireSpecial: false } }))
         .toBe('SenhaABC1')
   })
   it('exige número quando requireNumber: true', () => {
      expect(() => normalize({ type: 'password', value: 'Senha@abc', options: { requireNumber: true } }))
         .toThrow('[normalize:password]')
   })
   it('aceita número quando requireNumber: true e tem número', () => {
      expect(normalize({ type: 'password', value: 'Senha@123', options: { requireNumber: true } }))
         .toBe('Senha@123')
   })
   it('lança para valor não-string', () => {
      expect(() => normalize({ type: 'password', value: 12345678 })).toThrow('[normalize:password]')
   })
   it('mensagem contém prefixo correto', () => {
      expect(() => normalize({ type: 'password', value: 'fraca' })).toThrow('[normalize:password]')
   })
})

// ─── url ──────────────────────────────────────────────────────────────────────

describe('type: "url"', () => {
   it('normaliza URL simples', () => {
      expect(normalize({ type: 'url', value: 'https://example.com' })).toBe('https://example.com/')
   })
   it('lowercase no host', () => {
      expect(normalize({ type: 'url', value: 'HTTPS://EXAMPLE.COM/path' })).toBe('https://example.com/path')
   })
   it('preserva path', () => {
      expect(normalize({ type: 'url', value: 'https://example.com/api/v1' }))
         .toBe('https://example.com/api/v1')
   })
   it('preserva query string', () => {
      expect(normalize({ type: 'url', value: 'https://example.com/api?foo=bar' }))
         .toBe('https://example.com/api?foo=bar')
   })
   it('aceita http', () => {
      expect(normalize({ type: 'url', value: 'http://example.com' })).toBe('http://example.com/')
   })
   it('lança para URL inválida', () => {
      expect(() => normalize({ type: 'url', value: 'nao-e-url' })).toThrow('[normalize:url]')
   })
   it('lança para protocolo não permitido (ftp)', () => {
      expect(() => normalize({ type: 'url', value: 'ftp://example.com' })).toThrow('[normalize:url]')
   })
   it('aceita protocolo customizado via options', () => {
      expect(normalize({ type: 'url', value: 'ftp://example.com', options: { protocols: ['ftp'] } }))
         .toBe('ftp://example.com/')
   })
   it('lança para string vazia', () => {
      expect(() => normalize({ type: 'url', value: '' })).toThrow('[normalize:url]')
   })
   it('mensagem contém prefixo correto', () => {
      expect(() => normalize({ type: 'url', value: 'invalida' })).toThrow('[normalize:url]')
   })
})

// ─── uuid ─────────────────────────────────────────────────────────────────────

describe('type: "uuid"', () => {
   const V4 = '550e8400-e29b-41d4-a716-446655440000'
   const V1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

   it('aceita UUID válido', () => {
      expect(normalize({ type: 'uuid', value: V4 })).toBe(V4)
   })
   it('normaliza para lowercase', () => {
      expect(normalize({ type: 'uuid', value: V4.toUpperCase() })).toBe(V4)
   })
   it('retorna uppercase com options.uppercase: true', () => {
      expect(normalize({ type: 'uuid', value: V4, options: { uppercase: true } }))
         .toBe(V4.toUpperCase())
   })
   it('valida versão específica v4', () => {
      expect(normalize({ type: 'uuid', value: V4, options: { version: 4 } })).toBe(V4)
   })
   it('valida versão específica v1', () => {
      expect(normalize({ type: 'uuid', value: V1, options: { version: 1 } })).toBe(V1)
   })
   it('lança quando versão não bate', () => {
      expect(() => normalize({ type: 'uuid', value: V1, options: { version: 4 } }))
         .toThrow('[normalize:uuid]')
   })
   it('lança para UUID inválido', () => {
      expect(() => normalize({ type: 'uuid', value: 'nao-e-uuid' })).toThrow('[normalize:uuid]')
   })
   it('lança para string vazia', () => {
      expect(() => normalize({ type: 'uuid', value: '' })).toThrow('[normalize:uuid]')
   })
   it('lança para versão não suportada', () => {
      expect(() => normalize({ type: 'uuid', value: V4, options: { version: 9 } }))
         .toThrow('[normalize:uuid]')
   })
   it('mensagem contém prefixo correto', () => {
      expect(() => normalize({ type: 'uuid', value: 'invalido' })).toThrow('[normalize:uuid]')
   })
})

// ─── any ──────────────────────────────────────────────────────────────────────

describe('type: "any"', () => {
   it('passa string sem modificar', () => {
      expect(normalize({ type: 'any', value: 'hello' })).toBe('hello')
   })
   it('passa number sem modificar', () => {
      expect(normalize({ type: 'any', value: 42 })).toBe(42)
   })
   it('passa boolean sem modificar', () => {
      expect(normalize({ type: 'any', value: true })).toBe(true)
   })
   it('passa objeto sem modificar', () => {
      const obj = { a: 1 }
      expect(normalize({ type: 'any', value: obj })).toBe(obj)
   })
   it('lança para null', () => {
      expect(() => normalize({ type: 'any', value: null })).toThrow('[normalize:any]')
   })
   it('lança para undefined', () => {
      expect(() => normalize({ type: 'any', value: undefined })).toThrow('[normalize:any]')
   })
   it('aceita com demandType correto', () => {
      expect(normalize({ type: 'any', value: 'oi', options: { demandType: 'string' } })).toBe('oi')
      expect(normalize({ type: 'any', value: 42, options: { demandType: 'number' } })).toBe(42)
      expect(normalize({ type: 'any', value: true, options: { demandType: 'boolean' } })).toBe(true)
   })
   it('lança quando demandType não bate', () => {
      expect(() => normalize({ type: 'any', value: 42, options: { demandType: 'string' } }))
         .toThrow('[normalize:any]')
   })
   it('lança quando demandType não bate — boolean vs number', () => {
      expect(() => normalize({ type: 'any', value: true, options: { demandType: 'number' } }))
         .toThrow('[normalize:any]')
   })
   it('mensagem contém prefixo correto', () => {
      expect(() => normalize({ type: 'any', value: null })).toThrow('[normalize:any]')
   })
   it('funciona no schema sem demandType', () => {
      const s = schema({ tag: 'any', score: 'any' })
      const r = s.safeParse({ tag: 'vip', score: 99 })
      expect(r.success).toBe(true)
      expect(r.data.tag).toBe('vip')
      expect(r.data.score).toBe(99)
   })
   it('funciona no schema com demandType', () => {
      const s = schema({ age: { type: 'any', options: { demandType: 'number' } } })
      expect(s.safeParse({ age: 25 }).success).toBe(true)
      expect(s.safeParse({ age: '25' }).success).toBe(false)
   })
   it('aplica transform no valor', () => {
      expect(normalize({ type: 'any', value: 5, options: { transform: (v) => v * 2 } })).toBe(10)
   })
   it('transform recebe string e retorna uppercase', () => {
      expect(normalize({ type: 'any', value: 'oi', options: { transform: (v) => v.toUpperCase() } })).toBe('OI')
   })
   it('transform roda após demandType', () => {
      expect(normalize({ type: 'any', value: 5, options: { demandType: 'number', transform: (v) => v * 3 } })).toBe(15)
   })
   it('lança se demandType falha antes do transform', () => {
      expect(() => normalize({ type: 'any', value: 'oi', options: { demandType: 'number', transform: (v) => v } }))
         .toThrow('[normalize:any]')
   })
   it('lança se transform não for função', () => {
      expect(() => normalize({ type: 'any', value: 42, options: { transform: 'nope' } }))
         .toThrow('[normalize:any]')
   })
   it('transform pode lançar TypeError customizado', () => {
      expect(() => normalize({ type: 'any', value: 42, options: { transform: () => { throw new TypeError('custom') } } }))
         .toThrow('custom')
   })
   it('funciona no schema com transform', () => {
      const s = schema({ score: { type: 'any', options: { demandType: 'number', transform: (v) => Math.min(100, v) } } })
      expect(s.safeParse({ score: 150 }).data.score).toBe(100)
      expect(s.safeParse({ score: 80 }).data.score).toBe(80)
   })
})
