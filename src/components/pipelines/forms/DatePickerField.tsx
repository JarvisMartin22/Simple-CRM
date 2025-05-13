
import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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

  return (
    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? 
            format(new Date(selectedDate), "PPP") : 
            "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate ? new Date(selectedDate) : undefined}
          onSelect={handleSelectDate}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
};
