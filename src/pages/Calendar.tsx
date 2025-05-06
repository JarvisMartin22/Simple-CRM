
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CheckCircle, ChevronDown, Clock, Edit, Filter, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';

// Sample event data
const events = [
  {
    id: 1,
    title: 'Client Demo Call',
    date: new Date(2025, 7, 10, 15, 0), // Aug 10, 2025, 3:00 PM
    endDate: new Date(2025, 7, 10, 16, 0), // Aug 10, 2025, 4:00 PM
    type: 'Meeting',
    description: 'Presentation of the new software features to Acme Inc.',
    location: 'Zoom',
    attendees: [
      { name: 'Sarah Johnson', email: 'sarah@example.com', status: 'confirmed' },
      { name: 'Michael Brown', email: 'michael@example.com', status: 'confirmed' },
      { name: 'You', email: 'you@example.com', status: 'organizer' }
    ]
  },
  {
    id: 2,
    title: 'Team Weekly Sync',
    date: new Date(2025, 7, 11, 10, 0), // Aug 11, 2025, 10:00 AM
    endDate: new Date(2025, 7, 11, 11, 0), // Aug 11, 2025, 11:00 AM
    type: 'Internal',
    description: 'Weekly team meeting to discuss progress and roadblocks',
    location: 'Conference Room B',
    attendees: [
      { name: 'You', email: 'you@example.com', status: 'organizer' },
      { name: 'Emily Parker', email: 'emily@example.com', status: 'confirmed' },
      { name: 'Marcus Lee', email: 'marcus@example.com', status: 'confirmed' },
      { name: 'Jessica Wong', email: 'jessica@example.com', status: 'tentative' }
    ]
  },
  {
    id: 3,
    title: 'Product Roadmap Review',
    date: new Date(2025, 7, 12, 14, 0), // Aug 12, 2025, 2:00 PM
    endDate: new Date(2025, 7, 12, 15, 30), // Aug 12, 2025, 3:30 PM
    type: 'Planning',
    description: 'Quarterly review of the product roadmap and prioritization',
    location: 'Boardroom',
    attendees: [
      { name: 'You', email: 'you@example.com', status: 'confirmed' },
      { name: 'Robert Chen', email: 'robert@example.com', status: 'confirmed' },
      { name: 'Amanda Walsh', email: 'amanda@example.com', status: 'confirmed' },
      { name: 'Daniel Martinez', email: 'daniel@example.com', status: 'declined' }
    ]
  },
  {
    id: 4,
    title: 'Marketing Strategy Session',
    date: new Date(2025, 7, 13, 11, 0), // Aug 13, 2025, 11:00 AM
    endDate: new Date(2025, 7, 13, 12, 30), // Aug 13, 2025, 12:30 PM
    type: 'Planning',
    description: 'Discuss and finalize Q3 marketing strategy',
    location: 'Conference Room C',
    attendees: [
      { name: 'You', email: 'you@example.com', status: 'confirmed' },
      { name: 'Jessica Wong', email: 'jessica@example.com', status: 'confirmed' },
      { name: 'Marcus Lee', email: 'marcus@example.com', status: 'confirmed' }
    ]
  },
  {
    id: 5,
    title: 'Interview: UI/UX Designer',
    date: new Date(2025, 7, 14, 13, 0), // Aug 14, 2025, 1:00 PM
    endDate: new Date(2025, 7, 14, 14, 0), // Aug 14, 2025, 2:00 PM
    type: 'Interview',
    description: 'Interview candidate for the UI/UX Designer position',
    location: 'Meeting Room 2',
    attendees: [
      { name: 'You', email: 'you@example.com', status: 'organizer' },
      { name: 'Emily Parker', email: 'emily@example.com', status: 'confirmed' }
    ]
  }
];

