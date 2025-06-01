import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const TestCampaignCreation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string, data?: any) => {
    const logMessage = data ? `${message}: ${JSON.stringify(data, null, 2)}` : message;
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logMessage}`]);
    console.log(message, data);
  };

  const testCampaignCreation = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      // Step 1: Check authentication
      addLog('Step 1: Checking authentication');
      if (!user) {
        addLog('❌ No authenticated user found');
        toast({
          title: 'Authentication Error',
          description: 'Please log in to create campaigns',
          variant: 'destructive',
        });
        return;
      }
      addLog('✅ Authenticated as', { email: user.email, id: user.id });

      // Step 2: Test minimal campaign creation
      addLog('Step 2: Creating minimal test campaign');
      const testCampaign = {
        user_id: user.id,
        name: `Test Campaign ${new Date().toISOString()}`,
        type: 'one_time' as const,
        status: 'draft' as const,
        description: 'Test campaign for debugging',
      };
      
      addLog('Campaign data to insert', testCampaign);

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert([testCampaign])
        .select()
        .single();

      if (campaignError) {
        addLog('❌ Campaign creation failed', {
          error: campaignError.message,
          code: campaignError.code,
          details: campaignError.details,
          hint: campaignError.hint
        });
        
        toast({
          title: 'Campaign Creation Failed',
          description: campaignError.message,
          variant: 'destructive',
        });
        return;
      }

      addLog('✅ Campaign created successfully', campaignData);

      // Step 3: Check if analytics were created
      addLog('Step 3: Checking if analytics were auto-created');
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignData.id)
        .single();

      if (analyticsError) {
        addLog('❌ No analytics found', analyticsError.message);
      } else {
        addLog('✅ Analytics auto-created', analyticsData);
      }

      // Step 4: Test campaign with audience
      addLog('Step 4: Creating campaign with audience');
      const campaignWithAudience = {
        user_id: user.id,
        name: `Campaign with Audience ${new Date().toISOString()}`,
        type: 'one_time' as const,
        status: 'draft' as const,
        audience_filter: {
          contacts: [
            { id: 'contact-1', email: 'test1@example.com' },
            { id: 'contact-2', email: 'test2@example.com' }
          ],
          size: 2
        }
      };

      const { data: audienceCampaign, error: audienceError } = await supabase
        .from('campaigns')
        .insert([campaignWithAudience])
        .select()
        .single();

      if (audienceError) {
        addLog('❌ Campaign with audience failed', audienceError);
      } else {
        addLog('✅ Campaign with audience created', audienceCampaign);
      }

      // Step 5: Clean up test campaigns (but leave the audience campaign for testing)
      addLog('Step 5: Cleaning up basic test campaign (keeping audience campaign for testing)');
      
      if (campaignData?.id) {
        const { error: deleteError } = await supabase
          .from('campaigns')
          .delete()
          .eq('id', campaignData.id);
          
        if (deleteError) {
          addLog('⚠️ Basic campaign cleanup failed', deleteError);
        } else {
          addLog('✅ Basic test campaign cleaned up');
        }
      }
      
      if (audienceCampaign?.id) {
        addLog(`✅ Audience campaign ${audienceCampaign.id} left for testing email functionality`);
      }

      toast({
        title: 'Test Complete',
        description: 'Check the logs below for details',
      });

    } catch (error) {
      addLog('❌ Unexpected error', error);
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingCampaigns = async () => {
    addLog('Checking existing campaigns...');
    const { data, error, count } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .limit(5)
      .order('created_at', { ascending: false });

    if (error) {
      addLog('❌ Error fetching campaigns', error);
    } else {
      addLog(`Found ${count} total campaigns`);
      if (data && data.length > 0) {
        addLog('Recent campaigns:', data);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Creation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testCampaignCreation} disabled={loading}>
              {loading ? 'Testing...' : 'Test Campaign Creation'}
            </Button>
            <Button onClick={checkExistingCampaigns} variant="outline">
              Check Existing Campaigns
            </Button>
            <Button onClick={() => setLogs([])} variant="outline">
              Clear Logs
            </Button>
          </div>

          {user && (
            <div className="text-sm text-muted-foreground">
              Logged in as: {user.email} (ID: {user.id})
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Logs:</h3>
            <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet. Click a button to start testing.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">{log}</div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestCampaignCreation;