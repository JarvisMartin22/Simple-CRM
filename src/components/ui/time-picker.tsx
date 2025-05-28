import * as React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TimePicker({ value = '', onChange }: TimePickerProps) {
  return (
    <div className="flex items-center">
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
      <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
    </div>
  );
} 