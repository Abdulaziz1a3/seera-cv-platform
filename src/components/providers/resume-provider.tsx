'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Import unified types from the new type system
import {
    type ResumeData,
    type TemplateId,
    type ThemeId,
    createEmptyResume as createEmptyResumeFromTypes,
    calculateATSScore as calculateATSScoreFromTypes,
    DEFAULT_TEMPLATE,
    DEFAULT_THEME,
    DEFAULT_LOCALE,
    DEFAULT_SETTINGS,
} from '@/lib/resume-types';

// Re-export for backwards compatibility
export type { ResumeData } from '@/lib/resume-types';

// Migration function for existing resumes without new fields
function migrateResume(resume: any): ResumeData {
    // Map old template names to new ones
    const templateMapping: Record<string, TemplateId> = {
        'executive': 'prestige-executive',
        'modern': 'metropolitan-split',
        'creative': 'impact-modern',
        'minimalist': 'nordic-minimal',
        'professional': 'classic-professional',
        'startup': 'impact-modern',
    };

    return {
        ...resume,
        // Migrate template name
        template: templateMapping[resume.template] || resume.template || DEFAULT_TEMPLATE,
        // Add missing fields
        theme: resume.theme || DEFAULT_THEME,
        locale: resume.locale || DEFAULT_LOCALE,
        settings: resume.settings || DEFAULT_SETTINGS,
    };
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

// Use the unified factory function
function createEmptyResume(title: string = 'Untitled Resume'): ResumeData {
    return createEmptyResumeFromTypes(title);
}

export function ResumeProvider({ children }: { children: ReactNode }) {
    const [resumes, setResumes] = useState<ResumeData[]>([]);
    const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount and migrate old resumes
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Migrate each resume to ensure all new fields exist
                const migrated = parsed.map(migrateResume);
                setResumes(migrated);
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

// Use the unified ATS score calculator
export function calculateATSScore(resume: ResumeData): number {
    return calculateATSScoreFromTypes(resume);
}
