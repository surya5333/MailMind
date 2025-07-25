import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface EmailAnalysisResult {
  phishingRiskScore: number;
  isSpam: boolean;
  reasoning: string;
  category: 'trusted' | 'suspicious' | 'spam';
}

export async function analyzeEmailWithGPT(
  sender: string, 
  subject: string, 
  body: string,
  isTrustedSender: boolean = false
): Promise<EmailAnalysisResult> {
  try {
    if (isTrustedSender) {
      return {
        phishingRiskScore: Math.floor(Math.random() * 10) + 1, // Low risk for trusted
        isSpam: false,
        reasoning: "Email from trusted sender - automatically categorized as safe.",
        category: 'trusted'
      };
    }

    const prompt = `You are an AI email security analyst.

Analyze the following email and respond with JSON in this exact format:
{
  "phishingRiskScore": <number 0-100>,
  "isSpam": <boolean>,
  "reasoning": "<2-3 line explanation>"
}

Consider common red flags:
- Urgent or threatening tone
- Suspicious sender domains
- Requests for credentials or personal data
- Links or attachments mentioned
- Grammar and spelling errors
- Impersonation attempts

EMAIL CONTENT:
Subject: ${subject}
Sender: ${sender}
Body:
${body}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email security analyst. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Determine category based on risk score and spam detection
    let category: 'trusted' | 'suspicious' | 'spam';
    if (result.isSpam || result.phishingRiskScore >= 80) {
      category = 'spam';
    } else if (result.phishingRiskScore >= 20) {
      category = 'suspicious';
    } else {
      category = 'trusted';
    }

    return {
      phishingRiskScore: Math.max(0, Math.min(100, result.phishingRiskScore || 0)),
      isSpam: !!result.isSpam,
      reasoning: result.reasoning || "Analysis completed",
      category
    };

  } catch (error) {
    console.error("GPT analysis failed:", error);
    
    // Fallback analysis based on simple heuristics
    const suspiciousKeywords = [
      'urgent', 'immediate', 'verify', 'suspend', 'click here', 'limited time',
      'congratulations', 'winner', 'prize', 'free', 'act now', 'password'
    ];
    
    const text = (subject + ' ' + body).toLowerCase();
    const suspiciousCount = suspiciousKeywords.filter(keyword => 
      text.includes(keyword)
    ).length;
    
    const riskScore = Math.min(100, suspiciousCount * 15 + Math.floor(Math.random() * 20));
    const isSpam = riskScore >= 60;
    
    let category: 'trusted' | 'suspicious' | 'spam';
    if (isSpam || riskScore >= 80) {
      category = 'spam';
    } else if (riskScore >= 20) {
      category = 'suspicious';
    } else {
      category = 'trusted';
    }

    return {
      phishingRiskScore: riskScore,
      isSpam,
      reasoning: `GPT analysis unavailable. Fallback analysis detected ${suspiciousCount} suspicious keywords.`,
      category
    };
  }
}
