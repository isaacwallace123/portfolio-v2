import { NextResponse } from 'next/server';

const HONEYPOT_FIELD = '_hp_field';
const TIMESTAMP_FIELD = '_timestamp';
const MIN_SUBMISSION_TIME = 2000; // 2 seconds

type SpamCheckResult = {
  isSpam: boolean;
  response?: NextResponse;
};

/**
 * Check for spam signals (honeypot, timing)
 */
export function checkSpam(body: Record<string, any>): SpamCheckResult {
  // Check 1: Honeypot field (should be empty)
  if (body[HONEYPOT_FIELD] && body[HONEYPOT_FIELD].trim() !== '') {
    console.warn('Spam detected: Honeypot field filled');
    return {
      isSpam: true,
      response: NextResponse.json(
        { error: 'Invalid submission detected' },
        { status: 400 }
      ),
    };
  }

  // Check 2: Submission timing (should take at least 2 seconds)
  if (body[TIMESTAMP_FIELD]) {
    const formLoadTime = parseInt(body[TIMESTAMP_FIELD], 10);
    const submissionTime = Date.now();
    const elapsed = submissionTime - formLoadTime;

    if (elapsed < MIN_SUBMISSION_TIME) {
      console.warn(`Spam detected: Too fast (${elapsed}ms)`);
      return {
        isSpam: true,
        response: NextResponse.json(
          { error: 'Submission too fast. Please try again.' },
          { status: 400 }
        ),
      };
    }
  }

  return { isSpam: false };
}

/**
 * Remove spam fields before validation
 */
export function stripSpamFields(body: Record<string, any>): Record<string, any> {
  const cleaned = { ...body };
  delete cleaned[HONEYPOT_FIELD];
  delete cleaned[TIMESTAMP_FIELD];
  return cleaned;
}

/**
 * Constants exported for client-side use
 */
export const SPAM_FIELDS = {
  HONEYPOT: HONEYPOT_FIELD,
  TIMESTAMP: TIMESTAMP_FIELD,
};
