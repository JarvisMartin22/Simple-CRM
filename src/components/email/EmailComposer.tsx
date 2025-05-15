import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Send, X } from 'lucide-react';
import { useEmail } from '@/contexts/EmailContext';
import { toast } from '@/components/ui/use-toast';

// Simple rich text editor
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface EmailComposerProps {
  prefilledRecipient?: string;
  prefilledSubject?: string;
  contactId?: string;
  onClose?: () => void;
  onSent?: () => void;
  variant?: 'inline' | 'dialog';
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-1">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200' : ''}
      >
        B
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200' : ''}
      >
        I
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
      >
        • List
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
      >
        1. List
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive('link') ? 'bg-gray-200' : ''}
      >
        Link
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
      >
        Unlink
      </Button>
    </div>
  );
};

export function EmailComposer({
  prefilledRecipient = '',
  prefilledSubject = '',
  contactId,
  onClose,
  onSent,
  variant = 'dialog'
}: EmailComposerProps) {
  const [to, setTo] = useState(prefilledRecipient);
  const [subject, setSubject] = useState(prefilledSubject);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  
  const { sendEmail, isEmailSending, isEmailConnected } = useEmail();
  
  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline'
        }
      }),
      Placeholder.configure({
        placeholder: 'Write your email here...',
      }),
    ],
    content: '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to || !subject || !editor?.getHTML()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    if (!isEmailConnected) {
      toast({
        title: "Email not connected",
        description: "Please connect your email account first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await sendEmail({
        to,
        subject,
        body: editor?.getHTML() || '',
        trackOpens,
        trackClicks
      });
      
      // Reset form
      setTo('');
      setSubject('');
      editor?.commands.clearContent();
      
      if (onSent) {
        onSent();
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };
  
  return (
    <Card className={variant === 'inline' ? 'w-full' : 'w-[600px]'}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Compose Email</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label>Message</Label>
              <div className="border rounded-md overflow-hidden">
                <MenuBar editor={editor} />
                <EditorContent 
                  editor={editor} 
                  className="min-h-[200px] p-3 focus:outline-none prose max-w-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between space-x-2 pt-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="track-opens" 
                  checked={trackOpens} 
                  onCheckedChange={setTrackOpens}
                />
                <Label htmlFor="track-opens">Track opens</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="track-clicks" 
                  checked={trackClicks} 
                  onCheckedChange={setTrackClicks}
                />
                <Label htmlFor="track-clicks">Track link clicks</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-3">
          <Button 
            type="submit" 
            className="ml-auto" 
            disabled={isEmailSending || !isEmailConnected}
          >
            {isEmailSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 