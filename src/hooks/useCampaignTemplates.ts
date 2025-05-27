import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface CampaignTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  subject: string;
  content: string;
  variables?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export const useCampaignTemplates = () => {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('campaign_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setTemplates(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching templates',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createTemplate = useCallback(async (template: Omit<CampaignTemplate, 'id' | 'user_id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: createError } = await supabase
        .from('campaign_templates')
        .insert([template])
        .select()
        .single();
      
      if (createError) throw createError;
      
      setTemplates(prev => [data, ...prev]);
      toast({
        title: 'Template created',
        description: 'Successfully created new template.',
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error creating template',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<CampaignTemplate>) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('campaign_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      setTemplates(prev => prev.map(template => 
        template.id === id ? { ...template, ...data } : template
      ));
      
      toast({
        title: 'Template updated',
        description: 'Successfully updated template.',
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error updating template',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('campaign_templates')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      setTemplates(prev => prev.filter(template => template.id !== id));
      toast({
        title: 'Template deleted',
        description: 'Successfully deleted template.',
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error deleting template',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}; 