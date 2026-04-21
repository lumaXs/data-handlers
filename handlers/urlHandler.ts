export interface UrlHandlerOptions {
   /** Protocolos aceitos. @default ['http', 'https'] */
   protocols?: string[]
}

export const urlHandler = (
   value: unknown,
   options: UrlHandlerOptions = {},
): string => {
   if (typeof value !== 'string' || !value.trim()) {
      throw new TypeError(
         `[normalize:url] Expected non-empty string. Received: ${typeof value}`,
      )
   }

   const { protocols = ['http', 'https'] } = options

   let parsed: URL
   try {
      parsed = new URL(value.trim())
   } catch {
      throw new TypeError(`[normalize:url] Invalid URL. Received: ${value}`)
   }

   const protocol = parsed.protocol.replace(':', '')
   if (!protocols.includes(protocol)) {
      throw new TypeError(
         `[normalize:url] Protocol "${protocol}" not allowed. Allowed: ${protocols.join(', ')}. Received: ${value}`,
      )
   }

   parsed.hostname = parsed.hostname.toLowerCase()
   return parsed.toString()
}
