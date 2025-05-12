
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MoreHorizontal, Plus } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  due: string;
  priority: string;
  description?: string;
}

interface TasksListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onNewTaskClick: () => void;
  onViewAllClick: () => void;
}

const TasksList: React.FC<TasksListProps> = ({ 
  tasks,
  onTaskClick,
  onNewTaskClick,
  onViewAllClick
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Your upcoming tasks and priorities</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onNewTaskClick}>
            <Plus size={16} className="mr-1" /> New Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-start space-x-4 py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 px-2 rounded-md"
              onClick={() => onTaskClick(task)}
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
        <Button variant="link" className="ml-auto" onClick={onViewAllClick}>View All Tasks</Button>
      </CardFooter>
    </Card>
  );
};

export default TasksList;
