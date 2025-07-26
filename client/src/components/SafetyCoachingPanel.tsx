import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  GraduationCap,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Shield,
  Award,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Star,
  Clock
} from "lucide-react";

interface TrainingEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  category: string;
  riskScore: number;
}

interface CoachingSessionResponse {
  id: string;
  email: TrainingEmail;
}

interface SubmitGuessResponse {
  isCorrect: boolean;
  feedback: string;
  learningPoints: string[];
  experience: number;
}

interface UserProgressData {
  totalSessions: number;
  correctGuesses: number;
  accuracy: number;
  streak: number;
  level: number;
  experience: number;
  badges: string[];
  weakAreas: string[];
  strengths: string[];
}

export default function SafetyCoachingPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSession, setCurrentSession] = useState<CoachingSessionResponse | null>(null);
  const [userGuess, setUserGuess] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);

  // Fetch user progress
  const { data: progress } = useQuery<UserProgressData>({
    queryKey: ['/api/coaching/progress'],
    staleTime: 30000,
  });

  // Note: We don't need to fetch sessions automatically, user will start them manually

  // Submit guess mutation
  const submitGuessMutation = useMutation<SubmitGuessResponse, Error, string>({
    mutationFn: async (guess: string) => {
      if (!currentSession) {
        throw new Error("No active session");
      }
      return await apiRequest("POST", `/api/coaching/submit`, {
        sessionId: currentSession.id,
        guess
      }) as SubmitGuessResponse;
    },
    onSuccess: (result) => {
      setShowFeedback(true);
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/progress'] });
      
      toast({
        title: result.isCorrect ? "Correct!" : "Learning Opportunity",
        description: result.isCorrect 
          ? "Great job identifying that email correctly!" 
          : "Don't worry, this helps you learn!",
        variant: result.isCorrect ? "default" : "destructive",
      });
    }
  });

  // Start new session mutation
  const startSessionMutation = useMutation<CoachingSessionResponse, Error, void>({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/coaching/start`) as CoachingSessionResponse;
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      setUserGuess('');
      setShowFeedback(false);
    }
  });

  const handleSubmitGuess = () => {
    if (!userGuess || !currentSession) return;
    submitGuessMutation.mutate(userGuess);
  };

  const handleNextSession = () => {
    setCurrentSession(null);
    setShowFeedback(false);
    startSessionMutation.mutate();
  };

  const getLevelInfo = (level: number) => {
    const levels = [
      { name: "Email Rookie", color: "text-gray-400", requirement: 0 },
      { name: "Security Cadet", color: "text-blue-400", requirement: 10 },
      { name: "Threat Hunter", color: "text-green-400", requirement: 25 },
      { name: "Phishing Expert", color: "text-purple-400", requirement: 50 },
      { name: "Cyber Guardian", color: "text-yellow-400", requirement: 100 }
    ];
    return levels[Math.min(level, levels.length - 1)];
  };

  if (!progress) {
    return (
      <div className="glass-card p-6 rounded-xl border border-white/20">
        <div className="flex items-center space-x-3 mb-4">
          <GraduationCap className="text-blue-400" size={24} />
          <h3 className="text-xl font-semibold text-white">Safety Coaching</h3>
        </div>
        <div className="text-gray-400">Loading your progress...</div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(progress.level);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="glass-card p-6 rounded-xl border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <GraduationCap className="text-blue-400" size={24} />
            <h3 className="text-xl font-semibold text-white">Email Safety Coaching</h3>
          </div>
          <Badge variant="outline" className={`${levelInfo.color} border-current`}>
            {levelInfo.name}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card p-4 border border-emerald-500/30">
            <div className="flex items-center space-x-3">
              <Target className="text-emerald-400" size={20} />
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {progress.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 border border-blue-500/30">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-blue-400" size={20} />
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {progress.streak}
                </div>
                <div className="text-sm text-gray-400">Current Streak</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 border border-purple-500/30">
            <div className="flex items-center space-x-3">
              <Award className="text-purple-400" size={20} />
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {progress.totalSessions}
                </div>
                <div className="text-sm text-gray-400">Total Sessions</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Level Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Level Progress</span>
            <span className="text-sm text-gray-400">
              {progress.experience}/100 XP
            </span>
          </div>
          <Progress value={progress.experience} className="h-2" />
        </div>

        {/* Badges */}
        {progress.badges.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Achievements</h4>
            <div className="flex flex-wrap gap-2">
              {progress.badges.map((badge, index) => (
                <Badge key={index} variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  <Star size={12} className="mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current Session or Start New */}
      {currentSession ? (
        <div className="glass-card p-6 rounded-xl border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="text-purple-400" size={24} />
            <h3 className="text-xl font-semibold text-white">Training Session</h3>
            <Badge variant="outline" className="text-blue-400 border-blue-400/50">
              Session #{progress.totalSessions + 1}
            </Badge>
          </div>

          {!showFeedback ? (
            <div className="space-y-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">From: {currentSession.email.sender}</span>
                  <span className="text-sm text-gray-400">
                    <Clock size={14} className="inline mr-1" />
                    2 hours ago
                  </span>
                </div>
                <h4 className="text-white font-medium mb-2">{currentSession.email.subject}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {currentSession.email.body}
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium mb-4">
                  How would you classify this email?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant={userGuess === 'safe' ? 'default' : 'outline'}
                    className={`p-4 h-auto flex-col space-y-2 ${
                      userGuess === 'safe' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                        : 'hover:bg-emerald-500/10'
                    }`}
                    onClick={() => setUserGuess('safe')}
                  >
                    <CheckCircle size={24} />
                    <span>Safe</span>
                  </Button>
                  
                  <Button
                    variant={userGuess === 'suspicious' ? 'default' : 'outline'}
                    className={`p-4 h-auto flex-col space-y-2 ${
                      userGuess === 'suspicious' 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                        : 'hover:bg-amber-500/10'
                    }`}
                    onClick={() => setUserGuess('suspicious')}
                  >
                    <AlertTriangle size={24} />
                    <span>Suspicious</span>
                  </Button>
                  
                  <Button
                    variant={userGuess === 'spam' ? 'default' : 'outline'}
                    className={`p-4 h-auto flex-col space-y-2 ${
                      userGuess === 'spam' 
                        ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                        : 'hover:bg-red-500/10'
                    }`}
                    onClick={() => setUserGuess('spam')}
                  >
                    <XCircle size={24} />
                    <span>Spam/Phishing</span>
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSubmitGuess}
                disabled={!userGuess || submitGuessMutation.isPending}
                className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
              >
                Submit Answer
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                {submitGuessMutation.data?.isCorrect ? (
                  <CheckCircle className="mx-auto text-emerald-400 mb-4" size={48} />
                ) : (
                  <XCircle className="mx-auto text-red-400 mb-4" size={48} />
                )}
                <h4 className="text-xl font-semibold text-white mb-2">
                  {submitGuessMutation.data?.isCorrect ? "Correct!" : "Not Quite Right"}
                </h4>
                <p className="text-gray-300">
                  {submitGuessMutation.data?.feedback}
                </p>
              </div>

              {submitGuessMutation.data?.learningPoints && submitGuessMutation.data.learningPoints.length > 0 && (
                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="text-blue-400" size={20} />
                    <span className="font-medium text-blue-400">Key Learning Points</span>
                  </div>
                  <ul className="space-y-2">
                    {submitGuessMutation.data.learningPoints.map((point: string, index: number) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                        <ChevronRight className="text-blue-400 mt-0.5 flex-shrink-0" size={14} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleNextSession}
                className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
              >
                <BookOpen className="mr-2" size={16} />
                Next Training Session
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-6 rounded-xl border border-white/20 text-center">
          <Shield className="mx-auto text-blue-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">
            Ready for Email Safety Training?
          </h3>
          <p className="text-gray-300 mb-6">
            Practice identifying phishing attempts and improve your email security skills through interactive sessions.
          </p>
          <Button
            onClick={() => startSessionMutation.mutate()}
            disabled={startSessionMutation.isPending}
            className="bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
          >
            <GraduationCap className="mr-2" size={16} />
            Start Training Session
          </Button>
        </div>
      )}

      {/* Learning Resources */}
      <div className="glass-card p-6 rounded-xl border border-white/20">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="text-green-400" size={24} />
          <h3 className="text-xl font-semibold text-white">Learning Resources</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card p-4 border border-green-500/30">
            <h4 className="font-medium text-green-400 mb-2">Phishing Red Flags</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Urgent or threatening language</li>
              <li>• Suspicious sender addresses</li>
              <li>• Unexpected attachments</li>
              <li>• Poor grammar and spelling</li>
            </ul>
          </Card>
          
          <Card className="glass-card p-4 border border-blue-500/30">
            <h4 className="font-medium text-blue-400 mb-2">Safety Best Practices</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Verify sender identity</li>
              <li>• Hover over links before clicking</li>
              <li>• Be cautious with personal info</li>
              <li>• When in doubt, ask IT</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}