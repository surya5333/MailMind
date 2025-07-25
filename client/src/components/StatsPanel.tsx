import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Plus, Download, Trash2, CheckCircle, AlertTriangle, Ban, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Email } from "@shared/schema";

interface EmailStats {
  total: number;
  trusted: number;
  suspicious: number;
  spam: number;
  avgRiskScore: number;
}

interface StatsPanelProps {
  onAnalyzeNewEmail?: () => void;
}

export default function StatsPanel({ onAnalyzeNewEmail }: StatsPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: stats } = useQuery<EmailStats>({
    queryKey: ['/api/stats'],
  });

  const { data: emails = [] } = useQuery<Email[]>({
    queryKey: ['/api/emails'],
  });

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  // Export report functionality
  const exportReport = () => {
    try {
      const reportData = generateEmailReport(emails, stats);
      downloadReport(reportData);
      
      toast({
        title: "Report Exported",
        description: "Email analysis report has been downloaded successfully.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export report. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Clear spam emails
  const clearSpamMutation = useMutation({
    mutationFn: async () => {
      const spamEmails = emails.filter(email => email.category === 'spam');
      const deletePromises = spamEmails.map(email => 
        fetch(`/api/emails/${email.id}`, { method: 'DELETE' })
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Spam Cleared",
        description: `Removed ${emails.filter(e => e.category === 'spam').length} spam emails.`,
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Clear Failed",
        description: "Unable to clear spam folder. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const generateEmailReport = (emails: Email[], stats: EmailStats | undefined) => {
    const reportDate = new Date().toLocaleString();
    const spamEmails = emails.filter(e => e.category === 'spam');
    const suspiciousEmails = emails.filter(e => e.category === 'suspicious');
    const trustedEmails = emails.filter(e => e.category === 'trusted');
    
    return `SMART EMAIL PRIORITIZER - SECURITY REPORT
Generated: ${reportDate}

==============================================
SUMMARY STATISTICS
==============================================
Total Emails Processed: ${stats?.total || 0}
Trusted Emails: ${stats?.trusted || 0} (${getPercentage(stats?.trusted || 0, stats?.total || 0)}%)
Suspicious Emails: ${stats?.suspicious || 0} (${getPercentage(stats?.suspicious || 0, stats?.total || 0)}%)
Spam/Blocked Emails: ${stats?.spam || 0} (${getPercentage(stats?.spam || 0, stats?.total || 0)}%)
Average Risk Score: ${stats?.avgRiskScore || 0}/100

==============================================
BLOCKED/SPAM EMAILS (${spamEmails.length})
==============================================
${spamEmails.length === 0 ? 'No spam emails found.' : 
  spamEmails.map((email, index) => 
    `${index + 1}. From: ${email.sender}
   Subject: ${email.subject}
   Risk Score: ${email.riskScore}/100
   Reason: ${email.gptReasoning || 'Automatic detection'}
   Date: ${new Date(email.timestamp).toLocaleString()}
   ---`
  ).join('\n')
}

==============================================
SUSPICIOUS EMAILS (${suspiciousEmails.length})
==============================================
${suspiciousEmails.length === 0 ? 'No suspicious emails found.' : 
  suspiciousEmails.map((email, index) => 
    `${index + 1}. From: ${email.sender}
   Subject: ${email.subject}
   Risk Score: ${email.riskScore}/100
   Reason: ${email.gptReasoning || 'Requires review'}
   Date: ${new Date(email.timestamp).toLocaleString()}
   ---`
  ).join('\n')
}

==============================================
TRUSTED EMAILS (${trustedEmails.length})
==============================================
${trustedEmails.length === 0 ? 'No trusted emails found.' : 
  trustedEmails.map((email, index) => 
    `${index + 1}. From: ${email.sender}
   Subject: ${email.subject}
   Risk Score: ${email.riskScore}/100
   Date: ${new Date(email.timestamp).toLocaleString()}
   ---`
  ).join('\n')
}

==============================================
SECURITY RECOMMENDATIONS
==============================================
• Review all suspicious emails before taking action
• Verify sender identity for high-risk emails
• Keep trusted sender list updated
• Regularly check spam folder for false positives
• Consider additional security training for high-risk patterns

Report generated by Smart Email Prioritizer
AI-Powered Email Security System`;
  };

  const downloadReport = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `email-security-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Stats Cards */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart className="mr-2 text-blue-400" size={20} />
          Email Analytics
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total Processed</span>
            <span className="font-bold text-xl">{stats?.total || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center">
              <CheckCircle className="text-emerald-400 mr-2" size={16} />
              Trusted
            </span>
            <span className="font-semibold text-emerald-400">
              {stats ? getPercentage(stats.trusted, stats.total) : 0}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center">
              <AlertTriangle className="text-amber-400 mr-2" size={16} />
              Suspicious
            </span>
            <span className="font-semibold text-amber-400">
              {stats ? getPercentage(stats.suspicious, stats.total) : 0}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center">
              <Ban className="text-red-400 mr-2" size={16} />
              Blocked
            </span>
            <span className="font-semibold text-red-400">
              {stats ? getPercentage(stats.spam, stats.total) : 0}%
            </span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="text-sm text-gray-300">Average Risk Score</div>
          <div className="flex items-center mt-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${stats?.avgRiskScore || 0}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">
              {stats?.avgRiskScore || 0}/100
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="mr-2 text-green-400" size={20} />
          Quick Actions
        </h3>
        
        <div className="space-y-3">
          <Button 
            variant="ghost" 
            className="w-full glass-card p-3 rounded-lg hover:bg-white/20 justify-start"
            onClick={onAnalyzeNewEmail}
          >
            <Mail className="mr-2 text-blue-400" size={16} />
            Analyze New Email
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full glass-card p-3 rounded-lg hover:bg-white/20 justify-start"
            onClick={exportReport}
          >
            <Download className="mr-2 text-purple-400" size={16} />
            Export Report
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full glass-card p-3 rounded-lg hover:bg-white/20 justify-start"
            onClick={() => clearSpamMutation.mutate()}
            disabled={clearSpamMutation.isPending || emails.filter(e => e.category === 'spam').length === 0}
          >
            <Trash2 className="mr-2 text-orange-400" size={16} />
            Clear Spam Folder ({emails.filter(e => e.category === 'spam').length})
          </Button>
        </div>
      </div>
    </div>
  );
}
