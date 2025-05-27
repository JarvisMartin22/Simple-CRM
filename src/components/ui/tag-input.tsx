import React, { KeyboardEvent, useState, useRef, useEffect } from 'react';
import { X, Tag as TagIcon, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagInputProps {
  id?: string;
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
  availableTags?: string[];
}

export function TagInput({
  id,
  placeholder = "Add tag...",
  tags,
  setTags,
  maxTags = 10,
  className,
  disabled = false,
  availableTags = [],
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedInput = useRef(input);
  useEffect(() => {
    debouncedInput.current = input;
  }, [input]);

  const filteredTags = availableTags
    .filter(tag => 
      tag.toLowerCase().includes(debouncedInput.current.toLowerCase()) && 
      !tags.includes(tag)
    );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && (!maxTags || tags.length < maxTags)) {
      if (!tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
      }
    }
    setInput('');
    setOpen(false);
    setSelectedIndex(-1);
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setOpen(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredTags.length) {
        addTag(filteredTags[selectedIndex]);
      } else {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setSelectedIndex(prev => 
        prev < filteredTags.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 border border-input p-1.5 rounded-md bg-white/50 backdrop-blur-sm", className)}>
      {tags.map((tag, index) => (
        <Badge 
          key={`${tag}-${index}`}
          variant="secondary"
          className="py-1 px-2 text-xs flex items-center gap-1.5 bg-primary/10 hover:bg-primary/15 transition-colors"
        >
          <TagIcon size={12} className="text-primary/70" />
          {tag}
          {!disabled && (
            <button
              type="button"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
              onClick={() => removeTag(index)}
            >
              <X size={14} />
              <span className="sr-only">Remove {tag}</span>
            </button>
          )}
        </Badge>
      ))}
      
      {(!maxTags || tags.length < maxTags) && !disabled && (
        <div className="flex-1 min-w-[120px] relative" ref={inputRef}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Input
                  id={id}
                  type="text"
                  placeholder={placeholder}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full border-0 p-1 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
              </div>
            </PopoverTrigger>
            {(filteredTags.length > 0 || input.trim()) && (
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                <ScrollArea className="max-h-[200px]">
                  <div className="flex flex-col gap-0.5">
                    {filteredTags.map((tag, index) => (
                      <button
                        key={tag}
                        className={cn(
                          "text-sm px-2 py-1.5 text-left rounded-sm flex items-center gap-2 transition-colors",
                          selectedIndex === index ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        )}
                        onClick={() => addTag(tag)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <TagIcon size={14} className="text-muted-foreground/70" />
                        {tag}
                      </button>
                    ))}
                    {input.trim() && (
                      <button
                        className="text-sm px-2 py-1.5 text-left rounded-sm flex items-center gap-2 text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => addTag(input)}
                      >
                        <Plus size={14} />
                        Create tag "{input}"
                      </button>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            )}
          </Popover>
        </div>
      )}
    </div>
  );
}
