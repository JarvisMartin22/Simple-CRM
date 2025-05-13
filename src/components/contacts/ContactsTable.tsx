
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContacts } from '@/contexts/ContactsContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColumnEditPopover } from './ColumnEditPopover';
import TableCellRenderer from './cells/TableCellRenderer';

export const ContactsTable: React.FC = () => {
  const { contacts, visibleFields, updateContact, updateField } = useContacts();
  const [editingCell, setEditingCell] = useState<{ contactId: string; fieldId: string } | null>(null);
  
  // Handle cell click to begin editing
  const handleCellClick = (contactId: string, fieldId: string) => {
    setEditingCell({ contactId, fieldId });
  };

  // Handle saving edited value
  const handleSaveEdit = (contactId: string, fieldId: string, value: any) => {
    console.log("Saving edit:", { contactId, fieldId, value });
    
    // Make sure we're handling both select and multi-select values correctly
    const field = visibleFields.find(f => f.id === fieldId);
    
    if (field?.type === 'multi-select') {
      // Ensure multi-select values are always arrays
      const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
      updateContact(contactId, fieldId, arrayValue);
    } else if (field?.type === 'select') {
      // For select fields, just pass the value directly
      updateContact(contactId, fieldId, value);
    } else {
      // For other field types
      updateContact(contactId, fieldId, value);
    }
    
    setEditingCell(null);
  };

  // Handle cancelling edit
  const handleCancelEdit = () => {
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
                  <PopoverTrigger className="cursor-pointer hover:text-coral-500 flex items-center">
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
              {visibleFields.map((field) => {
                const isEditing = 
                  editingCell?.contactId === contact.id && 
                  editingCell?.fieldId === field.id;
                
                return (
                  <TableCell 
                    key={`${contact.id}-${field.id}`}
                    className="cursor-pointer min-w-[120px] relative"
                  >
                    <TableCellRenderer
                      contact={contact}
                      field={field}
                      isEditing={isEditing}
                      onSave={(value) => handleSaveEdit(contact.id, field.id, value)}
                      onCancel={handleCancelEdit}
                      onClick={() => handleCellClick(contact.id, field.id)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
