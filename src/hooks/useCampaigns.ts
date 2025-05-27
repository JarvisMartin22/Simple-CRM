import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { ScheduleConfig } from '@/components/campaign/CampaignScheduler';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'one-time' | 'sequence';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  template_id?: string;
  audience_filter?: {
    contacts: Array<{ id: string; email?: string }>;
    size: number;
  };
  schedule_config?: ScheduleConfig;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  paused_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCampaigns(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching campaigns',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCampaign = useCallback(async (campaign: Omit<Campaign, 'id' | 'user_id' | 'status'>) => {
    try {
      setLoading(true);
      setError(null);

      const status = campaign.schedule_config?.enabled ? 'scheduled' : 'draft';
      const scheduled_at = campaign.schedule_config?.enabled && campaign.schedule_config.startDate
        ? new Date(
            campaign.schedule_config.startDate.setHours(
              parseInt(campaign.schedule_config.startTime?.split(':')[0] || '0'),
              parseInt(campaign.schedule_config.startTime?.split(':')[1] || '0')
            )
          ).toISOString()
        : null;

      const { data, error: createError } = await supabase
        .from('campaigns')
        .insert([{
          ...campaign,
          status,
          scheduled_at,
        }])
        .select()
        .single();

      if (createError) throw createError;

      // If it's a sequence campaign with scheduling enabled, create the sequence entries
      if (campaign.type === 'sequence' && campaign.schedule_config?.enabled && campaign.schedule_config.recurringSchedule) {
        const { frequency, interval, daysOfWeek, timeOfDay } = campaign.schedule_config.recurringSchedule;
        const sequences = [];
        let currentDate = new Date(scheduled_at!);

        // Generate the next 10 sequences
        for (let i = 1; i <= 10; i++) {
          switch (frequency) {
            case 'daily':
              currentDate = new Date(currentDate.setDate(currentDate.getDate() + interval));
              break;
            case 'weekly':
              if (daysOfWeek?.length) {
                // Find the next occurrence of any selected day
                let found = false;
                while (!found) {
                  currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
                  if (daysOfWeek.includes(currentDate.getDay())) {
                    found = true;
                  }
                }
              } else {
                currentDate = new Date(currentDate.setDate(currentDate.getDate() + (interval * 7)));
              }
              break;
            case 'monthly':
              currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + interval));
              break;
          }

          if (timeOfDay) {
            const [hours, minutes] = timeOfDay.split(':');
            currentDate.setHours(parseInt(hours), parseInt(minutes));
          }

          sequences.push({
            campaign_id: data.id,
            sequence_number: i,
            scheduled_at: currentDate.toISOString(),
          });
        }

        const { error: sequenceError } = await supabase
          .from('campaign_sequences')
          .insert(sequences);

        if (sequenceError) throw sequenceError;
      }

      setCampaigns(prev => [data, ...prev]);
      toast({
        title: 'Campaign created',
        description: 'Successfully created new campaign.',
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error creating campaign',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    try {
      setLoading(true);
      setError(null);

      // Update scheduled_at if schedule_config is being updated
      if (updates.schedule_config) {
        updates.scheduled_at = updates.schedule_config.enabled && updates.schedule_config.startDate
          ? new Date(
              updates.schedule_config.startDate.setHours(
                parseInt(updates.schedule_config.startTime?.split(':')[0] || '0'),
                parseInt(updates.schedule_config.startTime?.split(':')[1] || '0')
              )
            ).toISOString()
          : null;
        updates.status = updates.schedule_config.enabled ? 'scheduled' : 'draft';
      }

      const { data, error: updateError } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? { ...campaign, ...data } : campaign
      ));

      toast({
        title: 'Campaign updated',
        description: 'Successfully updated campaign.',
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error updating campaign',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const pauseCampaign = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? { ...campaign, ...data } : campaign
      ));

      toast({
        title: 'Campaign paused',
        description: 'Successfully paused campaign.',
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error pausing campaign',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resumeCampaign = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'running',
          paused_at: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? { ...campaign, ...data } : campaign
      ));

      toast({
        title: 'Campaign resumed',
        description: 'Successfully resumed campaign.',
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error resuming campaign',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    pauseCampaign,
    resumeCampaign,
  };
}; 