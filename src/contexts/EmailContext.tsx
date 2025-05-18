import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

interface EmailTrackingData {
  id: string;
  email_id: string;
  recipient: string;
  subject: string;
  sent_at: string;
  opened_at: string | null;
  replied_at: string | null;
  clicked_at?: string | null;
  created_at?: string;
  provider?: string;
  tracking_pixel_id?: string | null;
  updated_at?: string;
  user_id?: string;
  open_count?: number;
  click_count?: number;
}

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

interface EmailContextType {
  // States
  isEmailConnected: boolean;
  emailProvider: string | null;
  emailAddress: string | null;
  isEmailSending: boolean;
  recentEmails: EmailTrackingData[];
  emailStats: { sent: number; opened: number; replied: number };

  // Actions
  sendEmail: (params: SendEmailParams) => Promise<void>;
  syncContacts: () => Promise<void>;
  isSyncing: boolean;
  
  // Notification
  notificationCount: number;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Fetch email integration data
  const { data: integration } = useQuery({
    queryKey: ['email-integration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'gmail')
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // No integration found, this is expected for new users
            console.log("EmailContext: No integration found (PGRST116)");
            return null;
          } else if ((error as any).status === 406) {
            // 406 Not Acceptable error - likely header issue
            console.error("EmailContext: 406 error fetching integration:", error);
            // Return null instead of throwing to prevent app crash
            return null;
          } else {
            console.error("EmailContext: Error fetching integration:", error);
            throw error;
          }
        }
        
        return data;
      } catch (e) {
        console.error("EmailContext: Unexpected error:", e);
        // Return null to prevent app from crashing on unexpected errors
        return null;
      }
    },
    enabled: !!user?.id,
  });
  
  // Fetch recent emails
  const { data: recentEmails = [] } = useQuery({
    queryKey: ['recent-emails', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error fetching recent emails:", error);
        throw error;
      }
      
      return data as EmailTrackingData[];
    },
    enabled: !!user?.id && !!integration,
  });
  
  // Fetch email stats
  const { data: emailStats = { sent: 0, opened: 0, replied: 0 } } = useQuery({
    queryKey: ['email-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { sent: 0, opened: 0, replied: 0 };
      
      const { data, error } = await supabase
        .from('email_tracking')
        .select('id, opened_at, replied_at')
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error fetching email stats:", error);
        throw error;
      }
      
      return {
        sent: data.length,
        opened: data.filter(email => email.opened_at).length,
        replied: data.filter(email => email.replied_at).length
      };
    },
    enabled: !!user?.id && !!integration,
  });
  
  // Set a default notification count for now
  useEffect(() => {
    // We'll use a mock count until the table is created
    setNotificationCount(0);
  }, []);
  
  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (params: SendEmailParams) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const response = await supabase.functions.invoke('send-email', {
        body: {
          userId: user.id,
          ...params
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Send email function
  const sendEmail = async (params: SendEmailParams) => {
    await sendEmailMutation.mutateAsync(params);
  };
  
  // Sync contacts function
  const syncContacts = async () => {
    if (!user?.id) throw new Error("User not authenticated");
    if (!integration) throw new Error("Email not connected");
    
    setIsSyncing(true);
    
    try {
      const response = await supabase.functions.invoke('sync-contacts', {
        body: {
          userId: user.id
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      toast({
        title: "Contacts synced",
        description: `${response.data.imported} contacts imported successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to sync contacts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const isEmailConnected = !!integration;
  const emailProvider = integration?.provider || null;
  const emailAddress = integration?.email || null;
  const isEmailSending = sendEmailMutation.isPending;
  
  const value = {
    // States
    isEmailConnected,
    emailProvider,
    emailAddress,
    isEmailSending,
    recentEmails,
    emailStats,
    
    // Actions
    sendEmail,
    syncContacts,
    isSyncing,
    
    // Notification
    notificationCount
  };
  
  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
} 