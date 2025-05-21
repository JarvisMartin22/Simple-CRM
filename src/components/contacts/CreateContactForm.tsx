
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useContacts, Contact } from '@/contexts/ContactsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TagInput } from '@/components/ui/tag-input';
import { useCompanies } from '@/contexts/CompaniesContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  company_id: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function CreateContactForm({ open, onOpenChange }: CreateContactFormProps) {
  const { createContact } = useContacts();
  const { user } = useAuth();
  const { companies } = useCompanies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      company_id: '',
      website: '',
      notes: ''
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const contactData: Partial<Contact> = {
        ...values,
        tags,
        user_id: user.id // Include the user_id from auth context
      };

      await createContact(contactData);
      toast.success('Contact created successfully');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create contact:', error);
      toast.error('Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setTags([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input 
                id="first_name" 
                {...form.register('first_name')} 
                placeholder="Enter first name" 
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input 
                id="last_name" 
                {...form.register('last_name')} 
                placeholder="Enter last name" 
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                {...form.register('email')} 
                type="email" 
                placeholder="Enter email address" 
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                {...form.register('phone')} 
                placeholder="Enter phone number" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input 
                id="title" 
                {...form.register('title')} 
                placeholder="Enter job title" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              <Select 
                onValueChange={(value) => form.setValue('company_id', value)} 
                defaultValue={form.getValues('company_id')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id || ''}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              {...form.register('website')} 
              placeholder="Enter website URL" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput 
              id="tags" 
              tags={tags} 
              setTags={setTags} 
              placeholder="Add tags..." 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              {...form.register('notes')} 
              placeholder="Enter notes about the contact" 
              className="min-h-[100px]" 
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
