
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Activity {
  id: number;
  action: string;
  user: string;
  time: string;
  details: string;
}

interface RecentActivityProps {
  activities: Activity[];
  onViewAllClick: () => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewAllClick }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
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
        <Button variant="link" className="ml-auto" onClick={onViewAllClick}>View All Activity</Button>
      </CardFooter>
    </Card>
  );
};

export default RecentActivity;
