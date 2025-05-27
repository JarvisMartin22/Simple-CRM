import React, { useState } from 'react';
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
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import RecipientSelector from '@/components/campaign/RecipientSelector';
import CampaignScheduler from '@/components/campaign/CampaignScheduler';
import type { ScheduleConfig } from '@/components/campaign/CampaignScheduler';
import { Contact } from '@/types/contacts';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['one-time', 'sequence']),
  template_id: z.string().optional(),
  audience_filter: z.any().optional(),
  schedule_config: z.any().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

const CampaignCreate: React.FC = () => {
  const navigate = useNavigate();
  const { createCampaign, loading: campaignLoading } = useCampaigns();
  const { templates, loading: templatesLoading } = useCampaignTemplates();
  const [activeStep, setActiveStep] = useState<'details' | 'recipients' | 'template' | 'schedule'>('details');
  const [selectedRecipients, setSelectedRecipients] = useState<Contact[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'one-time',
      template_id: undefined,
      audience_filter: undefined,
      schedule_config: undefined,
    },
  });

  const campaignType = form.watch('type');

  const onSubmit = async (values: CampaignFormValues) => {
    if (selectedRecipients.length === 0) {
      form.setError('audience_filter', {
        type: 'manual',
        message: 'Please select at least one recipient',
      });
      return;
    }

    if (scheduleConfig.enabled && !scheduleConfig.startDate) {
      form.setError('schedule_config', {
        type: 'manual',
        message: 'Please set a start date for the campaign',
      });
      return;
    }

    const campaign = await createCampaign({
      ...values,
      audience_filter: {
        contacts: selectedRecipients.map(contact => ({
          id: contact.id,
          email: contact.email,
        })),
        size: selectedRecipients.length,
      },
      schedule_config: scheduleConfig.enabled ? scheduleConfig : undefined,
    });

    if (campaign) {
      navigate(`/app/campaigns/${campaign.id}`);
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
                            <SelectItem value="one-time">One-time Campaign</SelectItem>
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
                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Template</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormDescription>
                          Choose an email template for your campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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