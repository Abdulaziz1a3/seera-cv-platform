/**
 * Basic profanity filter list for slug validation
 * This is a minimal list - consider using a more comprehensive library
 * like 'bad-words' for production use
 */
export const profanityList = [
  // English profanity (abbreviated list)
  'fuck',
  'shit',
  'ass',
  'bitch',
  'damn',
  'crap',
  'piss',
  'dick',
  'cock',
  'pussy',
  'bastard',
  'slut',
  'whore',
  'cunt',
  'fag',
  'nigger',
  'nigga',
  'retard',
  'idiot',
  'moron',
  'stupid',
  // Common variations
  'f-ck',
  'fuk',
  'fck',
  'sh1t',
  'b1tch',
  'a55',
  'd1ck',
  // Additional offensive terms
  'porn',
  'xxx',
  'sex',
  'nude',
  'naked',
  'erotic',
  'fetish',
  'hentai',
  // Hate speech indicators
  'nazi',
  'isis',
  'terrorist',
  'kkk',
];

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return profanityList.some((word) => lowerText.includes(word));
}

/**
 * Get matching profane words in text
 */
export function findProfanity(text: string): string[] {
  const lowerText = text.toLowerCase();
  return profanityList.filter((word) => lowerText.includes(word));
}
