
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowUp, Briefcase, Calendar, CircleCheck, Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const Dashboard: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const recentActivities = [
    { id: 1, type: 'contact', name: 'Sarah Johnson', action: 'added to contacts', time: '2 hours ago' },
    { id: 2, type: 'deal', name: 'Acme Corp Partnership', action: 'moved to Negotiation', time: '3 hours ago' },
    { id: 3, type: 'task', name: 'Call with Michael Brown', action: 'marked as completed', time: '5 hours ago' },
    { id: 4, type: 'email', name: 'Follow-up email', action: 'sent to Emma Davis', time: 'Yesterday' },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Send proposal to InnoTech', dueDate: 'Today', priority: 'high' },
    { id: 2, title: 'Follow up with James about pricing', dueDate: 'Tomorrow', priority: 'medium' },
    { id: 3, title: 'Prepare for team meeting', dueDate: 'Jun 6', priority: 'low' },
    { id: 4, title: 'Review Q2 metrics', dueDate: 'Jun 8', priority: 'medium' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center">
          <span className="mr-2">Quick Add</span>
          <span className="text-lg">+</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="flex items-center">
                <Users className="mr-3 text-primary" />
                <span className="text-3xl font-semibold">248</span>
              </div>
              <div className="flex items-center text-success text-small">
                <ArrowUp size={16} className="mr-1" />
                <span>12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="flex items-center">
                <Briefcase className="mr-3 text-secondary" />
                <span className="text-3xl font-semibold">36</span>
              </div>
              <div className="flex items-center text-success text-small">
                <ArrowUp size={16} className="mr-1" />
                <span>8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Tasks Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="flex items-center">
                <Calendar className="mr-3 text-warning" />
                <span className="text-3xl font-semibold">12</span>
              </div>
              <div className="text-small text-muted-foreground">
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Deal Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">68%</span>
                <span className="text-success text-xs">+5.2%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                      activity.type === 'contact' ? 'bg-primary/10 text-primary' :
                      activity.type === 'deal' ? 'bg-secondary/10 text-secondary' :
                      activity.type === 'task' ? 'bg-success/10 text-success' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {activity.type === 'contact' && <Users size={14} />}
                      {activity.type === 'deal' && <Briefcase size={14} />}
                      {activity.type === 'task' && <CircleCheck size={14} />}
                      {activity.type === 'email' && <Mail size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.name}</p>
                      <p className="text-muted-foreground text-small">{activity.action}</p>
                    </div>
                    <div className="text-muted-foreground text-micro">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Upcoming Tasks</span>
                <button className="text-primary text-small">View All</button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center p-3 rounded-md hover:bg-muted">
                    <input type="checkbox" className="w-4 h-4 mr-3 accent-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-muted-foreground text-small">Due {task.dueDate}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-micro ${
                      task.priority === 'high' ? 'bg-danger/10 text-danger' :
                      task.priority === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
