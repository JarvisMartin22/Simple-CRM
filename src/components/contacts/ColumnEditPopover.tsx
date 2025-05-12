
import React from 'react';
import { 
  Pencil, 
  Filter, 
  ArrowUpAZ, 
  ArrowDownAZ, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { ContactField, useContacts } from '@/contexts/ContactsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FieldEditDialog } from './FieldEditDialog';

interface ColumnEditPopoverProps {
  field: ContactField;
}

export const ColumnEditPopover: React.FC<ColumnEditPopoverProps> = ({ field }) => {
  const { toggleFieldVisibility, deleteField } = useContacts();

  const handleDelete = () => {
    if (!field.required) {
      deleteField(field.id);
    }
  };

  return (
    <div className="w-48 space-y-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Pencil size={16} className="mr-2" />
            Edit field
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          <FieldEditDialog field={field} mode="edit" />
        </DialogContent>
      </Dialog>

      <Button variant="ghost" className="w-full justify-start" size="sm">
        <Filter size={16} className="mr-2" />
        Filter
      </Button>

      <Button variant="ghost" className="w-full justify-start" size="sm">
        <ArrowUpAZ size={16} className="mr-2" />
        Sort ascending
      </Button>

      <Button variant="ghost" className="w-full justify-start" size="sm">
        <ArrowDownAZ size={16} className="mr-2" />
        Sort descending
      </Button>

      <Button 
        variant="ghost" 
        className="w-full justify-start" 
        size="sm" 
        onClick={() => toggleFieldVisibility(field.id)}
        disabled={field.required}
      >
        {field.visible ? (
          <>
            <EyeOff size={16} className="mr-2" />
            Hide in view
          </>
        ) : (
          <>
            <Eye size={16} className="mr-2" />
            Show in view
          </>
        )}
      </Button>

      <Button 
        variant="ghost" 
        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" 
        size="sm"
        onClick={handleDelete}
        disabled={field.required}
      >
        <X size={16} className="mr-2" />
        Delete property
      </Button>
    </div>
  );
};
