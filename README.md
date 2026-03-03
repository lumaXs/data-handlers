[🇺🇸 English](./README.md) | 🇧🇷 [Português](./README.pt-BR.md)

---

# data-handlers

> Extensible normalization and validation library with pluggable handlers for names, numbers, dates, and more.

[![npm version](https://img.shields.io/npm/v/data-handlers)](https://www.npmjs.com/package/data-handlers)
[![license](https://img.shields.io/npm/l/data-handlers)](./LICENSE)
[![node](https://img.shields.io/node/v/data-handlers)](https://nodejs.org)

---

## Overview

**data-handlers** provides a unified interface to **format** and **validate** common data types. It ships with three built-in handlers — `name`, `number`, and `date` — plus four official plugins: `cpfHandler`, `cnpjHandler`, `phoneHandler`, and `cepHandler`. The library was designed from the ground up to be extensible via additional plugins.

The `register()` function (or its semantic alias `createPlugin()`) lets you add any custom type to the ecosystem: CPF, CNPJ, ZIP codes, phone numbers, slugs, and whatever else you need.

All built-in formatting is powered by the native [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) API, with zero external dependencies.

---

## Plugin Ecosystem

**data-handlers** key advantage over other validation libraries is its support for **official plugins targeting the Brazilian market**, which libraries like Zod completely ignore.

```
data-handlers           → core (normalize, validate, register, createPlugin)
data-handlers-cpf       → CPF validation and formatting
data-handlers-cnpj      → CNPJ validation and formatting
data-handlers-phone     → Brazilian phone number formatting
data-handlers-cep       → ZIP code formatting and lookup
```

> These plugins are now included in the core and ready to use.

---

## Requirements

- Node.js `>= 18`
- ESM-only (`"type": "module"`)
- TypeScript: types included via `index.d.ts`

---

## Installation

```bash
npm install data-handlers
```

---

## API

### `normalize({ type, value, options? })`

Normalizes and formats a value using the handler registered for the given type. **Throws** `TypeError` if the type is unknown or the value fails validation.

```js
import { normalize } from 'data-handlers'

normalize({ type: 'name', value: '  john   doe  ' })
// → 'John Doe'

normalize({ type: 'number', value: 1234567.89, options: { locale: 'pt-BR', style: 'currency', currency: 'BRL' } })
// → 'R$ 1.234.567,89'

normalize({ type: 'date', value: '2024-01-15', options: { locale: 'pt-BR', dateStyle: 'long' } })
// → '15 de janeiro de 2024'
```

---

### `validate({ type, value, options? })`

Same logic as `normalize()`, but **never throws**. Returns an object with `valid`, `value`, and `error` — ideal for form validation.

```js
import { validate } from 'data-handlers'

validate({ type: 'name', value: '  john doe  ' })
// → { valid: true, value: 'John Doe', error: null }

validate({ type: 'name', value: '' })
// → { valid: false, value: null, error: '[normalize:name] Expected non-empty string. Received: ' }

validate({ type: 'number', value: NaN })
// → { valid: false, value: null, error: '[normalize:number] Expected finite number. Received: NaN' }
```

---

### `register(type, handler)`

Registers a custom handler for any type. Overwrites the existing handler if the type is already registered.

| Parameter | Type       | Description                                               |
|-----------|------------|-----------------------------------------------------------|
| `type`    | `string`   | Type identifier — case-insensitive and whitespace-trimmed |
| `handler` | `Function` | `(value: any, options?: any) => string`                   |

**Throws** `TypeError` if `handler` is not a function.

---

### `createPlugin(type, handler)`

Semantic alias for `register()`. Use this when **publishing a plugin** package under `data-handlers-*`.

```js
// data-handlers-slug/index.js
import { createPlugin } from 'data-handlers'

const slugHandler = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new TypeError(`[normalize:slug] Expected non-empty string. Received: ${value}`)
    }

    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

createPlugin('slug', slugHandler)
```

```js
// usage
import { normalize } from 'data-handlers'
import 'data-handlers-slug'

normalize({ type: 'slug', value: 'Olá Mundo Legal!' })
// → 'ola-mundo-legal'
```

> **Tip:** Import plugins before calling `normalize()` so the `createPlugin()` side-effect runs first.

---

## Built-in Handlers

### `name`

Normalizes a full name string to **Title Case**, trimming and collapsing extra whitespace.

```js
normalize({ type: 'name', value: '   joão   da   silva   ' })
// → 'João Da Silva'
```

**Throws** `TypeError` if `value` is not a non-empty string.

---

### `number`

Formats a finite number into a locale-aware string via [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).

| Option    | Type     | Default   | Description                    |
|-----------|----------|-----------|--------------------------------|
| `locale`  | `string` | `'en-US'` | BCP 47 language tag            |
| `...rest` | `any`    | —         | Any `Intl.NumberFormatOptions` |

```js
normalize({ type: 'number', value: 1234567.89, options: { locale: 'pt-BR' } })
// → '1.234.567,89'

normalize({ type: 'number', value: 42, options: { locale: 'en-US', style: 'currency', currency: 'USD' } })
// → '$42.00'

normalize({ type: 'number', value: 0.753, options: { style: 'percent', maximumFractionDigits: 1 } })
// → '75.3%'
```

**Throws** `TypeError` if `value` is not a finite number.

---

### `date`

Formats a date value into a locale-aware string via [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat). Accepts a `Date` object, an ISO string, or any value parseable by the `Date` constructor.

| Option    | Type     | Default   | Description                      |
|-----------|----------|-----------|----------------------------------|
| `locale`  | `string` | `'en-US'` | BCP 47 language tag              |
| `...rest` | `any`    | —         | Any `Intl.DateTimeFormatOptions` |

```js
normalize({ type: 'date', value: new Date(2026, 2, 1), options: { locale: 'pt-BR' } })
// → '01/03/2026'

normalize({ type: 'date', value: new Date(2026, 2, 1), options: { locale: 'pt-BR', year: 'numeric', month: 'long', day: 'numeric' } })
// → '1 de março de 2026'

normalize({ type: 'date', value: '2024-01-15', options: { locale: 'en-US', dateStyle: 'long' } })
// → 'January 15, 2024'
```

**Throws** `TypeError` if `value` cannot be parsed into a valid date.

---

## Building a Plugin

A plugin is any module that imports `createPlugin` and registers a handler. The handler should **validate and format** the value — and throw a `TypeError` with a descriptive prefix if the value is invalid.

```js
// data-handlers-cpf (example implementation)
import { createPlugin } from 'data-handlers'

const isValidCPF = (cpf) => {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

    const calc = (factor) =>
        digits.slice(0, factor - 1).split('').reduce((sum, d, i) => sum + Number(d) * (factor - i), 0)

    const mod = (n) => ((n * 10) % 11) % 10

    return mod(calc(10)) === Number(digits[9]) && mod(calc(11)) === Number(digits[10])
}

const cpfHandler = (value) => {
    const digits = String(value).replace(/\D/g, '')

    if (!isValidCPF(digits)) {
        throw new TypeError(`[normalize:cpf] Invalid CPF. Received: ${value}`)
    }

    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

createPlugin('cpf', cpfHandler)
```

```js
import { normalize, validate } from 'data-handlers'

normalize({ type: 'cpf', value: '11144477735' })
// → '111.444.777-35'

validate({ type: 'cpf', value: '00000000000' })
// → { valid: false, value: null, error: '[normalize:cpf] Invalid CPF. Received: 00000000000' }
```

---

## Error Handling

All handlers throw `TypeError` with a prefix that identifies the source:

| Prefix               | Source            |
|----------------------|-------------------|
| `[normalize]`        | Core (`index.js`) |
| `[normalize:name]`   | Name handler      |
| `[normalize:number]` | Number handler    |
| `[normalize:date]`   | Date handler      |
| `[normalize:*]`      | External plugins  |

Use `validate()` when you'd rather not deal with exceptions:

```js
const { valid, value, error } = validate({ type: 'cpf', value: input })

if (!valid) {
    console.error(error)
}
```

---

## TypeScript

Types are included natively — no additional installation required.

```ts
import { normalize, validate, register, createPlugin } from 'data-handlers'
import type { Handler, ValidateResult } from 'data-handlers'

const slugHandler: Handler<string> = (value) => {
    // ...
    return slug
}

createPlugin('slug', slugHandler)

const result: ValidateResult = validate({ type: 'slug', value: 'Hello World' })
```

---

## Project Structure

```
data-handlers
├── handlers/
│   ├── dateHandler.js     # Intl.DateTimeFormat wrapper
│   ├── nameHandler.js     # Title Case normalizer
│   └── numberHandler.js   # Intl.NumberFormat wrapper
├── src/
│   └── main.js            # Handler registry + formatType
├── index.js               # Public API
└── index.d.ts             # TypeScript types
```

---

## API Reference

### `normalize(params)` / `validate(params)`

| Parameter        | Type     | Required | Description                      |
|------------------|----------|----------|----------------------------------|
| `params.type`    | `string` | ✅        | Registered type identifier       |
| `params.value`   | `any`    | ✅        | Value to process                 |
| `params.options` | `object` | ❌        | Options forwarded to the handler |

`normalize` → returns `string` or throws `TypeError`.
`validate` → returns `{ valid, value, error }`, never throws.

---

### `register(type, handler)` / `createPlugin(type, handler)`

| Parameter | Type       | Required | Description                   |
|-----------|------------|----------|-------------------------------|
| `type`    | `string`   | ✅        | Type identifier to register   |
| `handler` | `Function` | ✅        | `(value, options?) => string` |

`register` → general use.
`createPlugin` → semantic alias for plugin authors.

---

## License

[MIT](./LICENSE) © Emersom Oliveira
