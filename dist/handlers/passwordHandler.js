export const passwordHandler = (value, options = {}) => {
    if (typeof value !== 'string' || !value) {
        throw new TypeError('[normalize:password] Expected non-empty string.');
    }
    const { minLength = 8, requireUppercase = true, requireLowercase = true, requireNumber = false, requireSpecial = true, } = options;
    if (value.length < minLength)
        throw new TypeError(`[normalize:password] Password must be at least ${minLength} characters. Received: ${value.length}`);
    if (requireUppercase && !/[A-Z]/.test(value))
        throw new TypeError('[normalize:password] Password must contain at least one uppercase letter.');
    if (requireLowercase && !/[a-z]/.test(value))
        throw new TypeError('[normalize:password] Password must contain at least one lowercase letter.');
    if (requireNumber && !/[0-9]/.test(value))
        throw new TypeError('[normalize:password] Password must contain at least one number.');
    if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
        throw new TypeError('[normalize:password] Password must contain at least one special character.');
    return value;
};
//# sourceMappingURL=passwordHandler.js.map