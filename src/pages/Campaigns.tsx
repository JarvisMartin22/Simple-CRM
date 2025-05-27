import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, ChevronDown, Copy, Edit, Eye, Filter, MoreHorizontal, Pause, Play, Plus, RefreshCw, Search, Send, Settings, Trash2, Users, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { useEmail } from '@/contexts/EmailContext';
import { EmailTracker } from '@/components/email/EmailTracker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmailComposer } from '@/components/email/EmailComposer';
import { useNavigate } from 'react-router-dom';
import { useGmailConnect } from '@/hooks/useGmailConnect';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignTemplates } from '@/hooks/useCampaignTemplates';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { isEmailConnected, emailStats, recentEmails } = useEmail();
  const { connectGmail, isConnecting, resetConnectionState } = useGmailConnect();
  const { loading: campaignsLoading, error: campaignsError, fetchCampaigns } = useCampaigns();
  const { loading: templatesLoading, error: templatesError, fetchTemplates } = useCampaignTemplates();
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle connection timeout
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (isConnecting) {
      // If connecting takes more than 2 minutes, reset the state
      timeoutId = window.setTimeout(() => {
        console.log('Connection timeout - resetting state');
        resetConnectionState();
      }, 2 * 60 * 1000);
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isConnecting, resetConnectionState]);
  
  // Fetch campaigns and templates
  useEffect(() => {
    const loadData = async () => {
      if (isEmailConnected) {
        const campaignsData = await fetchCampaigns();
        const templatesData = await fetchTemplates();
        
        setCampaigns(campaignsData || []);
        setTemplates(templatesData || []);
      }
    };
    
    loadData();
  }, [isEmailConnected, fetchCampaigns, fetchTemplates]);
  
  const handleConnect = async () => {
    console.log('Campaign page: initiating Gmail connection');
    try {
      const success = await connectGmail();
      console.log('Campaign page: connection result:', success);
    } catch (error) {
      console.error('Campaign page: connection error:', error);
    }
  };
  
  // Filter campaigns based on search query and active tab
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || campaign.status.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });
  
  // Calculate summary metrics
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
  const averageOpenRate = totalSent ? Math.round((totalOpened / totalSent) * 100) : 0;
  
  if (!isEmailConnected) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-h1 font-medium">Campaigns</h1>
            <p className="text-gray-500 mt-1">Create and manage your email campaigns</p>
          </div>
        </div>
        
        <Card className="p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Mail className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Connect Your Email</h3>
            <p className="mb-4 mt-2 text-muted-foreground">
              You need to connect your email account to use the campaign features.
            </p>
            <Button 
              className="mt-4" 
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Email
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-medium">Campaigns</h1>
          <p className="text-gray-500 mt-1">Create and manage your email campaigns</p>
        </div>
        <Button onClick={() => navigate('/campaigns/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {activeCampaigns} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">
              across all campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageOpenRate}%</div>
            <p className="text-xs text-muted-foreground">
              average across campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              reusable templates
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" onClick={() => {
          fetchCampaigns();
          fetchTemplates();
        }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {campaignsLoading ? (
            <Card className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading campaigns...</p>
            </Card>
          ) : campaignsError ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="mt-2 text-destructive">{campaignsError}</p>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No campaigns found</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  Get started by creating your first campaign
                </p>
                <Button onClick={() => navigate('/campaigns/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </Card>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 cursor-pointer" onClick={() => navigate(`/app/campaigns/${campaign.id}`)}>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {campaign.type} • Last updated {new Date(campaign.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        campaign.status === 'active' ? 'default' :
                        campaign.status === 'completed' ? 'secondary' :
                        campaign.status === 'draft' ? 'outline' :
                        'destructive'
                      }
                    >
                      {campaign.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/app/campaigns/${campaign.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/app/campaigns/${campaign.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {campaign.status === 'active' ? (
                          <DropdownMenuItem>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        ) : campaign.status === 'paused' ? (
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>Progress</div>
                    <div>{campaign.stats?.sent || 0}/{campaign.audience_filter?.size || 0} sent</div>
                  </div>
                  <Progress value={
                    campaign.audience_filter?.size
                      ? (campaign.stats?.sent || 0) / campaign.audience_filter.size * 100
                      : 0
                  } className="mt-2" />
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Sent</div>
                    <div className="mt-1 font-medium">{campaign.stats?.sent || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Opened</div>
                    <div className="mt-1 font-medium">{campaign.stats?.opened || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Clicked</div>
                    <div className="mt-1 font-medium">{campaign.stats?.clicked || 0}</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Campaigns;
