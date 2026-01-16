const personalEmailDomains = new Set([
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
    'tutanota.com',
    'fastmail.com',
    'hey.com',
    'zoho.com',
    'mail.com',
    'yandex.com',
    'gmx.com',
]);

export function isCompanyEmail(email: string): boolean {
    const [, domainRaw] = email.trim().toLowerCase().split('@');
    if (!domainRaw) return false;
    if (personalEmailDomains.has(domainRaw)) return false;
    return domainRaw.includes('.');
}
