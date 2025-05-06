
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BarChart3, CalendarIcon, Check, ChevronDown, Clock, DollarSign, Filter, MoreHorizontal, Plus, User } from 'lucide-react';

// Sample data for pipeline stages and deals
const pipelineData = [
  {
    id: 'lead',
    name: 'Lead',
    deals: [
      { 
        id: 1, 
        title: 'Website Redesign Project', 
        company: 'Acme Inc', 
        value: 12000, 
        probability: 20, 
        contact: 'Sarah Johnson',
        contactAvatar: null,
        dueDate: 'Aug 15, 2025',
        age: '3 days',
        tags: ['Web Design', 'New Lead']
      },
      { 
        id: 2, 
        title: 'Marketing Automation Tool', 
        company: 'Tech Solutions', 
        value: 8500, 
        probability: 10, 
        contact: 'James Wilson',
        contactAvatar: null,
        dueDate: 'Aug 18, 2025',
        age: '5 days',
        tags: ['Software', 'Marketing']
      },
      { 
        id: 3, 
        title: 'Digital Transformation Consultation', 
        company: 'Global Retail Inc', 
        value: 45000, 
        probability: 15, 
        contact: 'Emma Davis',
        contactAvatar: null,
        dueDate: 'Aug 22, 2025',
        age: '1 day',
        tags: ['Consulting', 'Enterprise']
      },
    ]
  },
  {
    id: 'meeting',
    name: 'Meeting',
    deals: [
      { 
        id: 4, 
        title: 'Cloud Migration Services', 
        company: 'Logistics Pro', 
        value: 32000, 
        probability: 40, 
        contact: 'Michael Brown',
        contactAvatar: null,
        dueDate: 'Aug 14, 2025',
        age: '10 days',
        tags: ['Cloud', 'Infrastructure']
      },
      { 
        id: 5, 
        title: 'Mobile App Development', 
        company: 'FinTech Startup', 
        value: 28500, 
        probability: 35, 
        contact: 'Jessica Lee',
        contactAvatar: null,
        dueDate: 'Aug 17, 2025',
        age: '7 days',
        tags: ['Mobile', 'Development']
      },
    ]
  },
  {
    id: 'proposal',
    name: 'Proposal',
    deals: [
      { 
        id: 6, 
        title: 'Annual IT Support Contract', 
        company: 'City Hospital', 
        value: 54000, 
        probability: 65, 
        contact: 'Robert Chen',
        contactAvatar: null,
        dueDate: 'Aug 12, 2025',
        age: '14 days',
        tags: ['Service Contract', 'Healthcare']
      },
      { 
        id: 7, 
        title: 'Data Analytics Platform', 
        company: 'Research Institute', 
        value: 76000, 
        probability: 55, 
        contact: 'Amanda Walsh',
        contactAvatar: null,
        dueDate: 'Aug 16, 2025',
        age: '12 days',
        tags: ['Analytics', 'Big Data']
      },
    ]
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    deals: [
      { 
        id: 8, 
        title: 'E-commerce Platform Integration', 
        company: 'Fashion Retailers Ltd', 
        value: 64000, 
        probability: 80, 
        contact: 'Daniel Martinez',
        contactAvatar: null,
        dueDate: 'Aug 10, 2025',
        age: '21 days',
        tags: ['E-commerce', 'Integration']
      },
    ]
  },
  {
    id: 'closed',
    name: 'Closed',
    deals: [
      { 
        id: 9, 
        title: 'HR Management System', 
        company: 'Manufacturing Co', 
        value: 42000, 
        probability: 100, 
        contact: 'Olivia Taylor',
        contactAvatar: null,
        dueDate: 'Completed Aug 5',
        age: '32 days',
        tags: ['HR', 'Software', 'Closed Won']
      },
      { 
        id: 10, 
        title: 'Security Assessment', 
        company: 'Finance Corp', 
        value: 15000, 
        probability: 0, 
        contact: 'William Johnson',
        contactAvatar: null,
        dueDate: 'Lost Aug 3',
        age: '18 days',
        tags: ['Security', 'Closed Lost']
      },
    ]
  }
];

