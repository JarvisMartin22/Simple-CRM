
// File containing sample data for the dashboard

// Sample data for the dashboard
export const recentContacts = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', company: 'Acme Inc', lastContact: '2 days ago', avatar: '/avatars/sarah.jpg', phone: '+1 (555) 123-4567' },
  { id: 2, name: 'Michael Brown', email: 'michael@example.com', company: 'TechCorp', lastContact: '5 days ago', avatar: '/avatars/michael.jpg', phone: '+1 (555) 987-6543' },
  { id: 3, name: 'Emma Davis', email: 'emma@example.com', company: 'Design Studio', lastContact: 'Today', avatar: '/avatars/emma.jpg', phone: '+1 (555) 456-7890' },
];

export const upcomingTasks = [
  { id: 1, title: 'Follow up with Sarah Johnson', due: 'Today, 3:00 PM', priority: 'High' },
  { id: 2, title: 'Prepare proposal for TechCorp', due: 'Tomorrow, 10:00 AM', priority: 'Medium' },
  { id: 3, title: 'Review Q3 pipeline forecast', due: 'Aug 12, 9:00 AM', priority: 'Low' },
  { id: 4, title: 'Schedule meeting with Design team', due: 'Aug 14, 2:00 PM', priority: 'Medium' },
];

export const pipelineStages = [
  { name: 'Lead', count: 16, value: 24600 },
  { name: 'Meeting', count: 8, value: 42800 },
  { name: 'Proposal', count: 6, value: 86500 },
  { name: 'Negotiation', count: 4, value: 137200 },
  { name: 'Closed', count: 3, value: 67500 },
];

export const recentActivity = [
  { id: 1, action: 'Added a new contact', user: 'You', time: '2 hours ago', details: 'James Wilson from InnoTech' },
  { id: 2, action: 'Moved deal to Proposal stage', user: 'Emily Parker', time: '4 hours ago', details: 'TechCorp website redesign ($24,000)' },
  { id: 3, action: 'Added a note', user: 'You', time: 'Yesterday', details: 'Follow-up call scheduled with Sarah Johnson' },
  { id: 4, action: 'Created new campaign', user: 'Marcus Lee', time: 'Yesterday', details: 'Q3 Newsletter - Software Solutions' },
];

export const calendarEvents = [
  { id: 1, title: 'Client Demo Call', date: 'Today', time: '3:00 PM - 4:00 PM' },
  { id: 2, title: 'Team Weekly Sync', date: 'Tomorrow', time: '10:00 AM - 11:00 AM' },
  { id: 3, title: 'Product Roadmap Review', date: 'Aug 12', time: '2:00 PM - 3:30 PM' },
];
