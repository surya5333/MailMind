import { storage } from "../storage";
import type { Email } from "@shared/schema";

interface LearningFeedback {
  isCorrect: boolean;
  feedback: string;
  learningPoints: string[];
  experience: number;
}

export async function generateCoachingFeedback(
  userGuess: string,
  email: Email
): Promise<LearningFeedback> {
  const actualCategory = email.category;
  const isCorrect = userGuess === actualCategory || 
    (userGuess === 'safe' && actualCategory === 'trusted');

  const experience = isCorrect ? 10 : 5; // More XP for correct answers
  
  let feedback = "";
  let learningPoints: string[] = [];

  if (isCorrect) {
    feedback = "Excellent! You correctly identified this email's risk level.";
    
    if (actualCategory === 'trusted') {
      learningPoints = [
        "This sender is in your trusted contacts list",
        "Even trusted emails should be reviewed for content",
        "Look for consistent communication patterns from known contacts"
      ];
    } else if (actualCategory === 'suspicious') {
      learningPoints = [
        "You caught the warning signs in this suspicious email",
        "Continue to verify sender identity when in doubt",
        "Check for urgency tactics and unusual requests"
      ];
    } else if (actualCategory === 'spam') {
      learningPoints = [
        "Great job identifying this phishing attempt",
        "Trust your instincts when something feels wrong",
        "Always verify unexpected requests through other channels"
      ];
    }
  } else {
    // Provide educational feedback based on what they missed
    if (actualCategory === 'spam' && userGuess !== 'spam') {
      feedback = "This was actually a phishing attempt. Let's learn what to watch for.";
      learningPoints = [
        "Check for suspicious sender addresses or domains",
        "Look for urgent or threatening language designed to pressure you",
        "Be wary of unexpected requests for personal information",
        "Verify the sender through independent communication if unsure"
      ];
    } else if (actualCategory === 'suspicious' && userGuess === 'safe') {
      feedback = "This email had some red flags that made it suspicious.";
      learningPoints = [
        "Look for inconsistencies in sender information",
        "Be cautious of unexpected attachments or links",
        "Trust your gut feeling when something seems off",
        "When in doubt, verify with the supposed sender directly"
      ];
    } else if (actualCategory === 'trusted' && userGuess !== 'safe') {
      feedback = "This was actually from a trusted sender, but caution is always good!";
      learningPoints = [
        "This sender is in your trusted contacts list",
        "Being cautious is better than being careless",
        "Even trusted emails can be compromised, so stay alert",
        "Continue to verify unusual requests even from known contacts"
      ];
    } else {
      feedback = "Not quite right, but every mistake is a learning opportunity.";
      learningPoints = [
        "Take time to analyze the sender's address carefully",
        "Look for grammar and spelling errors in the content",
        "Consider the context - was this email expected?",
        "When unsure, it's always safer to be cautious"
      ];
    }
  }

  return {
    isCorrect,
    feedback,
    learningPoints,
    experience
  };
}

export async function updateUserProgressAfterSession(
  userId: string,
  isCorrect: boolean,
  experience: number
): Promise<void> {
  let progress = await storage.getUserProgress(userId);
  
  if (!progress) {
    // Create initial progress
    progress = await storage.updateUserProgress(userId, {
      userId,
      totalSessions: 1,
      correctGuesses: isCorrect ? 1 : 0,
      accuracy: isCorrect ? 100 : 0,
      streak: isCorrect ? 1 : 0,
      level: 0,
      experience: experience,
      badges: JSON.stringify([]),
      weakAreas: JSON.stringify([]),
      strengths: JSON.stringify([])
    });
  } else {
    // Update existing progress
    const newTotalSessions = progress.totalSessions + 1;
    const newCorrectGuesses = progress.correctGuesses + (isCorrect ? 1 : 0);
    const newAccuracy = Math.round((newCorrectGuesses / newTotalSessions) * 100);
    const newStreak = isCorrect ? progress.streak + 1 : 0;
    const newExperience = Math.min(100, progress.experience + experience);
    
    // Calculate level based on experience and sessions
    let newLevel = progress.level;
    if (newTotalSessions >= 10 && newLevel === 0) newLevel = 1;
    if (newTotalSessions >= 25 && newLevel === 1) newLevel = 2;
    if (newTotalSessions >= 50 && newLevel === 2) newLevel = 3;
    if (newTotalSessions >= 100 && newLevel === 3) newLevel = 4;

    // Handle badges
    let badges = [];
    try {
      badges = JSON.parse(progress.badges || '[]');
    } catch (e) {
      badges = [];
    }

    // Award new badges
    if (newStreak >= 5 && !badges.includes('5-Streak Master')) {
      badges.push('5-Streak Master');
    }
    if (newStreak >= 10 && !badges.includes('10-Streak Champion')) {
      badges.push('10-Streak Champion');
    }
    if (newAccuracy >= 80 && newTotalSessions >= 10 && !badges.includes('Accuracy Expert')) {
      badges.push('Accuracy Expert');
    }
    if (newTotalSessions >= 50 && !badges.includes('Training Veteran')) {
      badges.push('Training Veteran');
    }

    await storage.updateUserProgress(userId, {
      totalSessions: newTotalSessions,
      correctGuesses: newCorrectGuesses,
      accuracy: newAccuracy,
      streak: newStreak,
      level: newLevel,
      experience: newExperience,
      badges: JSON.stringify(badges)
    });
  }
}