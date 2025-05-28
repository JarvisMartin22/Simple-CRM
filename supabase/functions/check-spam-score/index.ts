import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  subject: string;
  content: string;
}

interface SpamCheckResult {
  score: number;
  issues: string[];
}

const spamIndicators = [
  {
    pattern: /buy now|act now|limited time|urgent|exclusive offer/gi,
    score: 1,
    message: 'Contains urgent or promotional language',
  },
  {
    pattern: /\$([\d,]+)/g,
    score: 0.5,
    message: 'Contains dollar amounts',
  },
  {
    pattern: /free|discount|save|offer|deal|bargain/gi,
    score: 0.5,
    message: 'Contains promotional keywords',
  },
  {
    pattern: /[!]{2,}/g,
    score: 1,
    message: 'Contains multiple exclamation marks',
  },
  {
    pattern: /[A-Z\s]{10,}/g,
    score: 1,
    message: 'Contains excessive capitalization',
  },
  {
    pattern: /viagra|cialis|weight loss|diet|pills/gi,
    score: 2,
    message: 'Contains potentially spammy product references',
  },
  {
    pattern: /lottery|winner|prize|inheritance|million|dollars/gi,
    score: 2,
    message: 'Contains scam-related keywords',
  },
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    score: 0.5,
    message: 'Contains email addresses in content',
  },
];

const checkSpamScore = (subject: string, content: string): SpamCheckResult => {
  let totalScore = 0;
  const issues: string[] = [];
  const textToCheck = `${subject} ${content}`;

  // Remove HTML tags for text analysis
  const plainText = textToCheck.replace(/<[^>]*>/g, '');

  spamIndicators.forEach(indicator => {
    const matches = plainText.match(indicator.pattern);
    if (matches) {
      totalScore += indicator.score;
      issues.push(indicator.message);
    }
  });

  // Additional checks
  if (plainText.length > 5000) {
    totalScore += 1;
    issues.push('Email is unusually long');
  }

  if ((plainText.match(/http/g) || []).length > 5) {
    totalScore += 1;
    issues.push('Contains many links');
  }

  // Normalize score to 0-10 range
  const normalizedScore = Math.min(10, (totalScore / 8) * 10);

  return {
    score: normalizedScore,
    issues: [...new Set(issues)], // Remove duplicates
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subject, content } = await req.json() as RequestBody;

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: 'Subject and content are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const result = checkSpamScore(subject, content);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}); 