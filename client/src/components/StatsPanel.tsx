import { useQuery } from "@tanstack/react-query";
import { BarChart, Plus, Download, Trash2, CheckCircle, AlertTriangle, Ban, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailStats {
  total: number;
  trusted: number;
  suspicious: number;
  spam: number;
  avgRiskScore: number;
}

export default function StatsPanel() {
  const { data: stats } = useQuery<EmailStats>({
    queryKey: ['/api/stats'],
  });

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
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
          <Button variant="ghost" className="w-full glass-card p-3 rounded-lg hover:bg-white/20 justify-start">
            <Mail className="mr-2 text-blue-400" size={16} />
            Analyze New Email
          </Button>
          
          <Button variant="ghost" className="w-full glass-card p-3 rounded-lg hover:bg-white/20 justify-start">
            <Download className="mr-2 text-purple-400" size={16} />
            Export Report
          </Button>
          
          <Button variant="ghost" className="w-full glass-card p-3 rounded-lg hover:bg-white/20 justify-start">
            <Trash2 className="mr-2 text-orange-400" size={16} />
            Clear Spam Folder
          </Button>
        </div>
      </div>
    </div>
  );
}
