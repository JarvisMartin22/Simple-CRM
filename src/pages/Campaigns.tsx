
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Send, Edit, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const Campaigns: React.FC = () => {
  const campaigns = [
    { 
      id: 1, 
      name: 'Welcome Sequence', 
      status: 'active', 
      recipients: 248, 
      openRate: 62, 
      clickRate: 28, 
      lastSent: '2 days ago' 
    },
    { 
      id: 2, 
      name: 'Product Update', 
      status: 'scheduled', 
      recipients: 156, 
      openRate: 0, 
      clickRate: 0, 
      lastSent: 'Scheduled for Jun 8' 
    },
    { 
      id: 3, 
      name: 'Follow-up - Leads', 
      status: 'active', 
      recipients: 87, 
      openRate: 45, 
      clickRate: 18, 
      lastSent: '5 days ago' 
    },
    { 
      id: 4, 
      name: 'End of Year Offer', 
      status: 'draft', 
      recipients: 0, 
      openRate: 0, 
      clickRate: 0, 
      lastSent: 'Not sent' 
    },
  ];

  const templates = [
    { id: 1, name: 'Welcome Email', category: 'Onboarding' },
    { id: 2, name: 'Follow-up', category: 'Sales' },
    { id: 3, name: 'Meeting Request', category: 'Sales' },
    { id: 4, name: 'Thank You', category: 'Relationship' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-h1 font-semibold">Email Campaigns</h1>
        <Button className="bg-primary">
          <Plus size={18} className="mr-2" />
          <span>Create Campaign</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-h3 font-medium">Active Campaigns</h2>
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{campaign.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        campaign.status === 'active' ? 'bg-success' :
                        campaign.status === 'scheduled' ? 'bg-warning' :
                        'bg-muted-foreground'
                      }`}></span>
                      <span className="text-small text-muted-foreground capitalize">{campaign.status}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-danger">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-muted-foreground text-small">Recipients</p>
                    <p className="font-medium">{campaign.recipients}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-small">Last Sent</p>
                    <p className="font-medium">{campaign.lastSent}</p>
                  </div>
                  <div className="text-right">
                    {campaign.status !== 'draft' && (
                      <Button variant="outline" size="sm" className="text-small">
                        <Send size={14} className="mr-1" />
                        View Report
                      </Button>
                    )}
                    {campaign.status === 'draft' && (
                      <Button variant="outline" size="sm" className="text-small">
                        <Send size={14} className="mr-1" />
                        Send Preview
                      </Button>
                    )}
                  </div>
                </div>

                {campaign.status === 'active' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-small">
                        <span>Open rate</span>
                        <span>{campaign.openRate}%</span>
                      </div>
                      <Progress value={campaign.openRate} className="h-1.5 mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-small">
                        <span>Click rate</span>
                        <span>{campaign.clickRate}%</span>
                      </div>
                      <Progress value={campaign.clickRate} className="h-1.5 mt-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <h2 className="text-h3 font-medium">Templates</h2>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Email Templates</h3>
                <Button variant="outline" size="sm">
                  <Plus size={16} className="mr-1" />
                  New Template
                </Button>
              </div>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center p-3 bg-muted rounded-md">
                    <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-md flex items-center justify-center mr-3">
                      <Mail size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
                      <Edit size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 border border-dashed border-gray-300">
                View All Templates
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-small">Total Sent</span>
                    <span className="font-medium">1,248</span>
                  </div>
                  <Progress value={70} className="h-1.5 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-small">Open Rate (avg)</span>
                    <span className="font-medium">52%</span>
                  </div>
                  <Progress value={52} className="h-1.5 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-small">Click Rate (avg)</span>
                    <span className="font-medium">24%</span>
                  </div>
                  <Progress value={24} className="h-1.5 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-small">Response Rate</span>
                    <span className="font-medium">18%</span>
                  </div>
                  <Progress value={18} className="h-1.5 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
