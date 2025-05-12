
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import refactored components
import KeyMetrics from '@/components/dashboard/KeyMetrics';
import TasksList from '@/components/dashboard/TasksList';
import RecentActivity from '@/components/dashboard/RecentActivity';
import PipelineOverview from '@/components/dashboard/PipelineOverview';
import RecentContacts from '@/components/dashboard/RecentContacts';
import CalendarPreview from '@/components/dashboard/CalendarPreview';
import TaskForm from '@/components/dashboard/TaskForm';
import ContactDetail from '@/components/dashboard/ContactDetail';
import MetricDetail from '@/components/dashboard/MetricDetail';
import TaskDetail from '@/components/dashboard/TaskDetail';

// Import sample data
import { 
  recentContacts, 
  upcomingTasks, 
  pipelineStages, 
  recentActivity,
  calendarEvents
} from '@/components/dashboard/DashboardData';

const Dashboard: React.FC = () => {
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
  const [selectedTask, setSelectedTask] = useState<null | typeof upcomingTasks[0]>(null);
  
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
  
  // Navigate to contacts page
  const handleAddContact = () => {
    navigate('/contacts');
  };
  
  // Navigate to calendar
  const handleOpenCalendar = () => {
    navigate('/calendar');
  };
  
  // Handle task actions
  const handleTaskClick = (task: typeof upcomingTasks[0]) => {
    setSelectedTask(task);
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
      <KeyMetrics onMetricClick={handleMetricClick} />

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks & Activities Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <TasksList 
            tasks={upcomingTasks}
            onTaskClick={handleTaskClick}
            onNewTaskClick={() => setTaskFormOpen(true)}
            onViewAllClick={() => setTaskFormOpen(true)}
          />

          {/* Recent Activity */}
          <RecentActivity 
            activities={recentActivity}
            onViewAllClick={() => toast.info("Viewing all activity")}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Pipeline Overview */}
          <PipelineOverview
            stages={pipelineStages}
            onViewPipelineClick={handleViewPipeline}
          />

          {/* Recent Contacts */}
          <RecentContacts
            contacts={recentContacts}
            onContactClick={handleContactClick}
            onContactAction={handleContactAction}
            onAddContactClick={handleAddContact}
            onViewAllClick={() => navigate('/contacts')}
          />

          {/* Calendar Preview */}
          <CalendarPreview
            events={calendarEvents}
            onOpenCalendarClick={handleOpenCalendar}
          />
        </div>
      </div>

      {/* Dialogs */}
      {taskFormOpen && <TaskForm isOpen={taskFormOpen} onClose={() => setTaskFormOpen(false)} />}
      {selectedContact && <ContactDetail isOpen={!!selectedContact} onClose={() => setSelectedContact(null)} contact={selectedContact} />}
      {selectedMetric && <MetricDetail isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />}
      {selectedTask && <TaskDetail isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} />}
    </div>
  );
};

export default Dashboard;
