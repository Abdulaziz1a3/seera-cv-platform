// Types shared between profile templates

export interface ProfileHighlight {
  id: string;
  content: string;
  icon: string | null;
  sortOrder: number;
}

export interface ProfileExperience {
  id: string;
  company: string;
  role: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  isFeatured: boolean;
  sortOrder: number;
}

export interface ProfileProject {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  tags: string[];
  sortOrder: number;
}

export interface ProfileCertificate {
  id: string;
  name: string;
  issuer: string;
  date: string | null;
  url: string | null;
  sortOrder: number;
}

export interface ProfileData {
  id: string;
  displayName: string;
  title: string;
  location: string | null;
  bio: string | null;
  avatarUrl: string | null;
  statusBadges: string[];
  language: 'en' | 'ar';
  themeColor: string;
  template: string;
  hidePhoneNumber: boolean;
  enableDownloadCv: boolean;
  cvFileUrl: string | null;

  // CTA settings
  ctaWhatsappNumber: string | null;
  ctaWhatsappMessage: string | null;
  ctaPhoneNumber: string | null;
  ctaEmail: string | null;
  ctaEmailSubject: string | null;
  ctaEmailBody: string | null;
  ctaLinkedinUrl: string | null;
  enabledCtas: string[];

  // Nested data
  highlights: ProfileHighlight[];
  experiences: ProfileExperience[];
  projects: ProfileProject[];
  certificates: ProfileCertificate[];
}
