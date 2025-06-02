import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, MoveUp, MoveDown, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EmailPreview } from './EmailPreview';
import TemplateEditor from './TemplateEditor';

export interface EmailSection {
  id: string;
  type: 'header' | 'hero' | 'content' | 'cta' | 'footer';
  title: string;
  content: string;
  tracking?: boolean;
}

export interface EnhancedEmailTemplate {
  subject: string;
  preheader?: string;
  sections: EmailSection[];
}

interface EnhancedTemplateEditorProps {
  template: EnhancedEmailTemplate;
  onChange: (template: EnhancedEmailTemplate) => void;
  variables?: Record<string, string>;
  recipientData?: {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
  };
  onSendTest?: (email: string) => Promise<void>;
}

const SECTION_TYPES = [
  { value: 'header', label: 'Header', description: 'Logo and navigation' },
  { value: 'hero', label: 'Hero', description: 'Main message or banner' },
  { value: 'content', label: 'Content', description: 'Body content section' },
  { value: 'cta', label: 'Call to Action', description: 'Buttons and actions' },
  { value: 'footer', label: 'Footer', description: 'Footer information' },
];

const DEFAULT_CONTENT = {
  header: '<div style="text-align: center; padding: 20px;"><h1>{{company_name}}</h1></div>',
  hero: '<div style="padding: 40px 20px; text-align: center;"><h2>Welcome {{first_name}}!</h2><p>We\'re excited to have you here.</p></div>',
  content: '<div style="padding: 20px;"><p>Your content goes here...</p></div>',
  cta: '<div style="text-align: center; padding: 30px;"><a href="#" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Call to Action</a></div>',
  footer: '<div style="text-align: center; padding: 20px; font-size: 12px; color: #666;"><p>© {{company_name}} | <a href="#">Unsubscribe</a></p></div>',
};

const EnhancedTemplateEditor: React.FC<EnhancedTemplateEditorProps> = ({
  template,
  onChange,
  variables = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    company: 'Company',
    company_name: 'Your Company',
  },
  recipientData,
  onSendTest,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const addSection = useCallback((type: EmailSection['type']) => {
    const newSection: EmailSection = {
      id: `section-${Date.now()}`,
      type,
      title: SECTION_TYPES.find(t => t.value === type)?.label || 'Section',
      content: DEFAULT_CONTENT[type] || '',
      tracking: true,
    };

    onChange({
      ...template,
      sections: [...template.sections, newSection],
    });
  }, [template, onChange]);

  const updateSection = useCallback((sectionId: string, updates: Partial<EmailSection>) => {
    onChange({
      ...template,
      sections: template.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    });
  }, [template, onChange]);

  const removeSection = useCallback((sectionId: string) => {
    onChange({
      ...template,
      sections: template.sections.filter(section => section.id !== sectionId),
    });
  }, [template, onChange]);

  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    const index = template.sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= template.sections.length) return;

    const newSections = [...template.sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

    onChange({
      ...template,
      sections: newSections,
    });
  }, [template, onChange]);

  const generateFullHtml = useCallback(() => {
    const sectionsHtml = template.sections.map(section => {
      // Wrap each section in a div with tracking pixel
      return `
        <div id="${section.id}" class="email-section email-section-${section.type}">
          ${section.content}
          ${section.tracking ? `<!-- Section tracking: ${section.id} -->` : ''}
        </div>
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject}</title>
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; }
          .email-section { width: 100%; }
          .email-section-header { background: #f8f9fa; }
          .email-section-footer { background: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${template.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${template.preheader}</div>` : ''}
          ${sectionsHtml}
        </div>
      </body>
      </html>
    `;
  }, [template]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Template Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={template.subject}
              onChange={(e) => onChange({ ...template, subject: e.target.value })}
              placeholder="Enter email subject..."
            />
          </div>

          <div>
            <Label htmlFor="preheader">Preheader Text (Optional)</Label>
            <Input
              id="preheader"
              value={template.preheader || ''}
              onChange={(e) => onChange({ ...template, preheader: e.target.value })}
              placeholder="Preview text that appears after subject..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Email Sections</h3>
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <EmailPreview
                subject={template.subject}
                content={generateFullHtml()}
                recipientData={recipientData}
                onSendTest={onSendTest}
              />
            </DialogContent>
          </Dialog>
        </div>

        {template.sections.map((section, index) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {section.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({section.type})
                  </span>
                  {section.tracking && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Tracked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === template.sections.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSectionId === section.id ? (
                <div className="space-y-4">
                  <TemplateEditor
                    content={section.content}
                    onChange={(content) => updateSection(section.id, { content })}
                    variables={variables}
                  />
                  <Button
                    size="sm"
                    onClick={() => setEditingSectionId(null)}
                  >
                    Done Editing
                  </Button>
                </div>
              ) : (
                <div 
                  className="prose prose-sm max-w-none cursor-pointer hover:bg-gray-50 p-4 rounded"
                  onClick={() => setEditingSectionId(section.id)}
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-2 flex-wrap">
          {SECTION_TYPES.map((type) => (
            <Button
              key={type.value}
              variant="outline"
              size="sm"
              onClick={() => addSection(type.value as EmailSection['type'])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {type.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedTemplateEditor;