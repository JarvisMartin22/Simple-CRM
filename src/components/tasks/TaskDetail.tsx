
import React from 'react';
import { Task } from '@/contexts/TasksContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle, Clock, AlertCircle, Building, User, BriefcaseIcon, Calendar } from 'lucide-react';

interface TaskDetailProps {
  task: Task;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task }) => {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-1">
          <p className="text-sm text-gray-500">Description</p>
          <p className="text-sm">{task.description || 'No description provided'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-sm font-medium capitalize">{task.status}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <div>{getPriorityBadge(task.priority)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-sm font-medium">
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          {task.assignedTo && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="text-sm font-medium">{task.assignedTo}</p>
              </div>
            </div>
          )}
          
          {task.relatedCompany && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Related Company</p>
                <p className="text-sm font-medium">{task.relatedCompany}</p>
              </div>
            </div>
          )}
          
          {task.relatedDeal && (
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Related Deal</p>
                <p className="text-sm font-medium">{task.relatedDeal}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')} | 
            Last Modified: {format(new Date(task.updatedAt), 'MMM dd, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskDetail;
