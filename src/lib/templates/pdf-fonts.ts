import type { jsPDF } from 'jspdf';

const ARABIC_REGULAR = '/fonts/NotoSansArabic-Regular.ttf';
const ARABIC_BOLD = '/fonts/NotoSansArabic-Bold.ttf';
const FONT_FAMILY = 'NotoSansArabic';
let cachedRegular: string | null = null;
let cachedBold: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function fetchFont(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load font at ${path}`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

export async function ensureArabicFonts(doc: jsPDF): Promise<void> {
  if (!cachedRegular || !cachedBold) {
    const [regularBase64, boldBase64] = await Promise.all([
      fetchFont(ARABIC_REGULAR),
      fetchFont(ARABIC_BOLD),
    ]);
    cachedRegular = regularBase64;
    cachedBold = boldBase64;
  }

  if (!cachedRegular || !cachedBold) {
    throw new Error('Arabic font files could not be loaded.');
  }

  doc.addFileToVFS('NotoSansArabic-Regular.ttf', cachedRegular);
  doc.addFileToVFS('NotoSansArabic-Bold.ttf', cachedBold);
  doc.addFont('NotoSansArabic-Regular.ttf', FONT_FAMILY, 'normal');
  doc.addFont('NotoSansArabic-Bold.ttf', FONT_FAMILY, 'bold');
}
