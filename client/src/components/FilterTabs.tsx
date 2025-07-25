import { Button } from "@/components/ui/button";
import { List, CheckCircle, AlertTriangle, Ban } from "lucide-react";

interface FilterTabsProps {
  activeFilter: 'all' | 'trusted' | 'suspicious' | 'spam';
  onFilterChange: (filter: 'all' | 'trusted' | 'suspicious' | 'spam') => void;
}

export default function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  const filters = [
    { key: 'all' as const, label: 'All Emails', icon: List },
    { key: 'trusted' as const, label: 'Trusted', icon: CheckCircle, color: 'text-emerald-400' },
    { key: 'suspicious' as const, label: 'Suspicious', icon: AlertTriangle, color: 'text-amber-400' },
    { key: 'spam' as const, label: 'Spam/Phishing', icon: Ban, color: 'text-red-400' },
  ];

  return (
    <div className="glass-card rounded-2xl p-2 fade-in">
      <div className="flex space-x-2">
        {filters.map(filter => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.key;
          
          return (
            <Button
              key={filter.key}
              variant="ghost"
              onClick={() => onFilterChange(filter.key)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                  : 'hover:bg-white/20'
              }`}
            >
              <Icon className={`mr-2 ${filter.color || ''}`} size={16} />
              {filter.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
