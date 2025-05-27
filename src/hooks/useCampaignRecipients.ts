import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  email: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  bounced_at?: string;
  email_tracking_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export const useCampaignRecipients = (campaignId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRecipients = useCallback(async () => {
    if (!campaignId) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('campaign_recipients')
        .select(`
          *,
          contacts:contact_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching recipients',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const addRecipients = useCallback(async (recipients: Array<{ contact_id: string; email: string }>) => {
    if (!campaignId) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const recipientsWithCampaignId = recipients.map(recipient => ({
        ...recipient,
        campaign_id: campaignId,
        status: 'pending',
      }));
      
      const { data, error: createError } = await supabase
        .from('campaign_recipients')
        .insert(recipientsWithCampaignId)
        .select();
      
      if (createError) throw createError;
      
      toast({
        title: 'Recipients added',
        description: `Successfully added ${recipients.length} recipients to the campaign.`,
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error adding recipients',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const updateRecipient = useCallback(async (recipientId: string, updates: Partial<CampaignRecipient>) => {
    if (!campaignId) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('campaign_recipients')
        .update(updates)
        .eq('id', recipientId)
        .eq('campaign_id', campaignId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error updating recipient',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const removeRecipient = useCallback(async (recipientId: string) => {
    if (!campaignId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('campaign_recipients')
        .delete()
        .eq('id', recipientId)
        .eq('campaign_id', campaignId);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: 'Recipient removed',
        description: 'Successfully removed recipient from the campaign.',
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error removing recipient',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  return {
    loading,
    error,
    fetchRecipients,
    addRecipients,
    updateRecipient,
    removeRecipient,
  };
}; 