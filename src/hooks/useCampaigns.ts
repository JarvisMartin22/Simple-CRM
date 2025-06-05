import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { supabaseWithAuth } from '@/lib/supabaseWithAuth';
import { useToast } from '@/components/ui/use-toast';
import type { ScheduleConfig } from '@/components/campaign/CampaignScheduler';
import { useBilling } from '@/contexts/BillingContext';

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
  const { tenant } = useBilling();

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First fetch campaigns
      const { data: campaignsData, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Then fetch analytics separately
      const campaignIds = (campaignsData || []).map(c => c.id);
      const { data: analyticsData } = await supabase
        .from('campaign_analytics')
        .select('*')
        .in('campaign_id', campaignIds);

      // Create a map for quick lookup
      const analyticsMap = new Map((analyticsData || []).map(a => [a.campaign_id, a]));

      // Transform data to include analytics as stats
      const campaignsWithStats = (campaignsData || []).map(campaign => {
        const analytics = analyticsMap.get(campaign.id);
        return {
          ...campaign,
          stats: {
            sent: analytics?.sent_count || 0,
            delivered: analytics?.delivered_count || 0,
            opened: analytics?.opened_count || 0,
            unique_opened: analytics?.unique_opened_count || 0,
            clicked: analytics?.clicked_count || 0,
            unique_clicked: analytics?.unique_clicked_count || 0,
            bounced: analytics?.bounced_count || 0,
            complained: analytics?.complained_count || 0,
            unsubscribed: analytics?.unsubscribed_count || 0
          }
        };
      });

      setCampaigns(campaignsWithStats);
      return campaignsWithStats;
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

      // Check if user can create campaigns
      if (!tenant?.can_use_campaigns) {
        toast({
          variant: "destructive",
          title: "Campaigns not available",
          description: "Your current plan doesn't include email campaigns. Please upgrade to access this feature.",
        });
        throw new Error('Campaigns not available on current plan');
      }

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

      // Keep schedule config separate from audience filter
      const schedule_config = campaign.schedule_config?.enabled ? {
        ...campaign.schedule_config
      } : null;

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

      // Create the campaign with proper audience_filter structure
      const campaignData = {
        user_id: user.id,
        name: campaign.name,
        description: campaign.description || null,
        type: campaign.type,
        template_id: campaign.template_id || null,
        status,
        scheduled_at: start_date,
        schedule_config: schedule_config,
        audience_filter: campaign.audience_filter ? {
          contacts: campaign.audience_filter.contacts.map(contact => ({
            id: contact.id,
            email: contact.email || null
          })),
          size: campaign.audience_filter.size
        } : null
      };

      console.log('Creating campaign with data:', campaignData);

      const { data, error: createError } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (createError) {
        console.error('Campaign creation error:', createError);
        console.error('Error details:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
        
        // Check for specific error types
        if (createError.code === '42501') {
          throw new Error('Permission denied. Please check your authentication.');
        } else if (createError.code === '23503') {
          throw new Error('Invalid template selected. Please choose a valid template.');
        } else if (createError.code === '23502') {
          throw new Error('Required field is missing. Please check all required fields.');
        }
        
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

      if (!data) {
        console.error('No data returned from campaign creation');
        throw new Error('Campaign was created but no data was returned');
      }

      console.log('Campaign created successfully:', data);
      
      setCampaigns(prev => [data, ...prev]);
      
      // Initialize campaign analytics
      try {
        const { error: analyticsError } = await supabase
          .from('campaign_analytics')
          .insert({
            campaign_id: data.id,
            total_recipients: campaign.audience_filter?.size || 0,
            sent_count: 0,
            delivered_count: 0,
            opened_count: 0,
            unique_opened_count: 0,
            clicked_count: 0,
            unique_clicked_count: 0,
            bounced_count: 0,
            complained_count: 0,
            unsubscribed_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (analyticsError) {
          console.error('Error initializing campaign analytics:', analyticsError);
        }
      } catch (err) {
        console.error('Failed to initialize campaign analytics:', err);
      }
      
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
  }, [toast, tenant]);

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

  const resetCampaignStatus = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'draft',
          started_at: null,
          completed_at: null,
          paused_at: null
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? { ...campaign, ...data } : campaign
      ));

      toast({
        title: 'Campaign reset',
        description: 'Campaign has been reset to draft status.',
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error resetting campaign',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const startCampaign = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_templates(
            id, 
            subject, 
            content
          )
        `)
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;
      if (!campaign) throw new Error('Campaign not found');

      // 2. Fetch the audience contacts
      let contacts = [];
      if (campaign.audience_filter && campaign.audience_filter.contacts) {
        contacts = campaign.audience_filter.contacts;
      } else {
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('id, email, first_name, last_name')
          .limit(100); // Safety limit

        if (contactsError) throw contactsError;
        contacts = contactsData || [];
      }

      if (!contacts.length) {
        throw new Error('No recipients found for this campaign');
      }

      // 3. Get email template content
      const template = campaign.campaign_templates;
      if (!template) {
        throw new Error('No template found for this campaign');
      }

      // 4. Check Gmail integration
      const { data: integrations, error: integrationsError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('provider', 'gmail')
        .single();

      if (integrationsError) {
        throw new Error('Gmail integration not found or not active. Please connect Gmail in the Integrations section.');
      }

      // 5. Update campaign status to running
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 6. Process emails by calling the send-email edge function for each recipient
      const emailPromises = contacts.map(async (contact, index) => {
        try {
          // Add a small delay between each email to avoid rate limiting
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Process variables in subject and body
          const personalizedSubject = template.subject
            .replace(/{{first_name}}/g, contact.first_name || '')
            .replace(/{{last_name}}/g, contact.last_name || '')
            .replace(/{{email}}/g, contact.email || '');

          const personalizedBody = template.content
            .replace(/{{first_name}}/g, contact.first_name || '')
            .replace(/{{last_name}}/g, contact.last_name || '')
            .replace(/{{email}}/g, contact.email || '');

          console.log(`Sending email to ${contact.email}...`);

          // Call the enhanced send-email edge function with better error handling
          const response = await supabaseWithAuth.functions.invoke('send-email-enhanced', {
            body: {
              userId: campaign.user_id,
              to: contact.email,
              subject: personalizedSubject,
              html: personalizedBody,
              campaign_id: id,
              contact_id: contact.id,
              trackOpens: true,
              trackClicks: true,
              trackSections: false // Can be enabled when using section-based templates
            }
          });

          // Check for Edge Function errors
          if (response.error) {
            console.error(`Edge Function error for ${contact.email}:`, response.error);
            
            // Handle specific error types
            if (response.error.message?.includes('Gmail integration not found')) {
              throw new Error('Gmail integration not found or not active. Please reconnect Gmail in the Integrations section.');
            } else if (response.error.message?.includes('Failed to refresh')) {
              throw new Error('Failed to refresh Gmail token. Please reconnect Gmail in the Integrations section.');
            } else if (response.error.message?.includes('Failed to send email')) {
              throw new Error(`Failed to send email to ${contact.email}: ${response.error.message}`);
            } else {
              throw new Error(`Email service error: ${response.error.message}`);
            }
          }

          // Check the response data for success
          if (!response.data || !response.data.success) {
            console.error(`Send email failed for ${contact.email}:`, response.data);
            throw new Error(`Failed to send email to ${contact.email}: ${response.data?.error || 'Unknown error'}`);
          }

          console.log(`Successfully sent email to ${contact.email}`);
          return { contact, success: true, emailId: response.data.email_id };

        } catch (error) {
          console.error(`Error processing email for ${contact.email}:`, error);
          return { 
            contact, 
            success: false, 
            error: error.message || 'Unknown error occurred'
          };
        }
      });

      const results = await Promise.all(emailPromises);
      
      // 7. Calculate success rate and update analytics
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const totalCount = results.length;
      const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

      // Collect error details for failed emails
      const failedEmails = results.filter(r => !r.success);
      const errorSummary = failedEmails.reduce((acc, result) => {
        const errorType = result.error?.includes('Gmail integration') ? 'gmail_integration' :
                         result.error?.includes('Failed to refresh') ? 'token_expired' :
                         result.error?.includes('Failed to send') ? 'send_failed' :
                         'unknown';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Campaign execution results:', {
        total: totalCount,
        successful: successCount,
        failed: failedCount,
        successRate,
        errorSummary
      });

      await supabase
        .from('campaign_analytics')
        .update({
          total_recipients: totalCount,
          sent_count: successCount,
          delivered_count: successCount, // Assume all sent are delivered for now
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', id);

      // 8. Update campaign status based on results
      let finalStatus: Campaign['status'] = 'completed';
      if (successCount === 0) {
        finalStatus = 'failed';
      }
      // For partial success, we still mark as completed but will show a warning toast

      const { error: finalUpdateError } = await supabase
        .from('campaigns')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (finalUpdateError) {
        console.error('Error updating campaign final status:', finalUpdateError);
      }

      // 9. Update the local state
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: finalStatus, completed_at: new Date().toISOString() } : c
      ));

      // 10. Show detailed success/error messages
      if (successCount === totalCount) {
        toast({
          title: 'Campaign completed successfully',
          description: `Successfully sent ${successCount} emails.`,
        });
      } else if (successCount > 0) {
        // Partial success - provide details about failures
        let errorMessage = `Sent ${successCount} out of ${totalCount} emails.`;
        if (errorSummary.gmail_integration > 0) {
          errorMessage += ` ${errorSummary.gmail_integration} failed due to Gmail integration issues.`;
        }
        if (errorSummary.token_expired > 0) {
          errorMessage += ` ${errorSummary.token_expired} failed due to expired tokens.`;
        }
        if (errorSummary.send_failed > 0) {
          errorMessage += ` ${errorSummary.send_failed} failed during sending.`;
        }
        
        toast({
          title: 'Campaign partially completed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        // Complete failure
        let errorMessage = 'Failed to send any emails.';
        if (errorSummary.gmail_integration > 0) {
          errorMessage += ' Please check your Gmail integration in Settings.';
        } else if (errorSummary.token_expired > 0) {
          errorMessage += ' Please reconnect your Gmail account in Settings.';
        }
        
        toast({
          title: 'Campaign failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      return {
        success: true,
        sent: successCount,
        total: totalCount,
        successRate
      };
    } catch (err: any) {
      console.error('Campaign execution error:', err);
      setError(err.message);
      
      // Update campaign status to failed
      try {
        await supabase
          .from('campaigns')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', id);
          
        setCampaigns(prev => prev.map(c => 
          c.id === id ? { ...c, status: 'failed', completed_at: new Date().toISOString() } : c
        ));
      } catch (updateErr) {
        console.error('Error updating campaign status to failed:', updateErr);
      }

      toast({
        title: 'Error running campaign',
        description: err.message,
        variant: 'destructive',
      });
      
      return {
        success: false,
        error: err.message
      };
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
    resetCampaignStatus,
    startCampaign
  };
}; 