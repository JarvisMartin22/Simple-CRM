
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { usePipelines, Opportunity } from '@/contexts/PipelinesContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useCompanies } from '@/contexts/CompaniesContext';
import { FormField } from './forms/FormField';
import { DatePickerField } from './forms/DatePickerField';
import { SelectField } from './forms/SelectField';
import { OpportunityFormActions } from './forms/OpportunityFormActions';

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

  const handleDateChange = (date: Date | undefined) => {
    setValue('expected_close_date', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  if (!currentPipeline) return null;

  // Prepare data for select fields
  const stageOptions = currentPipeline.stages.map(stage => ({
    value: stage.id,
    label: stage.name
  }));

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  const contactOptions = contacts.map(contact => ({
    value: contact.id,
    label: `${contact.first_name} ${contact.last_name}`
  }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <FormField 
              id="name" 
              label="Deal Name" 
              required
              error={errors.name?.message}
            >
              <Input
                id="name"
                {...register('name', { required: 'Deal name is required' })}
                placeholder="Enter deal name"
              />
            </FormField>

            <FormField id="stage" label="Stage" required>
              <SelectField
                options={stageOptions}
                value={currentOpportunity?.stage || currentPipeline.stages[0]?.id}
                onValueChange={(value) => setValue('stage', value)}
                placeholder="Select a stage"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField 
                id="value" 
                label="Value"
                error={errors.value?.message}
              >
                <Input
                  id="value"
                  type="number"
                  {...register('value', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Value must be positive' }
                  })}
                  placeholder="0.00"
                />
              </FormField>

              <FormField 
                id="probability" 
                label="Probability (%)"
                error={errors.probability?.message}
              >
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
              </FormField>
            </div>

            <FormField id="expected_close_date" label="Expected Close Date">
              <DatePickerField
                selectedDate={currentOpportunity?.expected_close_date}
                onDateChange={handleDateChange}
                label="Expected Close Date"
              />
            </FormField>

            <FormField id="company_id" label="Company">
              <SelectField
                options={companyOptions}
                value={currentOpportunity?.company_id || ''}
                onValueChange={(value) => setValue('company_id', value)}
                placeholder="Select a company"
                emptyOption
              />
            </FormField>

            <FormField id="contact_id" label="Contact">
              <SelectField
                options={contactOptions}
                value={currentOpportunity?.contact_id || ''}
                onValueChange={(value) => setValue('contact_id', value)}
                placeholder="Select a contact"
                emptyOption
              />
            </FormField>

            <FormField id="details" label="Details">
              <Textarea
                id="details"
                {...register('details')}
                placeholder="Enter deal details"
                className="min-h-[100px]"
              />
            </FormField>
          </div>
          
          <OpportunityFormActions
            onCancel={onClose}
            isEditing={isEditing}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
