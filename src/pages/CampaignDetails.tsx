import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import CampaignAnalyticsDashboard from '@/components/analytics/CampaignAnalyticsDashboard';

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    campaigns,
    loading,
    fetchCampaigns,
    pauseCampaign,
    resumeCampaign,
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignDetails; 