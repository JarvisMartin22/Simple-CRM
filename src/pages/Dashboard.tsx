
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clock, 
  Edit, 
  Mail, 
  MoreHorizontal, 
  Phone, 
  Plus, 
  UserPlus 
} from 'lucide-react';
import TaskForm from '@/components/dashboard/TaskForm';
import ContactDetail from '@/components/dashboard/ContactDetail';
import MetricDetail from '@/components/dashboard/MetricDetail';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Sample data for the dashboard
const recentContacts = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', company: 'Acme Inc', lastContact: '2 days ago', avatar: '/avatars/sarah.jpg', phone: '+1 (555) 123-4567' },
  { id: 2, name: 'Michael Brown', email: 'michael@example.com', company: 'TechCorp', lastContact: '5 days ago', avatar: '/avatars/michael.jpg', phone: '+1 (555) 987-6543' },
  { id: 3, name: 'Emma Davis', email: 'emma@example.com', company: 'Design Studio', lastContact: 'Today', avatar: '/avatars/emma.jpg', phone: '+1 (555) 456-7890' },
];

const upcomingTasks = [
  { id: 1, title: 'Follow up with Sarah Johnson', due: 'Today, 3:00 PM', priority: 'High' },
  { id: 2, title: 'Prepare proposal for TechCorp', due: 'Tomorrow, 10:00 AM', priority: 'Medium' },
  { id: 3, title: 'Review Q3 pipeline forecast', due: 'Aug 12, 9:00 AM', priority: 'Low' },
  { id: 4, title: 'Schedule meeting with Design team', due: 'Aug 14, 2:00 PM', priority: 'Medium' },
];

const pipelineStages = [
  { name: 'Lead', count: 16, value: 24600 },
  { name: 'Meeting', count: 8, value: 42800 },
  { name: 'Proposal', count: 6, value: 86500 },
  { name: 'Negotiation', count: 4, value: 137200 },
  { name: 'Closed', count: 3, value: 67500 },
];

const recentActivity = [
  { id: 1, action: 'Added a new contact', user: 'You', time: '2 hours ago', details: 'James Wilson from InnoTech' },
  { id: 2, action: 'Moved deal to Proposal stage', user: 'Emily Parker', time: '4 hours ago', details: 'TechCorp website redesign ($24,000)' },
  { id: 3, action: 'Added a note', user: 'You', time: 'Yesterday', details: 'Follow-up call scheduled with Sarah Johnson' },
  { id: 4, action: 'Created new campaign', user: 'Marcus Lee', time: 'Yesterday', details: 'Q3 Newsletter - Software Solutions' },
];

