import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/seera-link/[slug]/cv - Fetch resume data for CV download/preview
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const profile = await prisma.seeraProfile.findFirst({
      where: {
        slug: slug.toLowerCase(),
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        visibility: true,
        cvResumeId: true,
        userId: true,
      },
    });

    if (!profile || !profile.cvResumeId) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    if (profile.visibility === 'PASSWORD_PROTECTED') {
      const cookieStore = cookies();
      const accessCookie = cookieStore.get(`seera-link-access-${profile.slug}`);
      if (!accessCookie || accessCookie.value !== profile.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id: profile.cvResumeId,
        userId: profile.userId,
        deletedAt: null,
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const resumeData: Record<string, unknown> = {
      id: resume.id,
      title: resume.title,
      targetRole: resume.targetRole,
      language: resume.language,
      atsScore: resume.atsScore,
      template: resume.template,
      theme: resume.theme,
    };

    resume.sections.forEach((section) => {
      const key = section.type.toLowerCase();
      resumeData[key] = section.content;
    });

    return NextResponse.json({ data: resumeData });
  } catch (error) {
    console.error('Error fetching Seera Link CV:', error);
    return NextResponse.json({ error: 'Failed to fetch CV' }, { status: 500 });
  }
}
