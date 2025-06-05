import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerFieldProps {
  selectedDate?: string | null;
  onDateChange: (date: Date | undefined) => void;
  label: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  selectedDate,
  onDateChange,
  label
}) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const handleSelectDate = (date: Date | undefined) => {
    onDateChange(date);
    setDatePickerOpen(false);
  };

  // Parse the date safely
  const getSelectedDate = () => {
    if (!selectedDate) return undefined;
    try {
      if (typeof selectedDate === 'string') {
        // Try to parse ISO string or regular date string
        const parsed = parseISO(selectedDate);
        return isValid(parsed) ? parsed : new Date(selectedDate);
      }
      return new Date(selectedDate);
    } catch {
      return undefined;
    }
  };

  const parsedDate = getSelectedDate();

  return (
    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !parsedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {parsedDate && isValid(parsedDate) ? 
            format(parsedDate, "PPP") : 
            "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleSelectDate}
          initialFocus
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  );
};
