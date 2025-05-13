
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCompanies } from '@/contexts/CompaniesContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const formSchema = z.object({
  company_name: z.string().min(1, { message: 'Company name is required' }),
  websites: z.string().url().optional().or(z.literal('')),
  assigned_to: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({
  open,
  onOpenChange,
}) => {
  const { companies, fields } = useCompanies();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: '',
      websites: '',
      assigned_to: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    try {
      // Get the context directly to access the setCompanies function
      const companiesContext = useCompanies();
      
      // Create new company with the form values
      const newCompany = {
        id: uuidv4(),
        ...values,
      };
      
      // Add the company to the context
      companiesContext.companies.push(newCompany);
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Show success toast
      toast.success("Company created successfully");
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Failed to create company");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="websites"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Company</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
