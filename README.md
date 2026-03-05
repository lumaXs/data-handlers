[🇺🇸 English](./README.md) | 🇧🇷 [Português](./README.pt-BR.md)

---

# data-handlers

> Zero-dependency normalization and validation library with pluggable handlers — built for the Brazilian market, designed for everyone.

[![npm](https://img.shields.io/npm/v/data-handlers)](https://www.npmjs.com/package/data-handlers)
[![license](https://img.shields.io/npm/l/data-handlers)](./LICENSE)
[![node](https://img.shields.io/node/v/data-handlers)](./package.json)

📦 [npmjs.com](https://www.npmjs.com/package/data-handlers) · 📖 [Documentation](https://lumaxs.github.io/data-handlers/)

---

## Features

- **Zero dependencies** — pure JS, only native APIs (`Intl`, `Map`, `Proxy`)
- **Core handlers** — name, number, date, password, url, uuid, any
- **Brazilian plugins** — CPF, CNPJ, CEP, phone, RG, slug, email, color
- **Schema system** — validate and normalize entire objects, à la Zod
- **Fluent proxy** — `handlers.cpf.parse(...)`, `handlers.name.safe(...)`
- **Zod-style aliases** — `.parse()` and `.safe()` on every type
- **Introspection** — `handlers.has('cpf')`, `handlers.types`, `handlers.$`
- **Extensible** — `register()`, `registerAliases()`, `createPlugin()`
- **Case-insensitive** — `handlers.Name` === `handlers.name` (by design)
- **Full TypeScript** — `.d.ts` with JSDoc autocomplete for JS too

---

## Installation

```bash
npm install data-handlers
# or
pnpm add data-handlers
```

---

## Quick start

```js
import { handlers, schema } from 'data-handlers'

// Core handlers
handlers.name.normalize('  emerson   ribeiro  ')         // 'Emerson Ribeiro'
handlers.number.normalize(1234.5, { style: 'currency', currency: 'BRL' }) // 'R$ 1.234,50'
handlers.date.normalize(new Date(), { dateStyle: 'long', locale: 'pt-BR' }) // '5 de março de 2026'
handlers.password.normalize('Senha@123')                 // 'Senha@123' (validated)
handlers.url.normalize('HTTPS://EXAMPLE.COM/api')        // 'https://example.com/api'
handlers.uuid.normalize('550E8400-E29B-41D4-A716-446655440000') // lowercase

// Brazilian plugins
handlers.cpf.normalize('11144477735')    // '111.444.777-35'
handlers.phone.normalize('11987654321')  // '(11) 98765-4321'
handlers.email.normalize('  User@SITE.COM  ') // 'user@site.com'
handlers.cep.normalize('01310100')       // '01310-100'

// Safe validation — never throws
handlers.cpf.safe('000.000.000-00')
// { valid: false, value: null, error: '[normalize:cpf] ...' }
```

---

## Introspection

The full list of registered types is always available at runtime — no need to check the docs for every new handler or plugin:

```js
handlers.types   // ['name', 'number', 'date', 'password', 'url', 'uuid', 'any', 'cpf', ...]
handlers.has('cpf')   // true
handlers.$.types       // meta namespace, same as handlers.types
```

---

## Accessor API

Each `handlers.<type>` exposes four methods:

| Method               | Behaviour                                       |
|----------------------|-------------------------------------------------|
| `.normalize(v, opts)` | Normalizes; throws if invalid                  |
| `.validate(v, opts)`  | Never throws; returns `{ valid, value, error }` |
| `.parse(v, opts)`     | Alias for `.normalize` (Zod-style)             |
| `.safe(v, opts)`      | Alias for `.validate` (Zod-style)              |

---

## Schema system

```js
import { schema } from 'data-handlers'

const userSchema = schema({
    name:     'name',
    email:    'email',
    phone:    { type: 'phone', optional: true },
    document: 'cpf',
    password: 'password',
    website:  { type: 'url', optional: true },
    tag:      'any',  // passes any non-null value as-is
})

// parse — throws SchemaError with .errors map if invalid
userSchema.parse({ name: 'JOAO SILVA', email: 'joao@example.com', ... })

// safeParse — never throws
const result = userSchema.safeParse(req.body)
if (!result.success) return res.status(400).json({ errors: result.errors })
await db.users.create(result.data) // already normalized

// Schema utilities (immutable — always return new schemas)
userSchema.partial()                    // all fields optional
userSchema.pick('name', 'email')        // only these fields
userSchema.omit('password')             // exclude field
userSchema.extend({ rg: 'rg' })         // add fields
```

### Field options

```js
schema({
    name: 'name',                   // short form
    phone: {
        type:     'phone',
        optional: true,             // null/undefined accepted without error
        default:  '11999999999',    // value used when field is undefined
        options:  { ... },          // passed to the handler
        label:    'Phone number',   // readable label in error messages
    },
    score: {
        type:    'any',
        options: { demandType: 'number' }, // only numbers accepted
    },
})
```

---

## Core handlers

### `name`
Title Case with pt-BR connectives (`de`, `da`, `do`, `das`, `dos`, `e`) and English ones (`of`, `the`, `and`) kept lowercase unless first token.

### `number`
Delegates to `Intl.NumberFormat`. Default locale: `pt-BR`. Throws `TypeError` for non-numbers, `RangeError` for `NaN`/`Infinity`.

### `date`
Delegates to `Intl.DateTimeFormat`. Accepts `Date`, ISO strings, and numeric timestamps (ms). Default locale: `pt-BR`.

### `password`
Validates a password. All rules are configurable via options:

```js
handlers.password.normalize('Senha@123')
// default: minLength 8, requireUppercase, requireLowercase, requireSpecial

handlers.password.normalize('SenhaSegura@1', {
    minLength:        12,
    requireNumber:    true,   // default: false
    requireSpecial:   true,
    requireUppercase: true,
    requireLowercase: true,
})
```

### `url`
Validates and normalizes URLs. Lowercases the host, preserves path and query.

```js
handlers.url.normalize('HTTPS://EXAMPLE.COM/path')  // 'https://example.com/path'
handlers.url.normalize('ftp://x.com', { protocols: ['ftp'] }) // custom protocol
```

### `uuid`
Validates UUID format. Supports v1, v3, v4, v5 and v7.

```js
handlers.uuid.normalize('550E8400-E29B-41D4-A716-446655440000')
// '550e8400-e29b-41d4-a716-446655440000'

handlers.uuid.normalize(id, { version: 4 })      // enforce v4
handlers.uuid.normalize(id, { uppercase: true })  // return uppercase
```

### `any`
Passes any non-null value through without normalizing. Useful in schemas for fields without a specific handler. Supports `demandType` to restrict the primitive type, and `transform` for inline validation or transformation logic.

```js
// Basic usage
handlers.any.normalize('text')   // 'text'
handlers.any.normalize(42)       // 42
handlers.any.normalize(true)     // true

// demandType — restrict accepted primitive type
handlers.any.normalize(42,  { demandType: 'number' })   // 42
handlers.any.safe('oi',     { demandType: 'number' })   // { valid: false, ... }

// transform — inline callback, runs after demandType
handlers.any.normalize(150, {
    demandType: 'number',
    transform:  (v) => Math.min(100, v), // clamp to 100
}) // 100

// transform can throw for custom validation
handlers.any.normalize(value, {
    transform: (v) => {
        if (!Array.isArray(v)) throw new TypeError('[normalize:any] Expected array.')
        return v.map(t => t.trim().toLowerCase())
    }
})

// In a schema
schema({
    tag:   'any',
    score: { type: 'any', options: { demandType: 'number', transform: (v) => Math.max(0, Math.min(100, v)) } },
    tags:  { type: 'any', options: { transform: (v) => Array.isArray(v) ? v.map(t => t.toLowerCase()) : [v] } },
    meta:  { type: 'any', optional: true },
})
```

---

## Brazilian plugins (included)

All plugins load automatically when importing `data-handlers`. The table below covers the main ones — the full list is always available at runtime via `handlers.types`.

| Type    | Description                        |
|---------|------------------------------------|
| `cpf`   | Validates & formats CPF            |
| `cnpj`  | Validates & formats CNPJ           |
| `phone` | Formats Brazilian phone numbers    |
| `cep`   | Formats CEP                        |
| `email` | Validates & normalizes email       |
| `rg`    | Formats Brazilian RG               |
| `slug`  | Generates URL-friendly slugs       |
| `color` | Normalizes hex/rgb colors          |

---

## Custom registration

```js
import { register, registerAliases, createPlugin } from 'data-handlers'

register('plate', (value) => {
    const clean = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!/^[A-Z]{3}[0-9]{4}$/.test(clean) && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean))
        throw new TypeError(`[normalize:plate] Invalid plate: ${value}`)
    return `${clean.slice(0, 3)}-${clean.slice(3)}`
})

registerAliases('name', 'nome', 'fullName')
createPlugin('myType', myHandler) // semantic alias of register(), for npm packages
```

---

## TypeScript

Written in JS with full `.d.ts` declarations. All types exported:

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

## License

[MIT](./LICENSE) © Emersom Oliveira
