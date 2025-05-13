
import React, { useState } from 'react';
import { useNotes, Note, NoteCategory } from '@/contexts/NotesContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface NotesListProps {
  onEdit: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ onEdit }) => {
  const { notes, deleteNote } = useNotes();
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredNotes = notes.filter(note => {
    const categoryMatch = categoryFilter === 'all' || note.category === categoryFilter;
    const searchMatch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const getCategoryBadge = (category: NoteCategory) => {
    switch (category) {
      case 'meeting':
        return <Badge className="bg-purple-500">Meeting</Badge>;
      case 'call':
        return <Badge className="bg-blue-500">Call</Badge>;
      case 'email':
        return <Badge className="bg-green-500">Email</Badge>;
      case 'general':
        return <Badge>General</Badge>;
      case 'other':
        return <Badge className="bg-gray-500">Other</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <div className="w-full sm:w-40">
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as NoteCategory | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No notes found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{note.title}</h3>
                  <div>{getCategoryBadge(note.category)}</div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 flex-grow">
                <p className="text-sm line-clamp-4 text-gray-600">{note.content}</p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {note.relatedCompany && (
                  <p className="text-xs text-gray-500 mt-2">
                    Related to: {note.relatedCompany}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(note.createdAt), 'MMM d, yyyy')}
                </div>
                <div className="space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(note)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;
