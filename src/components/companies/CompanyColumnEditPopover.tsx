import React from 'react';
import { 
  Edit, 
  Filter, 
  ArrowUpDown, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { CompanyField, useCompanies } from '@/contexts/CompaniesContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CompanyFieldEditDialog } from './CompanyFieldEditDialog';

interface CompanyColumnEditPopoverProps {
  field: CompanyField | null;
}

export const CompanyColumnEditPopover: React.FC<CompanyColumnEditPopoverProps> = ({ field }) => {
  const { toggleFieldVisibility, deleteField } = useCompanies();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  if (!field) return null;

  const handleDelete = () => {
    if (!field.required) {
      deleteField(field.id);
    }
  };

  return (
    <div className="w-48 space-y-2">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Edit size={16} className="mr-2" />
            Edit field
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          <CompanyFieldEditDialog field={field} mode="edit" onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Button variant="ghost" className="w-full justify-start" size="sm">
        <Filter size={16} className="mr-2" />
        Filter
      </Button>

      <Button variant="ghost" className="w-full justify-start" size="sm">
        <ArrowUpDown size={16} className="mr-2" />
        Sort
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
