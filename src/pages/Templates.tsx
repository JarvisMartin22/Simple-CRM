import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useCampaignTemplates } from '@/hooks/useCampaignTemplates';
import TemplateEditor from '@/components/email/TemplateEditor';
import { Plus, Search, Edit2, Trash2, Copy, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEmail } from '@/hooks/useEmail';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const Templates: React.FC = () => {
  const { loading, error, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useCampaignTemplates();
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const { sendEmail } = useEmail();
  
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      subject: '',
      content: '',
    },
  });
  
  React.useEffect(() => {
    const loadTemplates = async () => {
      const data = await fetchTemplates();
      setTemplates(data || []);
    };
    
    loadTemplates();
  }, [fetchTemplates]);
  
  const handleCreateTemplate = async (values: TemplateFormValues) => {
    try {
      setIsSubmitting(true);
      
      const template = await createTemplate({
        ...values,
        variables: {},
        name: values.name,
        description: values.description || '',
        subject: values.subject,
        content: values.content,
      });
      
      if (template) {
        setTemplates([template, ...templates]);
        form.reset();
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateTemplate = async (values: TemplateFormValues) => {
    if (!selectedTemplate) return;
    
    try {
      setIsSubmitting(true);
      
      const updated = await updateTemplate(selectedTemplate.id, {
        ...values,
        variables: selectedTemplate.variables,
      });
      
      if (updated) {
        setTemplates(templates.map(t => t.id === updated.id ? updated : t));
        setSelectedTemplate(null);
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteTemplate = async (template: any) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    const success = await deleteTemplate(template.id);
    
    if (success) {
      setTemplates(templates.filter(t => t.id !== template.id));
    }
  };
  
  const handleDuplicateTemplate = async (template: any) => {
    try {
      setIsSubmitting(true);
      
      const duplicate = await createTemplate({
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined,
      });
      
      if (duplicate) {
        setTemplates([duplicate, ...templates]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSendTest = async (email: string) => {
    if (!selectedTemplate) return;

    try {
      await sendEmail({
        to: email,
        subject: selectedTemplate.subject,
        body: selectedTemplate.content,
        trackOpens: true,
        trackClicks: true,
        isTest: true,
      });

      toast({
        title: 'Test email sent',
        description: 'Check your inbox for the test email',
      });
    } catch (error) {
      toast({
        title: 'Failed to send test email',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const availableVariables = {
    'contact.first_name': 'First Name',
    'contact.last_name': 'Last Name',
    'contact.email': 'Email',
    'contact.company': 'Company Name',
    'user.first_name': 'Your First Name',
    'user.last_name': 'Your Last Name',
    'user.email': 'Your Email',
    'user.company': 'Your Company Name',
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-medium">Email Templates</h1>
          <p className="text-muted-foreground mt-1">Create and manage your email templates</p>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? 'Update your email template details'
                  : 'Create a new email template for your campaigns'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  selectedTemplate ? handleUpdateTemplate : handleCreateTemplate
                )}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template name" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name to identify your template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template description" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional description to provide more context
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email subject" {...field} />
                      </FormControl>
                      <FormDescription>
                        The subject line of your email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content</FormLabel>
                      <FormControl>
                        <TemplateEditor
                          content={field.value}
                          subject={form.getValues('subject')}
                          onChange={field.onChange}
                          onSubjectChange={(subject) => form.setValue('subject', subject)}
                          variables={availableVariables}
                          recipientData={{
                            email: 'example@test.com',
                            firstName: 'John',
                            lastName: 'Doe',
                            company: 'Example Corp',
                          }}
                          onSendTest={handleSendTest}
                        />
                      </FormControl>
                      <FormDescription>
                        Use the editor to compose your email template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedTemplate(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {selectedTemplate ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      selectedTemplate ? 'Save Changes' : 'Create Template'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Edit2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Get started by creating your first email template
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="relative group">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{template.name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        form.reset({
                          name: template.name,
                          description: template.description,
                          subject: template.subject,
                          content: template.content,
                        });
                        setIsEditing(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium">Subject</div>
                    <div className="text-sm text-muted-foreground">
                      {template.subject}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Preview</div>
                    <div
                      className="text-sm text-muted-foreground line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: template.content }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look with sample data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <div className="font-medium">Subject</div>
              <div className="text-muted-foreground">
                {form.getValues('subject')}
              </div>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: form.getValues('content').replace(
                      /{{([^}]+)}}/g,
                      (_, variable) => {
                        const [category, field] = variable.split('.');
                        return category === 'contact'
                          ? `[Sample ${field}]`
                          : `[Your ${field}]`;
                      }
                    ),
                  }}
                />
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates; 