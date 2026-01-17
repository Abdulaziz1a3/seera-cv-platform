'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { normalizeResumeForAI } from '@/lib/resume-normalizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Mic,
    MicOff,
    Play,
    Pause,
    RotateCcw,
    Volume2,
    VolumeX,
    MessageSquare,
    Brain,
    Target,
    Clock,
    ChevronRight,
    Loader2,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Star,
    Trophy,
    User,
    Briefcase,
    HelpCircle,
    Phone,
    Keyboard,
    Send,
} from 'lucide-react';
import { toast } from 'sonner';

type InterviewStatus = 'setup' | 'ready' | 'interviewing' | 'feedback' | 'summary';

interface Message {
    id: string;
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: Date;
    audioUrl?: string;
}

interface QuestionResult {
    question: string;
    answer: string;
    score: number;
    feedback?: {
        strengths: string[];
        improvements: string[];
    };
}

export default function InterviewPrepPage() {
    const { locale, t } = useLocale();
    const { resumes } = useResumes();

    // Setup state
    const [targetRole, setTargetRole] = useState('');
    const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior' | 'executive'>('mid');
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [questionCount, setQuestionCount] = useState(5);

    // Interview state
    const [status, setStatus] = useState<InterviewStatus>('setup');
    const [questions, setQuestions] = useState<Array<{ question: string; category: string }>>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);
    const [results, setResults] = useState<QuestionResult[]>([]);
    const [summaryData, setSummaryData] = useState<{
        summary: string;
        topStrength: string;
        topImprovement: string;
    } | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Voice state
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    const [micPermissionDenied, setMicPermissionDenied] = useState(false);
    const [useTextInput, setUseTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recognitionRef = useRef<any>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            setUseTextInput(true);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + ' ' + finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed' || event.error === 'audio-capture') {
                setMicPermissionDenied(true);
                setUseTextInput(true);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            try { recognition.stop(); } catch (e) { }
        };
    }, [locale]);

    // Play AI voice
    const playInterviewerVoice = async (text: string) => {
        if (isMuted) return;

        try {
            setIsPlaying(true);
            const response = await fetch('/api/interview/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: 'onyx' }),
            });

            if (!response.ok) throw new Error('TTS failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch(() => {
                    setIsPlaying(false);
                });
            }
        } catch (error) {
            console.error('TTS error:', error);
        } finally {
            setIsPlaying(false);
        }
    };

    // Start recording
    const startRecording = async () => {
        if (!speechSupported || micPermissionDenied) {
            setUseTextInput(true);
            toast.error(locale === 'ar' ? 'الميكروفون غير متاح - استخدم الكتابة' : 'Microphone not available - use text input');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Start speech recognition
            if (recognitionRef.current) {
                setTranscript('');
                try {
                    recognitionRef.current.start();
                } catch (error) {
                    setUseTextInput(true);
                }
            }
        } catch (error) {
            setMicPermissionDenied(true);
            setUseTextInput(true);
            toast.error(locale === 'ar' ? 'فشل تفعيل الميكروفون' : 'Failed to access microphone');
        }
    };

    // Stop recording and process
    const stopRecording = async () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.stop();
        setIsRecording(false);

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }

        // Process the answer
        if (transcript.trim()) {
            await processAnswer(transcript.trim());
        }
    };

    const handleTextSubmit = async () => {
        const trimmed = textInput.trim();
        if (!trimmed || isLoading) return;
        setTextInput('');
        await processAnswer(trimmed);
    };

    // Generate interview questions
    const generateQuestions = async () => {
        setIsLoading(true);
        setSummaryData(null);
        setSummaryLoading(false);
        try {
            let resumeSummary: string | undefined;
            let resumeSkills: string[] | undefined;

            if (selectedResumeId) {
                const resumeResponse = await fetch(`/api/resumes/${selectedResumeId}`);
                if (resumeResponse.ok) {
                    const resumeData = await resumeResponse.json();
                    const normalized = normalizeResumeForAI(resumeData);
                    resumeSummary = normalized.summary;
                    resumeSkills = normalized.skills;
                }
            }

            const response = await fetch('/api/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-questions',
                    context: {
                        targetRole,
                        experienceLevel,
                        resumeSummary,
                        skills: resumeSkills,
                        locale,
                    },
                    count: questionCount,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to generate questions');
            }
            const { result } = payload;
            if (result && result.length > 0) {
                setQuestions(result);
                setStatus('ready');
                toast.success(locale === 'ar' ? `تم إنشاء ${result.length} سؤال` : `Generated ${result.length} questions`);
            } else {
                throw new Error('No questions generated');
            }
        } catch (error) {
            toast.error(locale === 'ar' ? 'فشل إنشاء الأسئلة' : 'Failed to generate questions');
        } finally {
            setIsLoading(false);
        }
    };

    // Start the interview
    const startInterview = async () => {
        setStatus('interviewing');
        setCurrentQuestionIndex(0);
        setMessages([]);
        setResults([]);

        // Play first question
        const firstQuestion = questions[0].question;
        const introMessage = locale === 'ar'
            ? `مرحباً بك في المقابلة. أنا مدير التوظيف، وسأطرح عليك ${questions.length} أسئلة. هل أنت جاهز؟ لنبدأ. ${firstQuestion}`
            : `Welcome to the interview. I'm the hiring manager, and I'll ask you ${questions.length} questions. Are you ready? Let's begin. ${firstQuestion}`;

        setMessages([{
            id: '1',
            role: 'interviewer',
            content: introMessage,
            timestamp: new Date(),
        }]);

        await playInterviewerVoice(introMessage);
    };

    // Process user's answer
    const processAnswer = async (answer: string) => {
        if (!answer.trim()) return;
        setIsLoading(true);

        // Add candidate message
        const candidateMsg: Message = {
            id: Date.now().toString(),
            role: 'candidate',
            content: answer,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, candidateMsg]);

        try {
            // Evaluate the answer
            const evalResponse = await fetch('/api/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'evaluate-answer',
                    question: questions[currentQuestionIndex].question,
                    answer,
                    context: { targetRole, experienceLevel, locale },
                }),
            });

            const payload = await evalResponse.json().catch(() => ({}));
            let feedback = payload?.result;
            if (!evalResponse.ok) {
                console.warn('Evaluation failed:', payload?.error || evalResponse.status);
                feedback = { score: 5, strengths: [], improvements: [] };
            }

            // Store result
            setResults(prev => [...prev, {
                question: questions[currentQuestionIndex].question,
                answer,
                score: feedback?.score || 5,
                feedback: {
                    strengths: feedback?.strengths || [],
                    improvements: feedback?.improvements || [],
                },
            }]);

            // Move to next question or finish
            if (currentQuestionIndex < questions.length - 1) {
                const nextIndex = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIndex);

                const transition = locale === 'ar'
                    ? `شكراً على إجابتك. السؤال التالي: ${questions[nextIndex].question}`
                    : `Thank you for your answer. Next question: ${questions[nextIndex].question}`;

                const interviewerMsg: Message = {
                    id: Date.now().toString() + '-i',
                    role: 'interviewer',
                    content: transition,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, interviewerMsg]);

                await playInterviewerVoice(transition);
            } else {
                // Interview complete
                const closing = locale === 'ar'
                    ? 'شكراً لوقتك. لقد انتهت المقابلة. سأقوم الآن بإعداد التقييم الشامل لأدائك.'
                    : 'Thank you for your time. The interview is now complete. I will now prepare your comprehensive performance review.';

                setMessages(prev => [...prev, {
                    id: 'closing',
                    role: 'interviewer',
                    content: closing,
                    timestamp: new Date(),
                }]);

                await playInterviewerVoice(closing);
                setStatus('summary');
            }
        } catch (error) {
            toast.error(locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
        } finally {
            setIsLoading(false);
            setTranscript('');
        }
    };

    useEffect(() => {
        if (status !== 'summary' || results.length === 0 || summaryLoading || summaryData) return;

        const runSummary = async () => {
            setSummaryLoading(true);
            try {
                const res = await fetch('/api/interview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'generate-summary',
                        questions: results.map((r) => ({
                            question: r.question,
                            answer: r.answer,
                            score: r.score,
                        })),
                        context: { targetRole, experienceLevel, locale },
                    }),
                });
                const payload = await res.json().catch(() => ({}));
                if (res.ok && payload?.result) {
                    setSummaryData({
                        summary: payload.result.summary || '',
                        topStrength: payload.result.topStrength || '',
                        topImprovement: payload.result.topImprovement || '',
                    });
                }
            } catch (error) {
                console.error('Summary error:', error);
            } finally {
                setSummaryLoading(false);
            }
        };

        runSummary();
    }, [status, results, summaryLoading, summaryData, targetRole, experienceLevel, locale]);

    // Calculate overall score
    const overallScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length * 10) / 10
        : 0;

    const getReadinessLevel = (score: number) => {
        if (score >= 8) return { label: locale === 'ar' ? 'ممتاز' : 'Excellent', color: 'text-green-500', icon: Trophy };
        if (score >= 6) return { label: locale === 'ar' ? 'جاهز' : 'Ready', color: 'text-blue-500', icon: CheckCircle2 };
        if (score >= 4) return { label: locale === 'ar' ? 'يحتاج تدريب' : 'Needs Practice', color: 'text-amber-500', icon: AlertCircle };
        return { label: locale === 'ar' ? 'غير جاهز' : 'Not Ready', color: 'text-red-500', icon: AlertCircle };
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Hidden audio element */}
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

            {/* Header */}
            <div className="border-b bg-card px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Brain className="h-6 w-6 text-primary" />
                            {locale === 'ar' ? 'تحضير المقابلة بالذكاء الاصطناعي' : 'AI Interview Prep'}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {locale === 'ar' ? 'تدرب على المقابلات مع محاور ذكي بالصوت' : 'Practice interviews with an AI voice interviewer'}
                        </p>
                    </div>

                    {status !== 'setup' && (
                        <Button variant="outline" onClick={() => setStatus('setup')}>
                            <RotateCcw className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'إعادة البدء' : 'Start Over'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6">
                {/* SETUP PHASE */}
                {status === 'setup' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>{locale === 'ar' ? 'إعداد المقابلة' : 'Interview Setup'}</CardTitle>
                                <CardDescription>
                                    {locale === 'ar' ? 'أخبرنا عن الوظيفة التي تستعد لها' : 'Tell us about the job you\'re preparing for'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Target Role */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'المنصب المستهدف' : 'Target Role'}
                                    </label>
                                    <Input
                                        placeholder={locale === 'ar' ? 'مثال: مهندس برمجيات' : 'e.g., Software Engineer'}
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                    />
                                </div>

                                {/* Experience Level */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'مستوى الخبرة' : 'Experience Level'}
                                    </label>
                                    <Select value={experienceLevel} onValueChange={(v: any) => setExperienceLevel(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="junior">{locale === 'ar' ? 'مبتدئ (0-2 سنة)' : 'Junior (0-2 years)'}</SelectItem>
                                            <SelectItem value="mid">{locale === 'ar' ? 'متوسط (2-5 سنوات)' : 'Mid-level (2-5 years)'}</SelectItem>
                                            <SelectItem value="senior">{locale === 'ar' ? 'متقدم (5-10 سنوات)' : 'Senior (5-10 years)'}</SelectItem>
                                            <SelectItem value="executive">{locale === 'ar' ? 'تنفيذي (10+ سنة)' : 'Executive (10+ years)'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Select Resume */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'اختر سيرتك الذاتية (اختياري)' : 'Select Your Resume (Optional)'}
                                    </label>
                                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={locale === 'ar' ? 'اختر سيرة ذاتية' : 'Select a resume'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {resumes.map((resume) => (
                                                <SelectItem key={resume.id} value={resume.id}>
                                                    {resume.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Number of Questions */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'عدد الأسئلة' : 'Number of Questions'}
                                    </label>
                                    <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">3 {locale === 'ar' ? 'أسئلة (سريع)' : 'questions (Quick)'}</SelectItem>
                                            <SelectItem value="5">5 {locale === 'ar' ? 'أسئلة (عادي)' : 'questions (Standard)'}</SelectItem>
                                            <SelectItem value="8">8 {locale === 'ar' ? 'أسئلة (شامل)' : 'questions (Comprehensive)'}</SelectItem>
                                            <SelectItem value="10">10 {locale === 'ar' ? 'أسئلة (كامل)' : 'questions (Full)'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    className="w-full h-12"
                                    onClick={generateQuestions}
                                    disabled={!targetRole || isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin me-2" />
                                    ) : (
                                        <Sparkles className="h-5 w-5 me-2" />
                                    )}
                                    {locale === 'ar' ? 'إنشاء أسئلة المقابلة' : 'Generate Interview Questions'}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">
                                            {locale === 'ar' ? 'أو جرب' : 'Or try'}
                                        </span>
                                    </div>
                                </div>

                                <Link href="/dashboard/interview/live" className="w-full">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-primary/50 hover:bg-primary/5"
                                    >
                                        <Phone className="h-5 w-5 me-2 text-primary" />
                                        {locale === 'ar' ? '🔥 المقابلة الحية الجديدة - محادثة طبيعية!' : '🔥 NEW: Live Interview - Natural Conversation!'}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Info cards */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { icon: Mic, title: locale === 'ar' ? 'محادثة صوتية' : 'Voice Chat', desc: locale === 'ar' ? 'تحدث بشكل طبيعي' : 'Speak naturally' },
                                { icon: Brain, title: locale === 'ar' ? 'ذكاء اصطناعي' : 'AI Powered', desc: locale === 'ar' ? 'أسئلة مخصصة' : 'Personalized Q&A' },
                                { icon: Target, title: locale === 'ar' ? 'تقييم فوري' : 'Instant Feedback', desc: locale === 'ar' ? 'نصائح تحسين' : 'Tips to improve' },
                            ].map((item) => (
                                <Card key={item.title} className="text-center p-4">
                                    <item.icon className="h-8 w-8 mx-auto text-primary mb-2" />
                                    <h3 className="font-medium">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* READY PHASE - Show questions before starting */}
                {status === 'ready' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    {locale === 'ar' ? 'الأسئلة جاهزة!' : 'Questions Ready!'}
                                </CardTitle>
                                <CardDescription>
                                    {locale === 'ar'
                                        ? `تم إنشاء ${questions.length} سؤال مخصص لمنصب ${targetRole}`
                                        : `Generated ${questions.length} questions tailored for ${targetRole}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {questions.map((q, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                            {i + 1}
                                        </span>
                                        <p className="text-sm">{q.question}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setStatus('setup')} className="flex-1">
                                {locale === 'ar' ? 'تعديل الإعدادات' : 'Edit Settings'}
                            </Button>
                            <Button onClick={startInterview} className="flex-1 h-12">
                                <Play className="h-5 w-5 me-2" />
                                {locale === 'ar' ? 'بدء المقابلة الصوتية' : 'Start Voice Interview'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* INTERVIEWING PHASE */}
                {status === 'interviewing' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Progress */}
                        <div className="flex items-center gap-4">
                            <Progress value={(currentQuestionIndex / questions.length) * 100} className="flex-1" />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {currentQuestionIndex + 1} / {questions.length}
                            </span>
                        </div>

                        {/* Chat Area */}
                        <Card className="min-h-[400px] flex flex-col">
                            <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[400px]">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'interviewer' ? 'bg-primary/10' : 'bg-muted'
                                            }`}>
                                            {msg.role === 'interviewer' ? (
                                                <Briefcase className="h-5 w-5 text-primary" />
                                            ) : (
                                                <User className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'interviewer'
                                            ? 'bg-muted rounded-tl-none'
                                            : 'bg-primary text-primary-foreground rounded-tr-none'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">{locale === 'ar' ? 'جارٍ التحليل...' : 'Analyzing...'}</span>
                                    </div>
                                )}
                            </CardContent>

                            {/* Voice Controls */}
                            <div className="border-t p-4">
                                {transcript && (
                                    <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                                        <span className="text-muted-foreground">{locale === 'ar' ? 'تحدثت: ' : 'You said: '}</span>
                                        {transcript}
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsMuted(!isMuted)}
                                    >
                                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                    </Button>

                                    <Button
                                        size="lg"
                                        className={`h-16 w-16 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isLoading || isPlaying || useTextInput || !speechSupported || micPermissionDenied}
                                    >
                                        {isRecording ? (
                                            <MicOff className="h-6 w-6" />
                                        ) : (
                                            <Mic className="h-6 w-6" />
                                        )}
                                    </Button>

                                    <div className="text-center min-w-[100px]">
                                        <p className="text-sm font-medium">
                                            {isRecording
                                                ? (locale === 'ar' ? 'جارٍ التسجيل...' : 'Recording...')
                                                : isPlaying
                                                    ? (locale === 'ar' ? 'المحاور يتحدث...' : 'Interviewer speaking...')
                                                    : (locale === 'ar' ? 'اضغط للتحدث' : 'Press to speak')
                                            }
                                        </p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setUseTextInput(!useTextInput)}
                                    >
                                        <Keyboard className="h-5 w-5" />
                                    </Button>
                                </div>

                                {!speechSupported && (
                                    <p className="text-center text-xs text-amber-600 mt-3">
                                        {locale === 'ar' ? 'المتصفح لا يدعم التعرف على الصوت - استخدم الكتابة' : 'Browser does not support voice input - use text instead'}
                                    </p>
                                )}

                                {useTextInput && (
                                    <div className="mt-4 flex gap-2">
                                        <Textarea
                                            placeholder={locale === 'ar' ? 'اكتب إجابتك...' : 'Type your answer...'}
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleTextSubmit())}
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button onClick={handleTextSubmit} disabled={!textInput.trim() || isLoading}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* SUMMARY PHASE */}
                {status === 'summary' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Overall Score */}
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                            <CardContent className="pt-8 pb-6">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mb-4">
                                        <span className="text-4xl font-bold text-primary">{overallScore}</span>
                                        <span className="text-lg text-primary">/10</span>
                                    </div>

                                    {(() => {
                                        const level = getReadinessLevel(overallScore);
                                        const LevelIcon = level.icon;
                                        return (
                                            <div className="flex items-center justify-center gap-2">
                                                <LevelIcon className={`h-5 w-5 ${level.color}`} />
                                                <span className={`font-semibold ${level.color}`}>{level.label}</span>
                                            </div>
                                        );
                                    })()}

                                    <p className="text-muted-foreground mt-2">
                                        {locale === 'ar'
                                            ? `أكملت ${results.length} سؤال بنجاح`
                                            : `Completed ${results.length} questions successfully`}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {summaryLoading && (
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'جارٍ إعداد الملخص...' : 'Preparing summary...'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {summaryData && (summaryData.summary || summaryData.topStrength || summaryData.topImprovement) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{locale === 'ar' ? 'ملخص الأداء' : 'Performance Summary'}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {summaryData.summary && (
                                        <p className="text-sm text-muted-foreground">{summaryData.summary}</p>
                                    )}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {summaryData.topStrength && (
                                            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                                <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                                                    {locale === 'ar' ? 'أبرز نقطة قوة' : 'Top Strength'}
                                                </h4>
                                                <p className="text-sm">{summaryData.topStrength}</p>
                                            </div>
                                        )}
                                        {summaryData.topImprovement && (
                                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                                <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                                                    {locale === 'ar' ? 'أكبر فرصة للتحسين' : 'Top Improvement'}
                                                </h4>
                                                <p className="text-sm">{summaryData.topImprovement}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Question Results */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">
                                {locale === 'ar' ? 'تفاصيل الأسئلة' : 'Question Details'}
                            </h2>

                            {results.map((result, i) => (
                                <Card key={i}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm mb-2">{result.question}</p>
                                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                                    "{result.answer}"
                                                </p>
                                            </div>
                                            <Badge className={`${result.score >= 8 ? 'bg-green-500' :
                                                result.score >= 6 ? 'bg-blue-500' :
                                                    result.score >= 4 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}>
                                                {result.score}/10
                                            </Badge>
                                        </div>

                                        {result.feedback && (
                                            <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                                {result.feedback.strengths.length > 0 && (
                                                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                                        <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                                                            {locale === 'ar' ? 'نقاط القوة' : 'Strengths'}
                                                        </h4>
                                                        <ul className="text-xs space-y-1">
                                                            {result.feedback.strengths.map((s, j) => (
                                                                <li key={j}>✓ {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {result.feedback.improvements.length > 0 && (
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                                        <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                                                            {locale === 'ar' ? 'للتحسين' : 'To Improve'}
                                                        </h4>
                                                        <ul className="text-xs space-y-1">
                                                            {result.feedback.improvements.map((s, j) => (
                                                                <li key={j}>→ {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setStatus('setup')} className="flex-1">
                                {locale === 'ar' ? 'مقابلة جديدة' : 'New Interview'}
                            </Button>
                            <Button onClick={() => startInterview()} className="flex-1">
                                <RotateCcw className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
