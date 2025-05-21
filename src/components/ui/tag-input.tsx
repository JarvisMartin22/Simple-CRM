
import React, { KeyboardEvent, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  id?: string;
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  id,
  placeholder = "Add tag...",
  tags,
  setTags,
  maxTags = 10,
  className,
  disabled = false,
}: TagInputProps) {
  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter or comma press
    if ((e.key === 'Enter' || e.key === ',') && input.trim() !== '') {
      e.preventDefault();
      const newTag = input.trim().replace(/,/g, '');
      
      // Check if the tag already exists
      if (!tags.includes(newTag)) {
        // Only add the tag if we haven't reached the maximum
        if (tags.length < maxTags) {
          setTags([...tags, newTag]);
          setInput('');
        }
      }
    }
    
    // Remove the last tag on Backspace if the input is empty
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      const newTags = [...tags];
      newTags.pop();
      setTags(newTags);
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1 border border-input p-1 rounded-md", className)}>
      {tags.map((tag, index) => (
        <Badge 
          key={`${tag}-${index}`}
          variant="secondary"
          className="py-1 px-2 text-xs flex items-center gap-1"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => removeTag(index)}
            >
              <X size={14} />
              <span className="sr-only">Remove {tag}</span>
            </button>
          )}
        </Badge>
      ))}
      
      {(!maxTags || tags.length < maxTags) && !disabled && (
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[120px] border-0 p-1 shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  );
}
