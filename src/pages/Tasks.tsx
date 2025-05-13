
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, ClipboardList } from 'lucide-react';
import TasksList from '@/components/tasks/TasksList';
import TaskForm from '@/components/tasks/TaskForm';
import TaskDetail from '@/components/tasks/TaskDetail';
import { Task } from '@/contexts/TasksContext';

const Tasks: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsViewDetailOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTask(null);
  };

  const handleCloseDetail = () => {
    setIsViewDetailOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <ClipboardList className="mr-2 h-5 w-5 text-gray-700" />
          <h1 className="text-2xl font-medium text-gray-800">Tasks</h1>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Task
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TasksList onEdit={handleEditTask} />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <TaskForm
            task={selectedTask || undefined}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {selectedTask && <TaskDetail task={selectedTask} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
