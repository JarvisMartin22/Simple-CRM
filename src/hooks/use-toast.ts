
import { toast as sonnerToast, type Toast } from 'sonner';

// Re-export the toast function
export function toast(props: Toast) {
  return sonnerToast(props);
}

// Re-export a useToast hook that returns the toast function
export const useToast = () => {
  return { toast };
};
