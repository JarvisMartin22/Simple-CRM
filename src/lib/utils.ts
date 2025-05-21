
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUrl(url: string, protocol: string = 'https://'): string {
  if (!url) return '';
  
  if (url.startsWith('http://') || url.startsWith('https://') || 
      url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }
  
  return `${protocol}${url}`;
}

export const flexibleUrlSchema = (message = 'Please enter a valid URL') => ({
  validate: (value: string) => {
    if (!value) return true; // Empty is valid (for optional fields)
    
    // Simple URL validation
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
    return urlPattern.test(value) || message;
  }
});
