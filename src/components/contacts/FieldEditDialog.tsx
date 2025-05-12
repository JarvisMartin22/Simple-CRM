
import React, { useState, useEffect } from 'react';
import { 
  ContactField, 
  FieldType, 
  SelectOption, 
  useContacts 
} from '@/contexts/ContactsContext';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { DialogFooter } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';

interface FieldEditDialogProps {
  field?: ContactField;
  mode: 'create' | 'edit';
  onComplete?: () => void;
}

interface FormValues {
  name: string;
  type: FieldType;
}

const fieldTypeOptions: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multi-select', label: 'Multi-select' },
  { value: 'status', label: 'Status' },
  { value: 'date', label: 'Date' },
  { value: 'files-media', label: 'Files & media' },
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

// Predefined colors for select options
const predefinedColors = [
  '#9b87f5', // Primary Purple
  '#F97316', // Bright Orange
  '#0EA5E9', // Ocean Blue
  '#8B5CF6', // Vivid Purple
  '#D946EF', // Magenta Pink
  '#10B981', // Green
  '#6366F1', // Indigo
  '#F43F5E', // Red
  '#F59E0B', // Amber
];

export const FieldEditDialog: React.FC<FieldEditDialogProps> = ({ 
  field, 
  mode, 
  onComplete 
}) => {
  const { addField, updateField } = useContacts();
  const [options, setOptions] = useState<SelectOption[]>(field?.options || []);
  
  const form = useForm<FormValues>({
    defaultValues: {
      name: field?.name || '',
      type: field?.type || 'text'
    }
  });

  const { watch } = form;
  const selectedType = watch('type');
  
  const needsOptions = ['select', 'multi-select', 'status'].includes(selectedType);

  const handleAddOption = () => {
    const newOption: SelectOption = {
      label: `Option ${options.length + 1}`,
      value: `option-${options.length + 1}`,
      color: predefinedColors[options.length % predefinedColors.length]
    };
    setOptions([...options, newOption]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: keyof SelectOption, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    setOptions(updatedOptions);
  };

  const handleSubmit = (values: FormValues) => {
    if (mode === 'create') {
      addField({
        name: values.name,
        type: values.type,
        visible: true,
        required: false,
        options: needsOptions ? options : undefined
      });
    } else if (field) {
      updateField(field.id, {
        name: values.name,
        type: values.type,
        options: needsOptions ? options : undefined
      });
    }
    
    if (onComplete) onComplete();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter field name" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={mode === 'edit' && field.value === 'name'} // Can't change name field type
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fieldTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {needsOptions && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Options</h4>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={handleAddOption}
              >
                <Plus size={16} className="mr-1" /> Add Option
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {options.map((option, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 p-2 border rounded-md"
                >
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: option.color }} 
                  />
                  
                  <Input 
                    value={option.label} 
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1 h-8"
                  />
                  
                  <Button
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveOption(index)}
                    className="h-8 w-8"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              
              {options.length === 0 && (
                <div className="text-center text-sm text-muted-foreground p-2">
                  No options defined. Click "Add Option" to start.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button type="submit">
            {mode === 'create' ? 'Create Field' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
