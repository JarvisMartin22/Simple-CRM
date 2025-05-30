import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { ScheduleConfig } from '@/components/campaign/CampaignScheduler';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'one_time' | 'automated' | 'sequence';
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

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      // Calculate status based on schedule
      const status = campaign.schedule_config?.enabled ? 'scheduled' : 'draft';
      
      // Convert schedule config to start_date
      const start_date = campaign.schedule_config?.enabled && campaign.schedule_config.startDate
        ? new Date(
            campaign.schedule_config.startDate.setHours(
              parseInt(campaign.schedule_config.startTime?.split(':')[0] || '0'),
              parseInt(campaign.schedule_config.startTime?.split(':')[1] || '0')
            )
          ).toISOString()
        : null;

      // Calculate end_date based on campaign type and schedule
      let end_date = null;
      if (campaign.schedule_config?.enabled && campaign.schedule_config.recurringSchedule) {
        const { frequency, interval } = campaign.schedule_config.recurringSchedule;
        const startDate = new Date(start_date!);
        
        switch (frequency) {
          case 'daily':
            end_date = new Date(startDate.setDate(startDate.getDate() + interval)).toISOString();
            break;
          case 'weekly':
            end_date = new Date(startDate.setDate(startDate.getDate() + (interval * 7))).toISOString();
            break;
          case 'monthly':
            end_date = new Date(startDate.setMonth(startDate.getMonth() + interval)).toISOString();
            break;
        }
      }

      // Combine schedule config and audience filter into one JSONB object
      const schedule_config = campaign.schedule_config?.enabled ? JSON.stringify({
        ...campaign.schedule_config,
        audience: campaign.audience_filter ? {
          contacts: campaign.audience_filter.contacts.map(contact => ({
            id: contact.id,
            email: contact.email || null
          })),
          size: campaign.audience_filter.size
        } : null
      }) : null;

      // First, verify that the template exists if template_id is provided
      if (campaign.template_id) {
        const { data: template, error: templateError } = await supabase
          .from('campaign_templates')
          .select('id')
          .eq('id', campaign.template_id)
          .single();

        if (templateError || !template) {
          throw new Error('Invalid template_id or template not found');
        }
      }

      // Create the campaign
      const { data, error: createError } = await supabase
        .from('campaigns')
        .insert([{
          user_id: user.id,
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          template_id: campaign.template_id || null,
          status,
          scheduled_at: start_date,
          schedule_config,
          audience_filter: campaign.audience_filter
        }])
        .select()
        .single();

      if (createError) {
        console.error('Campaign creation error:', createError);
        throw createError;
      }

      // If it's a sequence campaign with scheduling enabled, create the sequence entries
      if (campaign.type === 'sequence' && campaign.schedule_config?.enabled && campaign.schedule_config.recurringSchedule) {
        const { frequency, interval, daysOfWeek, timeOfDay } = campaign.schedule_config.recurringSchedule;
        const sequences = [];
        let currentDate = new Date(start_date!);

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
      console.error('Campaign creation error:', err);
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

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));

      toast({
        title: 'Campaign deleted',
        description: 'Successfully deleted campaign.',
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error deleting campaign',
        description: err.message,
        variant: 'destructive',
      });
      return false;
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
    deleteCampaign,
  };
}; 