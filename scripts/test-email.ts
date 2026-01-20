// Test script for Resend email delivery
// Run with: npx tsx scripts/test-email.ts

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_4oCYNbq1_48dhgvMRLAk9pBLSgT6axHsc';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Seera AI <noreply@updates.seera-ai.com>';
const TEST_EMAIL = process.argv[2] || 'abdulaziz1a3@gmail.com';

async function testEmail() {
    console.log('=== Email Test ===');
    console.log('API Key:', RESEND_API_KEY ? `${RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('From:', EMAIL_FROM);
    console.log('To:', TEST_EMAIL);
    console.log('');

    if (!RESEND_API_KEY) {
        console.error('ERROR: RESEND_API_KEY is not set');
        process.exit(1);
    }

    const resend = new Resend(RESEND_API_KEY);

    try {
        console.log('Sending test email...');
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: TEST_EMAIL,
            subject: 'Seera AI - Test Email',
            html: `
                <h1>Test Email from Seera AI</h1>
                <p>If you receive this email, your email configuration is working correctly!</p>
                <p>Time: ${new Date().toISOString()}</p>
            `,
        });

        if (error) {
            console.error('ERROR from Resend API:', error);
            process.exit(1);
        }

        console.log('SUCCESS! Email sent');
        console.log('Message ID:', data?.id);
    } catch (err) {
        console.error('EXCEPTION:', err);
        process.exit(1);
    }
}

testEmail();
