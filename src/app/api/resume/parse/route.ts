import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { getOpenAI } from '@/lib/openai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API not configured' },
                { status: 503 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const maxSizeBytes = 10 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        const fileName = file.name?.toLowerCase() || '';
        const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
        const isDocx =
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.endsWith('.docx');

        if (!isPdf && !isDocx) {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let extractedText = '';

        if (isPdf) {
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text || '';
        } else if (isDocx) {
            const docxResult = await mammoth.extractRawText({ arrayBuffer });
            extractedText = docxResult.value || '';
        }

        const cleanedText = extractedText
            .replace(/\u0000/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (!cleanedText) {
            return NextResponse.json(
                { error: 'No readable text found in file.' },
                { status: 400 }
            );
        }

        const maxChars = 20000;
        const textForModel =
            cleanedText.length > maxChars
                ? `${cleanedText.slice(0, 12000)}\n\n[...truncated...]\n\n${cleanedText.slice(-8000)}`
                : cleanedText;

        // Use OpenAI GPT-4o to parse the resume text
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
                    content: `Parse this resume (${file.name}) and extract all information into JSON.\n\nResume text:\n${textForModel}`,
                }
            ],
            max_tokens: 4000,
            temperature: 0.1,
            response_format: { type: 'json_object' },
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
        const message = error?.message || 'Failed to parse';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
