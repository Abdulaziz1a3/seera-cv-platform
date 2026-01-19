const DEFAULT_BUCKET = 'interview-recordings';
const DEFAULT_SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days

function getSupabaseStorageConfig() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET_INTERVIEWS || DEFAULT_BUCKET;
    const signedTtl = Number(process.env.SUPABASE_STORAGE_SIGNED_TTL || DEFAULT_SIGNED_TTL);

    if (!url || !serviceKey) {
        throw new Error('Supabase storage is not configured');
    }

    return { url, serviceKey, bucket, signedTtl };
}

export function buildInterviewRecordingPath(params: {
    userId: string;
    sessionId: string;
    extension: string;
}) {
    const safeExtension = params.extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'webm';
    return `interviews/${params.userId}/${params.sessionId}.${safeExtension}`;
}

export async function uploadInterviewRecording(params: {
    userId: string;
    sessionId: string;
    contentType: string;
    data: Buffer;
}) {
    const { url, serviceKey, bucket } = getSupabaseStorageConfig();
    const extension = params.contentType.split('/')[1]?.split(';')[0] || 'webm';
    const path = buildInterviewRecordingPath({
        userId: params.userId,
        sessionId: params.sessionId,
        extension,
    });

    const uploadUrl = `${url}/storage/v1/object/${bucket}/${path}`;
    const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            'content-type': params.contentType,
            'x-upsert': 'true',
        },
        body: params.data,
    });

    if (!res.ok) {
        const message = await res.text().catch(() => '');
        throw new Error(message || 'Failed to upload recording');
    }

    return { bucket, path };
}

export async function createSignedInterviewUrl(params: {
    bucket: string;
    path: string;
    expiresIn?: number;
}) {
    const { url, serviceKey, signedTtl } = getSupabaseStorageConfig();
    const expiresIn = params.expiresIn ?? signedTtl;

    const res = await fetch(`${url}/storage/v1/object/sign/${params.bucket}/${params.path}`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify({ expiresIn }),
    });

    if (!res.ok) {
        const message = await res.text().catch(() => '');
        throw new Error(message || 'Failed to create signed URL');
    }

    const payload = await res.json();
    const signed = payload.signedURL || payload.signedUrl || payload.url;
    if (typeof signed === 'string') {
        if (signed.startsWith('http')) return signed;
        if (signed.startsWith('/')) return `${url}${signed}`;
        return `${url}/storage/v1/object/sign/${params.bucket}/${params.path}?token=${signed}`;
    }
    throw new Error('Invalid signed URL response');
}
