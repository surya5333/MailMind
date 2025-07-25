import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Check, 
  AlertTriangle, 
  Ban, 
  Reply, 
  Archive, 
  Trash,
  Shield,
  ShieldCheck,
  CircleAlert,
  Skull,
  Brain,
  Star,
  Clock,
  Paperclip
} from "lucide-react";
import type { Email } from "@shared/schema";

interface EmailCardProps {
  email: Email;
  onDelete: () => void;
}

export default function EmailCard({ email, onDelete }: EmailCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteEmailMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/emails/${email.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Email Deleted",
        description: "Email has been removed from your inbox.",
      });
      onDelete();
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (action: 'mark_safe' | 'block') => {
      await apiRequest("PATCH", `/api/emails/${email.id}/status`, { action });
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: action === 'mark_safe' ? "Email Marked Safe" : "Email Blocked",
        description: action === 'mark_safe' 
          ? "Email has been moved to trusted emails." 
          : "Email has been blocked and moved to spam.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusConfig = () => {
    switch (email.category) {
      case 'trusted':
        return {
          icon: Check,
          label: '✅ Trusted',
          bgColor: 'bg-emerald-500/20 text-emerald-400',
          glowClass: 'trusted-glow',
          gradientFrom: 'from-emerald-400',
          gradientTo: 'to-green-500',
          riskIcon: ShieldCheck,
          riskColor: 'text-emerald-400',
          priority: 'High Priority',
          priorityIcon: Star,
          priorityColor: 'text-blue-400'
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          label: '⚠️ Suspicious',
          bgColor: 'bg-amber-500/20 text-amber-400',
          glowClass: 'suspicious-glow',
          gradientFrom: 'from-amber-400',
          gradientTo: 'to-yellow-500',
          riskIcon: CircleAlert,
          riskColor: 'text-amber-400',
          priority: 'Requires Review',
          priorityIcon: Clock,
          priorityColor: 'text-gray-400'
        };
      case 'spam':
        return {
          icon: Ban,
          label: '❌ Phishing',
          bgColor: 'bg-red-500/20 text-red-400',
          glowClass: 'danger-glow',
          gradientFrom: 'from-red-500',
          gradientTo: 'to-pink-500',
          riskIcon: Skull,
          riskColor: 'text-red-400',
          priority: 'BLOCKED',
          priorityIcon: Shield,
          priorityColor: 'text-red-400'
        };
      default:
        return {
          icon: Check,
          label: '✅ Safe',
          bgColor: 'bg-emerald-500/20 text-emerald-400',
          glowClass: 'trusted-glow',
          gradientFrom: 'from-emerald-400',
          gradientTo: 'to-green-500',
          riskIcon: ShieldCheck,
          riskColor: 'text-emerald-400',
          priority: 'Normal',
          priorityIcon: Clock,
          priorityColor: 'text-gray-400'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const RiskIcon = config.riskIcon;
  const PriorityIcon = config.priorityIcon;

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className={`glass-card rounded-2xl p-6 ${config.glowClass} fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className={`w-12 h-12 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded-full flex items-center justify-center`}>
            <StatusIcon className="text-white" size={20} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-lg">{email.sender}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor}`}>
                {config.label}
              </span>
              <span className="text-gray-400 text-sm">
                {formatTimestamp(email.timestamp)}
              </span>
            </div>
            
            <h4 className="text-white font-medium mb-2">{email.subject}</h4>
            
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {email.body.length > 200 ? `${email.body.substring(0, 200)}...` : email.body}
            </p>
            
            {/* GPT Reasoning for suspicious/spam emails */}
            {email.gptReasoning && email.category !== 'trusted' && (
              <div className={`mt-4 glass-card p-3 rounded-lg border-${email.category === 'spam' ? 'red' : 'amber'}-500/30`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className={config.riskColor} size={16} />
                  <span className={`font-medium text-sm ${config.riskColor}`}>
                    GPT Analysis {email.category === 'spam' ? '- HIGH RISK' : ''}
                  </span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {email.gptReasoning}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${config.riskColor}`}>
                  <RiskIcon className="mr-1 inline" size={16} />
                  Risk Score: {email.riskScore}/100
                </span>
                <span className={`text-sm ${config.priorityColor}`}>
                  <PriorityIcon className="mr-1 inline" size={16} />
                  {config.priority}
                </span>
                {Math.random() > 0.5 && (
                  <span className="text-blue-400 text-sm">
                    <Paperclip className="mr-1 inline" size={16} />
                    {Math.floor(Math.random() * 3) + 1} Attachment{Math.floor(Math.random() * 3) + 1 > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                {email.category === 'suspicious' && (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      onClick={() => updateStatusMutation.mutate('mark_safe')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Check className="mr-1" size={14} />
                      Mark Safe
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      onClick={() => updateStatusMutation.mutate('block')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Ban className="mr-1" size={14} />
                      Block
                    </Button>
                  </>
                )}
                {email.category === 'trusted' && (
                  <>
                    <Button variant="ghost" size="sm" className="glass-card hover:bg-white/20">
                      <Reply size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="glass-card hover:bg-white/20">
                      <Archive size={14} />
                    </Button>
                  </>
                )}
                {email.category === 'spam' && (
                  <Button 
                    size="sm" 
                    disabled 
                    className="bg-gray-500/20 text-gray-400 cursor-not-allowed"
                  >
                    <Trash className="mr-1" size={14} />
                    Quarantined
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteEmailMutation.mutate()}
                  disabled={deleteEmailMutation.isPending}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <Trash size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
