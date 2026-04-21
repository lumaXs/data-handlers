import { createPlugin } from '../../src/main.js'

const isValidCNPJ = (cnpj: string): boolean => {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const calc = (factor: number): number => {
    let sum = 0,
      pos = factor - 7
    for (let i = factor; i >= 1; i--) {
      sum += Number(d[factor - i]) * pos--
      if (pos < 2) pos = 9
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11)
  }
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}

const cnpjHandler = (value: unknown): string => {
  const digits = String(value).replace(/\D/g, '')
  if (!isValidCNPJ(digits)) {
    throw new TypeError(`[normalize:cnpj] Invalid CNPJ. Received: ${value}`)
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

createPlugin('cnpj', cnpjHandler)
