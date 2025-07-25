import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, X, Plus, User, Trash, Upload, Download } from "lucide-react";
import type { TrustedSender, InsertTrustedSender } from "@shared/schema";

interface TrustedSendersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrustedSendersPanel({ isOpen, onClose }: TrustedSendersPanelProps) {
  const [newSender, setNewSender] = useState({ email: "", name: "" });
  const { toast } = useToast();

  const { data: trustedSenders = [] } = useQuery<TrustedSender[]>({
    queryKey: ['/api/trusted-senders'],
  });

  const addSenderMutation = useMutation({
    mutationFn: async (data: InsertTrustedSender) => {
      const response = await apiRequest("POST", "/api/trusted-senders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trusted Sender Added",
        description: "The sender has been added to your trusted list.",
      });
      setNewSender({ email: "", name: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/trusted-senders'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Sender",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeSenderMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trusted-senders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Trusted Sender Removed",
        description: "The sender has been removed from your trusted list.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trusted-senders'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Remove Sender",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddSender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSender.email) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    addSenderMutation.mutate(newSender);
  };

  const handleRemoveSender = (id: string) => {
    removeSenderMutation.mutate(id);
  };

  return (
    <div className={`fixed right-0 top-0 h-full w-96 glass-morphism transform transition-transform duration-500 z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } ${isOpen ? 'slide-in-right' : ''}`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="mr-3 text-emerald-400" size={24} />
            Trusted Senders
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="glass-card hover:bg-white/20">
            <X size={16} />
          </Button>
        </div>

        {/* Add New Trusted Sender */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <h3 className="font-medium mb-3">Add Trusted Sender</h3>
          <form onSubmit={handleAddSender} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newSender.email}
                onChange={(e) => setNewSender(prev => ({ ...prev, email: e.target.value }))}
                className="glass-card border-white/15 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Display Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Display name"
                value={newSender.name}
                onChange={(e) => setNewSender(prev => ({ ...prev, name: e.target.value }))}
                className="glass-card border-white/15 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <Button
              type="submit"
              disabled={addSenderMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              <Plus className="mr-2" size={16} />
              {addSenderMutation.isPending ? "Adding..." : "Add Sender"}
            </Button>
          </form>
        </div>

        {/* Trusted Senders List */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="font-medium mb-3">Current Trusted Senders</h3>
          
          {trustedSenders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users size={32} className="mx-auto mb-3 opacity-50" />
              <p>No trusted senders yet</p>
              <p className="text-sm">Add senders above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trustedSenders.map(sender => (
                <div key={sender.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <User className="text-white" size={14} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{sender.email}</div>
                      {sender.name && (
                        <div className="text-xs text-gray-400">{sender.name}</div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSender(sender.id)}
                    disabled={removeSenderMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import/Export Options */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" className="glass-card hover:bg-white/20 text-sm">
              <Upload className="mr-1" size={14} />
              Import
            </Button>
            <Button variant="ghost" className="glass-card hover:bg-white/20 text-sm">
              <Download className="mr-1" size={14} />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
