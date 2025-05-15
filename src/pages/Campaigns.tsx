import React, { useEffect } from 'react';
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

// Sample campaign data
const campaignData = [
  {
    id: 1,
    name: 'Q3 Newsletter - Software Solutions',
    type: 'Email',
    status: 'Active',
    sent: 3642,
    opened: 1824,
    clicked: 621,
    lastSent: 'Aug 2, 2025',
    schedule: 'One-time',
    audienceSize: 5000,
    progress: 73,
  },
  {
    id: 2,
    name: 'Product Update - New Features',
    type: 'Email',
    status: 'Draft',
    sent: 0,
    opened: 0,
    clicked: 0,
    lastSent: '-',
    schedule: 'Not scheduled',
    audienceSize: 4200,
    progress: 60,
  },
  {
    id: 3,
    name: 'Welcome Sequence - New Signups',
    type: 'Email Sequence',
    status: 'Active',
    sent: 856,
    opened: 723,
    clicked: 412,
    lastSent: 'Today',
    schedule: 'Automated',
    audienceSize: 'Auto',
    progress: 100,
  },
  {
    id: 4,
    name: 'Follow-up - Trade Show Leads',
    type: 'Email',
    status: 'Scheduled',
    sent: 0,
    opened: 0,
    clicked: 0,
    lastSent: '-',
    schedule: 'Aug 15, 2025',
    audienceSize: 320,
    progress: 100,
  },
  {
    id: 5,
    name: 'Summer Promotion - Limited Offer',
    type: 'Email',
    status: 'Completed',
    sent: 12500,
    opened: 8375,
    clicked: 3125,
    lastSent: 'July 15, 2025',
    schedule: 'One-time',
    audienceSize: 12500,
    progress: 100,
  },
  {
    id: 6,
    name: 'Customer Feedback Survey',
    type: 'Email',
    status: 'Paused',
    sent: 2800,
    opened: 1400,
    clicked: 840,
    lastSent: 'July 28, 2025',
    schedule: 'Paused',
    audienceSize: 8000,
    progress: 35,
  },
  {
    id: 7,
    name: 'Re-engagement Campaign - Inactive Users',
    type: 'Email Sequence',
    status: 'Active',
    sent: 5600,
    opened: 1680,
    clicked: 560,
    lastSent: 'Today',
    schedule: 'Weekly',
    audienceSize: 15000,
    progress: 37,
  },
];

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { isEmailConnected, emailStats, recentEmails } = useEmail();
  const { connectGmail, isConnecting, resetConnectionState } = useGmailConnect();
  
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
  
  const handleConnect = async () => {
    console.log('Campaign page: initiating Gmail connection');
    try {
      const success = await connectGmail();
      console.log('Campaign page: connection result:', success);
    } catch (error) {
      console.error('Campaign page: connection error:', error);
    }
  };
  
  // Calculate summary metrics
  const totalCampaigns = campaignData.length;
  const activeCampaigns = campaignData.filter(c => c.status === 'Active').length;
  const totalSent = isEmailConnected ? emailStats.sent : 0;
  const totalOpened = isEmailConnected ? emailStats.opened : 0;
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
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus size={16} className="mr-2" />
              <span>Create Campaign</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[720px] p-0">
            <EmailComposer />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Email Tracker - Show recent activity */}
      <EmailTracker />
      
      {/* Campaign Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Campaigns</CardDescription>
            <CardTitle className="text-2xl">{totalCampaigns}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <Badge variant="outline" className="bg-gray-50">{activeCampaigns} active</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Emails Sent</CardDescription>
            <CardTitle className="text-2xl">{totalSent.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">+8.3% vs last month</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Average Open Rate</CardDescription>
            <CardTitle className="text-2xl">{averageOpenRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <Badge variant="outline" className="bg-green-50 text-green-700">+2.1% vs industry</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Average Click Rate</CardDescription>
            <CardTitle className="text-2xl">12.5%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <Badge variant="outline" className="bg-green-50 text-green-700">+3.5% vs industry</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Campaign List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>All Campaigns</CardTitle>
              <CardDescription>Manage your email campaigns</CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Tabs defaultValue="all" className="w-[400px]">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search campaigns..." className="pl-8" />
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-1 h-4 w-4" />
                Filter
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <span>Sort by</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Name</DropdownMenuItem>
                  <DropdownMenuItem>Date Created</DropdownMenuItem>
                  <DropdownMenuItem>Status</DropdownMenuItem>
                  <DropdownMenuItem>Performance</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3">Campaign</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Performance</th>
                  <th scope="col" className="px-4 py-3">Last Sent</th>
                  <th scope="col" className="px-4 py-3">Audience</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Show recent emails as campaigns if available, otherwise show sample data */}
                {recentEmails.length > 0 ? (
                  recentEmails.map((email) => (
                    <tr key={email.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <div>{email.subject || 'No subject'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">Email</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={email.opened_at ? 'default' : 'secondary'}>
                          {email.opened_at ? 'Opened' : 'Sent'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-4">
                          <Progress value={email.opened_at ? 100 : 0} className="h-2 w-[60px]" />
                          <div className="text-xs text-gray-600">{email.opened_at ? 'Opened' : 'Pending'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(email.sent_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-7 w-7 mr-2">
                            <AvatarFallback>{email.recipient.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{email.recipient}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  campaignData.map((campaign) => (
                    <tr key={campaign.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <div>{campaign.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{campaign.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          campaign.status === 'Active' ? 'default' : 
                          campaign.status === 'Draft' ? 'secondary' : 
                          campaign.status === 'Completed' ? 'outline' : 
                          campaign.status === 'Scheduled' ? 'secondary' : 'destructive'
                        }>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-4">
                          <Progress value={campaign.progress} className="h-2 w-[60px]" />
                          <div className="text-xs text-gray-600">
                            {campaign.sent > 0 ? 
                              `${Math.round((campaign.opened / campaign.sent) * 100)}% open rate` : 
                              'Not sent yet'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {campaign.lastSent}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-xs">{typeof campaign.audienceSize === 'number' ? campaign.audienceSize.toLocaleString() : campaign.audienceSize}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            {campaign.status === 'Active' ? (
                              <DropdownMenuItem>
                                <Pause className="mr-2 h-4 w-4" />
                                <span>Pause</span>
                              </DropdownMenuItem>
                            ) : campaign.status === 'Paused' ? (
                              <DropdownMenuItem>
                                <Play className="mr-2 h-4 w-4" />
                                <span>Resume</span>
                              </DropdownMenuItem>
                            ) : campaign.status === 'Draft' || campaign.status === 'Scheduled' ? (
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                <span>Send Now</span>
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campaigns;
