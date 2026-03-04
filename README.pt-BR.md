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
- **Handlers embutidos** — nome, número, data
- **Plugins nacionais** — CPF, CNPJ, CEP, telefone, RG, slug, email, cor
- **Sistema de schemas** — valide e normalize objetos inteiros, à la Zod
- **Proxy fluente** — `handlers.cpf.parse(...)`, `handlers.name.safe(...)`
- **Aliases Zod-style** — `.parse()` e `.safe()` em todo tipo
- **Introspecção** — `handlers.has('cpf')`, `handlers.types`, `handlers.$`
- **registerAliases** — `registerAliases('name', 'nome', 'fullName')`
- **Case-insensitive** — `handlers.Name` === `handlers.name` (por design)
- **Accessors imutáveis** — `Object.freeze` + cache por tipo
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
import { handlers, normalize, validate, register, schema } from 'data-handlers'

// Nome
handlers.name.normalize('  emerson   ribeiro  ')
// → 'Emerson Ribeiro'

handlers.name.parse('  maria das dores  ')   // alias Zod-style
// → 'Maria das Dores'

// Número
handlers.number.normalize(1234567.89, {
    style: 'currency', currency: 'BRL', locale: 'pt-BR'
})
// → 'R$ 1.234.567,89'

// Data — aceita Date, string ISO ou timestamp Unix em ms
handlers.date.normalize(new Date(), { dateStyle: 'long', locale: 'pt-BR' })
// → '3 de março de 2026'

handlers.date.normalize(1735689600000, { dateStyle: 'short', locale: 'pt-BR' })
// → '01/01/2025'

// Plugins brasileiros
handlers.cpf.normalize('11144477735')       // → '111.444.777-35'
handlers.cnpj.normalize('11222333000181')   // → '11.222.333/0001-81'
handlers.phone.normalize('11987654321')     // → '(11) 98765-4321'
handlers.cep.normalize('01310100')          // → '01310-100'
handlers.email.normalize('  User@SITE.COM  ') // → 'user@site.com'
handlers.rg.normalize('123456789')          // → '12.345.678-9'
handlers.color.normalize('#abc')            // → '#aabbcc'
handlers.slug.normalize('Olá Mundo!')       // → 'ola-mundo'

// Validação segura (nunca lança)
handlers.cpf.safe('000.000.000-00')
// → { valid: false, value: null, error: '[normalize:cpf] ...' }
```

---

## Introspecção

```js
handlers.has('cpf')       // true
handlers.types            // ['name', 'number', 'date', 'cpf', ...]

// Namespace meta $
handlers.$.has('cnpj')    // true
handlers.$.types          // igual a handlers.types
```

---

## API por tipo

Cada `handlers.<tipo>` expõe quatro métodos:

| Método               | Comportamento                                    |
|----------------------|--------------------------------------------------|
| `.normalize(v, opts)` | Normaliza; lança se inválido                    |
| `.validate(v, opts)`  | Nunca lança; retorna `{ valid, value, error }`  |
| `.parse(v, opts)`     | Alias de `.normalize` (Zod-style)               |
| `.safe(v, opts)`      | Alias de `.validate` (Zod-style)                |

---

## Sistema de schemas

```js
import { schema } from 'data-handlers'

const userSchema = schema({
    name:     'name',
    document: 'cpf',
    phone:    { type: 'phone', optional: true },
    amount:   { type: 'number', options: { style: 'currency', currency: 'BRL', locale: 'pt-BR' } },
    website:  { type: 'slug', default: 'sem-site', optional: true },
})

// parse — lança SchemaError com .errors se inválido
userSchema.parse({
    name:     'JOAO SILVA',
    document: '11144477735',
    amount:   99.9,
})
// { name: 'Joao Silva', document: '111.444.777-35', phone: null, amount: 'R$ 99,90', website: 'sem-site' }

// safeParse — nunca lança
userSchema.safeParse({ name: '', document: 'invalido' })
// { success: false, data: null, errors: { name: '...', document: '...' } }

