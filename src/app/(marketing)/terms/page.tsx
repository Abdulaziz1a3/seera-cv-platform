import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Seera AI',
    description: 'Read the terms and conditions for using Seera AI resume builder.',
};

export default function TermsPage() {
    return (
        <div className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <h1 className="text-4xl font-bold">Terms of Service</h1>
                    <p className="mt-4 text-muted-foreground">Last updated: January 11, 2026</p>

                    <div className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Seera AI ("Service"), you accept and agree to be bound by the terms
                            and provisions of this agreement. If you do not agree to abide by the above, please do not
                            use this Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            Seera AI provides an online resume building platform that allows users to create,
                            edit, and export professional resumes. The Service includes AI-powered writing assistance,
                            ATS optimization, job description targeting, and application tracking features.
                        </p>

                        <h2>3. User Accounts</h2>
                        <p>
                            To access certain features of the Service, you must create an account. You are responsible
                            for maintaining the confidentiality of your account credentials and for all activities that
                            occur under your account.
                        </p>
                        <ul>
                            <li>You must provide accurate and complete information when creating your account</li>
                            <li>You must be at least 16 years old to use the Service</li>
                            <li>You are responsible for keeping your password secure</li>
                            <li>You must notify us immediately of any unauthorized use of your account</li>
                        </ul>

                        <h2>4. User Content</h2>
                        <p>
                            You retain all rights to the content you create using our Service. By using the Service,
                            you grant us a limited license to process your content solely for the purpose of providing
                            the Service to you.
                        </p>
                        <p>
                            You agree not to upload, share, or create content that is:
                        </p>
                        <ul>
                            <li>Illegal, harmful, or offensive</li>
                            <li>Infringing on others' intellectual property rights</li>
                            <li>Containing malware or malicious code</li>
                            <li>Deceptive or fraudulent</li>
                        </ul>

                        <h2>5. AI-Generated Content</h2>
                        <p>
                            Our Service uses artificial intelligence to provide writing suggestions. You acknowledge that:
                        </p>
                        <ul>
                            <li>AI suggestions are meant to assist, not replace, your own judgment</li>
                            <li>You are responsible for reviewing and editing all AI-generated content</li>
                            <li>We do not guarantee the accuracy or appropriateness of AI suggestions</li>
                            <li>Final resume content is your responsibility</li>
                        </ul>

                        <h2>6. Subscription and Payments</h2>
                        <p>
                            Certain features of the Service require a paid subscription. By subscribing:
                        </p>
                        <ul>
                            <li>You authorize us to charge your payment method on a recurring basis</li>
                            <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
                            <li>Prices may change with 30 days notice</li>
                        </ul>

                        <h2>7. Intellectual Property</h2>
                        <p>
                            The Service and its original content (excluding user content), features, and functionality
                            are owned by Seera AI and are protected by international copyright, trademark, patent,
                            trade secret, and other intellectual property laws.
                        </p>

                        <h2>8. Privacy</h2>
                        <p>
                            Your use of the Service is also governed by our Privacy Policy, which is incorporated
                            into these Terms by reference. Please review our Privacy Policy to understand our practices.
                        </p>

                        <h2>9. Termination</h2>
                        <p>
                            We may terminate or suspend your account and access to the Service immediately, without
                            prior notice or liability, for any reason, including breach of these Terms. Upon termination,
                            your right to use the Service will cease immediately.
                        </p>

                        <h2>10. Disclaimer of Warranties</h2>
                        <p>
                            The Service is provided "AS IS" without warranties of any kind. We do not guarantee that:
                        </p>
                        <ul>
                            <li>The Service will be uninterrupted or error-free</li>
                            <li>The results from using the Service will be accurate or reliable</li>
                            <li>The Service will meet your specific requirements</li>
                            <li>Using the Service will guarantee job interviews or employment</li>
                        </ul>

                        <h2>11. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, Seera AI shall not be liable for any indirect,
                            incidental, special, consequential, or punitive damages resulting from your use of or
                            inability to use the Service.
                        </p>

                        <h2>12. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. We will provide notice of
                            significant changes by posting the new Terms on this page and updating the "Last updated"
                            date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
                        </p>

                        <h2>13. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the
                            jurisdiction in which Seera AI operates, without regard to its conflict of law provisions.
                        </p>

                        <h2>14. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <ul>
                            <li>Email: info@seera-sa.com</li>
                            <li>Support: info@seera-sa.com</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
