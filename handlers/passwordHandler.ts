export interface PasswordHandlerOptions {
  /** Comprimento mínimo. @default 8 */
  minLength?: number
  /** Exige ao menos uma letra maiúscula. @default true */
  requireUppercase?: boolean
  /** Exige ao menos uma letra minúscula. @default true */
  requireLowercase?: boolean
  /** Exige ao menos um número. @default false */
  requireNumber?: boolean
  /** Exige ao menos um caractere especial. @default true */
  requireSpecial?: boolean
}

export const passwordHandler = (
  value: unknown,
  options: PasswordHandlerOptions = {},
): string => {
  if (typeof value !== 'string' || !value) {
    throw new TypeError('[normalize:password] Expected non-empty string.')
  }

  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = false,
    requireSpecial = true,
  } = options

  if (value.length < minLength)
    throw new TypeError(
      `[normalize:password] Password must be at least ${minLength} characters. Received: ${value.length}`,
    )
  if (requireUppercase && !/[A-Z]/.test(value))
    throw new TypeError(
      '[normalize:password] Password must contain at least one uppercase letter.',
    )
  if (requireLowercase && !/[a-z]/.test(value))
    throw new TypeError(
      '[normalize:password] Password must contain at least one lowercase letter.',
    )
  if (requireNumber && !/[0-9]/.test(value))
    throw new TypeError(
      '[normalize:password] Password must contain at least one number.',
    )
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
    throw new TypeError(
      '[normalize:password] Password must contain at least one special character.',
    )

  return value
}
