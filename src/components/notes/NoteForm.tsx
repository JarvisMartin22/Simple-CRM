
import React, { useState, useEffect } from 'react';
import { Note, NoteCategory, useNotes } from '@/contexts/NotesContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface NoteFormProps {
  note?: Note;
  onClose: () => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ note, onClose }) => {
  const isEditMode = !!note;
  const { addNote, updateNote } = useNotes();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    category: NoteCategory;
    tags: string[];
    relatedCompany: string;
    relatedContact: string;
    relatedDeal: string;
    relatedTask: string;
  }>({
    title: '',
    content: '',
    category: 'general',
    tags: [],
    relatedCompany: '',
    relatedContact: '',
    relatedDeal: '',
    relatedTask: '',
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        category: note.category,
        tags: [...note.tags], // Create a copy to avoid mutation
        relatedCompany: note.relatedCompany || '',
        relatedContact: note.relatedContact || '',
        relatedDeal: note.relatedDeal || '',
        relatedTask: note.relatedTask || '',
      });
    }
  }, [note]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Note title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Note content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && note) {
        updateNote(note.id, formData);
        toast({
          title: "Success",
          description: "Note updated successfully",
        });
      } else {
        addNote(formData);
        toast({
          title: "Success",
          description: "Note created successfully",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Note' : 'Create New Note'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter note title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter note content"
              rows={5}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags and press Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <button 
                      type="button"
                      onClick={() => removeTag(tag)} 
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {tag}</span>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="relatedCompany">Related Company</Label>
              <Input
                id="relatedCompany"
                name="relatedCompany"
                value={formData.relatedCompany}
                onChange={handleInputChange}
                placeholder="Enter company name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relatedContact">Related Contact</Label>
              <Input
                id="relatedContact"
                name="relatedContact"
                value={formData.relatedContact}
                onChange={handleInputChange}
                placeholder="Enter contact name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="relatedDeal">Related Deal</Label>
              <Input
                id="relatedDeal"
                name="relatedDeal"
                value={formData.relatedDeal}
                onChange={handleInputChange}
                placeholder="Enter deal name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relatedTask">Related Task</Label>
              <Input
                id="relatedTask"
                name="relatedTask"
                value={formData.relatedTask}
                onChange={handleInputChange}
                placeholder="Enter task name"
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditMode ? 'Update Note' : 'Create Note'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default NoteForm;
