import { createPlugin } from '../../src/main.js';
const phoneHandler = (value) => {
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 10)
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    if (digits.length === 11)
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    throw new TypeError(`[normalize:phone] Expected 10 or 11-digit Brazilian phone number. Received: ${value}`);
};
createPlugin('phone', phoneHandler);
//# sourceMappingURL=index.js.map