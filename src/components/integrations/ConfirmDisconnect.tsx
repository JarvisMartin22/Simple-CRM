import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ConfirmDisconnectProps {
  onConfirm: () => Promise<void>;
  isDisconnecting: boolean;
  serviceName?: string;
  children: React.ReactNode;
}

export const ConfirmDisconnect: React.FC<ConfirmDisconnectProps> = ({
  onConfirm,
  isDisconnecting,
  serviceName = 'integration',
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleConfirm = async () => {
    await onConfirm();
    setIsOpen(false);
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {serviceName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the {serviceName} integration from your account. Any connected features will stop working.
            You can reconnect at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                `Disconnect ${serviceName}`
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 