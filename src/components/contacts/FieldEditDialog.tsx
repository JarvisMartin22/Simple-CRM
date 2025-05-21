import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactField, FieldType, SelectOption } from '@/contexts/ContactsContext';

// Define the allowed field types
const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Select' },
  { value: 'multi-select', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
];

// Define props for the component
export interface FieldEditDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  field?: ContactField | null;
  onSave?: (field: ContactField) => void;
  mode?: 'create' | 'edit';
  onClose?: () => void;
}

export function FieldEditDialog({ 
  open, 
  onOpenChange, 
  field, 
  onSave, 
  mode = 'create',
  onClose 
}: FieldEditDialogProps) {
  // Initialize state with field values or defaults
  const [name, setName] = useState(field?.name || '');
  const [label, setLabel] = useState(field?.label || '');
  const [type, setType] = useState<FieldType>(field?.type || 'text');
  const [visible, setVisible] = useState(field?.visible !== undefined ? field?.visible : true);
  const [required, setRequired] = useState(field?.required || false);
  const [options, setOptions] = useState<SelectOption[]>(field?.options || []);
  const [newOption, setNewOption] = useState({ value: '', label: '' });

  // Function to add new options for select/multi-select fields
  const addOption = () => {
    if (newOption.value && newOption.label) {
      setOptions([...options, { ...newOption }]);
      setNewOption({ value: '', label: '' });
    }
  };

  // Function to remove options
  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // Reset form when dialog opens/closes or field changes
  const resetForm = () => {
    if (field) {
      setName(field.name);
      setLabel(field.label);
      setType(field.type);
      setVisible(field.visible);
      setRequired(field.required);
      setOptions(field.options || []);
    } else {
      setName('');
      setLabel('');
      setType('text');
      setVisible(true);
      setRequired(false);
      setOptions([]);
    }
    setNewOption({ value: '', label: '' });
  };

  // Handle form submission
  const handleSave = () => {
    if (!name || !label) return;
    
    const updatedField: ContactField = {
      id: field?.id || '',
      name,
      label,
      type,
      visible,
      required,
      options: ['select', 'multi-select'].includes(type) ? options : undefined,
    };
    
    if (onSave) {
      onSave(updatedField);
    }
    
    if (onOpenChange) {
      onOpenChange(false);
    }
    
    if (onClose) {
      onClose();
    }
  };

  // Effect to reset form when component mounts or field changes
  useState(() => {
    resetForm();
  });

  // If using the Dialog component directly
  if (open !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Edit Field' : 'Add Field'}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="py-4">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              {(type === 'select' || type === 'multi-select') && (
                <TabsTrigger value="options">Options</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Field Name</Label>
                    <Input 
                      id="name"
                      value={name} 
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!label) setLabel(e.target.value);
                      }}
                      placeholder="e.g. email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="label">Display Label</Label>
                    <Input 
                      id="label"
                      value={label} 
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Email Address"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Field Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as FieldType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((fieldType) => (
                        <SelectItem key={fieldType.value} value={fieldType.value}>
                          {fieldType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="visible">Visible</Label>
                    <Switch 
                      id="visible" 
                      checked={visible} 
                      onCheckedChange={setVisible}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="required">Required</Label>
                    <Switch 
                      id="required" 
                      checked={required} 
                      onCheckedChange={setRequired}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {(type === 'select' || type === 'multi-select') && (
              <TabsContent value="options" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="optionValue">Option Value</Label>
                      <Input 
                        id="optionValue"
                        value={newOption.value} 
                        onChange={(e) => setNewOption({...newOption, value: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="optionLabel">Option Label</Label>
                      <Input 
                        id="optionLabel"
                        value={newOption.label} 
                        onChange={(e) => setNewOption({...newOption, label: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <Button type="button" onClick={addOption} disabled={!newOption.value || !newOption.label}>
                    Add Option
                  </Button>
                  
                  {options.length > 0 && (
                    <div className="border rounded-md p-4">
                      <h4 className="text-sm font-medium mb-2">Current Options</h4>
                      <div className="space-y-2">
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-sm">
                            <span>{option.label} ({option.value})</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeOption(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange && onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name || !label}
            >
              Save Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // If using without Dialog (just the form content)
  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="py-4">
        <TabsList>
          <TabsTrigger value="basic">Basic</TabsTrigger>
          {(type === 'select' || type === 'multi-select') && (
            <TabsTrigger value="options">Options</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Field Name</Label>
                <Input 
                  id="name"
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!label) setLabel(e.target.value);
                  }}
                  placeholder="e.g. email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label">Display Label</Label>
                <Input 
                  id="label"
                  value={label} 
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Email Address"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Field Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as FieldType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((fieldType) => (
                    <SelectItem key={fieldType.value} value={fieldType.value}>
                      {fieldType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="visible">Visible</Label>
                <Switch 
                  id="visible" 
                  checked={visible} 
                  onCheckedChange={setVisible}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="required">Required</Label>
                <Switch 
                  id="required" 
                  checked={required} 
                  onCheckedChange={setRequired}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        {(type === 'select' || type === 'multi-select') && (
          <TabsContent value="options" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionValue">Option Value</Label>
                  <Input 
                    id="optionValue"
                    value={newOption.value} 
                    onChange={(e) => setNewOption({...newOption, value: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="optionLabel">Option Label</Label>
                  <Input 
                    id="optionLabel"
                    value={newOption.label} 
                    onChange={(e) => setNewOption({...newOption, label: e.target.value})}
                  />
                </div>
              </div>
              
              <Button type="button" onClick={addOption} disabled={!newOption.value || !newOption.label}>
                Add Option
              </Button>
              
              {options.length > 0 && (
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Current Options</h4>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-sm">
                        <span>{option.label} ({option.value})</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeOption(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!name || !label}
        >
          Save Field
        </Button>
      </div>
    </div>
  );
}