// Utilitários (imutáveis — sempre retornam novo schema)
const partialSchema  = userSchema.partial()                // todos opcionais
const miniSchema     = userSchema.pick('name', 'document') // só esses campos
const semPhone       = userSchema.omit('phone')            // sem esse campo
const extendedSchema = userSchema.extend({ email: 'email' }) // adiciona campo
```

### Opções de campo

```js
schema({
    // Forma curta: só o tipo
    name: 'name',

    // Forma completa
    phone: {
        type:     'phone',
        optional: true,          // null/undefined passam sem erro
        default:  '11999999999', // valor padrão quando undefined
        options:  { ... },       // opções repassadas ao handler
        label:    'Telefone',    // rótulo legível nas mensagens de erro
    },
})
```

---

## Registro customizado

```js
import { register, registerAliases } from 'data-handlers'

register('phone', (value) => String(value).replace(/\D/g, ''))

// Aliases — mesmo handler, múltiplos nomes
registerAliases('name', 'nome', 'fullName', 'fullname')
handlers.nome.normalize('  joao  ')      // 'Joao'
handlers.fullName.normalize('  joao  ')  // 'Joao'

// Para autores de plugins
import { createPlugin } from 'data-handlers'
createPlugin('meuTipo', meuHandler)
```

---

## Handlers embutidos

### `name` / `nome`
Title Case com conectivos pt-BR (`de`, `da`, `do`, `das`, `dos`, `e`) e em (`of`, `the`, `and`...) em minúsculo. Acentos tratados via `toLocaleUpperCase('pt-BR')`.

```js
handlers.name.normalize('maria das dores')  // 'Maria das Dores'
handlers.name.normalize('joao de paula', { lowerCaseWords: [] }) // 'Joao De Paula'
```

### `number`
Delega para `Intl.NumberFormat`. Locale padrão: `pt-BR`.
- `TypeError`  — value não é `number`
- `RangeError` — value é `NaN` ou `Infinity`

### `date`
Delega para `Intl.DateTimeFormat`. Aceita `Date`, string ISO e **timestamp numérico em ms**. Locale padrão: `pt-BR`.

---

## Plugins inclusos

| Plugin                  | Tipo     | Descrição                         |
|-------------------------|----------|-----------------------------------|
| `data-handlers-cpf`     | `cpf`    | Valida e formata CPF              |
| `data-handlers-cnpj`    | `cnpj`   | Valida e formata CNPJ             |
| `data-handlers-cep`     | `cep`    | Formata CEP                       |
| `data-handlers-phone`   | `phone`  | Formata telefone brasileiro       |
| `data-handlers-slug`    | `slug`   | Gera slugs URL-friendly           |
| `data-handlers-email`   | `email`  | Valida e normaliza e-mail         |
| `data-handlers-rg`      | `rg`     | Formata RG no padrão SP           |
| `data-handlers-color`   | `color`  | Normaliza hex/rgb                 |

Todos carregados automaticamente ao importar `data-handlers`.

---

## TypeScript

Escrita em JS com declarações `.d.ts` completas. Todos os tipos exportados:

```ts
import type {
    Handler, TypeAccessor, HandlersProxy, ValidateResult,
    Schema, SchemaShape, FieldConfig, SchemaParseResult,
    NameHandlerOptions, NumberHandlerOptions, DateHandlerOptions,
    SlugHandlerOptions, ColorHandlerOptions, RgHandlerOptions,
} from 'data-handlers'
```

O autocomplete funciona em JS puro via os arquivos `.d.ts` inclusos.

---

## Segurança e performance

- Zero dependências
- `Object.freeze()` em cada accessor de tipo
- Cache de accessors — 1 objeto por tipo, reutilizado em loops
- `handlers.name = ...` lança `TypeError` imediatamente
- Erros com prefixo `[normalize:<tipo>]` para fácil debug
- Compatible com Node.js >= 18

---

## Licença

[MIT](./LICENSE) © Emersom Oliveira
