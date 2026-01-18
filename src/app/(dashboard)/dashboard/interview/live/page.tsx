'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    Phone,
    PhoneOff,
    Volume2,
    VolumeX,
    RotateCcw,
    Loader2,
    Brain,
    Target,
    User,
    CheckCircle2,
    Trophy,
    AlertCircle,
    Coffee,
    Send,
    Keyboard,
    Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';

type InterviewPhase = 'setup' | 'connecting' | 'greeting' | 'warmup' | 'interview' | 'closing' | 'ended';
type InterviewLanguage = 'en' | 'ar' | 'ar-sa'; // English, Formal Arabic, Saudi Dialect

interface Message {
    id: string;
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: Date;
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

// Interviewer names by language
const INTERVIEWER_NAMES = {
    'en': 'Sarah',
    'ar': 'سارة',
    'ar-sa': 'سارة',
};

// Phrases by language - Saudi dialect uses casual, friendly language
const PHRASES = {
    'en': {
        greeting: (name: string) => `Hi ${name}! I'm Sarah, the hiring manager. Thanks for coming in today. How are you doing?`,
        warmup: (role: string) => `That's great to hear! Before we dive into the formal questions, tell me a little about yourself. What attracted you to this ${role} position?`,
        toInterview: (q: string) => `Excellent, your background sounds really interesting! Alright, let's move on to the questions. ${q}`,
        transitions: ['Thank you. ', 'I see. ', 'Great. ', 'Excellent. ', 'Interesting. '],
        closing: `Thank you so much for your time today. It was great talking to you. Do you have any questions for me?`,
        goodbye: `Great questions! We'll be in touch soon. Have a wonderful day!`,
        fallbackQ: 'Tell me about a challenge you faced at work.',
    },
    'ar': {
        greeting: (name: string) => `مرحباً ${name}! أنا سارة، مديرة التوظيف. شكراً لحضورك اليوم. كيف حالك؟`,
        warmup: (role: string) => `رائع! قبل أن نبدأ بالأسئلة الرسمية، أخبرني قليلاً عن نفسك. ما الذي جذبك لمنصب ${role}؟`,
        toInterview: (q: string) => `ممتاز، خبرتك تبدو مثيرة للاهتمام! حسناً، دعنا ننتقل للأسئلة. ${q}`,
        transitions: ['شكراً. ', 'أفهم. ', 'جميل. ', 'ممتاز. ', 'مثير للاهتمام. '],
        closing: `شكراً جزيلاً على وقتك اليوم. كان من الرائع التحدث معك. هل لديك أي أسئلة لي؟`,
        goodbye: `أسئلة رائعة! سنتواصل معك قريباً. أتمنى لك يوماً سعيداً!`,
        fallbackQ: 'أخبرني عن تحدٍ واجهته في عملك.',
    },
    'ar-sa': {
        // Saudi Arabian dialect - casual and friendly! 🇸🇦
        greeting: (name: string) => `هلا والله ${name}! أنا سارة من الموارد البشرية. حياك الله، شلونك اليوم؟ إن شاء الله تمام؟`,
        warmup: (role: string) => `الحمدلله، زين! طيب قبل ما ندخل في الأسئلة الرسمية، قلي شوي عن نفسك. وش اللي خلاك تتقدم على وظيفة ${role}؟`,
        toInterview: (q: string) => `ماشاء الله، خبرتك حلوة! طيب خلنا نبدأ في الأسئلة. ${q}`,
        transitions: ['تمام. ', 'أها، فاهمة عليك. ', 'حلو. ', 'ممتاز والله. ', 'زين. '],
        closing: `يعطيك العافية على وقتك اليوم، كان حوارنا ممتاز. عندك أي أسئلة لي قبل ما نخلص؟`,
        goodbye: `أسئلة حلوة! بنتواصل معك قريب إن شاء الله. الله يوفقك!`,
        fallbackQ: 'قلي عن موقف صعب مريت فيه بشغلك وكيف تعاملت معه؟',
    },
};

const SILENT_AUDIO_DATA_URL =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

const FALLBACK_QUESTIONS = {
    en: [
        'Why are you interested in this role?',
        'Tell me about a professional achievement you are proud of.',
        'Describe a time you faced a challenge and how you solved it.',
        'How do you prioritize when you have multiple deadlines?',
        'What makes you a strong fit for this position?',
        'Tell me about a time you received feedback and what you did with it.',
        'How do you collaborate with teammates under pressure?',
        'What are your strengths and areas for improvement?',
    ],
    ar: [
        'لماذا ترغب في هذه الوظيفة؟',
        'حدثني عن إنجاز مهني تفخر به.',
        'صف موقفاً واجهت فيه تحدياً وكيف حللته.',
        'كيف ترتب أولوياتك عند وجود عدة مواعيد نهائية؟',
        'ما الذي يجعلك مناسباً لهذا الدور؟',
        'كيف تتعامل مع الملاحظات أو النقد البنّاء؟',
        'كيف تتعاون مع فريقك تحت الضغط؟',
        'ما هي نقاط قوتك ومجالات التحسين لديك؟',
    ],
    'ar-sa': [
        'ليه مهتم بهالوظيفة؟',
        'علمني عن إنجاز مهني تفتخر فيه.',
        'قلي عن موقف صار فيه تحدي وكيف حلّيته.',
        'كيف ترتّب أولوياتك لو عندك أكثر من موعد نهائي؟',
        'وش اللي يخليك مناسب لهالدور؟',
        'كيف تتعامل مع الملاحظات أو النقد البنّاء؟',
        'كيف تتعاون مع فريقك وقت الضغط؟',
        'وش نقاط قوتك وأشياء تبي تحسنها؟',
    ],
};

export default function LiveInterviewPage() {
    const { locale } = useLocale();

    // Setup state
    const [targetRole, setTargetRole] = useState('');
    const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior' | 'executive'>('mid');
    const [questionCount, setQuestionCount] = useState(5);
    const [candidateName, setCandidateName] = useState('');
    const [interviewLang, setInterviewLang] = useState<InterviewLanguage>(locale === 'ar' ? 'ar-sa' : 'en');

    // Interview state
    const [phase, setPhase] = useState<InterviewPhase>('setup');
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
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [selectedVoice, setSelectedVoice] = useState<'nova' | 'alloy' | 'echo' | 'onyx' | 'shimmer'>('nova');
    const [speechSupported, setSpeechSupported] = useState(true);
    const [micPermissionDenied, setMicPermissionDenied] = useState(false);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [audioErrorShown, setAudioErrorShown] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const [micErrorShown, setMicErrorShown] = useState(false);
    const [ttsFallbackActive, setTtsFallbackActive] = useState(false);
    const [ttsErrorShown, setTtsErrorShown] = useState(false);
    const [micRequesting, setMicRequesting] = useState(false);
    const [micReady, setMicReady] = useState(false);

    // Text input mode
    const [useTextInput, setUseTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');

    // Refs
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<Message[]>([]);
    const pendingAnswerRef = useRef<string>('');
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const phaseRef = useRef(phase);
    const autoListenRef = useRef(true);
    const isSpeakingRef = useRef(false);
    const isLoadingRef = useRef(false);
    const suppressListenRef = useRef(false);
    const processingRef = useRef(false);
    const lastAnswerRef = useRef<{ text: string; at: number } | null>(null);
    const pendingAudioUrlRef = useRef<string | null>(null);

    // Get phrases for current language
    const phrases = PHRASES[interviewLang];
    const interviewerName = INTERVIEWER_NAMES[interviewLang];

    // Keep phase ref in sync
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        isSpeakingRef.current = isSpeaking;
    }, [isSpeaking]);

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
    }, []);

    const normalizeSpeechText = useCallback((text: string) => (
        text
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]+/g, '')
            .trim()
    ), []);

    const buildFallbackQuestions = useCallback(() => {
        const list = FALLBACK_QUESTIONS[interviewLang] || FALLBACK_QUESTIONS.en;
        const count = Math.max(3, Math.min(questionCount, list.length));
        return list.slice(0, count).map((question) => ({
            question,
            category: 'behavioral',
        }));
    }, [interviewLang, questionCount]);

    const unlockAudio = useCallback(async () => {
        if (!audioRef.current || audioUnlocked) return;
        try {
            audioRef.current.src = SILENT_AUDIO_DATA_URL;
            audioRef.current.muted = true;
            await audioRef.current.play();
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.muted = false;
            setAudioUnlocked(true);
        } catch {
            if (!audioErrorShown) {
                setAudioErrorShown(true);
                toast.error(locale === 'ar' ? 'الرجاء النقر لتفعيل الصوت' : 'Please click once to enable audio');
            }
        }
    }, [audioUnlocked, audioErrorShown, locale]);

    const requestMicAccess = useCallback(async () => {
        if (!navigator?.mediaDevices?.getUserMedia) {
            setSpeechSupported(false);
            setUseTextInput(true);
            return false;
        }

        try {
            setMicRequesting(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            setMicPermissionDenied(false);
            setMicReady(true);
            return true;
        } catch (error) {
            setMicReady(false);
            setMicPermissionDenied(true);
            if (!micErrorShown) {
                setMicErrorShown(true);
                toast.error(interviewLang.startsWith('ar') ? 'الميكروفون غير مسموح' : 'Microphone permission denied');
            }
            return false;
        } finally {
            setMicRequesting(false);
        }
    }, [interviewLang, micErrorShown]);

    const handleRequestMic = useCallback(async () => {
        const ok = await requestMicAccess();
        if (ok) {
            toast.success(interviewLang.startsWith('ar') ? 'تم تفعيل الميكروفون' : 'Microphone enabled');
        }
    }, [interviewLang, requestMicAccess]);

    const pickSpeechVoice = useCallback(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return undefined;

        const langPrefix = interviewLang === 'en' ? 'en' : 'ar';
        const isFemalePreferred = selectedVoice === 'nova' || selectedVoice === 'shimmer';
        const isMalePreferred = selectedVoice === 'echo' || selectedVoice === 'onyx';
        const candidates = voices.filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix));
        const fallbackVoice = candidates[0] || voices[0];

        const femaleHints = ['female', 'zira', 'samantha', 'victoria', 'karen', 'susan', 'tessa', 'serena', 'sara'];
        const maleHints = ['male', 'david', 'alex', 'daniel', 'mark', 'fred', 'jorge', 'juan'];

        const matchByHints = (hints: string[]) =>
            candidates.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint)));

        if (isFemalePreferred) {
            return matchByHints(femaleHints) || fallbackVoice;
        }

        if (isMalePreferred) {
            return matchByHints(maleHints) || fallbackVoice;
        }

        return fallbackVoice;
    }, [interviewLang, selectedVoice]);

    // Stop listening
    const stopListening = useCallback((suppress: boolean = false) => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        pendingAnswerRef.current = '';
        if (suppress) {
            suppressListenRef.current = true;
        }
        try { recognitionRef.current?.abort(); } catch (e) { }
        try { recognitionRef.current?.stop(); } catch (e) { }
        setIsListening(false);
    }, []);

    useEffect(() => {
        const isInteractive = ['greeting', 'warmup', 'interview', 'closing'].includes(phase);
        if (!isInteractive) {
            autoListenRef.current = false;
            stopListening();
        }
    }, [phase, stopListening]);

    // Start listening
    const startListening = useCallback(() => {
        if (micRequesting) return;
        if (!recognitionRef.current || isSpeakingRef.current || isLoadingRef.current || useTextInput || !autoListenRef.current) return;
        try {
            suppressListenRef.current = false;
            pendingAnswerRef.current = '';
            setLiveTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            setIsListening(false);
            setUseTextInput(true);
            if (!micErrorShown) {
                setMicErrorShown(true);
                toast.error(locale === 'ar' ? 'الميكروفون غير متاح - استخدم الكتابة' : 'Microphone not available - use text input');
            }
        }
    }, [isSpeaking, isLoading, locale, micErrorShown, micRequesting, useTextInput]);

    const speakWithBrowser = useCallback(async (text: string): Promise<void> => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            return;
        }

        setTtsFallbackActive(true);

        return new Promise((resolve) => {
            const synth = window.speechSynthesis;
            const speakNow = () => {
                try {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = interviewLang === 'en' ? 'en-US' : 'ar-SA';
                    utterance.rate = 0.95;
                    const preferredVoice = pickSpeechVoice();
                    if (preferredVoice) {
                        utterance.voice = preferredVoice;
                    }
                    utterance.onend = () => resolve();
                    utterance.onerror = () => resolve();

                    synth.cancel();
                    synth.speak(utterance);
                } catch {
                    resolve();
                }
            };

            if (synth.getVoices().length === 0) {
                const onVoicesChanged = () => {
                    synth.removeEventListener('voiceschanged', onVoicesChanged);
                    speakNow();
                };
                synth.addEventListener('voiceschanged', onVoicesChanged);
                window.setTimeout(() => {
                    synth.removeEventListener('voiceschanged', onVoicesChanged);
                    speakNow();
                }, 350);
            } else {
                speakNow();
            }
        });
    }, [interviewLang, pickSpeechVoice, startListening]);

    const playPendingAudio = useCallback(async () => {
        if (!audioRef.current || !pendingAudioUrlRef.current) {
            setAudioBlocked(false);
            return;
        }
        try {
            setIsSpeaking(true);
            isSpeakingRef.current = true;
            stopListening(true);
            await unlockAudio();
            audioRef.current.src = pendingAudioUrlRef.current;
            await audioRef.current.play();
            await new Promise<void>((resolve) => {
                audioRef.current!.onended = () => resolve();
                audioRef.current!.onerror = () => resolve();
            });
            URL.revokeObjectURL(pendingAudioUrlRef.current);
            pendingAudioUrlRef.current = null;
            setAudioBlocked(false);
        } catch {
            if (!audioErrorShown) {
                setAudioErrorShown(true);
                toast.error(locale === 'ar' ? 'تعذر تشغيل الصوت' : 'Audio playback blocked');
            }
        } finally {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            suppressListenRef.current = false;
            setTimeout(() => startListening(), 500);
        }
    }, [audioErrorShown, locale, startListening, stopListening, unlockAudio]);

    // Speak using OpenAI TTS
    const speak = useCallback(async (text: string): Promise<void> => {
        const shouldResume = autoListenRef.current && !useTextInput;
        let playbackFailed = false;

        if (isMuted) {
            if (shouldResume) {
                setTimeout(() => startListening(), 300);
            }
            return;
        }

        setIsSpeaking(true);
        isSpeakingRef.current = true;
        stopListening(true);
        pendingAnswerRef.current = '';
        setLiveTranscript('');
        setTtsFallbackActive(false);

        let audioUrl: string | null = null;

        try {
            if (!audioRef.current) {
                await speakWithBrowser(text);
                return;
            }

            await unlockAudio();

            const response = await fetch('/api/interview/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: selectedVoice }),
            });

            if (await handleAICreditsResponse(response.clone())) {
                return;
            }
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const message =
                    errorPayload?.error?.message ||
                    errorPayload?.error ||
                    errorPayload?.message ||
                    `TTS failed (${response.status})`;
                throw new Error(message);
            }

            const audioBlob = await response.blob();
            audioUrl = URL.createObjectURL(audioBlob);
            setTtsFallbackActive(false);
            audioRef.current.src = audioUrl;

            const tryPlay = async () => {
                try {
                    await audioRef.current!.play();
                    return true;
                } catch {
                    try {
                        await unlockAudio();
                        await audioRef.current!.play();
                        return true;
                    } catch {
                        return false;
                    }
                }
            };

            const played = await tryPlay();
            if (!played) {
                playbackFailed = true;
                setAudioBlocked(true);
                pendingAudioUrlRef.current = audioUrl;
                return;
            }

            await new Promise<void>((resolve, reject) => {
                audioRef.current!.onended = () => resolve();
                audioRef.current!.onerror = () => reject(new Error('Audio playback failed'));
            });
        } catch (error) {
            console.error('TTS error:', error);
            if (!ttsErrorShown) {
                setTtsErrorShown(true);
                const message = error instanceof Error ? error.message : 'TTS failed';
                toast.error(
                    interviewLang.startsWith('ar')
                        ? `تعذر تشغيل صوت الذكاء الاصطناعي: ${message}`
                        : `AI voice unavailable: ${message}`
                );
            }
            await speakWithBrowser(text);
        } finally {
            if (audioUrl && pendingAudioUrlRef.current !== audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            suppressListenRef.current = false;
            if (shouldResume && !playbackFailed) {
                setTimeout(() => startListening(), 500);
            }
        }
    }, [audioErrorShown, interviewLang, isMuted, locale, selectedVoice, speakWithBrowser, startListening, stopListening, ttsErrorShown, unlockAudio, useTextInput]);

    // Process user response
    const processUserResponse = useCallback(async (answer: string) => {
        const trimmedAnswer = answer.trim();
        if (!trimmedAnswer || processingRef.current || isLoadingRef.current || isSpeakingRef.current) return;

        const normalizedAnswer = normalizeSpeechText(trimmedAnswer);
        const lastAnswer = lastAnswerRef.current;
        const now = Date.now();
        if (normalizedAnswer && lastAnswer && lastAnswer.text === normalizedAnswer && now - lastAnswer.at < 3000) {
            return;
        }

        const lastInterviewer = [...messagesRef.current].reverse().find((msg) => msg.role === 'interviewer');
        if (lastInterviewer) {
            const normalizedInterviewer = normalizeSpeechText(lastInterviewer.content);
            if (
                normalizedAnswer.length >= 8 &&
                (normalizedInterviewer.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedInterviewer))
            ) {
                return;
            }
        }

        processingRef.current = true;
        lastAnswerRef.current = normalizedAnswer ? { text: normalizedAnswer, at: now } : null;

        const currentPhase = phaseRef.current;
        setIsLoading(true);
        isLoadingRef.current = true;
        stopListening(true);
        setLiveTranscript('');

        const candidateMessage: Message = {
            id: Date.now().toString() + '-candidate',
            role: 'candidate',
            content: trimmedAnswer,
            timestamp: new Date(),
        };
        const conversation = [...messagesRef.current, candidateMessage];

        setMessages((prev) => [...prev, candidateMessage]);

        try {
            let responseText = '';

            if (currentPhase === 'greeting') {
                setPhase('warmup');
                phaseRef.current = 'warmup';
                responseText = phrases.warmup(targetRole);

            } else if (currentPhase === 'warmup') {
                setPhase('interview');
                phaseRef.current = 'interview';
                const firstQ = questions[0]?.question || phrases.fallbackQ;
                responseText = phrases.toInterview(firstQ);

            } else if (currentPhase === 'interview') {
                const currentQuestion = questions[currentQuestionIndex]?.question || phrases.fallbackQ;

                if (currentQuestion) {
                    try {
                        const evalRes = await fetch('/api/interview', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'evaluate-answer',
                                question: currentQuestion,
                                answer,
                                context: {
                                    targetRole,
                                    experienceLevel,
                                    locale: interviewLang,
                                    dialect: interviewLang === 'ar-sa' ? 'saudi_casual' : undefined,
                                },
                            }),
                        });
                        if (await handleAICreditsResponse(evalRes.clone())) {
                            return;
                        }
                        const evalPayload = await evalRes.json().catch(() => ({}));

                        if (evalRes.ok) {
                            const feedback = evalPayload?.result || {};
                            setResults((prev) => [
                                ...prev,
                                {
                                    question: currentQuestion,
                                    answer,
                                    score: feedback?.score || 5,
                                    feedback: {
                                        strengths: feedback?.strengths || [],
                                        improvements: feedback?.improvements || [],
                                    },
                                },
                            ]);
                        } else {
                            console.warn('Evaluation failed:', evalPayload?.error || evalRes.status);
                            setResults((prev) => [
                                ...prev,
                                {
                                    question: currentQuestion,
                                    answer,
                                    score: 5,
                                    feedback: { strengths: [], improvements: [] },
                                },
                            ]);
                        }
                    } catch (e) {
                        console.error('Eval error:', e);
                    }
                }

                if (currentQuestionIndex < questions.length - 1) {
                    const nextIdx = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextIdx);
                    const nextQuestion = questions[nextIdx]?.question || phrases.fallbackQ;
                    let aiTransition = '';

                    try {
                        const conductRes = await fetch('/api/interview', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'conduct-interview',
                                messages: conversation.map((msg) => ({
                                    role: msg.role,
                                    content: msg.content,
                                })),
                                context: {
                                    targetRole,
                                    experienceLevel,
                                    locale: interviewLang,
                                    dialect: interviewLang === 'ar-sa' ? 'saudi_casual' : undefined,
                                },
                                currentQuestion,
                                nextQuestion,
                            }),
                        });
                        if (await handleAICreditsResponse(conductRes.clone())) {
                            return;
                        }
                        const conductPayload = await conductRes.json().catch(() => ({}));
                        if (conductRes.ok) {
                            aiTransition = conductPayload?.result || '';
                        }
                    } catch (e) {
                        console.error('Conduct interview error:', e);
                    }

                    const trans = phrases.transitions[Math.floor(Math.random() * phrases.transitions.length)];
                    responseText = aiTransition?.trim() ? aiTransition : `${trans}${nextQuestion}`;
                } else {
                    setPhase('closing');
                    phaseRef.current = 'closing';
                    responseText = phrases.closing;
                }

            } else if (currentPhase === 'closing') {
                autoListenRef.current = false;
                setPhase('ended');
                phaseRef.current = 'ended';
                responseText = phrases.goodbye;
            }

            if (responseText) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString() + '-interviewer',
                        role: 'interviewer',
                        content: responseText,
                        timestamp: new Date(),
                    },
                ]);
            }

            if (responseText) {
                await speak(responseText);
            }

        } catch (error) {
            console.error('Error:', error);
            toast.error(interviewLang.startsWith('ar') ? 'حدث خطأ' : 'An error occurred');
        } finally {
            processingRef.current = false;
            isLoadingRef.current = false;
            suppressListenRef.current = false;
            setIsLoading(false);
        }
    }, [
        normalizeSpeechText,
        targetRole,
        questions,
        currentQuestionIndex,
        experienceLevel,
        interviewLang,
        phrases,
        speak,
        stopListening,
    ]);

    

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setSpeechSupported(false);
            setUseTextInput(true);
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = interviewLang === 'en' ? 'en-US' : 'ar-SA';

        let micPermissionDenied = false; // Track if permission was denied
        let errorShown = false; // Prevent multiple error toasts

        recognition.onresult = (event: any) => {
            if (isSpeakingRef.current || suppressListenRef.current || isLoadingRef.current) {
                return;
            }
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            if (final) pendingAnswerRef.current += final;
            setLiveTranscript((pendingAnswerRef.current + interim).trim());

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

            if (pendingAnswerRef.current.trim()) {
                silenceTimerRef.current = setTimeout(() => {
                    const answer = pendingAnswerRef.current.trim();
                    if (answer) {
                        processUserResponse(answer);
                        pendingAnswerRef.current = '';
                    }
                }, 2500);
            }
        };

        recognition.onerror = (event: any) => {
            console.log('Speech recognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'audio-capture') {
                micPermissionDenied = true;
                setMicPermissionDenied(true);
                if (!errorShown) {
                    errorShown = true;
                    toast.error(interviewLang.startsWith('ar') ? 'الميكروفون غير متاح - استخدم الكتابة' : 'Microphone not available - use text input', {
                        duration: 5000,
                    });
                }
                setUseTextInput(true);
                setIsListening(false);
            } else if (event.error === 'no-speech') {
                // No speech detected, this is normal - don't show error
            } else if (event.error === 'aborted') {
                // User aborted, don't show error
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            // Don't restart if permission was denied
            if (micPermissionDenied || useTextInput || !autoListenRef.current || suppressListenRef.current) return;

            const currentPhase = phaseRef.current;
            if (
                ['greeting', 'warmup', 'interview', 'closing'].includes(currentPhase) &&
                !isSpeakingRef.current &&
                !isLoadingRef.current
            ) {
                setTimeout(() => {
                    try {
                        recognition.start();
                        setIsListening(true);
                    } catch (e) {
                        // Failed to start, enable text input
                        setUseTextInput(true);
                    }
                }, 100);
            }
        };

        recognitionRef.current = recognition;

        return () => { try { recognition.stop(); } catch (e) { } };
    }, [interviewLang, processUserResponse, useTextInput]);

    // Start interview
    const startInterview = async () => {
        setPhase('connecting');
        phaseRef.current = 'connecting';
        setIsLoading(true);
        isLoadingRef.current = true;
        setSummaryData(null);
        setSummaryLoading(false);
        setTtsErrorShown(false);
        setTtsFallbackActive(false);
        pendingAnswerRef.current = '';
        lastAnswerRef.current = null;
        processingRef.current = false;
        suppressListenRef.current = false;
        setLiveTranscript('');
        stopListening();

        try {
            await unlockAudio();
            let generatedQuestions: Array<{ question: string; category: string }> = [];

            try {
                const res = await fetch('/api/interview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'generate-questions',
                        context: {
                            targetRole,
                            experienceLevel,
                            locale: interviewLang,
                            // Tell AI to use Saudi dialect if selected
                            dialect: interviewLang === 'ar-sa' ? 'saudi_casual' : undefined,
                        },
                        count: questionCount,
                    }),
                });

                if (await handleAICreditsResponse(res.clone())) {
                    setPhase('setup');
                    phaseRef.current = 'setup';
                    setIsLoading(false);
                    isLoadingRef.current = false;
                    return;
                }
                const payload = await res.json().catch(() => ({}));

                if (res.ok && Array.isArray(payload?.result) && payload.result.length > 0) {
                    generatedQuestions = payload.result;
                } else {
                    const apiError = payload?.error || payload?.message;
                    if (apiError) {
                        toast.error(
                            interviewLang.startsWith('ar')
                                ? `تعذر إنشاء الأسئلة: ${apiError}`
                                : `Failed to generate questions: ${apiError}`
                        );
                    } else {
                        toast.error(interviewLang.startsWith('ar') ? 'تعذر إنشاء الأسئلة' : 'Failed to generate questions');
                    }
                }
            } catch (error) {
                console.error('Question generation error:', error);
                toast.error(interviewLang.startsWith('ar') ? 'تعذر الاتصال بالخادم' : 'Failed to contact server');
            }

            if (generatedQuestions.length === 0) {
                generatedQuestions = buildFallbackQuestions();
            }

            setQuestions(generatedQuestions);

            setMessages([]);
            setResults([]);
            setCurrentQuestionIndex(0);
            setPhase('greeting');
            phaseRef.current = 'greeting';
            setIsLoading(false);
            isLoadingRef.current = false;
            autoListenRef.current = !useTextInput;

            const name = candidateName || (interviewLang === 'en' ? 'friend' : 'يا غالي');
            const greeting = phrases.greeting(name);

            setMessages([{ id: '1', role: 'interviewer', content: greeting, timestamp: new Date() }]);
            await speak(greeting);
        } catch (error) {
            console.error('Start error:', error);
            toast.error(interviewLang.startsWith('ar') ? 'فشل البدء' : 'Failed to start');
            setPhase('setup');
            phaseRef.current = 'setup';
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    };

    const handleTextSubmit = () => {
        if (textInput.trim()) {
            processUserResponse(textInput.trim());
            setTextInput('');
        }
    };

    const endInterview = () => {
        stopListening();
        audioRef.current?.pause();
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        autoListenRef.current = false;
        setPhase('ended');
        phaseRef.current = 'ended';
    };

    const toggleTextInput = () => {
        const next = !useTextInput;
        setUseTextInput(next);
        if (next) {
            autoListenRef.current = false;
            stopListening();
        } else {
            autoListenRef.current = true;
            const currentPhase = phaseRef.current;
            if (['greeting', 'warmup', 'interview', 'closing'].includes(currentPhase)) {
                startListening();
            }
        }
    };

    const toggleMicrophone = async () => {
        if (!speechSupported) {
            setUseTextInput(true);
            autoListenRef.current = false;
            if (!micErrorShown) {
                setMicErrorShown(true);
                toast.error(interviewLang.startsWith('ar') ? 'الميكروفون غير متاح - استخدم الكتابة' : 'Microphone not available - use text input');
            }
            return;
        }
        if (isListening) {
            autoListenRef.current = false;
            stopListening();
        } else {
            if (micRequesting) return;
            const micOk = await requestMicAccess();
            if (!micOk) {
                setUseTextInput(true);
                autoListenRef.current = false;
                return;
            }
            setUseTextInput(false);
            autoListenRef.current = true;
            startListening();
        }
    };

    useEffect(() => {
        if (phase !== 'ended' || results.length === 0 || summaryLoading || summaryData) return;

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
                        context: {
                            targetRole,
                            experienceLevel,
                            locale: interviewLang,
                            dialect: interviewLang === 'ar-sa' ? 'saudi_casual' : undefined,
                        },
                    }),
                });
                if (await handleAICreditsResponse(res.clone())) {
                    return;
                }
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
    }, [phase, results, summaryLoading, summaryData, targetRole, experienceLevel, interviewLang]);

    const overallScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length * 10) / 10
        : 0;

    const getReadinessLevel = (score: number) => {
        if (score >= 8) return { label: interviewLang.startsWith('ar') ? 'ممتاز' : 'Excellent', color: 'text-green-500', icon: Trophy };
        if (score >= 6) return { label: interviewLang.startsWith('ar') ? 'جاهز' : 'Ready', color: 'text-blue-500', icon: CheckCircle2 };
        if (score >= 4) return { label: interviewLang.startsWith('ar') ? 'يحتاج تدريب' : 'Needs Practice', color: 'text-amber-500', icon: AlertCircle };
        return { label: interviewLang.startsWith('ar') ? 'غير جاهز' : 'Not Ready', color: 'text-red-500', icon: AlertCircle };
    };

    const getLanguageLabel = (lang: InterviewLanguage) => {
        switch (lang) {
            case 'en': return 'English';
            case 'ar': return 'العربية الفصحى';
            case 'ar-sa': return '🇸🇦 السعودية (عامية)';
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b bg-card px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Brain className="h-6 w-6 text-primary" />
                            {interviewLang === 'ar-sa' ? 'المقابلة الحية 🇸🇦' : interviewLang === 'ar' ? 'المقابلة الحية' : 'Live Interview'}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {interviewLang === 'ar-sa'
                                ? `محادثة ودية مع ${interviewerName} - بالعامية السعودية`
                                : interviewLang === 'ar'
                                    ? `محادثة مع ${interviewerName}`
                                    : `Conversation with ${interviewerName}`}
                        </p>
                    </div>

                    {phase !== 'setup' && phase !== 'ended' && (
                        <Button variant="destructive" size="sm" onClick={endInterview}>
                            <PhoneOff className="h-4 w-4 me-2" />
                            {interviewLang.startsWith('ar') ? 'إنهاء' : 'End'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6">
                {/* SETUP */}
                {phase === 'setup' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Coffee className="h-5 w-5 text-primary" />
                                    {locale === 'ar' ? 'مقابلة مع سارة' : `Interview with ${INTERVIEWER_NAMES.en}`}
                                </CardTitle>
                                <CardDescription>
                                    {locale === 'ar' ? 'محادثة طبيعية ودية' : 'Natural friendly conversation'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Language Selection - PROMINENT */}
                                <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" />
                                        {locale === 'ar' ? 'لغة المقابلة' : 'Interview Language'}
                                    </label>
                                    <Select value={interviewLang} onValueChange={(v: InterviewLanguage) => setInterviewLang(v)}>
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">🇺🇸 English (Formal)</SelectItem>
                                            <SelectItem value="ar">🌍 العربية الفصحى (Formal Arabic)</SelectItem>
                                            <SelectItem value="ar-sa">🇸🇦 السعودية - عامية ودية (Saudi Casual)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {interviewLang === 'ar-sa' && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            ✨ المقابلة بتكون بالعامية السعودية الودية - زي ما تتكلم مع صاحبك!
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{locale === 'ar' ? 'اسمك' : 'Your Name'}</label>
                                    <Input
                                        placeholder={locale === 'ar' ? 'أحمد' : 'Ahmed'}
                                        value={candidateName}
                                        onChange={(e) => setCandidateName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{locale === 'ar' ? 'المنصب' : 'Target Role'}</label>
                                    <Input
                                        placeholder={locale === 'ar' ? 'مدير تقنية المعلومات' : 'IT Director'}
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{locale === 'ar' ? 'الخبرة' : 'Experience'}</label>
                                        <Select value={experienceLevel} onValueChange={(v: any) => setExperienceLevel(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="junior">{locale === 'ar' ? 'مبتدئ' : 'Junior'}</SelectItem>
                                                <SelectItem value="mid">{locale === 'ar' ? 'متوسط' : 'Mid'}</SelectItem>
                                                <SelectItem value="senior">{locale === 'ar' ? 'متقدم' : 'Senior'}</SelectItem>
                                                <SelectItem value="executive">{locale === 'ar' ? 'تنفيذي' : 'Executive'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{locale === 'ar' ? 'الأسئلة' : 'Questions'}</label>
                                        <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="3">3</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="8">8</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Volume2 className="h-4 w-4" />
                                        {locale === 'ar' ? 'الصوت' : 'Voice'}
                                    </label>
                                    <Select value={selectedVoice} onValueChange={(v: any) => setSelectedVoice(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nova">Nova (Female - Friendly)</SelectItem>
                                            <SelectItem value="shimmer">Shimmer (Female - Calm)</SelectItem>
                                            <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                                            <SelectItem value="echo">Echo (Male - Young)</SelectItem>
                                            <SelectItem value="onyx">Onyx (Male - Deep)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Mic className="h-4 w-4" />
                                        {locale === 'ar' ? 'الميكروفون' : 'Microphone'}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleRequestMic}
                                            disabled={micRequesting || !speechSupported}
                                        >
                                            {micRequesting
                                                ? (locale === 'ar' ? 'جارٍ التفعيل...' : 'Enabling...')
                                                : micReady
                                                    ? (locale === 'ar' ? 'الميكروفون جاهز' : 'Microphone ready')
                                                    : (locale === 'ar' ? 'تفعيل الميكروفون' : 'Enable microphone')}
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            {micPermissionDenied
                                                ? (locale === 'ar'
                                                    ? 'مرفوض - فعّل الإذن من إعدادات المتصفح'
                                                    : 'Blocked - enable permission in browser settings')
                                                : micReady
                                                    ? (locale === 'ar' ? 'الإذن مفعّل ويمكنك البدء' : 'Permission granted and ready')
                                                    : (locale === 'ar' ? 'يفتح نافذة الإذن قبل البداية' : 'Prompts permission before starting')}
                                        </span>
                                    </div>
                                    {!speechSupported && (
                                        <p className="text-xs text-amber-600">
                                            {locale === 'ar' ? 'المتصفح لا يدعم التعرف على الصوت - استخدم الكتابة' : 'Browser does not support voice input - use text instead'}
                                        </p>
                                    )}
                                </div>

                                <Button className="w-full h-14 text-lg" onClick={startInterview} disabled={!targetRole || isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin me-2" /> : <Phone className="h-5 w-5 me-2" />}
                                    {interviewLang === 'ar-sa'
                                        ? 'يلا نبدأ! 🚀'
                                        : interviewLang === 'ar'
                                            ? 'ابدأ المقابلة'
                                            : 'Start Interview'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <Card className="text-center p-4">
                                <Coffee className="h-8 w-8 mx-auto text-primary mb-2" />
                                <h3 className="font-medium">{locale === 'ar' ? 'تحية ودية' : 'Warm Greeting'}</h3>
                                <p className="text-sm text-muted-foreground">{interviewLang === 'ar-sa' ? 'هلا والله!' : locale === 'ar' ? 'نبدأ بترحيب' : 'Friendly start'}</p>
                            </Card>
                            <Card className="text-center p-4">
                                <Brain className="h-8 w-8 mx-auto text-primary mb-2" />
                                <h3 className="font-medium">{locale === 'ar' ? 'صوت طبيعي' : 'Natural Voice'}</h3>
                                <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'صوت واقعي' : 'Premium AI'}</p>
                            </Card>
                            <Card className="text-center p-4">
                                <Target className="h-8 w-8 mx-auto text-primary mb-2" />
                                <h3 className="font-medium">{locale === 'ar' ? 'تقييم ذكي' : 'Smart Score'}</h3>
                                <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'تقييم فوري' : 'Instant feedback'}</p>
                            </Card>
                        </div>
                    </div>
                )}

                {/* CONNECTING */}
                {phase === 'connecting' && (
                    <div className="max-w-md mx-auto text-center py-20">
                        <Phone className="h-16 w-16 mx-auto text-primary mb-6 animate-pulse" />
                        <h2 className="text-2xl font-bold mb-2">
                            {interviewLang === 'ar-sa' ? 'جاري الاتصال بسارة...' : interviewLang === 'ar' ? 'جارٍ الاتصال...' : 'Connecting...'}
                        </h2>
                    </div>
                )}

                {/* LIVE INTERVIEW */}
                {['greeting', 'warmup', 'interview', 'closing'].includes(phase) && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {phase === 'interview' && questions.length > 0 && (
                            <Progress value={(currentQuestionIndex / questions.length) * 100} />
                        )}

                        <Card className="min-h-[400px] flex flex-col">
                            <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[400px]">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${msg.role === 'interviewer' ? 'bg-primary/10' : 'bg-muted'}`}>
                                            {msg.role === 'interviewer' ? '👩‍💼' : <User className="h-5 w-5" />}
                                        </div>
                                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'interviewer' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}

                                {liveTranscript && (
                                    <div className="flex gap-3 flex-row-reverse">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <Mic className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="max-w-[80%] p-4 rounded-2xl bg-green-50 border-2 border-dashed border-green-300">
                                            <p className="text-sm text-green-700">{liveTranscript}...</p>
                                        </div>
                                    </div>
                                )}

                                {isLoading && (
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">👩‍💼</div>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">{interviewLang === 'ar-sa' ? 'سارة تفكر...' : interviewLang === 'ar' ? 'تفكر...' : 'Thinking...'}</span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </CardContent>

                            {/* Input */}
                            <div className="border-t p-4 space-y-4">
                                <div className="flex items-center justify-center gap-6">
                                    <Button variant="outline" size="icon" onClick={() => setIsMuted(!isMuted)}>
                                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                    </Button>

                                    <div className="relative">
                                        <Button
                                            size="lg"
                                            className={`h-20 w-20 rounded-full ${isListening ? 'bg-green-500 hover:bg-green-600' : isSpeaking ? 'bg-blue-500' : ''}`}
                                            onClick={toggleMicrophone}
                                            disabled={isLoading || isSpeaking || !speechSupported || micRequesting}
                                        >
                                            {isListening ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
                                        </Button>
                                        {isListening && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25" />}
                                    </div>

                                    <Button variant="outline" size="icon" onClick={toggleTextInput}>
                                        <Keyboard className="h-5 w-5" />
                                    </Button>
                                </div>

                                <p className="text-center text-sm text-muted-foreground">
                                    {micRequesting
                                        ? (interviewLang.startsWith('ar') ? '🎙️ جاري طلب إذن الميكروفون...' : '🎙️ Requesting microphone permission...')
                                        : isSpeaking
                                            ? (interviewLang === 'ar-sa' ? '🔊 سارة تتكلم...' : '🔊 Speaking...')
                                            : isListening
                                                ? (interviewLang === 'ar-sa' ? '🎙️ أسمعك... تكلم!' : '🎙️ Listening...')
                                                : '🔇 Click mic'}
                                </p>
                                {!speechSupported && (
                                    <p className="text-center text-xs text-amber-600">
                                        {locale === 'ar' ? 'المتصفح لا يدعم التعرف على الصوت - استخدم الكتابة' : 'Browser does not support voice input - use text instead'}
                                    </p>
                                )}
                                {micPermissionDenied && (
                                    <p className="text-center text-xs text-amber-600">
                                        {interviewLang.startsWith('ar')
                                            ? 'الميكروفون محظور - فعّل الإذن من إعدادات المتصفح ثم اضغط الميكروفون'
                                            : 'Microphone blocked - enable permission in browser settings, then press the mic'}
                                    </p>
                                )}
                                {ttsFallbackActive && (
                                    <p className="text-center text-xs text-amber-600">
                                        {interviewLang.startsWith('ar') ? 'الصوت من الجهاز (تعذر تفعيل صوت الذكاء الاصطناعي)' : 'Using device voice (AI voice unavailable)'}
                                    </p>
                                )}
                                {audioBlocked && (
                                    <div className="flex items-center justify-center">
                                        <Button variant="outline" size="sm" onClick={playPendingAudio}>
                                            {interviewLang.startsWith('ar') ? 'تفعيل صوت الذكاء الاصطناعي' : 'Enable AI Voice'}
                                        </Button>
                                    </div>
                                )}

                                {useTextInput && (
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder={interviewLang === 'ar-sa' ? 'اكتب هنا...' : interviewLang === 'ar' ? 'اكتب إجابتك...' : 'Type your answer...'}
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleTextSubmit())}
                                            className="flex-1"
                                            rows={2}
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

                {/* ENDED */}
                {phase === 'ended' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {results.length > 0 ? (
                            <>
                                <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                                    <CardContent className="pt-8 pb-6 text-center">
                                        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mb-4">
                                            <span className="text-4xl font-bold text-primary">{overallScore}</span>
                                            <span className="text-primary">/10</span>
                                        </div>
                                        {(() => {
                                            const level = getReadinessLevel(overallScore);
                                            return (
                                                <div className="flex items-center justify-center gap-2">
                                                    <level.icon className={`h-5 w-5 ${level.color}`} />
                                                    <p className={`font-semibold ${level.color}`}>{level.label}</p>
                                                </div>
                                            );
                                        })()}
                                        <p className="text-muted-foreground mt-2">
                                            {interviewLang === 'ar-sa' ? 'ماشاء الله عليك! خلصت المقابلة 🎉' : interviewLang === 'ar' ? 'أكملت المقابلة!' : 'Interview complete!'}
                                        </p>
                                    </CardContent>
                                </Card>

                                {summaryLoading && (
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                {interviewLang.startsWith('ar') ? 'جارٍ إعداد الملخص...' : 'Preparing summary...'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {summaryData && (summaryData.summary || summaryData.topStrength || summaryData.topImprovement) && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{interviewLang.startsWith('ar') ? 'ملخص الأداء' : 'Performance Summary'}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {summaryData.summary && (
                                                <p className="text-sm text-muted-foreground">{summaryData.summary}</p>
                                            )}
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {summaryData.topStrength && (
                                                    <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                                                        <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                                                            {interviewLang.startsWith('ar') ? 'أبرز نقطة قوة' : 'Top Strength'}
                                                        </p>
                                                        <p className="text-sm">{summaryData.topStrength}</p>
                                                    </div>
                                                )}
                                                {summaryData.topImprovement && (
                                                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                                                            {interviewLang.startsWith('ar') ? 'أكبر فرصة للتحسين' : 'Top Improvement'}
                                                        </p>
                                                        <p className="text-sm">{summaryData.topImprovement}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="space-y-4">
                                    {results.map((r, i) => (
                                        <Card key={i}>
                                            <CardContent className="pt-4">
                                                <div className="flex justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium text-sm mb-2">{r.question}</p>
                                                        <p className="text-sm text-muted-foreground">"{r.answer}"</p>
                                                    </div>
                                                    <Badge className={r.score >= 7 ? 'bg-green-500' : r.score >= 5 ? 'bg-amber-500' : 'bg-red-500'}>
                                                        {r.score}/10
                                                    </Badge>
                                                </div>
                                                {r.feedback && (r.feedback.strengths.length > 0 || r.feedback.improvements.length > 0) && (
                                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                        {r.feedback.strengths.length > 0 && (
                                                            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                                                                <h4 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                                                                    {interviewLang.startsWith('ar') ? 'نقاط القوة' : 'Strengths'}
                                                                </h4>
                                                                <ul className="text-xs space-y-1">
                                                                    {r.feedback.strengths.map((s, idx) => (
                                                                        <li key={idx}>✓ {s}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {r.feedback.improvements.length > 0 && (
                                                            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                                                                <h4 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                                                                    {interviewLang.startsWith('ar') ? 'للتحسين' : 'To Improve'}
                                                                </h4>
                                                                <ul className="text-xs space-y-1">
                                                                    {r.feedback.improvements.map((s, idx) => (
                                                                        <li key={idx}>→ {s}</li>
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
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                                <p>{interviewLang === 'ar-sa' ? 'يعطيك العافية!' : interviewLang === 'ar' ? 'شكراً!' : 'Thanks!'}</p>
                            </div>
                        )}

                        <Button onClick={() => setPhase('setup')} className="w-full">
                            <RotateCcw className="h-4 w-4 me-2" />
                            {interviewLang === 'ar-sa' ? 'مقابلة جديدة' : interviewLang === 'ar' ? 'مقابلة جديدة' : 'New Interview'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
