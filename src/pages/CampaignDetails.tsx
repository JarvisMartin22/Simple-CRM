import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Pause, Play, Send, Loader2, RefreshCw } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import CampaignAnalyticsDashboard from '@/components/analytics/CampaignAnalyticsDashboard';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const {
    campaigns,
    loading,
    fetchCampaigns,
    pauseCampaign,
    resumeCampaign,
    startCampaign,
    resetCampaignStatus
  } = useCampaigns();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const campaign = campaigns.find(c => c.id === id);

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  const handlePauseResume = async () => {
    if (campaign.status === 'running') {
      await pauseCampaign(campaign.id);
    } else if (campaign.status === 'paused') {
      await resumeCampaign(campaign.id);
    }
  };

  const handleStartCampaign = async () => {
    if (!campaign.template_id) {
      toast({
        title: "Missing template",
        description: "This campaign doesn't have an email template. Please edit the campaign to add a template.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsStarting(true);
      const result = await startCampaign(campaign.id);
      
      if (!result.success) {
        toast({
          title: "Error starting campaign",
          description: result.error || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error starting campaign",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleResetCampaign = async () => {
    try {
      setIsResetting(true);
      await resetCampaignStatus(campaign.id);
    } catch (error: any) {
      toast({
        title: "Error resetting campaign",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleTestSendEmail = async () => {
    if (!campaign?.template_id) {
      toast({
        title: 'Error',
        description: 'This campaign does not have a template assigned',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsStarting(true);
      
      // First, fetch the template data
      const { data: template, error: templateError } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('id', campaign.template_id)
        .single();

      if (templateError || !template) {
        toast({
          title: 'Error',
          description: 'Campaign template not found in database',
          variant: 'destructive',
        });
        return;
      }

      // Test with a sample email
      const testEmail = 'test@example.com';
      
      console.log('Testing send-email function with template:', template.name);
      
      const response = await supabase.functions.invoke('send-email', {
        body: {
          userId: campaign.user_id,
          to: testEmail,
          subject: `Test: ${template.subject}`,
          html: template.content,
          campaign_id: campaign.id,
          contact_id: 'test-contact-id',
          trackOpens: true,
          trackClicks: true
        }
      });

      console.log('Send-email test response:', response);

      if (response.error) {
        console.error('Send-email test error:', response.error);
        toast({
          title: 'Email Function Test Failed',
          description: response.error.message || 'Unknown error',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email Function Test Successful',
          description: 'The email sending function is working correctly',
        });
      }
    } catch (error) {
      console.error('Test send email error:', error);
      toast({
        title: 'Test Failed',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/campaigns')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {campaign.status === 'draft' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartCampaign}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Start Campaign
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestSendEmail}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Test Email Function
                    </>
                  )}
                </Button>
              </>
            )}
            {(campaign.status === 'failed' || campaign.status === 'completed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCampaign}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Draft
                  </>
                )}
              </Button>
            )}
            {(campaign.status === 'running' || campaign.status === 'paused') && (
              <Button
                variant={campaign.status === 'running' ? 'destructive' : 'default'}
                size="sm"
                onClick={handlePauseResume}
              >
                {campaign.status === 'running' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Campaign
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Campaign
                  </>
                )}
              </Button>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-4">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Status:</div>
          <div className="capitalize">{campaign.status}</div>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <CampaignAnalyticsDashboard campaignId={campaign.id} />
        </TabsContent>

        <TabsContent value="settings">
          {/* Campaign settings content */}
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/app/campaigns/edit/${campaign.id}`)}
            >
              Edit Campaign
            </Button>
            
            {campaign.status === 'failed' && (
              <div className="bg-red-50 p-4 rounded-md border border-red-200 text-sm mt-4">
                <p className="font-medium text-red-800">Campaign Failed</p>
                <p className="text-red-700 mt-1">
                  This campaign failed during execution. You can reset it to draft status to try again.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignDetails; 