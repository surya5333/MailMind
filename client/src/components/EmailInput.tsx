import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Eraser, Loader2 } from "lucide-react";
import type { AnalyzeEmailRequest } from "@shared/schema";

interface EmailInputProps {
  onEmailAnalyzed: () => void;
}

export default function EmailInput({ onEmailAnalyzed }: EmailInputProps) {
  const [formData, setFormData] = useState({
    sender: "",
    subject: "",
    body: ""
  });
  
  const { toast } = useToast();

  const analyzeEmailMutation = useMutation({
    mutationFn: async (data: AnalyzeEmailRequest) => {
      const response = await apiRequest("POST", "/api/emails/analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Analyzed Successfully",
        description: `Risk Score: ${data.email.riskScore}/100 - Category: ${data.email.category}`,
      });
      setFormData({ sender: "", subject: "", body: "" });
      onEmailAnalyzed();
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sender || !formData.subject || !formData.body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before analyzing.",
        variant: "destructive",
      });
      return;
    }
    analyzeEmailMutation.mutate(formData);
  };

  const handleClear = () => {
    setFormData({ sender: "", subject: "", body: "" });
  };

  return (
    <div className="glass-card rounded-2xl p-6 fade-in">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Brain className="mr-3 text-blue-400" size={24} />
        Analyze Email
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sender" className="text-sm font-medium text-gray-300">
              Sender Email
            </Label>
            <Input
              id="sender"
              type="email"
              placeholder="sender@example.com"
              value={formData.sender}
              onChange={(e) => setFormData(prev => ({ ...prev, sender: e.target.value }))}
              className="glass-card border-white/15 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-gray-300">
              Subject Line
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject..."
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="glass-card border-white/15 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="body" className="text-sm font-medium text-gray-300">
            Email Body
          </Label>
          <Textarea
            id="body"
            rows={4}
            placeholder="Email content goes here..."
            value={formData.body}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            className="glass-card border-white/15 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        
        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={analyzeEmailMutation.isPending}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 pulse-glow"
          >
            {analyzeEmailMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Brain className="mr-2" size={16} />
            )}
            {analyzeEmailMutation.isPending ? "Analyzing..." : "Analyze with AI"}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="glass-card hover:bg-white/20"
          >
            <Eraser className="mr-2" size={16} />
            Clear
          </Button>
        </div>
      </form>

      {/* GPT Analysis Loading State */}
      {analyzeEmailMutation.isPending && (
        <div className="mt-4 glass-card p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="animate-spin text-blue-400" size={20} />
            <span className="text-blue-400">GPT is analyzing your email for threats...</span>
          </div>
        </div>
      )}
    </div>
  );
}
