import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useGmailDisconnect() {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const disconnectGmail = async (integrationId: string) => {
    if (!integrationId) {
      toast({
        title: "No integration found",
        description: "There's no Gmail integration to disconnect.",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setIsDisconnecting(true);
      
      // Delete the integration from the database
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integrationId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Gmail disconnected",
        description: "Your Gmail account has been disconnected from the CRM.",
      });
      
      // Invalidate all queries that might depend on email connection
      queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
      queryClient.invalidateQueries({ queryKey: ['email-integration'] });
      queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      
      console.log('Integration disconnected, ID:', integrationId);
      
      return true;
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      
      toast({
        title: "Disconnection failed",
        description: "There was an error disconnecting from Gmail.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  return { disconnectGmail, isDisconnecting };
} 