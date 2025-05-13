
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, FileText } from 'lucide-react';
import NotesList from '@/components/notes/NotesList';
import NoteForm from '@/components/notes/NoteForm';
import NoteDetail from '@/components/notes/NoteDetail';
import { Note } from '@/contexts/NotesContext';

const Notes: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsFormOpen(true);
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsViewDetailOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedNote(null);
  };

  const handleCloseDetail = () => {
    setIsViewDetailOpen(false);
    setSelectedNote(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-gray-700" />
          <h1 className="text-2xl font-medium text-gray-800">Notes</h1>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Note
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <NotesList onEdit={handleEditNote} />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <NoteForm
            note={selectedNote || undefined}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {selectedNote && <NoteDetail note={selectedNote} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