const Dashboard: React.FC = () => {
  // Calculate pipeline total value
  const pipelineTotal = pipelineStages.reduce((sum, stage) => sum + stage.value, 0);
  
  const navigate = useNavigate();
  
  // State for dialogs
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<null | typeof recentContacts[0]>(null);
  const [selectedMetric, setSelectedMetric] = useState<null | {
    title: string;
    value: string | number;
    change?: string;
    changeValue?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }>(null);
  
  // Handle clicking on a card
  const handleMetricClick = (title: string, value: string | number, changeValue?: string, change?: string, changeType?: 'positive' | 'negative' | 'neutral') => {
    setSelectedMetric({
      title,
      value,
      changeValue,
      change,
      changeType
    });
  };

  // Handle contact interactions
  const handleContactClick = (contact: typeof recentContacts[0]) => {
    setSelectedContact(contact);
  };
  
  const handleContactAction = (action: 'email' | 'phone', contact: typeof recentContacts[0]) => {
    if (action === 'email') {
      toast.info(`Opening email to ${contact.email}`);
      window.open(`mailto:${contact.email}`);
    } else if (action === 'phone' && contact.phone) {
      toast.info(`Calling ${contact.name}`);
      window.open(`tel:${contact.phone}`);
    }
  };
  
  // Navigate to calendar
  const handleOpenCalendar = () => {
    navigate('/calendar');
  };
  
  // Handle task actions
  const handleTaskClick = (task: typeof upcomingTasks[0]) => {
    toast.info(`Viewing details for task: ${task.title}`);
  };
  
  // Handle pipeline view
  const handleViewPipeline = () => {
    navigate('/pipelines');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-h1 font-medium">Dashboard</h1>
        <Button className="bg-primary" onClick={() => setTaskFormOpen(true)}>
          <Plus size={16} className="mr-2" />
          <span>Add Task</span>
        </Button>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleMetricClick("Total Contacts", "1,234", "+5.2%", "vs last month", "positive")}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total Contacts</CardDescription>
            <CardTitle className="text-2xl">1,234</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 flex items-center">
              <Badge variant="outline" className="text-green-600 bg-green-50">+5.2%</Badge>
              <span className="ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleMetricClick("Open Deals", "34", "$291,100", "total value", "neutral")}
        >
          <CardHeader className="pb-2">
            <CardDescription>Open Deals</CardDescription>
            <CardTitle className="text-2xl">34</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 flex items-center">
              <Badge variant="outline" className="text-blue-600 bg-blue-50">$291,100</Badge>
              <span className="ml-2">total value</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleMetricClick("This Month's Revenue", "$67,500", "-2.3%", "vs last month", "negative")}
        >
          <CardHeader className="pb-2">
            <CardDescription>This Month's Revenue</CardDescription>
            <CardTitle className="text-2xl">$67,500</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 flex items-center">
              <Badge variant="outline" className="text-red-600 bg-red-50">-2.3%</Badge>
              <span className="ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleMetricClick("Active Campaigns", "8", "22.5%", "open rate", "positive")}
        >
          <CardHeader className="pb-2">
            <CardDescription>Active Campaigns</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 flex items-center">
              <Badge variant="outline" className="text-green-600 bg-green-50">22.5%</Badge>
              <span className="ml-2">open rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks & Activities Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>Your upcoming tasks and priorities</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTaskFormOpen(true)}>
                  <Plus size={16} className="mr-1" /> New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-start space-x-4 py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 px-2 rounded-md"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <CheckCircle size={18} className="text-gray-400" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            task.priority === 'High' ? 'default' : 
                            task.priority === 'Medium' ? 'secondary' : 
                            'outline'
                          } className={
                            task.priority === 'High' ? 'bg-red-50 text-red-700 hover:bg-red-50' : 
                            task.priority === 'Medium' ? 'bg-orange-50 text-orange-700 hover:bg-orange-50' : 
                            'bg-gray-50 text-gray-700 hover:bg-gray-50'
                          }>
                            {task.priority}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock size={14} className="mr-1" />
                        <span>{task.due}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="link" className="ml-auto" onClick={() => setTaskFormOpen(true)}>View All Tasks</Button>
            </CardFooter>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex space-x-4 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {activity.user === 'You' ? 
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar> : 
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{activity.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                      }
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="link" className="ml-auto">View All Activity</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Pipeline Overview */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Pipeline Overview</CardTitle>
              <CardDescription>Current deals by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStages.map((stage) => (
                  <div key={stage.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage.name}</span>
                      <span className="text-gray-500">{stage.count} deals · ${stage.value.toLocaleString()}</span>
                    </div>
                    <Progress value={(stage.value / pipelineTotal) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="link" className="ml-auto" onClick={handleViewPipeline}>View Pipeline</Button>
            </CardFooter>
          </Card>

          {/* Recent Contacts */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Recent Contacts</CardTitle>
                  <CardDescription>Recently added or updated</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/contacts')}>
                  <UserPlus size={16} className="mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded-md px-2"
                    onClick={() => handleContactClick(contact)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">{contact.company}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                        e.stopPropagation();
                        handleContactAction('email', contact);
                      }}>
                        <Mail size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                        e.stopPropagation();
                        handleContactAction('phone', contact);
                      }}>
                        <Phone size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="link" className="ml-auto" onClick={() => navigate('/contacts')}>View All Contacts</Button>
            </CardFooter>
          </Card>

          {/* Calendar Preview */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your schedule for the next few days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Client Demo Call</div>
                    <Badge variant="outline">Today</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <CalendarIcon size={12} className="mr-1" /> 3:00 PM - 4:00 PM
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Team Weekly Sync</div>
                    <Badge variant="outline">Tomorrow</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <CalendarIcon size={12} className="mr-1" /> 10:00 AM - 11:00 AM
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Product Roadmap Review</div>
                    <Badge variant="outline">Aug 12</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <CalendarIcon size={12} className="mr-1" /> 2:00 PM - 3:30 PM
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="link" className="ml-auto" onClick={handleOpenCalendar}>Open Calendar</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {taskFormOpen && <TaskForm isOpen={taskFormOpen} onClose={() => setTaskFormOpen(false)} />}
      {selectedContact && <ContactDetail isOpen={!!selectedContact} onClose={() => setSelectedContact(null)} contact={selectedContact} />}
      {selectedMetric && <MetricDetail isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />}
    </div>
  );
};

export default Dashboard;
