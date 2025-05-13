
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates and formats URLs to ensure they have a proper protocol
 * Accepts common formats like "example.com" or "www.example.com"
 */
export function formatUrl(url: string): string {
  if (!url) return '';
  
  // If URL already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Add https:// prefix for common formats
  return `https://${url}`;
}

// Custom Zod URL validator that's more flexible with inputs
export const flexibleUrlSchema = z.string()
  .refine(
    (val) => {
      if (!val) return true; // Empty is valid (for optional fields)
      
      // Prepare URL for validation by ensuring it has a protocol
      const urlToValidate = formatUrl(val);
      
      try {
        // Check if it can be parsed as a valid URL
        new URL(urlToValidate);
        return true;
      } catch (error) {
        return false;
      }
    },
    { message: 'Please enter a valid website address' }
  )
  .transform(formatUrl); // Automatically format the URL when validated

