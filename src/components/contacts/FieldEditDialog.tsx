
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { ContactField, FieldType, SelectOption, useContacts } from '@/contexts/ContactsContext';

// Field types available for selection
const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select (Single Choice)' },
  { value: 'multi-select', label: 'Multi-select' },
  { value: 'status', label: 'Status' },
  { value: 'date', label: 'Date' },
  { value: 'files-media', label: 'Files & Media' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'formula', label: 'Formula' },
  { value: 'relation', label: 'Relation' },
  { value: 'rollup', label: 'Rollup' },
  { value: 'created-time', label: 'Created time' },
  { value: 'last-edited-time', label: 'Last edited time' },
  { value: 'button', label: 'Button' }
];

// Predefined colors for options
const colorOptions = [
  '#0EA5E9', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#6B7280', // gray
];

interface FieldEditDialogProps {
  field?: ContactField;
  mode: 'create' | 'edit';
  onClose?: () => void;
}

export const FieldEditDialog: React.FC<FieldEditDialogProps> = ({ field, mode, onClose }) => {
  const { addField, updateField } = useContacts();
  
  // State for field properties
  const [name, setName] = useState(field?.name || '');
  const [type, setType] = useState<FieldType>(field?.type || 'text');
  const [options, setOptions] = useState<SelectOption[]>(field?.options || []);

  // Reset form when field changes
  useEffect(() => {
    if (field) {
      setName(field.name);
      setType(field.type);
      setOptions(field.options || []);
    }
  }, [field]);

  // Add a new option to select/multi-select field
  const addOption = () => {
    const newOption = {
      label: `Option ${options.length + 1}`,
      value: `option-${options.length + 1}`,
      color: colorOptions[options.length % colorOptions.length]
    };
    setOptions([...options, newOption]);
  };

  // Remove an option
  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  // Update an option's property
  const updateOption = (index: number, key: keyof SelectOption, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [key]: value };
    setOptions(newOptions);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!name.trim()) return; // Prevent empty field names
    
    const fieldData = {
      name,
      type,
      visible: true,
      required: false,
      ...((['select', 'multi-select', 'status'].includes(type)) ? { options } : {})
    };
    
    if (mode === 'create') {
      addField(fieldData);
    } else if (field) {
      updateField(field.id, fieldData);
    }
    
    if (onClose) onClose();
  };

  // Determine if options are available for this field type
  const showOptionsEditor = ['select', 'multi-select', 'status'].includes(type);

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <label htmlFor="field-name" className="text-sm font-medium">Field Name</label>
        <Input 
          id="field-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter field name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="field-type" className="text-sm font-medium">Field Type</label>
        <Select
          value={type}
          onValueChange={(value) => setType(value as FieldType)}
          disabled={field?.id === 'name'} // Disable type change for name field
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showOptionsEditor && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Options</label>
            <Button 
              variant="ghost" 
              size="sm" 
              type="button" 
              onClick={addOption}
              className="h-8 px-2"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Option
            </Button>
          </div>
          
          <div className="space-y-2">
            {options.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 border border-dashed rounded-md text-center">
                No options defined. Add some options.
              </div>
            ) : (
              options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: option.color }}
                  />
                  <Input 
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                    placeholder="Option name"
                    className="flex-1"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    type="button" 
                    onClick={() => removeOption(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>{mode === 'create' ? 'Create' : 'Save'}</Button>
      </div>
    </div>
  );
};
