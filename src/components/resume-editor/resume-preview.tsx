'use client';

import type { Resume } from '@/lib/resume-schema';

interface ResumePreviewProps {
    resume: Resume;
}

export function ResumePreview({ resume }: ResumePreviewProps) {
    return (
        <div className="bg-white text-black rounded-lg shadow-lg p-6 text-sm scale-75 origin-top transform">
            {/* Contact Header */}
            {resume.contact && (
                <div className="text-center border-b pb-4 mb-4">
                    <h1 className="text-xl font-bold">{resume.contact.fullName || 'Your Name'}</h1>
                    {resume.targetRole && (
                        <p className="text-gray-600 mt-1">{resume.targetRole}</p>
                    )}
                    <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs text-gray-500">
                        {resume.contact.email && <span>{resume.contact.email}</span>}
                        {resume.contact.phone && (
                            <>
                                <span>•</span>
                                <span>{resume.contact.phone}</span>
                            </>
                        )}
                        {resume.contact.location && (
                            <>
                                <span>•</span>
                                <span>{resume.contact.location}</span>
                            </>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-1 text-xs text-blue-600">
                        {resume.contact.linkedin && <span>{resume.contact.linkedin}</span>}
                        {resume.contact.website && <span>{resume.contact.website}</span>}
                    </div>
                </div>
            )}

            {/* Summary */}
            {resume.summary?.content && (
                <section className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
                        Professional Summary
                    </h2>
                    <p className="text-xs text-gray-700 leading-relaxed">
                        {resume.summary.content}
                    </p>
                </section>
            )}

            {/* Experience */}
            {resume.experience?.items && resume.experience.items.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
                        Experience
                    </h2>
                    <div className="space-y-3">
                        {resume.experience.items.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-xs">{exp.position || 'Position'}</h3>
                                        <p className="text-xs text-gray-600">
                                            {exp.company || 'Company'}
                                            {exp.location && ` | ${exp.location}`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {exp.startDate || 'Start'} - {exp.isCurrent ? 'Present' : (exp.endDate || 'End')}
                                    </span>
                                </div>
                                {exp.bullets && exp.bullets.length > 0 && (
                                    <ul className="mt-1 space-y-0.5">
                                        {exp.bullets.map((bullet) => (
                                            <li key={bullet.id} className="text-xs text-gray-700 flex">
                                                <span className="mr-1">•</span>
                                                <span>{bullet.content || 'Bullet point'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {resume.education?.items && resume.education.items.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
                        Education
                    </h2>
                    <div className="space-y-2">
                        {resume.education.items.map((edu) => (
                            <div key={edu.id} className="flex justify-between">
                                <div>
                                    <h3 className="font-semibold text-xs">
                                        {edu.degree || 'Degree'}
                                        {edu.field && ` in ${edu.field}`}
                                    </h3>
                                    <p className="text-xs text-gray-600">
                                        {edu.institution || 'Institution'}
                                        {edu.gpa && ` | GPA: ${edu.gpa}`}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {edu.endDate || 'Year'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {resume.skills && (
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
                        Skills
                    </h2>
                    {resume.skills.categories && resume.skills.categories.length > 0 ? (
                        <div className="space-y-1">
                            {resume.skills.categories.map((category) => (
                                <p key={category.id} className="text-xs">
                                    <span className="font-medium">{category.name}: </span>
                                    <span className="text-gray-700">{category.skills.join(', ')}</span>
                                </p>
                            ))}
                        </div>
                    ) : resume.skills.simpleList && resume.skills.simpleList.length > 0 ? (
                        <p className="text-xs text-gray-700">
                            {resume.skills.simpleList.join(', ')}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 italic">No skills added</p>
                    )}
                </section>
            )}

            {/* Empty state */}
            {!resume.contact?.fullName &&
                !resume.summary?.content &&
                (!resume.experience?.items || resume.experience.items.length === 0) && (
                    <div className="text-center py-8 text-gray-400">
                        <p>Start adding content to see your resume preview</p>
                    </div>
                )}
        </div>
    );
}
