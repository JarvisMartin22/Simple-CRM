
import React from 'react';
import { Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BaseCellProps, ViewCellProps } from './CellTypes';

export const CheckboxCellEdit: React.FC<BaseCellProps> = ({ value, onSave, onCancel }) => {
  return (
    <div className="flex items-center min-w-[220px]">
      <Checkbox 
        checked={Boolean(value)} 
        onCheckedChange={(checked) => {
          onSave(Boolean(checked));
        }}
      />
      <div className="flex ml-2">
        <button 
          onClick={() => onSave(Boolean(value))}
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

export const CheckboxCellView: React.FC<ViewCellProps> = ({ value, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {value ? '✓' : ''}
    </div>
  );
};
