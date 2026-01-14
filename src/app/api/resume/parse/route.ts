import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Read file content
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert file to base64 for OpenAI
        const base64File = buffer.toString('base64');
        const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

        // Use OpenAI GPT-4o with vision to parse the resume
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert resume parser. Analyze the uploaded resume document and extract ALL information into a structured JSON format.

IMPORTANT: Extract EVERYTHING you can find. Be thorough and accurate.

Return a JSON object with this exact structure:
{
    "name": "Full Name of the candidate",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "LinkedIn URL if present",
    "website": "Portfolio/website URL if present",
    "summary": "Professional summary or objective statement",
    "experience": [
        {
            "company": "Company Name",
            "position": "Job Title",
            "location": "City, Country",
            "startDate": "Month Year or Year",
            "endDate": "Month Year or Present",
            "description": "Brief job description if any",
            "achievements": ["Bullet point 1", "Bullet point 2", "..."]
        }
    ],
    "education": [
        {
            "institution": "University/School Name",
            "degree": "Degree Type (e.g., Bachelor's, Master's)",
            "field": "Field of Study",
            "location": "City, Country",
            "graduationYear": "Year",
            "gpa": "GPA if mentioned"
        }
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "certifications": [
        {
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "date": "Date obtained"
        }
    ],
    "languages": [
        {
            "name": "Language",
            "proficiency": "Level (Native, Fluent, Intermediate, Basic)"
        }
    ]
}

RULES:
1. Return ONLY valid JSON, no markdown code blocks
2. If information is not found, use empty string "" or empty array []
3. Extract bullet points as separate items in achievements array
4. Be thorough - don't miss any work experience or education`
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Parse this resume (${file.name}) and extract all information into JSON.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64File}`,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            max_tokens: 4000,
            temperature: 0.1,
        });

        const content = response.choices[0]?.message?.content || '{}';

        // Clean the response
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
        if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
        if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
        cleanContent = cleanContent.trim();

        try {
            const parsedData = JSON.parse(cleanContent);
            console.log('Resume parsed:', { name: parsedData.name, skills: parsedData.skills?.length });
            return NextResponse.json(parsedData);
        } catch {
            return NextResponse.json({
                name: '', email: '', phone: '', location: '',
                summary: '', experience: [], education: [], skills: [],
            });
        }

    } catch (error: any) {
        console.error('Resume parse error:', error);
        return NextResponse.json({ error: error.message || 'Failed to parse' }, { status: 500 });
    }
}
