
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the Note types
export type NoteCategory = 'general' | 'meeting' | 'call' | 'email' | 'other';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  relatedCompany?: string;
  relatedContact?: string;
  relatedDeal?: string;
  relatedTask?: string;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updatedNote: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
}

export const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Initial client meeting',
      content: 'Client expressed interest in our enterprise solution. Need to follow up with pricing options.',
      category: 'meeting',
      tags: ['client', 'enterprise', 'pricing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedCompany: 'Acme Inc',
    },
    {
      id: '2',
      title: 'Product feedback call',
      content: 'Client requested additional reporting features. Should discuss with product team.',
      category: 'call',
      tags: ['feedback', 'reporting', 'feature-request'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedCompany: 'XYZ Corp',
    },
    {
      id: '3',
      title: 'Contract renewal discussion',
      content: 'Client is considering upgrading to premium tier. Send proposal by end of week.',
      category: 'email',
      tags: ['renewal', 'upgrade', 'proposal'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedCompany: 'Acme Inc',
    }
  ]);

  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const updateNote = (id: string, updatedNote: Partial<Note>) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id
          ? { ...note, ...updatedNote, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
  };

  const getNote = (id: string) => {
    return notes.find((note) => note.id === id);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        addNote,
        updateNote,
        deleteNote,
        getNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
