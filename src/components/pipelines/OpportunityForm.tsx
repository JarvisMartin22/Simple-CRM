
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { usePipelines, Opportunity } from '@/contexts/PipelinesContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useCompanies } from '@/contexts/CompaniesContext';
import { cn } from '@/lib/utils';

interface OpportunityFormProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: string;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({ 
  open, 
  onClose,
  opportunityId 
}) => {
  const { currentPipeline, opportunities, addOpportunity, updateOpportunity } = usePipelines();
  const { contacts } = useContacts();
  const { companies } = useCompanies();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const isEditing = !!opportunityId;
  const currentOpportunity = isEditing ? opportunities.find(o => o.id === opportunityId) : null;

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<Opportunity>();

  useEffect(() => {
    if (open) {
      if (currentOpportunity) {
        // Set form values for editing
        setValue('name', currentOpportunity.name);
        setValue('stage', currentOpportunity.stage);
        setValue('value', currentOpportunity.value || undefined);
        setValue('probability', currentOpportunity.probability || undefined);
        setValue('expected_close_date', currentOpportunity.expected_close_date || undefined);
        setValue('company_id', currentOpportunity.company_id || undefined);
        setValue('contact_id', currentOpportunity.contact_id || undefined);
        setValue('details', currentOpportunity.details || '');
      } else {
        // Reset form for new opportunity
        reset({
          name: '',
          stage: currentPipeline?.stages[0]?.id || '',
          value: undefined,
          probability: undefined,
          expected_close_date: undefined,
          company_id: undefined,
          contact_id: undefined,
          details: '',
        });
      }
    }
  }, [open, currentOpportunity, currentPipeline, reset, setValue]);

  const onSubmit = async (data: any) => {
    try {
      if (!currentPipeline) return;
      
      if (isEditing && currentOpportunity) {
        await updateOpportunity({
          ...data,
          id: currentOpportunity.id,
          pipeline_id: currentPipeline.id,
        });
      } else {
        await addOpportunity({
          ...data,
          pipeline_id: currentPipeline.id,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving opportunity:', error);
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    setValue('expected_close_date', date ? format(date, 'yyyy-MM-dd') : undefined);
    setDatePickerOpen(false);
  };

  if (!currentPipeline) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Deal Name *
              </label>
              <Input
                id="name"
                {...register('name', { required: 'Deal name is required' })}
                placeholder="Enter deal name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="stage" className="block text-sm font-medium mb-1">
                Stage *
              </label>
              <Select 
                defaultValue={currentOpportunity?.stage || currentPipeline.stages[0]?.id}
                onValueChange={(value) => setValue('stage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {currentPipeline.stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="value" className="block text-sm font-medium mb-1">
                  Value
                </label>
                <Input
                  id="value"
                  type="number"
                  {...register('value', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Value must be positive' }
                  })}
                  placeholder="0.00"
                />
                {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value.message}</p>}
              </div>

              <div>
                <label htmlFor="probability" className="block text-sm font-medium mb-1">
                  Probability (%)
                </label>
                <Input
                  id="probability"
                  type="number"
                  {...register('probability', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Probability must be between 0 and 100' },
                    max: { value: 100, message: 'Probability must be between 0 and 100' }
                  })}
                  placeholder="0"
                />
                {errors.probability && <p className="text-red-500 text-sm mt-1">{errors.probability.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Expected Close Date
              </label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", 
                    !currentOpportunity?.expected_close_date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentOpportunity?.expected_close_date ? 
                      format(new Date(currentOpportunity.expected_close_date), "PPP") : 
                      "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentOpportunity?.expected_close_date ? 
                      new Date(currentOpportunity.expected_close_date) : undefined}
                    onSelect={handleSelectDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label htmlFor="company_id" className="block text-sm font-medium mb-1">
                Company
              </label>
              <Select 
                defaultValue={currentOpportunity?.company_id || undefined}
                onValueChange={(value) => setValue('company_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="contact_id" className="block text-sm font-medium mb-1">
                Contact
              </label>
              <Select 
                defaultValue={currentOpportunity?.contact_id || undefined}
                onValueChange={(value) => setValue('contact_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium mb-1">
                Details
              </label>
              <Textarea
                id="details"
                {...register('details')}
                placeholder="Enter deal details"
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update' : 'Create'} Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
