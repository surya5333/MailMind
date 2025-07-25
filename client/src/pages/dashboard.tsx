import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EmailInput from "@/components/EmailInput";
import EmailCard from "@/components/EmailCard";
import FilterTabs from "@/components/FilterTabs";
import StatsPanel from "@/components/StatsPanel";
import TrustedSendersPanel from "@/components/TrustedSendersPanel";
import { Button } from "@/components/ui/button";
import { Settings, Users, Shield } from "lucide-react";
import type { Email } from "@shared/schema";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'trusted' | 'suspicious' | 'spam'>('all');
  const [isTrustedPanelOpen, setIsTrustedPanelOpen] = useState(false);

  const { data: emails = [], refetch: refetchEmails, isLoading } = useQuery<Email[]>({
    queryKey: ['/api/emails'],
  });

  const filteredEmails = emails.filter(email => {
    if (activeFilter === 'all') return true;
    return email.category === activeFilter;
  });

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="glass-morphism border-b border-white/20 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Smart Email Prioritizer</h1>
              <p className="text-xs text-gray-300">AI-Powered Security & Organization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="glass-card hover:bg-white/20">
              <Settings className="mr-2" size={16} />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="glass-card hover:bg-white/20"
              onClick={() => setIsTrustedPanelOpen(true)}
            >
              <Users className="mr-2" size={16} />
              Trusted Senders
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Stats Dashboard */}
        <div className="lg:col-span-1">
          <StatsPanel />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Email Input Section */}
          <EmailInput onEmailAnalyzed={refetchEmails} />

          {/* Filter Tabs */}
          <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {/* Email Inbox */}
          <div className="space-y-4 fade-in">
            {isLoading ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading emails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Shield className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium mb-2">
                  {activeFilter === 'all' ? 'No Emails Yet' : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Emails`}
                </h3>
                <p className="text-gray-400">
                  {activeFilter === 'all' 
                    ? 'Start by analyzing your first email above.'
                    : `No emails found in the ${activeFilter} category.`
                  }
                </p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <EmailCard key={email.id} email={email} onDelete={refetchEmails} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trusted Senders Panel */}
      <TrustedSendersPanel 
        isOpen={isTrustedPanelOpen} 
        onClose={() => setIsTrustedPanelOpen(false)} 
      />
    </div>
  );
}
