
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskDetailProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    due: string;
    priority: string;
    description?: string;
  };
}

const TaskDetail: React.FC<TaskDetailProps> = ({ isOpen, onClose, task }) => {
  const [status, setStatus] = useState('pending'); // 'pending' or 'completed'
  
  const handleMarkComplete = () => {
    setStatus('completed');
    toast.success(`Task "${task.title}" marked as complete`);
  };
  
  const handleDelete = () => {
    toast.success(`Task "${task.title}" deleted`);
    onClose();
  };
  
  const handleEdit = () => {
    toast.info(`Editing task "${task.title}"`);
    // In a real app, this would open the task form with pre-populated data
  };
  
  const formatDueDate = (dueString: string) => {
    // Check if the string has a time component
    if (dueString.includes(':')) {
      const [datePart, timePart] = dueString.split(', ');
      
      let dateToFormat;
      if (datePart.toLowerCase() === 'today') {
        dateToFormat = new Date();
      } else if (datePart.toLowerCase() === 'tomorrow') {
        dateToFormat = new Date();
        dateToFormat.setDate(dateToFormat.getDate() + 1);
      } else {
        // Handle "Aug 12" format
        const currentYear = new Date().getFullYear();
        dateToFormat = new Date(`${datePart}, ${currentYear} ${timePart}`);
      }
      
      return format(dateToFormat, "MMMM d, yyyy 'at' h:mm a");
    }
    
    return dueString;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{task.title}</h3>
            <Badge variant={
              task.priority === 'High' ? 'destructive' : 
              task.priority === 'Medium' ? 'default' : 
              'outline'
            }>
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {task.description}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={16} className="mr-2" />
            <span>Due: {formatDueDate(task.due)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={16} className="mr-2" />
            <span>Created: {format(new Date(), "MMMM d, yyyy")}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className={`h-2 w-2 rounded-full mr-2 ${status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <span className="font-medium">{status === 'completed' ? 'Completed' : 'Pending'}</span>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0 mt-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit size={14} className="mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600" onClick={handleDelete}>
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          </div>
          
          {status !== 'completed' && (
            <Button onClick={handleMarkComplete}>
              <CheckCircle size={14} className="mr-1" /> Mark as Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetail;
