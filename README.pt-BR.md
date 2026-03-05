🇧🇷 Português | [🇺🇸 English](./README.md)

---

# data-handlers

> Biblioteca de normalização e validação extensível com zero dependências — com suporte nacional de primeira classe e sistema de schemas.

[![npm](https://img.shields.io/npm/v/data-handlers)](https://www.npmjs.com/package/data-handlers)
[![license](https://img.shields.io/npm/l/data-handlers)](./LICENSE)
[![node](https://img.shields.io/node/v/data-handlers)](./package.json)

📦 [npmjs.com](https://www.npmjs.com/package/data-handlers) · 📖 [Documentação](https://lumaxs.github.io/data-handlers/)

---

## Funcionalidades

- **Zero dependências** — JS puro, só APIs nativas (`Intl`, `Map`, `Proxy`)
- **Handlers do core** — name, number, date, password, url, uuid, any
- **Plugins nacionais** — CPF, CNPJ, CEP, telefone, RG, slug, email, cor
- **Sistema de schemas** — valide e normalize objetos inteiros, à la Zod
- **Proxy fluente** — `handlers.cpf.parse(...)`, `handlers.name.safe(...)`
- **Aliases Zod-style** — `.parse()` e `.safe()` em todo tipo
- **Introspecção** — `handlers.has('cpf')`, `handlers.types`, `handlers.$`
- **Extensível** — `register()`, `registerAliases()`, `createPlugin()`
- **Case-insensitive** — `handlers.Name` === `handlers.name` (por design)
- **TypeScript completo** — `.d.ts` com autocomplete real para JS e TS

---

## Instalação

```bash
npm install data-handlers
# ou
pnpm add data-handlers
```

---

## Início rápido

```js
import { handlers, schema } from 'data-handlers'

// Handlers do core
handlers.name.normalize('  emerson   ribeiro  ')         // 'Emerson Ribeiro'
handlers.number.normalize(1234.5, { style: 'currency', currency: 'BRL' }) // 'R$ 1.234,50'
handlers.date.normalize(new Date(), { dateStyle: 'long', locale: 'pt-BR' }) // '5 de março de 2026'
handlers.password.normalize('Senha@123')                 // 'Senha@123' (validado)
handlers.url.normalize('HTTPS://EXAMPLE.COM/api')        // 'https://example.com/api'
handlers.uuid.normalize('550E8400-E29B-41D4-A716-446655440000') // lowercase

// Plugins brasileiros
handlers.cpf.normalize('11144477735')    // '111.444.777-35'
handlers.phone.normalize('11987654321')  // '(11) 98765-4321'
handlers.email.normalize('  User@SITE.COM  ') // 'user@site.com'
handlers.cep.normalize('01310100')       // '01310-100'

// Validação segura — nunca lança
handlers.cpf.safe('000.000.000-00')
// { valid: false, value: null, error: '[normalize:cpf] ...' }
```

---

## Introspecção

A lista completa de tipos registrados está sempre disponível em runtime — não precisa consultar a doc a cada novo handler ou plugin:

```js
handlers.types   // ['name', 'number', 'date', 'password', 'url', 'uuid', 'any', 'cpf', ...]
handlers.has('cpf')   // true
handlers.$.types       // meta namespace, igual a handlers.types
```

---

## API por tipo

Cada `handlers.<tipo>` expõe quatro métodos:

| Método               | Comportamento                                     |
|----------------------|---------------------------------------------------|
| `.normalize(v, opts)` | Normaliza; lança se inválido                     |
| `.validate(v, opts)`  | Nunca lança; retorna `{ valid, value, error }`   |
| `.parse(v, opts)`     | Alias de `.normalize` (Zod-style)                |
| `.safe(v, opts)`      | Alias de `.validate` (Zod-style)                 |

---

## Sistema de schemas

```js
import { schema } from 'data-handlers'

const userSchema = schema({
    name:     'name',
    email:    'email',
    phone:    { type: 'phone', optional: true },
    document: 'cpf',
    password: 'password',
    website:  { type: 'url', optional: true },
    tag:      'any',  // passa qualquer valor não-nulo como está
})

// parse — lança SchemaError com .errors se inválido
userSchema.parse({ name: 'JOAO SILVA', email: 'joao@example.com', ... })

// safeParse — nunca lança
const result = userSchema.safeParse(req.body)
if (!result.success) return res.status(400).json({ errors: result.errors })
await db.usuarios.criar(result.data) // já normalizado

// Utilitários (imutáveis — sempre retornam novo schema)
userSchema.partial()                    // todos os campos opcionais
userSchema.pick('name', 'email')        // só esses campos
userSchema.omit('password')             // sem esse campo
userSchema.extend({ rg: 'rg' })         // adiciona campos
```

### Opções de campo

```js
schema({
    name: 'name',                   // forma curta
    phone: {
        type:     'phone',
        optional: true,             // null/undefined passam sem erro
        default:  '11999999999',    // valor usado quando o campo for undefined
        options:  { ... },          // repassadas ao handler
        label:    'Telefone',       // rótulo legível nas mensagens de erro
    },
    score: {
        type:    'any',
        options: { demandType: 'number' }, // aceita só numbers
    },
})
```

---

## Handlers do core

### `name`
Title Case com conectivos pt-BR (`de`, `da`, `do`, `das`, `dos`, `e`) e em inglês (`of`, `the`, `and`) em minúsculo, exceto o primeiro token.

### `number`
Delega para `Intl.NumberFormat`. Locale padrão: `pt-BR`. Lança `TypeError` para não-números, `RangeError` para `NaN`/`Infinity`.

### `date`
Delega para `Intl.DateTimeFormat`. Aceita `Date`, string ISO e timestamp numérico em ms. Locale padrão: `pt-BR`.

### `password`
Valida senha com regras configuráveis:

```js
handlers.password.normalize('Senha@123')
// padrão: minLength 8, requer maiúscula, minúscula e especial

handlers.password.normalize('SenhaSegura@1', {
    minLength:        12,
    requireNumber:    true,   // padrão: false
    requireSpecial:   true,
    requireUppercase: true,
    requireLowercase: true,
})
```

### `url`
Valida e normaliza URLs. Coloca o host em lowercase, preserva path e query.

```js
handlers.url.normalize('HTTPS://EXAMPLE.COM/path')  // 'https://example.com/path'
handlers.url.normalize('ftp://x.com', { protocols: ['ftp'] }) // protocolo customizado
```

### `uuid`
Valida formato UUID. Suporta v1, v3, v4, v5 e v7.

```js
handlers.uuid.normalize('550E8400-E29B-41D4-A716-446655440000')
// '550e8400-e29b-41d4-a716-446655440000'

handlers.uuid.normalize(id, { version: 4 })      // exige v4
handlers.uuid.normalize(id, { uppercase: true })  // retorna maiúsculo
```

### `any`
Passa qualquer valor não-nulo sem normalizar. Útil em schemas para campos sem handler específico. Suporta `demandType` para restringir o tipo primitivo, e `transform` para validações ou transformações inline.

```js
// Uso básico
handlers.any.normalize('texto')  // 'texto'
handlers.any.normalize(42)       // 42
handlers.any.normalize(true)     // true

// demandType — restringe o tipo primitivo aceito
handlers.any.normalize(42,  { demandType: 'number' })   // 42
handlers.any.safe('oi',     { demandType: 'number' })   // { valid: false, ... }

// transform — callback inline, roda após demandType
handlers.any.normalize(150, {
    demandType: 'number',
    transform:  (v) => Math.min(100, v), // clamp máximo 100
}) // 100

// transform pode lançar para validações customizadas
handlers.any.normalize(value, {
    transform: (v) => {
        if (!Array.isArray(v)) throw new TypeError('[normalize:any] Expected array.')
        return v.map(t => t.trim().toLowerCase())
    }
})

// No schema
schema({
    tag:   'any',
    score: { type: 'any', options: { demandType: 'number', transform: (v) => Math.max(0, Math.min(100, v)) } },
    tags:  { type: 'any', options: { transform: (v) => Array.isArray(v) ? v.map(t => t.toLowerCase()) : [v] } },
    meta:  { type: 'any', optional: true },
})
```

---

## Plugins inclusos

Todos carregados automaticamente ao importar `data-handlers`. A tabela abaixo cobre os principais — a lista completa está sempre disponível em runtime via `handlers.types`.

| Tipo    | Descrição                          |
|---------|------------------------------------|
| `cpf`   | Valida e formata CPF               |
| `cnpj`  | Valida e formata CNPJ              |
| `phone` | Formata telefone brasileiro        |
| `cep`   | Formata CEP                        |
| `email` | Valida e normaliza e-mail          |
| `rg`    | Formata RG no padrão SP            |
| `slug`  | Gera slugs URL-friendly            |
| `color` | Normaliza hex/rgb                  |

---

## Registro customizado

```js
import { register, registerAliases, createPlugin } from 'data-handlers'

register('placa', (value) => {
    const clean = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!/^[A-Z]{3}[0-9]{4}$/.test(clean) && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean))
        throw new TypeError(`[normalize:placa] Placa inválida: ${value}`)
    return `${clean.slice(0, 3)}-${clean.slice(3)}`
})

registerAliases('name', 'nome', 'nomeCompleto')
createPlugin('meuTipo', meuHandler) // alias semântico de register(), para pacotes npm
```

---

## TypeScript

Escrita em JS com declarações `.d.ts` completas. Todos os tipos exportados:

```ts
import type {
    Handler, TypeAccessor, HandlersProxy, ValidateResult,
    Schema, SchemaShape, FieldConfig, SchemaParseResult,
    NameHandlerOptions, NumberHandlerOptions, DateHandlerOptions,
    PasswordHandlerOptions, UrlHandlerOptions, UuidHandlerOptions,
    AnyHandlerOptions, SlugHandlerOptions, ColorHandlerOptions, RgHandlerOptions,
} from 'data-handlers'
```

---

## Segurança e performance

- Zero dependências
- `Object.freeze()` em cada accessor de tipo
- Cache de accessors — 1 objeto por tipo, reutilizado em loops
- `handlers.name = ...` lança `TypeError` imediatamente
- Erros com prefixo `[normalize:<tipo>]` para fácil debug
- Node.js >= 18

---

## Licença

[MIT](./LICENSE) © Emersom Oliveira
