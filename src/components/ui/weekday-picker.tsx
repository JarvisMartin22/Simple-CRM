import * as React from 'react';
import { Button } from '@/components/ui/button';

interface WeekdayPickerProps {
  value: number[];
  onChange: (value: number[]) => void;
}

export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day, index) => (
        <Button
          key={day}
          type="button"
          variant={value.includes(index) ? 'default' : 'outline'}
          className="w-12"
          onClick={() => {
            onChange(
              value.includes(index)
                ? value.filter((d) => d !== index)
                : [...value, index]
            );
          }}
        >
          {day}
        </Button>
      ))}
    </div>
  );
} 