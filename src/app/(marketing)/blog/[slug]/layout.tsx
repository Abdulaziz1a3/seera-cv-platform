import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';

// Post titles for metadata generation — mirrors data in page.tsx
const POST_TITLES: Record<string, { en: string; description: string }> = {
    'how-to-write-ats-friendly-resume': {
        en: 'How to Write an ATS-Friendly Resume',
        description:
            'Learn the essential techniques to write a resume that passes Applicant Tracking Systems. Step-by-step guide with formatting tips, keyword strategies, and common mistakes to avoid.',
    },
    'arabic-resume-tips': {
        en: 'Arabic Resume Writing Tips for the Gulf Market',
        description:
            'Expert tips on crafting a professional Arabic resume for jobs in Saudi Arabia, UAE, and across the Gulf region. Bilingual resume advice from career specialists.',
    },
    'resume-mistakes-to-avoid': {
        en: 'Top Resume Mistakes to Avoid in 2024',
        description:
            'Discover the most common resume mistakes that cost candidates job opportunities and learn exactly how to fix them with actionable advice.',
    },
    'how-to-use-linkedin': {
        en: 'How to Optimize Your LinkedIn Profile Alongside Your Resume',
        description:
            'Maximize your job search by aligning your LinkedIn profile with your resume. Tips on keywords, accomplishments, and standing out to recruiters.',
    },
    'salary-negotiation-tips': {
        en: 'Salary Negotiation Tips for Job Seekers',
        description:
            'Proven strategies to negotiate your salary confidently. Learn when and how to bring up compensation, and how to evaluate an offer.',
    },
};

type Props = {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = POST_TITLES[slug];

    if (!post) {
        return {
            title: 'Article Not Found',
            robots: { index: false, follow: false },
        };
    }

    return {
        title: post.en,
        description: post.description,
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            title: `${post.en} | Seera AI Blog`,
            description: post.description,
            url: `/blog/${slug}`,
            type: 'article',
            siteName: 'Seera AI',
            images: [
                {
                    url: '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: post.en,
                },
            ],
        },
        twitter: {
            title: post.en,
            description: post.description,
            card: 'summary_large_image',
        },
    };
}

export default function BlogSlugLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
