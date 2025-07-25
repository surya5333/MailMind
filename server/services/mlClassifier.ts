// Simple ML-based classification using keyword analysis and heuristics
// In a real implementation, this would use TF-IDF and trained models

export interface MLClassificationResult {
  riskScore: number;
  category: 'trusted' | 'suspicious' | 'spam';
  confidence: number;
}

export function classifyEmailWithML(
  sender: string,
  subject: string,
  body: string
): MLClassificationResult {
  const spamKeywords = [
    'free', 'winner', 'congratulations', 'prize', 'lottery', 'urgent', 'act now',
    'limited time', 'click here', 'verify now', 'suspended', 'immediate',
    'guarantee', 'no risk', 'cash', 'money', 'earn', 'income', 'investment'
  ];

  const phishingKeywords = [
    'verify', 'suspend', 'urgent', 'immediate', 'click', 'login', 'password',
    'account', 'security', 'confirm', 'update', 'expires', 'locked'
  ];

  const suspiciousDomains = [
    'tempmail', 'guerrillamail', '10minutemail', 'mailinator', 'paypaI',
    'arnazon', 'microsft', 'gmai1', 'yah00'
  ];

  const text = (subject + ' ' + body).toLowerCase();
  const senderLower = sender.toLowerCase();

  // Check for suspicious sender domain
  let domainSuspicious = false;
  suspiciousDomains.forEach(domain => {
    if (senderLower.includes(domain)) {
      domainSuspicious = true;
    }
  });

  // Count keyword matches
  const spamMatches = spamKeywords.filter(keyword => text.includes(keyword)).length;
  const phishingMatches = phishingKeywords.filter(keyword => text.includes(keyword)).length;

  // Check for urgent language patterns
  const urgentPatterns = [
    'asap', 'immediately', 'expires today', 'last chance', 'final notice',
    'action required', 'respond now', 'time sensitive'
  ];
  const urgentMatches = urgentPatterns.filter(pattern => text.includes(pattern)).length;

  // Calculate risk score
  let riskScore = 0;
  riskScore += spamMatches * 10;
  riskScore += phishingMatches * 15;
  riskScore += urgentMatches * 12;
  riskScore += domainSuspicious ? 30 : 0;

  // Check for all caps (shouting)
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
  if (capsRatio > 0.5) riskScore += 10;

  // Check for excessive punctuation
  const exclamationCount = (text.match(/!/g) || []).length;
  riskScore += Math.min(exclamationCount * 3, 15);

  // Normalize risk score
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine category
  let category: 'trusted' | 'suspicious' | 'spam';
  if (riskScore >= 70) {
    category = 'spam';
  } else if (riskScore >= 35) {
    category = 'suspicious';
  } else {
    category = 'trusted';
  }

  // Calculate confidence based on how many indicators we found
  const totalIndicators = spamMatches + phishingMatches + urgentMatches + (domainSuspicious ? 1 : 0);
  const confidence = Math.min(0.95, 0.3 + (totalIndicators * 0.15));

  return {
    riskScore,
    category,
    confidence
  };
}
