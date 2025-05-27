import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Variable,
  Eye,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

interface TemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
  variables?: Record<string, string>;
  onPreview?: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  content,
  onChange,
  variables = {},
  onPreview,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your email template here...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertVariable = useCallback((variable: string) => {
    if (!editor) return;
    
    editor
      .chain()
      .focus()
      .insertContent(`{{${variable}}}`)
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap bg-muted p-2 rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}
          className={editor.isActive('bold') ? 'bg-secondary' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic')}
          className={editor.isActive('italic') ? 'bg-secondary' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          data-active={editor.isActive('underline')}
          className={editor.isActive('underline') ? 'bg-secondary' : ''}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive('bulletList')}
          className={editor.isActive('bulletList') ? 'bg-secondary' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive('orderedList')}
          className={editor.isActive('orderedList') ? 'bg-secondary' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          data-active={editor.isActive({ textAlign: 'left' })}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-secondary' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          data-active={editor.isActive({ textAlign: 'center' })}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-secondary' : ''}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          data-active={editor.isActive({ textAlign: 'right' })}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-secondary' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          data-active={editor.isActive('link')}
          className={editor.isActive('link') ? 'bg-secondary' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Variable className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <div className="font-medium">Insert Variable</div>
              <div className="text-sm text-muted-foreground">
                Choose a variable to insert into your template
              </div>
              <div className="grid gap-1">
                {Object.keys(variables).map((key) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => insertVariable(key)}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    {variables[key]}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {onPreview && (
          <>
            <div className="w-px h-4 bg-border mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      <Card>
        <CardContent className="p-4">
          <EditorContent editor={editor} className="min-h-[200px] prose prose-sm max-w-none" />
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateEditor; 