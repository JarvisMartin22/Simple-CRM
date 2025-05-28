import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignTemplates } from '@/hooks/useCampaignTemplates';
import { ArrowLeft, ArrowRight, Loader2, Plus, Edit } from 'lucide-react';
import RecipientSelector from '@/components/campaign/RecipientSelector';
import CampaignScheduler from '@/components/campaign/CampaignScheduler';
import type { ScheduleConfig } from '@/components/campaign/CampaignScheduler';
import { Contact } from '@/types/contacts';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['one_time', 'automated', 'sequence']).default('one_time'),
  template_id: z.string().min(1, 'Template is required'),
  audience_filter: z.object({
    contacts: z.array(z.object({
      id: z.string(),
      email: z.string()
    })),
    size: z.number()
  }),
  schedule_config: z.any().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

const CampaignCreate: React.FC = () => {
  const navigate = useNavigate();
  const { createCampaign, loading: campaignLoading } = useCampaigns();
  const { templates, loading: templatesLoading, fetchTemplates } = useCampaignTemplates();
  const [activeStep, setActiveStep] = useState<'details' | 'recipients' | 'template' | 'schedule'>('details');
  const [selectedRecipients, setSelectedRecipients] = useState<Contact[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      type: 'one_time',
      template_id: '',
      audience_filter: {
        contacts: [],
        size: 0
      },
      schedule_config: undefined,
    },
  });

  const campaignType = form.watch('type');

  const onSubmit = async (values: CampaignFormValues) => {
    console.log('Form submission started', { values, selectedRecipients, scheduleConfig });
    
    try {
      // Validate required fields
      if (!values.name) {
        form.setError('name', { type: 'manual', message: 'Name is required' });
        return;
      }

      if (!values.type) {
        form.setError('type', { type: 'manual', message: 'Campaign type is required' });
        return;
      }

      if (!values.template_id) {
        form.setError('template_id', { type: 'manual', message: 'Template is required' });
        return;
      }

      if (selectedRecipients.length === 0) {
        form.setError('audience_filter', {
          type: 'manual',
          message: 'Please select at least one recipient',
        });
        return;
      }

      if (scheduleConfig.enabled) {
        if (!scheduleConfig.startDate) {
          form.setError('schedule_config', {
            type: 'manual',
            message: 'Please set a start date for the campaign',
          });
          return;
        }

        if (!scheduleConfig.startTime) {
          form.setError('schedule_config', {
            type: 'manual',
            message: 'Please set a start time for the campaign',
          });
          return;
        }
      }

      console.log('Validation passed, creating campaign...');

      const formattedScheduleConfig = scheduleConfig.enabled ? {
        enabled: scheduleConfig.enabled,
        timezone: scheduleConfig.timezone,
        startDate: scheduleConfig.startDate,
        startTime: scheduleConfig.startTime,
        recurringSchedule: scheduleConfig.recurringSchedule
      } : undefined;

      const scheduled_at = scheduleConfig.enabled && scheduleConfig.startDate && scheduleConfig.startTime
        ? new Date(new Date(scheduleConfig.startDate).setHours(
            parseInt(scheduleConfig.startTime.split(':')[0] || '0'),
            parseInt(scheduleConfig.startTime.split(':')[1] || '0')
          )).toISOString()
        : null;

      const campaign = await createCampaign({
        name: values.name,
        description: values.description,
        type: values.type,
        template_id: values.template_id,
        audience_filter: {
          contacts: selectedRecipients.map(contact => ({
            id: contact.id,
            email: contact.email,
          })),
          size: selectedRecipients.length,
        },
        schedule_config: formattedScheduleConfig,
        scheduled_at,
      });

      console.log('Campaign created:', campaign);

      if (campaign) {
        navigate(`/app/campaigns/${campaign.id}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleNext = () => {
    if (activeStep === 'details') {
      const detailsValid = form.trigger(['name', 'type']);
      if (detailsValid) {
        setActiveStep('recipients');
      }
    } else if (activeStep === 'recipients') {
      if (selectedRecipients.length > 0) {
        setActiveStep('template');
      } else {
        form.setError('audience_filter', {
          type: 'manual',
          message: 'Please select at least one recipient',
        });
      }
    } else if (activeStep === 'template') {
      const templateValid = form.trigger('template_id');
      if (templateValid) {
        setActiveStep('schedule');
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 'recipients') {
      setActiveStep('details');
    } else if (activeStep === 'template') {
      setActiveStep('recipients');
    } else if (activeStep === 'schedule') {
      setActiveStep('template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-medium">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">
            Create a new email campaign
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
      </div>

      <Tabs value={activeStep} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Campaign Details</TabsTrigger>
          <TabsTrigger value="recipients">Select Recipients</TabsTrigger>
          <TabsTrigger value="template">Email Template</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>
                    Enter the basic information about your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name to identify your campaign
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
                          <Textarea
                            placeholder="Enter campaign description"
                            className="resize-none"
                            {...field}
                          />
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="one_time">One-time Campaign</SelectItem>
                            <SelectItem value="automated">Automated Campaign</SelectItem>
                            <SelectItem value="sequence">Email Sequence</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose whether this is a one-time campaign or an automated sequence
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end mt-6">
                <Button type="button" onClick={handleNext}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="recipients">
              <Card>
                <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                  <CardDescription>
                    Choose the contacts who will receive this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecipientSelector
                    onSelectionChange={setSelectedRecipients}
                    initialSelection={selectedRecipients}
                  />
                  {form.formState.errors.audience_filter?.message && (
                    <p className="text-sm text-destructive mt-2">
                      {String(form.formState.errors.audience_filter.message)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
                <Button type="button" onClick={handleNext}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="template">
              <Card>
                <CardHeader>
                  <CardTitle>Email Template</CardTitle>
                  <CardDescription>
                    Choose a template for your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="template_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Template</FormLabel>
                          <div className="flex items-center gap-2">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templatesLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : templates.length === 0 ? (
                                  <div className="p-4 text-sm text-muted-foreground text-center">
                                    No templates available
                                  </div>
                                ) : (
                                  templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                      {template.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => navigate(`/app/templates?returnUrl=${encodeURIComponent('/app/campaigns/new')}`)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              New Template
                            </Button>
                          </div>
                          <FormDescription>
                            Choose an email template or create a new one for your campaign
                          </FormDescription>
                          <FormMessage />
                          
                          {field.value && templates.find(t => t.id === field.value) && (
                            <div className="mt-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Template Preview</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/app/templates?edit=${field.value}`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Template
                                </Button>
                              </div>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="space-y-2">
                                    <div>
                                      <div className="text-sm font-medium">Subject</div>
                                      <div className="text-sm text-muted-foreground">
                                        {templates.find(t => t.id === field.value)?.subject}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">Content Preview</div>
                                      <div 
                                        className="text-sm text-muted-foreground prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{
                                          __html: templates.find(t => t.id === field.value)?.content || ''
                                        }}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
                <Button type="button" onClick={handleNext}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="schedule">
              <CampaignScheduler
                campaignType={campaignType}
                initialConfig={scheduleConfig}
                onConfigChange={setScheduleConfig}
              />
              {form.formState.errors.schedule_config?.message && (
                <p className="text-sm text-destructive mt-2">
                  {String(form.formState.errors.schedule_config.message)}
                </p>
              )}

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
                <Button type="submit" disabled={campaignLoading}>
                  {campaignLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              </div>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default CampaignCreate; 