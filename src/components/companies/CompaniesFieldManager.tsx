
import React from 'react';
import { useCompanies, CompanyField } from '@/contexts/CompaniesContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CompanyFieldEditDialog } from './CompanyFieldEditDialog';
import { Plus } from 'lucide-react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const CompaniesFieldManager: React.FC = () => {
  const { fields, toggleFieldVisibility } = useCompanies();
  const [openDialog, setOpenDialog] = React.useState(false);

  return (
    <div className="space-y-4 py-2">
      <SheetHeader className="mb-4">
        <SheetTitle>Properties</SheetTitle>
      </SheetHeader>

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Shown in table</span>
        <Button variant="outline" size="sm" onClick={() => {
          // Hide all non-required fields
          fields.forEach(field => {
            if (!field.required && field.visible) {
              toggleFieldVisibility(field.id);
            }
          });
        }}>
          Hide all
        </Button>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {fields.map((field) => (
          <FieldItem 
            key={field.id} 
            field={field} 
            onToggleVisibility={() => toggleFieldVisibility(field.id)} 
          />
        ))}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <Plus size={16} className="mr-1" /> New property
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <CompanyFieldEditDialog 
            mode="create" 
            onClose={() => setOpenDialog(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface FieldItemProps {
  field: CompanyField;
  onToggleVisibility: () => void;
}

const FieldItem: React.FC<FieldItemProps> = ({ field, onToggleVisibility }) => {
  return (
    <div className="flex items-center justify-between border-b pb-2">
      <div className="flex items-center">
        <div className="text-sm">
          {field.name}
          {field.required && (
            <span className="ml-1 text-xs text-muted-foreground">(required)</span>
          )}
        </div>
      </div>
      <Switch 
        checked={field.visible} 
        onCheckedChange={onToggleVisibility}
        disabled={field.required} // Can't toggle required fields
      />
    </div>
  );
};
