
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContacts, Contact, ContactField, FieldType } from '@/contexts/ContactsContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColumnEditPopover } from './ColumnEditPopover';

export const ContactsTable: React.FC = () => {
  const { contacts, visibleFields } = useContacts();
  
  // Helper function to render cell content based on field type
  const renderCellContent = (contact: Contact, field: ContactField) => {
    const value = contact[field.id];
    
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
            {value.map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
        );
      
      case 'url':
        return value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline"
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
            <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
              {visibleFields.map((field) => (
                <TableCell key={`${contact.id}-${field.id}`}>
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
