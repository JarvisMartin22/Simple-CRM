import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useContacts } from '@/contexts/ContactsContext';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().optional(),
  title: z.string().optional(),
  company_id: z.string().optional(),
  notes: z.string().optional(),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Company {
  id: string;
  name: string;
  domain?: string;
}

interface CreateContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateContactForm: React.FC<CreateContactFormProps> = ({
  open,
  onOpenChange,
}) => {
  const { addContact } = useContacts();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // Fetch companies for dropdown
  const { data: companies = [], isError: companiesError } = useQuery<Company[]>({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("Fetching companies for dropdown");
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, domain')
          .eq('user_id', user.id)
          .order('name');
          
        if (error) {
          console.error("Error fetching companies:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} companies for dropdown`);
        return data || [];
      } catch (error) {
        console.error("Error in company query:", error);
        return [];
      }
    },
    enabled: !!user?.id && open, // Only fetch when form is open
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      company_id: '',
      notes: '',
      website: '',
    },
  });
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset();
      setRenderError(null);
    }
  }, [open, form]);

  const onSubmit = async (values: FormValues) => {
    console.log("Form submitted with values:", values);
    try {
      setIsSubmitting(true);
      
      // Make sure domain is extracted from email
      let domain = null;
      if (values.email && values.email.includes('@')) {
        domain = values.email.split('@')[1];
      }
      
      // Use the addContact function from context
      await addContact({
        ...values,
        tags: [], // Initialize with empty tags array
        domain,
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating contact:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create contact",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rendering errors
  if (renderError) {
    return (
      <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="text-red-500">
            Error rendering contact form: {renderError}
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  try {
    return (
      <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email*</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Job Title" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="example.com" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Add any notes about this contact" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Contact"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    console.error("Error rendering contact form:", error);
    setRenderError(error instanceof Error ? error.message : String(error));
    return null; // Render nothing if there's an error
  }
};
