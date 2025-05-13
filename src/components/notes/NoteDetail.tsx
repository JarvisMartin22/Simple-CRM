
import React from 'react';
import { Note } from '@/contexts/NotesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Building, User, BriefcaseIcon, Calendar, FileText, ClipboardList } from 'lucide-react';

interface NoteDetailProps {
  note: Note;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note }) => {
  const getCategoryBadge = (category: Note['category']) => {
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{note.title}</CardTitle>
          <div>{getCategoryBadge(note.category)}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-1">
          <p className="whitespace-pre-wrap">{note.content}</p>
        </div>
        
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 mt-2 border-t border-gray-100">
          {note.relatedCompany && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Related Company</p>
                <p className="text-sm font-medium">{note.relatedCompany}</p>
              </div>
            </div>
          )}
          
          {note.relatedContact && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Related Contact</p>
                <p className="text-sm font-medium">{note.relatedContact}</p>
              </div>
            </div>
          )}
          
          {note.relatedDeal && (
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Related Deal</p>
                <p className="text-sm font-medium">{note.relatedDeal}</p>
              </div>
            </div>
          )}

          {note.relatedTask && (
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Related Task</p>
                <p className="text-sm font-medium">{note.relatedTask}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Created: {format(new Date(note.createdAt), 'MMM dd, yyyy')} | 
            Last Modified: {format(new Date(note.updatedAt), 'MMM dd, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteDetail;
