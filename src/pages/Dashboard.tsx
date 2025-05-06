
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
          <h1 className="text-h1 font-medium">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{currentDate}</p>
        </div>
        <button className="notion-primary-button flex items-center">
          <span className="mr-2">Quick Add</span>
          <span className="text-lg">+</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm hover:shadow-md transition-all duration-150">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-gray-500 text-sm font-normal">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="flex items-center">
                <Users className="mr-3 text-gray-600" size={18} />
                <span className="text-2xl font-medium">248</span>
              </div>
              <div className="flex items-center text-success text-xs">
                <ArrowUp size={14} className="mr-1" />
                <span>12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm hover:shadow-md transition-all duration-150">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-gray-500 text-sm font-normal">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="flex items-center">
                <Briefcase className="mr-3 text-gray-600" size={18} />
                <span className="text-2xl font-medium">36</span>
              </div>
              <div className="flex items-center text-success text-xs">
                <ArrowUp size={14} className="mr-1" />
                <span>8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm hover:shadow-md transition-all duration-150">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-gray-500 text-sm font-normal">Tasks Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="flex items-center">
                <Calendar className="mr-3 text-gray-600" size={18} />
                <span className="text-2xl font-medium">12</span>
              </div>
              <div className="text-xs text-gray-500">
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm hover:shadow-md transition-all duration-150">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-gray-500 text-sm font-normal">Deal Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-sm">68%</span>
                <span className="text-success text-xs">+5.2%</span>
              </div>
              <Progress value={68} className="h-1.5 bg-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 pt-4 flex justify-between items-center">
              <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              <button className="text-sm text-gray-500 hover:text-primary transition-colors">View All</button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start pb-3 last:pb-0 border-b last:border-b-0 border-gray-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 bg-gray-100`}>
                      {activity.type === 'contact' && <Users size={14} className="text-gray-600" />}
                      {activity.type === 'deal' && <Briefcase size={14} className="text-gray-600" />}
                      {activity.type === 'task' && <CircleCheck size={14} className="text-gray-600" />}
                      {activity.type === 'email' && <Mail size={14} className="text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.name}</p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 pt-4 flex justify-between items-center">
              <CardTitle className="text-lg font-medium">Upcoming Tasks</CardTitle>
              <button className="text-sm text-gray-500 hover:text-primary transition-colors">View All</button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <input type="checkbox" className="w-4 h-4 mr-3 rounded border-gray-300 text-primary focus:ring-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">Due {task.dueDate}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      task.priority === 'high' ? 'bg-red-50 text-red-600' :
                      task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-green-50 text-green-600'
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
