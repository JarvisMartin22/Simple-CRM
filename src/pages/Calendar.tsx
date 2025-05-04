
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const Calendar: React.FC = () => {
  const currentDate = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Sample events
  const events = [
    { id: 1, title: 'Team Meeting', day: 5, start: '10:00', end: '11:30', type: 'internal' },
    { id: 2, title: 'Client Call: TechCorp', day: 5, start: '14:00', end: '15:00', type: 'client' },
    { id: 3, title: 'Proposal Review', day: 7, start: '11:00', end: '12:00', type: 'internal' },
    { id: 4, title: 'Product Demo: InnoTech', day: 10, start: '15:30', end: '16:30', type: 'client' },
    { id: 5, title: 'Strategy Planning', day: 12, start: '09:00', end: '10:30', type: 'internal' },
    { id: 6, title: 'Interview: Designer', day: 14, start: '13:00', end: '14:00', type: 'recruitment' },
    { id: 7, title: 'Quarterly Review', day: 18, start: '10:00', end: '11:30', type: 'internal' },
    { id: 8, title: 'Contract Signing: Acme', day: 20, start: '16:00', end: '17:00', type: 'client' },
    { id: 9, title: 'Interview: Developer', day: 21, start: '11:00', end: '12:00', type: 'recruitment' },
    { id: 10, title: 'Marketing Campaign Review', day: 24, start: '14:00', end: '15:00', type: 'internal' },
  ];

  // Generate calendar grid
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calendarStart = firstDayOfMonth === 0 ? -5 : 2 - firstDayOfMonth; // Adjust for Monday start

  const calendarGrid = [];
  for (let day = calendarStart; day <= daysInMonth; day++) {
    if (day <= 0) {
      // Previous month days
      calendarGrid.push({ day: new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDate(), isCurrentMonth: false });
    } else {
      // Current month days
      calendarGrid.push({ day, isCurrentMonth: true, isToday: day === currentDate.getDate() });
    }
  }

  // Fill in remaining grid cells for the last week
  const remainingDays = 7 - (calendarGrid.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      calendarGrid.push({ day: i, isCurrentMonth: false });
    }
  }

  // Create weeks array
  const weeks = [];
  for (let i = 0; i < calendarGrid.length; i += 7) {
    weeks.push(calendarGrid.slice(i, i + 7));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-h1 font-semibold">Calendar</h1>
        <Button className="bg-primary">
          <Plus size={18} className="mr-2" />
          <span>Add Event</span>
        </Button>
      </div>

      <Card className="shadow-card p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mr-2">
              <ChevronLeft size={18} />
            </Button>
            <h2 className="text-h2 font-medium">{month} {year}</h2>
            <Button variant="outline" size="icon" className="ml-2">
              <ChevronRight size={18} />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Today</Button>
            <Button variant="outline" size="sm">Month</Button>
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Day</Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div key={day} className="py-2 text-center text-muted-foreground font-medium">
              {day}
            </div>
          ))}

          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day, dayIndex) => {
                const dayEvents = events.filter(event => event.day === day.day && day.isCurrentMonth);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`border border-gray-100 min-h-28 p-1 ${!day.isCurrentMonth ? 'bg-muted/50 text-muted-foreground' : ''} ${day.isToday ? 'border-primary' : ''}`}
                  >
                    <div className="flex justify-between items-center p-1">
                      <span className={`text-sm inline-block w-6 h-6 rounded-full text-center leading-6 ${day.isToday ? 'bg-primary text-white' : ''}`}>
                        {day.day}
                      </span>
                      {dayEvents.length > 0 && day.isCurrentMonth && (
                        <Button variant="ghost" size="icon" className="w-5 h-5">
                          <Plus size={14} />
                        </Button>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.map((event) => (
                        <div 
                          key={event.id} 
                          className={`text-xs p-1 rounded overflow-hidden text-ellipsis whitespace-nowrap ${
                            event.type === 'client' ? 'bg-primary/10 text-primary' :
                            event.type === 'recruitment' ? 'bg-secondary/10 text-secondary' :
                            'bg-success/10 text-success'
                          }`}
                        >
                          {event.start} - {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <div className="p-6">
            <h3 className="font-medium mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {events
                .filter(event => event.day >= currentDate.getDate())
                .slice(0, 5)
                .map(event => (
                  <div key={event.id} className="flex items-start p-3 hover:bg-muted rounded-md">
                    <div className="mr-3 text-center">
                      <div className="font-medium">{event.day}</div>
                      <div className="text-xs text-muted-foreground">{month.slice(0, 3)}</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-small text-muted-foreground">{event.start} - {event.end}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-micro ${
                      event.type === 'client' ? 'bg-primary/10 text-primary' :
                      event.type === 'recruitment' ? 'bg-secondary/10 text-secondary' :
                      'bg-success/10 text-success'
                    }`}>
                      {event.type}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>

        <Card className="shadow-card">
          <div className="p-6">
            <h3 className="font-medium mb-4">Event Categories</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                  <span>Client Meetings</span>
                </div>
                <span className="bg-muted px-2 py-1 rounded text-micro">{events.filter(e => e.type === 'client').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
                  <span>Recruitment</span>
                </div>
                <span className="bg-muted px-2 py-1 rounded text-micro">{events.filter(e => e.type === 'recruitment').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-success mr-2"></div>
                  <span>Internal</span>
                </div>
                <span className="bg-muted px-2 py-1 rounded text-micro">{events.filter(e => e.type === 'internal').length}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;
