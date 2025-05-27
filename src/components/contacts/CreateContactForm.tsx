import { useState, useEffect } from 'react';
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
  contact?: Contact;
  mode?: 'create' | 'edit';
}

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company_id: z.string().optional().or(z.literal('none'))
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function CreateContactForm({ open, onOpenChange, contact, mode = 'create' }: CreateContactFormProps) {
  const { createContact, updateContact } = useContacts();
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
      company_id: 'none'
    },
  });

  // Set form values when editing a contact
  useEffect(() => {
    if (mode === 'edit' && contact) {
      form.reset({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company_id: contact.company_id || 'none'
      });
      setTags(contact.tags || []);
    }
  }, [contact, mode, form]);

  const onSubmit = async (values: ContactFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      console.log('Submitting contact with values:', values);
      console.log('Tags:', tags);
      
      const contactData: Partial<Contact> = {
        ...values,
        company_id: values.company_id === 'none' ? null : values.company_id,
        tags: tags,
        user_id: user.id
      };

      console.log('Prepared contact data:', contactData);

      if (mode === 'edit' && contact) {
        await updateContact(contact.id, contactData);
        toast.success('Contact updated successfully');
      } else {
        await createContact(contactData);
        toast.success('Contact created successfully');
      }
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to ${mode} contact:`, error);
      toast.error(`Failed to ${mode} contact`);
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
          <DialogTitle>{mode === 'edit' ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
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
              <Label htmlFor="company_id">Company</Label>
              <Select 
                onValueChange={(value) => form.setValue('company_id', value)} 
                defaultValue={form.getValues('company_id')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id || 'none'}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Contact' : 'Create Contact')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
