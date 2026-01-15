'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ResumeSummary {
    id: string;
    title: string;
    targetRole?: string | null;
    updatedAt?: string | null;
    atsScore?: number | null;
}

interface ResumeContextType {
    resumes: ResumeSummary[];
    isLoading: boolean;
    refreshResumes: () => Promise<void>;
    createResume: (data: {
        title: string;
        targetRole?: string;
        language?: 'en' | 'ar';
        template?: string;
        theme?: string;
    }) => Promise<string>;
    deleteResume: (id: string) => Promise<void>;
    duplicateResume: (id: string) => Promise<string | null>;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
    const [resumes, setResumes] = useState<ResumeSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshResumes = async () => {
        try {
            const response = await fetch('/api/resumes');
            if (!response.ok) {
                throw new Error('Failed to fetch resumes');
            }
            const data = await response.json();
            setResumes(
                Array.isArray(data)
                    ? data.map((resume) => ({
                        id: resume.id,
                        title: resume.title,
                        targetRole: resume.targetRole,
                        updatedAt: resume.updatedAt,
                        atsScore: resume.atsScore,
                    }))
                    : []
            );
        } catch (error) {
            console.error('Failed to load resumes:', error);
            setResumes([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshResumes();
    }, []);

    const createResume: ResumeContextType['createResume'] = async (data) => {
        const response = await fetch('/api/resumes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const raw = await response.text();
            let message = 'Failed to create resume';
            try {
                const payload = JSON.parse(raw || '{}');
                message = payload?.error || message;
            } catch {
                if (raw.trim().length > 0) {
                    message = raw.trim();
                } else if (response.status) {
                    message = `Failed to create resume (HTTP ${response.status})`;
                }
            }
            throw new Error(message);
        }

        const payload = await response.json();
        await refreshResumes();
        return payload.id as string;
    };

    const deleteResume: ResumeContextType['deleteResume'] = async (id) => {
        const response = await fetch(`/api/resumes/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload?.error || 'Failed to delete resume');
        }

        await refreshResumes();
    };

    const duplicateResume: ResumeContextType['duplicateResume'] = async (id) => {
        const response = await fetch(`/api/resumes/${id}`);
        if (!response.ok) {
            return null;
        }

        const original = await response.json();
        const title = original.title ? `${original.title} (Copy)` : 'Untitled Resume (Copy)';

        const newId = await createResume({
            title,
            targetRole: original.targetRole,
            language: original.language || 'en',
            template: original.template,
            theme: original.theme,
        });

        await fetch(`/api/resumes/${newId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                targetRole: original.targetRole,
                contact: original.contact,
                summary: original.summary,
                experience: original.experience,
                education: original.education,
                skills: original.skills,
                projects: original.projects,
                certifications: original.certifications,
                languages: original.languages,
                template: original.template,
                theme: original.theme,
            }),
        });

        await refreshResumes();
        return newId;
    };

    return (
        <ResumeContext.Provider value={{
            resumes,
            isLoading,
            refreshResumes,
            createResume,
            deleteResume,
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
