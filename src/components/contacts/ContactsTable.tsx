
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContacts, Contact, ContactField, FieldType, SelectOption } from '@/contexts/ContactsContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColumnEditPopover } from './ColumnEditPopover';
import { Input } from "@/components/ui/input";
import { Check, Calendar as CalendarIcon, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ContactsTable: React.FC = () => {
  const { contacts, visibleFields, updateContact } = useContacts();
  const [editingCell, setEditingCell] = useState<{ contactId: string; fieldId: string } | null>(null);
  const [editValue, setEditValue] = useState<string | string[] | boolean | Date | null>('');
  
  // Helper function to render cell content based on field type
  const renderCellContent = (contact: Contact, field: ContactField) => {
    const value = contact[field.id];
    const isEditing = editingCell?.contactId === contact.id && editingCell?.fieldId === field.id;
    
    // If we're currently editing this cell
    if (isEditing) {
      // Handle different field types
      switch (field.type) {
        case 'text':
        case 'url':
        case 'email':
        case 'phone':
        case 'number':
          return (
            <div className="flex items-center min-w-[200px]">
              <Input 
                type={field.type === 'number' ? 'number' : 'text'}
                value={editValue as string || ''} 
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit(contact.id, field.id);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
              />
              <button 
                onClick={() => handleSaveEdit(contact.id, field.id)}
                className="ml-2 p-1 bg-green-500 text-white rounded-md"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => setEditingCell(null)}
                className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          );
        
        case 'date':
          return (
            <div className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center h-8 px-3 border rounded-md bg-white justify-between min-w-[200px]">
                    {editValue ? format(editValue as Date, 'PP') : 'Select date'}
                    <CalendarIcon className="ml-2 h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 min-w-[250px]">
                  <Calendar
                    mode="single"
                    selected={editValue as Date || undefined}
                    onSelect={(date) => {
                      setEditValue(date);
                      if (date) {
                        setTimeout(() => handleSaveEdit(contact.id, field.id), 100);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <div className="flex mt-1">
                <button 
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-green-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        
        case 'checkbox':
          return (
            <div className="flex items-center">
              <Checkbox 
                checked={Boolean(editValue)} 
                onCheckedChange={(checked) => {
                  setEditValue(Boolean(checked));
                  setTimeout(() => handleSaveEdit(contact.id, field.id), 100);
                }}
              />
              <div className="flex ml-2">
                <button 
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-green-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        
        case 'select':
          return (
            <div>
              <Select 
                value={(editValue as string) || ''} 
                onValueChange={(value) => {
                  setEditValue(value);
                  setTimeout(() => handleSaveEdit(contact.id, field.id), 100);
                }}
              >
                <SelectTrigger className="h-8 min-w-[200px]">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: option.color }} 
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex mt-1">
                <button 
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-green-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
          
        case 'multi-select':
          const selectedValues = (editValue as string[]) || [];
          return (
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center h-8 px-3 border rounded-md bg-white min-w-[200px] justify-between">
                    <div className="flex flex-wrap gap-1 max-w-[180px] overflow-hidden">
                      {selectedValues.length > 0 ? (
                        selectedValues.map((value) => {
                          const option = field.options?.find((o) => o.value === value);
                          return (
                            <Badge key={value} variant="secondary" className="bg-muted text-muted-foreground">
                              {option?.label || value}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-gray-400">Select options</span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[200px]">
                  {field.options?.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={(checked) => {
                        let newValues = [...selectedValues];
                        if (checked) {
                          newValues.push(option.value);
                        } else {
                          newValues = newValues.filter((v) => v !== option.value);
                        }
                        setEditValue(newValues);
                      }}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: option.color }} 
                        />
                        {option.label}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex mt-1">
                <button 
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-green-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
          
        default:
          return (
            <div className="flex items-center">
              <Input 
                value={String(editValue || '')} 
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-full min-w-[200px]"
                autoFocus
              />
              <button 
                onClick={() => handleSaveEdit(contact.id, field.id)}
                className="ml-2 p-1 bg-green-500 text-white rounded-md"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => setEditingCell(null)}
                className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          );
      }
    }
    
    if (value === undefined || value === null) {
      return '';
    }

    switch (field.type) {
      case 'date':
        return value ? format(new Date(value), 'PP') : '';
      
      case 'select':
        if (!value) return '';
        const selectOption = field.options?.find(opt => opt.value === value);
        return selectOption ? (
          <Badge 
            style={{ backgroundColor: selectOption.color, color: '#fff' }} 
            variant="default"
          >
            {selectOption.label}
          </Badge>
        ) : value;
      
      case 'multi-select':
        if (!Array.isArray(value) || value.length === 0) return '';
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((tag, i) => {
              const option = field.options?.find(opt => opt.value === tag);
              return (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="bg-muted text-muted-foreground"
                  style={option ? { backgroundColor: option.color, color: '#fff' } : {}}
                >
                  {option?.label || tag}
                </Badge>
              );
            })}
          </div>
        );
      
      case 'url':
        return value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        ) : '';
      
      case 'checkbox':
        return value ? '✓' : '';
        
      default:
        return value;
    }
  };

  // Handle cell click to begin editing
  const handleCellClick = (contact: Contact, field: ContactField) => {
    setEditingCell({ contactId: contact.id, fieldId: field.id });
    
    // Initialize edit value based on field type
    let initialValue;
    switch (field.type) {
      case 'checkbox':
        initialValue = Boolean(contact[field.id]);
        break;
      case 'date':
        initialValue = contact[field.id] ? new Date(contact[field.id]) : new Date();
        break;
      case 'multi-select':
        initialValue = Array.isArray(contact[field.id]) ? contact[field.id] : [];
        break;
      default:
        initialValue = contact[field.id] || '';
    }
    
    setEditValue(initialValue);
  };

  // Handle saving edited value
  const handleSaveEdit = (contactId: string, fieldId: string) => {
    updateContact(contactId, fieldId, editValue);
    setEditingCell(null);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleFields.map((field) => (
              <TableHead key={field.id} className="whitespace-nowrap">
                <Popover>
                  <PopoverTrigger className="cursor-pointer hover:text-primary flex items-center">
                    {field.name}
                  </PopoverTrigger>
                  <PopoverContent>
                    <ColumnEditPopover field={field} />
                  </PopoverContent>
                </Popover>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-muted/50">
              {visibleFields.map((field) => (
                <TableCell 
                  key={`${contact.id}-${field.id}`}
                  onClick={() => handleCellClick(contact, field)}
                  className="cursor-pointer min-w-[120px] relative"
                >
                  {renderCellContent(contact, field)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