const Pipelines: React.FC = () => {
  // Calculate totals
  const totalDeals = pipelineData.reduce((sum, stage) => sum + stage.deals.length, 0);
  const totalValue = pipelineData.reduce((sum, stage) => 
    sum + stage.deals.reduce((stageSum, deal) => stageSum + deal.value, 0), 0);
  
  // Calculate value by stage for the pipeline summary
  const stageValues = pipelineData.map(stage => ({
    name: stage.name,
    count: stage.deals.length,
    value: stage.deals.reduce((sum, deal) => sum + deal.value, 0),
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-medium">Pipelines</h1>
          <p className="text-gray-500 mt-1">Manage and track your sales pipeline</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus size={16} className="mr-2" />
                <span>Add Deal</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
                <DialogDescription>
                  Enter the details of the new deal below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Deal Name</label>
                  <Input id="title" placeholder="Enter deal title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="company" className="text-sm font-medium">Company</label>
                    <Input id="company" placeholder="Select or create company" />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="value" className="text-sm font-medium">Value</label>
                    <Input id="value" placeholder="$0.00" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="contact" className="text-sm font-medium">Primary Contact</label>
                  <Input id="contact" placeholder="Select or create contact" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="stage" className="text-sm font-medium">Pipeline Stage</label>
                    <select id="stage" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="lead">Lead</option>
                      <option value="meeting">Meeting</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="probability" className="text-sm font-medium">Probability (%)</label>
                    <Input id="probability" placeholder="0%" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create Deal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Pipeline Overview Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pipeline Overview</CardTitle>
              <CardDescription>Current deals and projections</CardDescription>
            </div>
            <Tabs defaultValue="all-pipelines" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="all-pipelines">All Pipelines</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="marketing">Marketing</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap -mx-4">
            <div className="w-1/3 px-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Total Deals</h3>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-semibold">{totalDeals}</span>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                    +3 this month
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="w-1/3 px-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Pipeline Value</h3>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-semibold">${totalValue.toLocaleString()}</span>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                    +12% vs last month
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="w-1/3 px-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Forecasted Close</h3>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-semibold">${(totalValue * 0.6).toLocaleString()}</span>
                  <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700">
                    60% probability
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Pipeline Stages</h3>
            {stageValues.map((stage) => (
              <div key={stage.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-gray-500">{stage.count} deals · ${stage.value.toLocaleString()}</span>
                </div>
                <Progress value={(stage.value / totalValue) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Pipeline Board */}
      <div className="flex space-x-2 mb-4">
        <div className="flex-1">
          <Input placeholder="Search deals..." className="w-[300px]" />
        </div>
        <Button variant="outline" className="flex items-center">
          <Filter size={16} className="mr-2" />
          <span>Filter</span>
        </Button>
        <Button variant="outline" className="flex items-center">
          <BarChart3 size={16} className="mr-2" />
          <span>Reports</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <span>View</span>
              <ChevronDown size={16} className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Board View</DropdownMenuItem>
            <DropdownMenuItem>Table View</DropdownMenuItem>
            <DropdownMenuItem>Calendar View</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-5 gap-4">
        {pipelineData.map((stage) => (
          <div key={stage.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-sm font-medium text-gray-700">{stage.name}</h3>
              <Badge>{stage.deals.length}</Badge>
            </div>
            
            <div className="bg-gray-50 rounded-md p-2 flex-1 min-h-[300px]">
              {stage.deals.map((deal) => (
                <Card key={deal.id} className="mb-3 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-base">{deal.title}</CardTitle>
                    <CardDescription>{deal.company}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <DollarSign size={14} className="text-gray-500 mr-1" />
                        <span className="text-sm font-medium">${deal.value.toLocaleString()}</span>
                      </div>
                      <Badge variant={deal.probability >= 50 ? "default" : "outline"} className={deal.probability >= 50 ? "bg-green-50 text-green-700 hover:bg-green-50" : ""}>
                        {deal.probability}%
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {deal.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>{deal.contact.split(' ')[0][0]}{deal.contact.split(' ')[1][0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-gray-600 text-xs">{deal.contact}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock size={12} className="mr-1" />
                        <span>{deal.age}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-center mt-2">
                <Button variant="ghost" size="sm" className="w-full text-gray-500">
                  <Plus size={14} className="mr-1" />
                  <span>Add Deal</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipelines;
