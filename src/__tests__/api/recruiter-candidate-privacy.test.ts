jest.mock('@/lib/recruiter-auth', () => ({
    requireEnterpriseRecruiter: jest.fn().mockResolvedValue({ allowed: true, userId: 'recruiter-1' }),
}));

jest.mock('@/lib/db', () => ({
    prisma: {
        talentProfile: {
            findUnique: jest.fn(),
        },
        cvUnlock: {
            findUnique: jest.fn(),
        },
    },
}));

import { prisma } from '@/lib/db';
import { GET } from '@/app/api/recruiters/candidates/[id]/route';

const baseCandidate = {
    id: 'cand-1',
    displayName: 'Full Name',
    currentTitle: 'Engineer',
    currentCompany: 'Company',
    hideCurrentEmployer: false,
    location: 'Riyadh',
    yearsExperience: 5,
    skills: ['Node', 'React'],
    education: 'BSc',
    summary: 'Summary',
    availabilityStatus: 'open_to_offers',
    desiredSalaryMin: 10000,
    desiredSalaryMax: 15000,
    hideSalaryHistory: false,
    noticePeriod: '1_month',
    preferredLocations: [],
    preferredIndustries: [],
    desiredRoles: [],
    isVisible: true,
    resume: { versions: [] },
    contact: {
        fullName: 'Full Name',
        email: 'test@example.com',
        phone: '+9665',
        location: 'Riyadh',
        linkedinUrl: 'https://linkedin.com/in/test',
        websiteUrl: 'https://example.com',
    },
};

describe('recruiter candidate privacy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not return contact details unless unlocked', async () => {
        (prisma.talentProfile.findUnique as jest.Mock).mockResolvedValue(baseCandidate);
        (prisma.cvUnlock.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await GET(new Request('http://localhost/api/recruiters/candidates/cand-1'), {
            params: { id: 'cand-1' },
        });
        const data = await response.json();

        expect(data.unlocked).toBe(false);
        expect(data.candidate.contact).toBeUndefined();
    });

    it('returns contact details when unlocked', async () => {
        (prisma.talentProfile.findUnique as jest.Mock).mockResolvedValue(baseCandidate);
        (prisma.cvUnlock.findUnique as jest.Mock).mockResolvedValue({ id: 'unlock-1' });

        const response = await GET(new Request('http://localhost/api/recruiters/candidates/cand-1'), {
            params: { id: 'cand-1' },
        });
        const data = await response.json();

        expect(data.unlocked).toBe(true);
        expect(data.candidate.contact.email).toBe('test@example.com');
    });
});
