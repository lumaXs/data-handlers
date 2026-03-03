🇧🇷 Português | [🇺🇸 English](./README.md)

---

# data-handlers

> Biblioteca de normalização e validação extensível com handlers plugáveis para nomes, números, datas e muito mais.

[![npm version](https://img.shields.io/npm/v/data-handlers)](https://www.npmjs.com/package/data-handlers)
[![license](https://img.shields.io/npm/l/data-handlers)](./LICENSE)
[![node](https://img.shields.io/node/v/data-handlers)](https://nodejs.org)

---

## Visão Geral

**data-handlers** fornece uma interface unificada para **formatar** e **validar** tipos de dados comuns. Vem atualmente com três handlers nativos — `name`, `number` e `date` mais quatro plugins `cpfHandler`, `cnpjHandler`, `phoneHandler` e `cepHandler` — e foi projetada do zero para ser extensível via plugins.

A função `register()` (ou seu alias semântico `createPlugin()`) permite adicionar qualquer tipo customizado ao ecossistema: CPF, CNPJ, CEP, telefone, slug, e o que mais você precisar.

Toda a formatação nativa é feita pela API [Intl](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl), sem nenhuma dependência externa.

---

## Ecossistema de Plugins

O diferencial do **data-handlers** em relação a outras libs de validação é o suporte a **plugins oficiais focados no mercado brasileiro**, que bibliotecas como o Zod ignoram completamente.

```
data-handlers           → core (normalize, validate, register, createPlugin)
data-handlers-cpf       → validação e formatação de CPF
data-handlers-cnpj      → validação e formatação de CNPJ
data-handlers-phone     → formatação de telefone BR
data-handlers-cep       → formatação e consulta de CEP
```

> Os pacotes de plugins acima já estão integrados ao núcleo e prontos para produção.

---

## Requisitos

- Node.js `>= 18`
- Apenas ESM (`"type": "module"`)
- TypeScript: tipos incluídos via `index.d.ts`

---

## Instalação

```bash
npm install data-handlers
```

---

## API

### `normalize({ type, value, options? })`

Normaliza e formata um valor usando o handler registrado para o tipo informado. **Lança** `TypeError` se o tipo for desconhecido ou o valor for inválido.

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

Mesma lógica do `normalize()`, mas **nunca lança**. Retorna um objeto com `valid`, `value` e `error` — ideal para validação de formulários.

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

Registra um handler customizado para qualquer tipo. Se o tipo já estiver registrado, ele será substituído.

| Parâmetro | Tipo       | Descrição                                                     |
|-----------|------------|---------------------------------------------------------------|
| `type`    | `string`   | Identificador do tipo — case-insensitive e sem espaços extras |
| `handler` | `Function` | `(value: any, options?: any) => string`                       |

**Lança** `TypeError` se `handler` não for uma função.

---

### `createPlugin(type, handler)`

Alias semântico de `register()`. Use este quando estiver **publicando um plugin** `data-handlers-*`.

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
// uso
import { normalize } from 'data-handlers'
import 'data-handlers-slug'

normalize({ type: 'slug', value: 'Olá Mundo Legal!' })
// → 'ola-mundo-legal'
```

> **Dica:** Importe o plugin antes de chamar `normalize()` para que o `createPlugin()` seja executado primeiro.

---

## Handlers Nativos

### `name`

Normaliza uma string de nome completo para **Title Case**, removendo e colapsando espaços extras.

```js
normalize({ type: 'name', value: '   joão   da   silva   ' })
// → 'João Da Silva'
```

**Lança** `TypeError` se `value` não for uma string não vazia.

---

### `number`

Formata um número finito em uma string sensível ao locale via [`Intl.NumberFormat`](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).

| Opção     | Tipo     | Padrão    | Descrição                           |
|-----------|----------|-----------|-------------------------------------|
| `locale`  | `string` | `'en-US'` | Tag de idioma BCP 47                |
| `...rest` | `any`    | —         | Qualquer `Intl.NumberFormatOptions` |

```js
normalize({ type: 'number', value: 1234567.89, options: { locale: 'pt-BR' } })
// → '1.234.567,89'

normalize({ type: 'number', value: 42, options: { locale: 'en-US', style: 'currency', currency: 'USD' } })
// → '$42.00'

normalize({ type: 'number', value: 0.753, options: { style: 'percent', maximumFractionDigits: 1 } })
// → '75.3%'
```

**Lança** `TypeError` se `value` não for um número finito.

---

### `date`

Formata um valor de data em uma string sensível ao locale via [`Intl.DateTimeFormat`](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat). Aceita `Date`, string ISO ou qualquer valor que o construtor `Date` consiga interpretar.

| Opção     | Tipo     | Padrão    | Descrição                             |
|-----------|----------|-----------|---------------------------------------|
| `locale`  | `string` | `'en-US'` | Tag de idioma BCP 47                  |
| `...rest` | `any`    | —         | Qualquer `Intl.DateTimeFormatOptions` |

```js
normalize({ type: 'date', value: new Date(2026, 2, 1), options: { locale: 'pt-BR' } })
// → '01/03/2026'

normalize({ type: 'date', value: new Date(2026, 2, 1), options: { locale: 'pt-BR', year: 'numeric', month: 'long', day: 'numeric' } })
// → '1 de março de 2026'

normalize({ type: 'date', value: '2024-01-15', options: { locale: 'en-US', dateStyle: 'long' } })
// → 'January 15, 2024'
```

**Lança** `TypeError` se `value` não puder ser interpretado como uma data válida.

---

## Criando um Plugin

Um plugin é qualquer módulo que importa `createPlugin` e registra um handler. O handler deve **validar e formatar** o valor — e lançar `TypeError` com um prefixo descritivo caso o valor seja inválido.

```js
// data-handlers-cpf (exemplo de implementação)
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

## Tratamento de Erros

Todos os handlers lançam `TypeError` com um prefixo que identifica a origem:

| Prefixo              | Origem            |
|----------------------|-------------------|
| `[normalize]`        | Core (`index.js`) |
| `[normalize:name]`   | Handler de nome   |
| `[normalize:number]` | Handler de número |
| `[normalize:date]`   | Handler de data   |
| `[normalize:*]`      | Plugins externos  |

Use `validate()` quando não quiser lidar com exceções:

```js
const { valid, value, error } = validate({ type: 'cpf', value: input })

if (!valid) {
    console.error(error)
}
```

---

## TypeScript

Os tipos são incluídos nativamente — nenhuma instalação adicional necessária.

```ts
import { normalize, validate, register, createPlugin } from 'data-handlers'
import type { Handler, ValidateResult } from 'data-handlers'

const slugHandler: Handler<string> = (value) => {
    // ...
    return slug
}

createPlugin('slug', slugHandler)

const result: ValidateResult = validate({ type: 'slug', value: 'Olá Mundo' })
```

---

## Estrutura do Projeto

```
data-handlers
├── handlers/
│   ├── dateHandler.js     # Wrapper do Intl.DateTimeFormat
│   ├── nameHandler.js     # Normalizador Title Case
│   └── numberHandler.js   # Wrapper do Intl.NumberFormat
├── src/
│   └── main.js            # Registro de handlers + formatType
├── index.js               # API pública
└── index.d.ts             # Tipos TypeScript
```

---

## Referência da API

### `normalize(params)` / `validate(params)`

| Parâmetro        | Tipo     | Obrigatório | Descrição                        |
|------------------|----------|-------------|----------------------------------|
| `params.type`    | `string` | ✅           | Identificador do tipo registrado |
| `params.value`   | `any`    | ✅           | Valor a ser processado           |
| `params.options` | `object` | ❌           | Opções repassadas ao handler     |

`normalize` → retorna `string` ou lança `TypeError`.
`validate` → retorna `{ valid, value, error }`, nunca lança.

---

### `register(type, handler)` / `createPlugin(type, handler)`

| Parâmetro | Tipo       | Obrigatório | Descrição                     |
|-----------|------------|-------------|-------------------------------|
| `type`    | `string`   | ✅           | Identificador do tipo         |
| `handler` | `Function` | ✅           | `(value, options?) => string` |

`register` → uso geral.
`createPlugin` → alias semântico para autores de plugins.

---

## Licença

[MIT](./LICENSE) © Emersom Oliveira
