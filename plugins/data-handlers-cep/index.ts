import { createPlugin } from '../../src/main.js'

const cepHandler = (value: unknown): string => {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length !== 8) {
    throw new TypeError(`[normalize:cep] Expected 8-digit CEP. Received: ${value}`)
  }
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
}

createPlugin('cep', cepHandler)
