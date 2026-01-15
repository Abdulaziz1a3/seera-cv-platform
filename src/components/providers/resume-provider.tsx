'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Resume, ExperienceItem, EducationItem, ProjectItem, CertificationItem } from '@/lib/resume-schema';

// Simple resume type for the store
export interface ResumeData {
    id: string;
    title: string;
    template: string;
    contact: {
        fullName: string;
        email: string;
        phone: string;
        location: string;
        linkedin: string;
        website: string;
    };
    summary: string;
    experience: Array<{
        id: string;
        company: string;
        position: string;
        location: string;
        startDate: string;
        endDate: string;
        current: boolean;
        bullets: string[];
    }>;
    education: Array<{
        id: string;
        institution: string;
        degree: string;
        field: string;
        location: string;
        graduationDate: string;
        gpa: string;
    }>;
    skills: string[];
    projects: Array<{
        id: string;
        name: string;
        description: string;
        url: string;
        technologies: string[];
    }>;
    certifications: Array<{
        id: string;
        name: string;
        issuer: string;
        date: string;
        credentialId: string;
    }>;
    languages: Array<{
        id: string;
        name: string;
        proficiency: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface ResumeContextType {
    resumes: ResumeData[];
    currentResume: ResumeData | null;
    createResume: (title?: string) => ResumeData;
    updateResume: (id: string, data: Partial<ResumeData>) => void;
    deleteResume: (id: string) => void;
    setCurrentResume: (id: string | null) => void;
    getResume: (id: string) => ResumeData | undefined;
    duplicateResume: (id: string) => ResumeData;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

const STORAGE_KEY = 'seera-ai-resumes';

// Create empty resume
function createEmptyResume(title: string = 'Untitled Resume'): ResumeData {
    return {
        id: crypto.randomUUID(),
        title,
        // Default to one of the 3 main templates users can pick
        template: 'executive',
        contact: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            website: '',
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

export function ResumeProvider({ children }: { children: ReactNode }) {
    const [resumes, setResumes] = useState<ResumeData[]>([]);
    const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setResumes(parsed);
            } catch (e) {
                console.error('Failed to parse stored resumes:', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever resumes change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
        }
    }, [resumes, isLoaded]);

    const createResume = (title?: string): ResumeData => {
        const newResume = createEmptyResume(title);
        setResumes(prev => [...prev, newResume]);
        setCurrentResumeId(newResume.id);
        return newResume;
    };

    const updateResume = (id: string, data: Partial<ResumeData>) => {
        setResumes(prev => prev.map(resume =>
            resume.id === id
                ? { ...resume, ...data, updatedAt: new Date().toISOString() }
                : resume
        ));
    };

    const deleteResume = (id: string) => {
        setResumes(prev => prev.filter(resume => resume.id !== id));
        if (currentResumeId === id) {
            setCurrentResumeId(null);
        }
    };

    const setCurrentResume = (id: string | null) => {
        setCurrentResumeId(id);
    };

    const getResume = (id: string): ResumeData | undefined => {
        return resumes.find(r => r.id === id);
    };

    const duplicateResume = (id: string): ResumeData => {
        const original = resumes.find(r => r.id === id);
        if (!original) {
            return createResume();
        }
        const duplicate: ResumeData = {
            ...JSON.parse(JSON.stringify(original)),
            id: crypto.randomUUID(),
            title: `${original.title} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setResumes(prev => [...prev, duplicate]);
        return duplicate;
    };

    const currentResume = currentResumeId ? resumes.find(r => r.id === currentResumeId) || null : null;

    return (
        <ResumeContext.Provider value={{
            resumes,
            currentResume,
            createResume,
            updateResume,
            deleteResume,
            setCurrentResume,
            getResume,
            duplicateResume,
        }}>
            {children}
        </ResumeContext.Provider>
    );
}

export function useResumes() {
    const context = useContext(ResumeContext);
    if (!context) {
        throw new Error('useResumes must be used within a ResumeProvider');
    }
    return context;
}

// Helper to calculate ATS score
export function calculateATSScore(resume: ResumeData): number {
    let score = 0;

    // Contact (15 points)
    if (resume.contact?.fullName) score += 3;
    if (resume.contact?.email) score += 3;
    if (resume.contact?.phone) score += 3;
    if (resume.contact?.location) score += 3;
    if (resume.contact?.linkedin) score += 3;

    // Summary (15 points) - with defensive type checking
    const summaryText = typeof resume.summary === 'string' ? resume.summary : '';
    if (summaryText) {
        const words = summaryText.split(/\s+/).length;
        if (words >= 30) score += 15;
        else if (words > 10) score += 10;
        else score += 5;
    }

    // Experience (30 points)
    const experiences = Array.isArray(resume.experience) ? resume.experience : [];
    if (experiences.length > 0) {
        score += Math.min(10, experiences.length * 4);
        const bullets = experiences.reduce((acc, exp) => acc + (Array.isArray(exp.bullets) ? exp.bullets.length : 0), 0);
        score += Math.min(20, bullets * 2);
    }

    // Education (15 points)
    if (Array.isArray(resume.education) && resume.education.length > 0) {
        score += 15;
    }

    // Skills (15 points)
    const skills = Array.isArray(resume.skills) ? resume.skills : [];
    score += Math.min(15, skills.length * 3);

    // Projects & Certs (10 points)
    if (Array.isArray(resume.projects) && resume.projects.length > 0) score += 5;
    if (Array.isArray(resume.certifications) && resume.certifications.length > 0) score += 5;

    return Math.min(100, score);
}
