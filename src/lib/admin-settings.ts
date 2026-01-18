import { z } from 'zod';

export const adminSettingsSchema = z.object({
    siteName: z.string().min(1),
    siteDescription: z.string().min(1),
    supportEmail: z.string().email(),
    maintenanceMode: z.boolean(),
    registrationEnabled: z.boolean(),
    emailVerification: z.boolean(),
    twoFactorAuth: z.boolean(),
    apiRateLimit: z.number().int().min(1).max(10000),
    maxResumesPerUser: z.number().int().min(1).max(100),
    maxFileSize: z.number().int().min(1).max(100),
    smtpHost: z.string(),
    smtpPort: z.number().int().min(1).max(65535),
    primaryColor: z.string().min(1),
    allowDarkMode: z.boolean(),
});

export type AdminSettings = z.infer<typeof adminSettingsSchema>;

export const defaultAdminSettings: AdminSettings = {
    siteName: 'Seera AI',
    siteDescription: 'Professional ATS-Friendly Resume Builder',
    supportEmail: 'info@seera-ai.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
    twoFactorAuth: false,
    apiRateLimit: 100,
    maxResumesPerUser: 5,
    maxFileSize: 10,
    smtpHost: 'smtp.mailgun.org',
    smtpPort: 587,
    primaryColor: '#2563eb',
    allowDarkMode: true,
};
