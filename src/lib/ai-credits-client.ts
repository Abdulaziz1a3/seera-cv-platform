export function openAICreditsModal(detail?: unknown) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('ai-credits-exceeded', { detail }));
}

export async function handleAICreditsResponse(response: Response): Promise<boolean> {
    if (response.status !== 402) return false;
    const payload = await response.json().catch(() => null);
    if (payload?.code === 'AI_CREDITS_EXCEEDED') {
        openAICreditsModal(payload.credits);
        return true;
    }
    return false;
}
