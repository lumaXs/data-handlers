import { createPlugin } from '../../src/main.js'

export interface EmailHandlerOptions {
   /** Se true, preserva capitalização original. @default false */
   caseSensitive?: boolean
}

const EMAIL_RE =
   /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

const emailHandler = (
   value: unknown,
   options: EmailHandlerOptions = {},
): string => {
   if (typeof value !== 'string' || !value.trim()) {
      throw new TypeError(
         `[normalize:email] Expected non-empty string. Received: ${value}`,
      )
   }

   const normalized = options.caseSensitive
      ? value.trim()
      : value.trim().toLowerCase()

   if (!EMAIL_RE.test(normalized)) {
      throw new TypeError(
         `[normalize:email] Invalid email address. Received: ${value}`,
      )
   }

   return normalized
}

createPlugin('email', emailHandler)
