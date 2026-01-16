import type { ResumeData } from '@/lib/resume-types';

const baseSettings = {
  showPhoto: false,
  showLinkedIn: true,
  showWebsite: true,
  dateFormat: 'MMM YYYY' as const,
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
};

const baseMeta = {
  id: 'preview',
  title: 'Preview Resume',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function getTemplatePreviewData(locale: 'en' | 'ar'): ResumeData {
  if (locale === 'ar') {
    return {
      ...baseMeta,
      locale,
      template: 'prestige-executive',
      theme: 'obsidian',
      contact: {
        fullName: 'سارة العتيبي',
        email: 'sara.alotaibi@example.com',
        phone: '+966 55 123 4567',
        location: 'الرياض، السعودية',
        linkedin: 'linkedin.com/in/sara-alotaibi',
        website: 'saraalotaibi.com',
      },
      summary:
        'مهندسة برمجيات بخبرة 6 سنوات في تطوير المنتجات الرقمية، تحسين الأداء، وإطلاق ميزات قابلة للتوسع في بيئات عالية النمو.',
      experience: [
        {
          id: 'exp-1',
          company: 'منصة نُمو',
          position: 'مهندسة برمجيات أولى',
          location: 'الرياض',
          startDate: '2021-01-01',
          endDate: '',
          current: true,
          bullets: [
            'تقليل وقت استجابة المنصة بنسبة 38٪ عبر تحسينات في البنية والخدمات.',
            'قيادة فريق مصغّر لإطلاق ميزة التوصيات وزيادة التفاعل الأسبوعي بنسبة 22٪.',
          ],
        },
        {
          id: 'exp-2',
          company: 'شركة حلول',
          position: 'مهندسة برمجيات',
          location: 'الرياض',
          startDate: '2018-06-01',
          endDate: '2020-12-01',
          current: false,
          bullets: [
            'تطوير لوحات تحكم داخلية وتحسين تجربة المستخدم للفرق التشغيلية.',
            'تنفيذ تكاملات خارجية خفّضت زمن إدخال البيانات بنسبة 30٪.',
          ],
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'جامعة الملك سعود',
          degree: 'بكالوريوس علوم الحاسب',
          field: 'علوم الحاسب',
          location: 'الرياض',
          graduationDate: '2018-05-01',
          gpa: '4.5/5',
        },
      ],
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'تحسين الأداء'],
      projects: [
        {
          id: 'proj-1',
          name: 'نظام توصيات',
          description: 'بناء نموذج توصية يدعم تخصيص المحتوى وزيادة التحويل.',
          url: 'https://example.com',
          technologies: ['Python', 'ML', 'FastAPI'],
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          name: 'AWS Solutions Architect',
          issuer: 'Amazon',
          date: '2022-09-01',
          credentialId: 'AWS-12345',
        },
      ],
      languages: [
        { id: 'lang-1', name: 'العربية', proficiency: 'Native' },
        { id: 'lang-2', name: 'English', proficiency: 'Professional' },
      ],
      settings: { ...baseSettings },
    };
  }

  return {
    ...baseMeta,
    locale,
    template: 'prestige-executive',
    theme: 'obsidian',
    contact: {
      fullName: 'Nora Alharbi',
      email: 'nora.alharbi@example.com',
      phone: '+966 55 123 4567',
      location: 'Riyadh, Saudi Arabia',
      linkedin: 'linkedin.com/in/nora-alharbi',
      website: 'noraalharbi.com',
    },
    summary:
      'Product-focused software engineer with 6+ years building scalable web apps, performance improvements, and high-impact features.',
    experience: [
      {
        id: 'exp-1',
        company: 'Numo Platform',
        position: 'Senior Software Engineer',
        location: 'Riyadh',
        startDate: '2021-01-01',
        endDate: '',
        current: true,
        bullets: [
          'Reduced API response time by 38% through caching and query optimization.',
          'Led a small team to launch recommendations, boosting weekly engagement by 22%.',
        ],
      },
      {
        id: 'exp-2',
        company: 'Solutix',
        position: 'Software Engineer',
        location: 'Riyadh',
        startDate: '2018-06-01',
        endDate: '2020-12-01',
        current: false,
        bullets: [
          'Built internal dashboards that improved ops efficiency by 30%.',
          'Shipped integrations that reduced manual data entry time by 40%.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'King Saud University',
        degree: 'B.Sc. Computer Science',
        field: 'Computer Science',
        location: 'Riyadh',
        graduationDate: '2018-05-01',
        gpa: '4.5/5',
      },
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Performance'],
    projects: [
      {
        id: 'proj-1',
        name: 'Recommendation Engine',
        description: 'Built a ranking model that personalized content and improved conversion.',
        url: 'https://example.com',
        technologies: ['Python', 'ML', 'FastAPI'],
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Solutions Architect',
        issuer: 'Amazon',
        date: '2022-09-01',
        credentialId: 'AWS-12345',
      },
    ],
    languages: [
      { id: 'lang-1', name: 'Arabic', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Professional' },
    ],
    settings: { ...baseSettings },
  };
}
