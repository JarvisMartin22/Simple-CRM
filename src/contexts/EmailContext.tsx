import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
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
  isLoading: boolean;
  syncEmails: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
}

export const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
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
  
  // Fetch email integration data
  const { data: integrationData, isLoading: isLoadingIntegration } = useQuery({
    queryKey: ['emailIntegration', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'gmail')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No integration found - this is expected for new users
            return null;
          }
          console.error('Error fetching email integration:', error);
          throw error;
        }
        return data;
      } catch (error) {
        console.error('Error in email integration query:', error);
        toast({
          title: "Error",
          description: "Failed to fetch email integration status. Please try again.",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: !!user,
  });

  const isEmailConnected = !!integrationData;
  const emailProvider = integrationData?.provider || null;
  const emailAddress = integrationData?.email || null;
  const isEmailSending = sendEmailMutation.isPending;
  
  // Fetch recent emails
  const { data: recentEmails = [] } = useQuery({
    queryKey: ['recent-emails', user?.id],
    queryFn: async () => {
      if (!user?.id || !isEmailConnected) return [];
      
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
    enabled: !!user?.id && isEmailConnected,
  });
  
  // Fetch email stats
  const { data: emailStats = { sent: 0, opened: 0, replied: 0 } } = useQuery({
    queryKey: ['email-stats', user?.id],
    queryFn: async () => {
      if (!user?.id || !isEmailConnected) return { sent: 0, opened: 0, replied: 0 };
      
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
    enabled: !!user?.id && isEmailConnected,
  });
  
  // Set a default notification count for now
  useEffect(() => {
    // We'll use a mock count until the table is created
    setNotificationCount(0);
  }, []);
  
  // Send email function
  const sendEmail = useCallback(async (params: SendEmailParams) => {
    if (!isEmailConnected) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your email account first",
      });
      return;
    }
    await sendEmailMutation.mutateAsync(params);
  }, [sendEmailMutation, isEmailConnected, toast]);
  
  // Sync contacts function
  const syncContacts = useCallback(async () => {
    if (!isEmailConnected) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your email account first",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke('sync-contacts', {
        body: {
          userId: user?.id
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      toast({
        title: "Success",
        description: "Contacts synced successfully",
      });
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync contacts",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, isEmailConnected, queryClient, toast]);
  
  // Sync emails function
  const syncEmails = useCallback(async () => {
    if (!isEmailConnected) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your email account first",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('sync-emails', {
        body: {
          userId: user?.id
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      
      toast({
        title: "Success",
        description: "Emails synced successfully",
      });
    } catch (error) {
      console.error('Error syncing emails:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync emails",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isEmailConnected, queryClient, toast]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  return (
    <EmailContext.Provider
      value={{
        isEmailConnected,
        emailProvider,
        emailAddress,
        isEmailSending,
        recentEmails,
        emailStats,
        sendEmail,
        syncContacts,
        isSyncing,
        notificationCount,
        isLoading,
        syncEmails,
        markNotificationAsRead,
      }}
    >
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