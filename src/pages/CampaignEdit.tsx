import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignTemplates } from '@/hooks/useCampaignTemplates';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['one-time', 'sequence']),
  template_id: z.string().optional(),
  audience_filter: z.any().optional(),
  schedule_config: z.any().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

const CampaignEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { loading, error, fetchCampaigns, updateCampaign } = useCampaigns();
  const { loading: templatesLoading, fetchTemplates } = useCampaignTemplates();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
  });
  
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      // Load campaign
      const campaigns = await fetchCampaigns();
      const campaign = campaigns?.find(c => c.id === id);
      
      if (campaign) {
        setCampaign(campaign);
        form.reset({
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          template_id: campaign.template_id,
          audience_filter: campaign.audience_filter,
          schedule_config: campaign.schedule_config,
        });
      }
      
      // Load templates
      const templatesData = await fetchTemplates();
      setTemplates(templatesData || []);
    };
    
    loadData();
  }, [id, fetchCampaigns, fetchTemplates, form]);
  
  const onSubmit = async (values: CampaignFormValues) => {
    if (!campaign) return;
    
    try {
      setIsSubmitting(true);
      
      const updated = await updateCampaign(campaign.id, values);
      
      if (updated) {
        navigate(`/app/campaigns/${campaign.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/app/campaigns/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaign
        </Button>
      </div>
      
      <div>
        <h1 className="text-h1 font-medium">Edit Campaign</h1>
        <p className="text-muted-foreground mt-1">Update your campaign settings</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Edit the basic information for your campaign
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      Choose an email template or create a new one later
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/app/campaigns/${id}`)}
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
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignEdit; 