const CalendarPage: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<string>('week');
  
  // Get today's events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  });
  
  // Get upcoming events (next 7 days)
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() + 7);
  
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate > today && eventDate <= oneWeekLater;
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-medium">Calendar</h1>
          <p className="text-gray-500 mt-1">Manage your schedule and events</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus size={16} className="mr-2" />
              <span>Create Event</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
              <DialogDescription>
                Create a new event in your calendar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Event Title</label>
                <Input id="title" placeholder="Enter event title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="startDate" className="text-sm font-medium">Start Date & Time</label>
                  <Input id="startDate" type="datetime-local" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="endDate" className="text-sm font-medium">End Date & Time</label>
                  <Input id="endDate" type="datetime-local" />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea 
                  id="description" 
                  rows={3} 
                  placeholder="Add description" 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                ></textarea>
              </div>
              <div className="grid gap-2">
                <label htmlFor="location" className="text-sm font-medium">Location</label>
                <Input id="location" placeholder="Add location" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">Event Type</label>
                <select id="type" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="appointment">Appointment</option>
                  <option value="internal">Internal</option>
                  <option value="planning">Planning</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Create Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Calendar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main calendar */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
              <div>
                <CardTitle>August 2025</CardTitle>
                <CardDescription>Manage your schedule and events</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Tabs value={view} onValueChange={setView} className="w-[300px]">
                  <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button variant="outline" size="sm">
                  Today
                </Button>
                
                <div className="flex items-center space-x-1">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border pointer-events-auto"
                classNames={{
                  head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                }}
              />
            </div>
            
            {view === 'week' && (
              <div className="border rounded-md">
                <div className="grid grid-cols-7 bg-gray-50 border-b">
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const day = new Date();
                    day.setDate(day.getDate() - day.getDay() + idx);
                    return (
                      <div key={idx} className="py-2 px-3 text-center border-r last:border-r-0">
                        <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className={`text-sm font-medium ${day.toDateString() === new Date().toDateString() ? 'text-primary' : ''}`}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="h-[500px] overflow-y-auto p-2">
                  {/* Placeholder for week view - would normally be populated with events */}
                  {events.map((event) => {
                    // Simplified logic to place events - in a real implementation, you'd calculate position based on time
                    const eventDay = event.date.getDay();
                    const eventStyle = {
                      gridColumnStart: eventDay + 1,
                      marginTop: `${(event.date.getHours() - 8) * 40}px`, // Simple formula to position events
                      height: `${((event.endDate.getTime() - event.date.getTime()) / 3600000) * 40}px`, // Height based on duration
                    };
                    
                    return (
                      <div 
                        key={event.id} 
                        className="absolute px-2 py-1 rounded-md bg-blue-100 border border-blue-200 text-sm overflow-hidden"
                        style={eventStyle}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs text-gray-600">{formatTime(event.date)}</div>
                      </div>
                    );
                  })}
                  <div className="text-center text-sm text-gray-500 mt-20">
                    Week view placeholder - Event rendering would require more complex implementation
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sidebar with upcoming events */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todaysEvents.length > 0 ? (
                <div className="space-y-4">
                  {todaysEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 pb-3 last:pb-0 last:border-0 border-b border-gray-100">
                      <div className="min-w-[50px] text-right text-sm text-gray-500">
                        {formatTime(event.date)}
                      </div>
                      <div className="flex-1 p-2 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-gray-500">{event.location}</div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Users size={12} className="mr-1" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No events scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Upcoming</CardTitle>
                  <CardDescription>Next 7 days</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Filter size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>All Events</DropdownMenuItem>
                    <DropdownMenuItem>Meetings</DropdownMenuItem>
                    <DropdownMenuItem>Internal</DropdownMenuItem>
                    <DropdownMenuItem>Planning</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex pb-3 last:pb-0 last:border-0 border-b border-gray-100">
                      <div className="mr-3 w-10 h-10 flex flex-col items-center justify-center bg-primary text-white rounded-md flex-shrink-0">
                        <span className="text-xs font-semibold">{event.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-sm font-bold">{event.date.getDate()}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between">
                          <div className="font-medium text-sm truncate">{event.title}</div>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock size={12} className="mr-1" />
                          <span>
                            {formatTime(event.date)} - {formatTime(event.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No upcoming events in the next 7 days</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="link" className="w-full">View All Events</Button>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Due this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start">
                  <CheckCircle size={16} className="mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm">Follow up with Sarah Johnson</div>
                    <div className="text-xs text-gray-500">Due today</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle size={16} className="mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm">Prepare proposal for TechCorp</div>
                    <div className="text-xs text-gray-500">Due tomorrow</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle size={16} className="mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm">Review Q3 pipeline forecast</div>
                    <div className="text-xs text-gray-500">Due Aug 12</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
