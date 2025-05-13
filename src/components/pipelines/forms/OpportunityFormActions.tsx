
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

interface OpportunityFormActionsProps {
  onCancel: () => void;
  isEditing: boolean;
  isSubmitting?: boolean;
}

export const OpportunityFormActions: React.FC<OpportunityFormActionsProps> = ({
  onCancel,
  isEditing,
  isSubmitting = false
}) => {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isEditing ? 'Update' : 'Create'} Deal
      </Button>
    </DialogFooter>
  );
};
