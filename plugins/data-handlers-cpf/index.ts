import { createPlugin } from '../../src/main.js'

const isValidCPF = (cpf: string): boolean => {
   const d = cpf.replace(/\D/g, '')
   if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
   const calc = (f: number) =>
      d
         .slice(0, f - 1)
         .split('')
         .reduce((s, v, i) => s + Number(v) * (f - i), 0)
   const mod = (n: number) => ((n * 10) % 11) % 10
   return mod(calc(10)) === Number(d[9]) && mod(calc(11)) === Number(d[10])
}

const cpfHandler = (value: unknown): string => {
   const digits = String(value).replace(/\D/g, '')
   if (!isValidCPF(digits)) {
      throw new TypeError(`[normalize:cpf] Invalid CPF. Received: ${value}`)
   }
   return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

createPlugin('cpf', cpfHandler)
