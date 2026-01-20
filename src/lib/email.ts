// Email Service for Seera AI
// Production-ready email integration using Resend

import { Resend } from 'resend';
import { logger } from './logger';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Seera AI <noreply@seera-ai.com>';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Seera AI';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Check if email service is configured
export function isEmailConfigured(): boolean {
    return resend !== null;
}

// Email templates
function getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
                            <div style="display: inline-flex; align-items: center; gap: 8px;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block;"></div>
                                <span style="font-size: 24px; font-weight: 700; color: #18181b;">${APP_NAME}</span>
                            </div>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f4f4f5; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">
                                This email was sent by ${APP_NAME}.<br>
                                If you didn't request this, you can safely ignore this email.
                            </p>
                            <p style="margin: 16px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">
                                <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">${APP_URL.replace(/^https?:\/\//, '')}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function getButtonStyle(): string {
    return 'display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;';
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatPlainTextMessage(message: string): string {
    return escapeHtml(message).replace(/\n/g, '<br>');
}

function formatSar(amount: number): string {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `${safeAmount.toFixed(2)} SAR`;
}

// Email sending functions
interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendAdminEmail(params: {
    to: string;
    subject: string;
    heading: string;
    message: string;
    ctaLabel?: string;
    ctaUrl?: string;
    name?: string;
}): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping admin email', { email: params.to });
        return { success: false, error: 'Email service not configured' };
    }

    const greeting = params.name ? `Hi ${params.name.split(' ')[0]},` : 'Hi there,';
    const ctaBlock = params.ctaUrl && params.ctaLabel
        ? `<div style="text-align: center; margin: 32px 0;">
            <a href="${params.ctaUrl}" style="${getButtonStyle()}">${escapeHtml(params.ctaLabel)}</a>
        </div>`
        : '';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">${escapeHtml(params.heading)}</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            ${formatPlainTextMessage(params.message)}
        </p>
        ${ctaBlock}
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: params.to,
            subject: params.subject,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send admin email', { email: params.to, error });
            return { success: false, error: error.message };
        }

        logger.info('Admin email sent', { email: params.to, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Admin email sending failed', { email: params.to, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendPaymentLinkEmail(
    email: string,
    paymentUrl: string,
    name?: string
): Promise<EmailResult> {
    return sendAdminEmail({
        to: email,
        subject: `Complete your payment - ${APP_NAME}`,
        heading: 'Complete your payment',
        message: 'Use the secure link below to finish your payment and activate your subscription.',
        ctaLabel: 'Pay Now',
        ctaUrl: paymentUrl,
        name,
    });
}

export async function sendBillingPortalEmail(
    email: string,
    portalUrl: string,
    name?: string
): Promise<EmailResult> {
    return sendPaymentLinkEmail(email, portalUrl, name);
}

export async function sendVerificationEmail(
    email: string,
    token: string,
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping verification email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">Verify your email address</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            Thanks for signing up for ${APP_NAME}! Please verify your email address to get started with building your professional resume.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="${getButtonStyle()}">Verify Email Address</a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="${verifyUrl}" style="color: #3b82f6; word-break: break-all;">${verifyUrl}</a>
        </p>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
            This link expires in 24 hours.
        </p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Verify your email - ${APP_NAME}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send verification email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Verification email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendPasswordResetEmail(
    email: string,
    token: string,
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping password reset email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">Reset your password</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="${getButtonStyle()}">Reset Password</a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Reset your password - ${APP_NAME}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send password reset email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Password reset email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendWelcomeEmail(
    email: string,
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping welcome email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const dashboardUrl = `${APP_URL}/dashboard`;
    const greeting = name ? `Welcome, ${name.split(' ')[0]}!` : 'Welcome!';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">${greeting}</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            Your email has been verified and your account is ready. You can now start building your professional, ATS-optimized resume with AI assistance.
        </p>
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #18181b;">Get started:</h2>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #3f3f46; line-height: 1.8;">
                <li>Create your first resume using AI-powered suggestions</li>
                <li>Choose from professional templates optimized for ATS</li>
                <li>Get career advice tailored to Saudi Arabia & GCC markets</li>
                <li>Practice interviews with AI coaching</li>
            </ul>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}" style="${getButtonStyle()}">Go to Dashboard</a>
        </div>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Welcome to ${APP_NAME} - Let's build your resume!`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send welcome email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Welcome email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendSubscriptionConfirmation(
    email: string,
    plan: string,
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping subscription email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const billingUrl = `${APP_URL}/dashboard/billing`;
    const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">Subscription Confirmed!</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            Thank you for upgrading to <strong>${plan}</strong>! Your subscription is now active and you have access to all premium features.
        </p>
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0; color: #047857; font-weight: 600;">
                Your ${plan} plan is now active
            </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${billingUrl}" style="${getButtonStyle()}">View Subscription</a>
        </div>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Subscription Confirmed - ${APP_NAME} ${plan}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send subscription email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Subscription confirmation email sent', { email, plan, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendPaymentReceiptEmail(params: {
    to: string;
    name?: string;
    planLabel: string;
    intervalLabel?: string;
    amountSar: number;
    paidAt?: Date;
    receiptId?: string;
    description?: string;
    recipientEmail?: string;
}): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping receipt email', { email: params.to });
        return { success: false, error: 'Email service not configured' };
    }

    const greeting = params.name ? `Hi ${params.name.split(' ')[0]},` : 'Hi there,';
    const billingUrl = `${APP_URL}/dashboard/billing`;
    const paidAtLabel = params.paidAt
        ? params.paidAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Today';
    const receiptId = params.receiptId ? escapeHtml(params.receiptId) : 'Pending';
    const intervalLabel = params.intervalLabel || 'Monthly';
    const description = params.description ? escapeHtml(params.description) : null;
    const recipientEmail = params.recipientEmail ? escapeHtml(params.recipientEmail) : null;

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">Payment receipt</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            Thanks for your payment. Your purchase is confirmed.
        </p>
        <div style="border: 1px solid #e4e4e7; border-radius: 10px; padding: 16px; margin: 16px 0;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 14px; color: #3f3f46;">
                ${description ? `
                <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Description</td>
                    <td style="padding: 6px 0; text-align: right;">${description}</td>
                </tr>` : ''}
                <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Plan</td>
                    <td style="padding: 6px 0; text-align: right;">${escapeHtml(params.planLabel)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Billing</td>
                    <td style="padding: 6px 0; text-align: right;">${escapeHtml(intervalLabel)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Amount paid</td>
                    <td style="padding: 6px 0; text-align: right;">${formatSar(params.amountSar)}</td>
                </tr>
                ${recipientEmail ? `
                <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Recipient</td>
                    <td style="padding: 6px 0; text-align: right;">${recipientEmail}</td>
                </tr>` : ''}
                <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Paid on</td>
                    <td style="padding: 6px 0; text-align: right;">${escapeHtml(paidAtLabel)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Receipt ID</td>
                    <td style="padding: 6px 0; text-align: right;">${receiptId}</td>
                </tr>
            </table>
        </div>
        <div style="text-align: center; margin: 24px 0;">
            <a href="${billingUrl}" style="${getButtonStyle()}">View subscription</a>
        </div>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #71717a;">
            Need help? Reply to this email and we'll assist you.
        </p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: params.to,
            subject: `Payment receipt - ${APP_NAME}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send receipt email', { email: params.to, error });
            return { success: false, error: error.message };
        }

        logger.info('Payment receipt email sent', { email: params.to, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Receipt email sending failed', { email: params.to, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendGiftSubscriptionEmail(
    email: string,
    params: {
        senderName?: string;
        planId: 'pro' | 'enterprise';
        interval: 'monthly' | 'yearly';
        message?: string;
        token: string;
        expiresAt?: Date;
    }
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping gift email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const sender = params.senderName ? params.senderName.split(' ')[0] : 'Someone';
    const planLabel = params.planId === 'enterprise' ? 'Enterprise' : 'Pro';
    const intervalLabel = params.interval === 'yearly' ? '1 year' : '1 month';
    const claimUrl = `${APP_URL}/gift/${params.token}`;
    const expiresLabel = params.expiresAt
        ? params.expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : null;
    const messageBlock = params.message
        ? `<div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #3f3f46;">${escapeHtml(params.message)}</p>
        </div>`
        : '';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">You've received a gift!</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${sender} gifted you a <strong>${planLabel}</strong> subscription for <strong>${intervalLabel}</strong>.
        </p>
        ${messageBlock}
        <div style="text-align: center; margin: 32px 0;">
            <a href="${claimUrl}" style="${getButtonStyle()}">Claim Your Gift</a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="${claimUrl}" style="color: #3b82f6; word-break: break-all;">${claimUrl}</a>
        </p>
        ${expiresLabel ? `<p style="margin: 16px 0 0 0; font-size: 14px; color: #71717a;">Claim before ${expiresLabel}.</p>` : ''}
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `${sender} gifted you Seera AI ${planLabel}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send gift email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Gift subscription email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

// Resume completion reminder email
export async function sendResumeReminderEmail(
    email: string,
    resumeTitle: string,
    completionPercentage: number,
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping resume reminder email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const resumeUrl = `${APP_URL}/dashboard/resumes`;
    const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">Complete Your Resume</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            Your resume "${resumeTitle}" is ${completionPercentage}% complete. A few more details and you'll be ready to impress recruiters!
        </p>
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex: 1; background-color: #e4e4e7; border-radius: 999px; height: 8px; overflow: hidden;">
                    <div style="width: ${completionPercentage}%; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); height: 100%; border-radius: 999px;"></div>
                </div>
                <span style="font-weight: 600; color: #3b82f6;">${completionPercentage}%</span>
            </div>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${resumeUrl}" style="${getButtonStyle()}">Continue Editing</a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
            Pro tip: Completed resumes get 3x more views from recruiters!
        </p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Your resume is almost ready! - ${APP_NAME}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send resume reminder email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Resume reminder email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

// Weekly tips newsletter
export async function sendWeeklyTipsEmail(
    email: string,
    tips: { title: string; description: string }[],
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping weekly tips email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

    const tipsHtml = tips.map(tip => `
        <div style="margin-bottom: 20px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #18181b;">${tip.title}</h3>
            <p style="margin: 0; font-size: 14px; color: #3f3f46; line-height: 1.5;">${tip.description}</p>
        </div>
    `).join('');

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">This Week's Career Tips</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            Here are this week's tips to help you stand out in your job search:
        </p>
        ${tipsHtml}
        <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/dashboard" style="${getButtonStyle()}">Apply These Tips</a>
        </div>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Weekly Career Tips - ${APP_NAME}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send weekly tips email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Weekly tips email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

// Feedback request email
export async function sendFeedbackRequestEmail(
    email: string,
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping feedback email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const feedbackUrl = `${APP_URL}/feedback`;
    const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">We'd Love Your Feedback</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            You've been using ${APP_NAME} for a while now, and we'd love to hear about your experience. Your feedback helps us improve for everyone!
        </p>
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 32px;">⭐⭐⭐⭐⭐</p>
            <p style="margin: 0; color: #92400e; font-weight: 500;">
                How would you rate your experience?
            </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${feedbackUrl}" style="${getButtonStyle()}">Share Feedback</a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
            Takes less than 2 minutes
        </p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Quick question about your experience - ${APP_NAME}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send feedback email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Feedback request email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

// Export notification email
export async function sendExportReadyEmail(
    email: string,
    resumeTitle: string,
    downloadUrl: string,
    format: 'PDF' | 'DOCX',
    name?: string
): Promise<EmailResult> {
    if (!resend) {
        logger.warn('Email service not configured - skipping export email', { email });
        return { success: false, error: 'Email service not configured' };
    }

    const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

    const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b;">Your Resume is Ready!</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
            ${greeting}<br><br>
            Your ${format} export of "${resumeTitle}" is ready for download.
        </p>
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #047857; font-weight: 600; font-size: 18px;">
                📄 ${resumeTitle}.${format.toLowerCase()}
            </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${downloadUrl}" style="${getButtonStyle()}">Download Resume</a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
            This download link expires in 24 hours.
        </p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Your resume is ready to download - ${APP_NAME}`,
            html: getBaseTemplate(content),
        });

        if (error) {
            logger.error('Failed to send export email', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('Export ready email sent', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Email sending failed', { email, error: error as Error });
        return { success: false, error: 'Failed to send email' };
    }
}

export default {
    isEmailConfigured,
    sendAdminEmail,
    sendPaymentLinkEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendSubscriptionConfirmation,
    sendPaymentReceiptEmail,
    sendBillingPortalEmail,
    sendGiftSubscriptionEmail,
    sendResumeReminderEmail,
    sendWeeklyTipsEmail,
    sendFeedbackRequestEmail,
    sendExportReadyEmail,
};
