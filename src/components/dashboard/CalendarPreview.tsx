
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
}

interface CalendarPreviewProps {
  events: CalendarEvent[];
  onOpenCalendarClick: () => void;
}

const CalendarPreview: React.FC<CalendarPreviewProps> = ({ events, onOpenCalendarClick }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Your schedule for the next few days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{event.title}</div>
                <Badge variant="outline">{event.date}</Badge>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <CalendarIcon size={12} className="mr-1" /> {event.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="link" className="ml-auto" onClick={onOpenCalendarClick}>Open Calendar</Button>
      </CardFooter>
    </Card>
  );
};

export default CalendarPreview;
