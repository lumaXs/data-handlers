[🇺🇸 English](./README.md) | 🇧🇷 [Português](./README.pt-BR.md)

---

# data-handlers

> Zero-dependency normalization and validation library with pluggable handlers — built for the Brazilian market, designed for everyone.

[![npm](https://img.shields.io/npm/v/data-handlers)](https://www.npmjs.com/package/data-handlers)
[![license](https://img.shields.io/npm/l/data-handlers)](./LICENSE)
[![node](https://img.shields.io/node/v/data-handlers)](./package.json)

---

## Features

- **Zero dependencies** — pure JS, only native APIs (`Intl`, `Map`, `Proxy`)
- **Built-in handlers** — name, number, date
- **Brazilian plugins** — CPF, CNPJ, CEP, phone, RG, slug, email, color
- **Schema system** — validate and normalize entire objects, à la Zod
- **Fluent proxy** — `handlers.cpf.parse(...)`, `handlers.name.safe(...)`
- **Zod-style aliases** — `.parse()` and `.safe()` on every type
- **Introspection** — `handlers.has('cpf')`, `handlers.types`, `handlers.$`
- **Alias registration** — `registerAliases('name', 'nome', 'fullName')`
- **Case-insensitive** — `handlers.Name` === `handlers.name` (documented by design)
- **Immutable accessors** — `Object.freeze` + accessor cache per type
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
import { handlers, normalize, validate, register, schema } from 'data-handlers'

// Name
handlers.name.normalize('  emerson   ribeiro  ')
// → 'Emerson Ribeiro'

handlers.name.parse('  maria das dores  ')   // Zod-style alias
// → 'Maria das Dores'

// Number
handlers.number.normalize(1234567.89, {
    style: 'currency', currency: 'BRL', locale: 'pt-BR'
})
// → 'R$ 1.234.567,89'

// Date — accepts Date, ISO string, or Unix timestamp (ms)
handlers.date.normalize(new Date(), { dateStyle: 'long', locale: 'pt-BR' })
// → '3 de março de 2026'

handlers.date.normalize(1735689600000, { dateStyle: 'short', locale: 'pt-BR' })
// → '01/01/2025'

// Brazilian plugins
handlers.cpf.normalize('11144477735')   // → '111.444.777-35'
handlers.cnpj.normalize('11222333000181')  // → '11.222.333/0001-81'
handlers.phone.normalize('11987654321')    // → '(11) 98765-4321'
handlers.cep.normalize('01310100')         // → '01310-100'
handlers.email.normalize('  User@SITE.COM  ') // → 'user@site.com'
handlers.rg.normalize('123456789')        // → '12.345.678-9'
handlers.color.normalize('#abc')          // → '#aabbcc'
handlers.slug.normalize('Olá Mundo!')     // → 'ola-mundo'

// Safe validation (never throws)
handlers.cpf.safe('000.000.000-00')
// → { valid: false, value: null, error: '[normalize:cpf] ...' }
```

---

## Introspection

```js
handlers.has('cpf')       // true
handlers.types            // ['name', 'number', 'date', 'cpf', ...]

// Meta namespace
handlers.$.has('cnpj')    // true
handlers.$.types          // same as handlers.types
```

---

## Accessor API

Each `handlers.<type>` exposes four methods:

| Method               | Behaviour                                    |
|----------------------|----------------------------------------------|
| `.normalize(v, opts)` | Normalizes; throws if invalid               |
| `.validate(v, opts)`  | Never throws; returns `{ valid, value, error }` |
| `.parse(v, opts)`     | Alias for `.normalize` (Zod-style)          |
| `.safe(v, opts)`      | Alias for `.validate` (Zod-style)           |

---

## Schema system

```js
import { schema } from 'data-handlers'

const userSchema = schema({
    name:     'name',
    document: 'cpf',
    phone:    { type: 'phone', optional: true },
    amount:   { type: 'number', options: { style: 'currency', currency: 'BRL', locale: 'pt-BR' } },
    website:  { type: 'slug', default: 'sem-site', optional: true },
})

// parse — throws SchemaError with .errors map if invalid
userSchema.parse({
    name:     'JOAO SILVA',
    document: '11144477735',
    amount:   99.9,
})
// { name: 'Joao Silva', document: '111.444.777-35', phone: null, amount: 'R$ 99,90', website: 'sem-site' }

// safeParse — never throws
userSchema.safeParse({ name: '', document: 'bad' })
// { success: false, data: null, errors: { name: '...', document: '...' } }

// Schema utilities (immutable — always return new schemas)
const partialSchema = userSchema.partial()            // all fields optional
const miniSchema    = userSchema.pick('name', 'document') // only these fields
const noPhone       = userSchema.omit('phone')        // exclude field
const extSchema     = userSchema.extend({ email: 'email' }) // add fields
```

---

## Custom registration

```js
import { register, registerAliases } from 'data-handlers'

register('phone', (value) => String(value).replace(/\D/g, ''))

// Aliases — map multiple names to the same handler
registerAliases('name', 'nome', 'fullName', 'fullname')
handlers.nome.normalize('  joao  ')      // 'Joao'
handlers.fullName.normalize('  joao  ')  // 'Joao'

// For plugin authors
import { createPlugin } from 'data-handlers'
createPlugin('myType', myHandler)
```

---

## Built-in handlers

### `name`
Title Case with pt-BR connectives (`de`, `da`, `do`, `das`, `dos`, `e`) and English ones (`of`, `the`, `and`...) kept lowercase unless they're the first token. Accented characters handled via `toLocaleUpperCase('pt-BR')`.

```js
handlers.name.normalize('maria das dores')  // 'Maria das Dores'
handlers.name.normalize('joao de paula', { lowerCaseWords: [] }) // 'Joao De Paula'
```

### `number`
Delegates to `Intl.NumberFormat`. Default locale: `pt-BR`.
- `TypeError` if value is not a `number`
- `RangeError` if value is `NaN` or `Infinity`

### `date`
Delegates to `Intl.DateTimeFormat`. Accepts `Date`, ISO strings, and **numeric timestamps (ms)**. Default locale: `pt-BR`.

---

## Plugins

| Plugin          | Type     | Description                        |
|-----------------|----------|------------------------------------|
| `data-handlers-cpf`   | `cpf`   | Validates & formats CPF            |
| `data-handlers-cnpj`  | `cnpj`  | Validates & formats CNPJ           |
| `data-handlers-cep`   | `cep`   | Formats CEP                        |
| `data-handlers-phone` | `phone` | Formats Brazilian phone numbers    |
| `data-handlers-slug`  | `slug`  | Generates URL-friendly slugs       |
| `data-handlers-email` | `email` | Validates & normalizes email       |
| `data-handlers-rg`    | `rg`    | Formats Brazilian RG               |
| `data-handlers-color` | `color` | Normalizes hex/rgb colors          |

All plugins are loaded automatically when importing `data-handlers`.

---

## TypeScript

Written in JS with full `.d.ts` declarations. All types are exported:

```ts
import type {
    Handler, TypeAccessor, HandlersProxy, ValidateResult,
    Schema, SchemaShape, FieldConfig, SchemaParseResult,
    NameHandlerOptions, NumberHandlerOptions, DateHandlerOptions,
    SlugHandlerOptions, ColorHandlerOptions, RgHandlerOptions,
} from 'data-handlers'
```

JSDoc autocomplete works in plain JS via the bundled `.d.ts`.

---

## License

[MIT](./LICENSE) © Emersom Oliveira
