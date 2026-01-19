import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Seera AI',
    description: 'Learn how Seera AI collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
    return (
        <div className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <h1 className="text-4xl font-bold">Privacy Policy</h1>
                    <p className="mt-4 text-muted-foreground">Last updated: January 11, 2026</p>

                    <div className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
                        <h2>1. Introduction</h2>
                        <p>
                            Seera AI ("we", "our", or "us") is committed to protecting your privacy. This Privacy
                            Policy explains how we collect, use, disclose, and safeguard your information when you
                            use our resume building service.
                        </p>

                        <h2>2. Information We Collect</h2>

                        <h3>2.1 Information You Provide</h3>
                        <p>We collect information you directly provide, including:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Email address, name, password</li>
                            <li><strong>Profile Information:</strong> Phone number, location, professional details</li>
                            <li><strong>Resume Content:</strong> Work history, education, skills, and other resume data</li>
                            <li><strong>Payment Information:</strong> Processed securely through TuwaiqPay; we don't store card details</li>
                            <li><strong>Communications:</strong> Support tickets, emails, and feedback</li>
                        </ul>

                        <h3>2.2 Information Collected Automatically</h3>
                        <ul>
                            <li><strong>Usage Data:</strong> Features used, time spent, actions taken</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
                            <li><strong>Log Data:</strong> IP address, access times, pages viewed</li>
                            <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
                        </ul>

                        <h2>3. How We Use Your Information</h2>
                        <p>We use your information to:</p>
                        <ul>
                            <li>Provide and maintain the Service</li>
                            <li>Process your resume creations and exports</li>
                            <li>Generate AI-powered suggestions for your resume</li>
                            <li>Process payments and manage subscriptions</li>
                            <li>Send important service notifications</li>
                            <li>Respond to support requests</li>
                            <li>Improve our Service through analytics</li>
                            <li>Prevent fraud and abuse</li>
                        </ul>

                        <h2>4. Data Storage and Security</h2>
                        <p>
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul>
                            <li><strong>Encryption:</strong> All data is encrypted in transit (TLS) and at rest (AES-256)</li>
                            <li><strong>Access Control:</strong> Strict access controls limit who can access your data</li>
                            <li><strong>Regular Audits:</strong> We conduct regular security assessments</li>
                            <li><strong>Secure Infrastructure:</strong> Data is stored on secure cloud infrastructure</li>
                        </ul>

                        <h2>5. Data Sharing</h2>
                        <p>
                            We do <strong>not</strong> sell your personal information. We may share data with:
                        </p>
                        <ul>
                            <li><strong>Service Providers:</strong> TuwaiqPay for payments, email providers for notifications</li>
                            <li><strong>AI Providers:</strong> Resume content may be processed by AI services to generate suggestions (data is not retained by providers)</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        </ul>

                        <h2>6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                            <li><strong>Deletion:</strong> Delete your account and all associated data</li>
                            <li><strong>Export:</strong> Download your resume data in standard formats</li>
                            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                        </ul>

                        <h2>7. Data Retention</h2>
                        <p>
                            We retain your data for as long as your account is active. After account deletion:
                        </p>
                        <ul>
                            <li>Personal data is deleted within 30 days</li>
                            <li>Backup data is purged within 90 days</li>
                            <li>Anonymized analytics data may be retained indefinitely</li>
                        </ul>

                        <h2>8. Cookies</h2>
                        <p>
                            We use essential cookies for authentication and functionality. We also use:
                        </p>
                        <ul>
                            <li><strong>Analytics Cookies:</strong> To understand how you use the Service</li>
                            <li><strong>Preference Cookies:</strong> To remember your settings</li>
                        </ul>
                        <p>
                            You can control cookies through your browser settings, though some features may not
                            work properly without them.
                        </p>

                        <h2>9. Children's Privacy</h2>
                        <p>
                            Our Service is not intended for users under 16 years of age. We do not knowingly
                            collect personal information from children under 16.
                        </p>

                        <h2>10. International Data Transfers</h2>
                        <p>
                            Your data may be transferred to and processed in countries other than your own.
                            We ensure appropriate safeguards are in place for such transfers.
                        </p>

                        <h2>11. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of significant
                            changes by email or through a prominent notice on our Service.
                        </p>

                        <h2>12. Contact Us</h2>
                        <p>
                            For privacy-related questions or to exercise your rights:
                        </p>
                        <p>
                            Please use the support form in the app and choose "Privacy" as the category.
                        </p>

                        <h2>13. GDPR Compliance (EU Users)</h2>
                        <p>
                            If you are located in the European Economic Area, you have additional rights under GDPR:
                        </p>
                        <ul>
                            <li>Right to data portability</li>
                            <li>Right to restrict processing</li>
                            <li>Right to object to processing</li>
                            <li>Right to lodge a complaint with a supervisory authority</li>
                        </ul>
                        <p>
                            Our legal basis for processing includes: consent, contract performance, and legitimate interests.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
