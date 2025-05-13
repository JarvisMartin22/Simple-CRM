
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Check, X, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BaseCellProps, ViewCellProps } from './CellTypes';

export const DateCellEdit: React.FC<BaseCellProps> = ({ value, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState<Date | null>(value ? new Date(value) : new Date());
  
  return (
    <div className="flex flex-col min-w-[220px]">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center h-8 px-3 border rounded-md bg-white justify-between w-full">
            {editValue ? format(editValue, 'PP') : 'Select date'}
            <CalendarIcon className="ml-2 h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 min-w-[250px]">
          <Calendar
            mode="single"
            selected={editValue || undefined}
            onSelect={(date) => {
              setEditValue(date);
            }}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <div className="flex mt-1">
        <button 
          onClick={() => onSave(editValue)}
          className="p-1 bg-green-500 text-white rounded-md text-xs"
        >
          <Check size={14} />
        </button>
        <button 
          onClick={onCancel}
          className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export const DateCellView: React.FC<ViewCellProps> = ({ value, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {value ? format(new Date(value), 'PP') : ''}
    </div>
  );
};
