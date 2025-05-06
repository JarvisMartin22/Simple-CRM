
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, ChevronDown, Copy, Edit, Eye, Filter, MoreHorizontal, Pause, Play, Plus, RefreshCw, Search, Send, Settings, Trash2, Users } from 'lucide-react';

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
  // Calculate summary metrics
  const totalCampaigns = campaignData.length;
  const activeCampaigns = campaignData.filter(c => c.status === 'Active').length;
  const totalSent = campaignData.reduce((sum, campaign) => sum + campaign.sent, 0);
  const totalOpened = campaignData.reduce((sum, campaign) => sum + campaign.opened, 0);
  const averageOpenRate = totalSent ? Math.round((totalOpened / totalSent) * 100) : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-medium">Campaigns</h1>
          <p className="text-gray-500 mt-1">Create and manage your email campaigns</p>
        </div>
        <Button className="bg-primary">
          <Plus size={16} className="mr-2" />
          <span>Create Campaign</span>
        </Button>
      </div>
      
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
                {campaignData.map((campaign) => (
                  <tr key={campaign.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <div>{campaign.name}</div>
                      <div className="text-xs text-gray-500">{campaign.schedule}</div>
                    </td>
                    <td className="px-4 py-3">{campaign.type}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        campaign.status === 'Active' ? 'default' : 
                        campaign.status === 'Draft' ? 'outline' :
                        campaign.status === 'Scheduled' ? 'secondary' :
                        campaign.status === 'Paused' ? 'outline' :
                        'outline'
                      } className={
                        campaign.status === 'Active' ? 'bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700' : 
                        campaign.status === 'Draft' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' :
                        campaign.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 hover:bg-blue-50' :
                        campaign.status === 'Paused' ? 'bg-amber-50 text-amber-700 hover:bg-amber-50' :
                        campaign.status === 'Completed' ? 'bg-gray-50 text-gray-700 hover:bg-gray-50' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {campaign.sent > 0 ? (
                        <div className="space-y-1 w-40">
                          <div className="flex justify-between text-xs">
                            <span>Open rate: {Math.round((campaign.opened / campaign.sent) * 100)}%</span>
                            <span>{campaign.opened} / {campaign.sent}</span>
                          </div>
                          <Progress value={(campaign.opened / campaign.sent) * 100} className="h-1" />
                          <div className="flex justify-between text-xs">
                            <span>Click rate: {Math.round((campaign.clicked / campaign.sent) * 100)}%</span>
                            <span>{campaign.clicked} / {campaign.sent}</span>
                          </div>
                          <Progress value={(campaign.clicked / campaign.sent) * 100} className="h-1" />
                        </div>
                      ) : (
                        <span className="text-gray-500">Not sent yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{campaign.lastSent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{typeof campaign.audienceSize === 'number' ? campaign.audienceSize.toLocaleString() : campaign.audienceSize}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {campaign.status === 'Active' && (
                              <DropdownMenuItem>
                                <Pause className="mr-2 h-4 w-4" />
                                <span>Pause</span>
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'Paused' && (
                              <DropdownMenuItem>
                                <Play className="mr-2 h-4 w-4" />
                                <span>Resume</span>
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'Draft' && (
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                <span>Send</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing <strong>{campaignData.length}</strong> of <strong>{campaignData.length}</strong> campaigns
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Campaigns;
