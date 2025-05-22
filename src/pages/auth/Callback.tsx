import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Callback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    let mounted = true;
    
    // Process the authentication response on component mount
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: sessionError.message,
          });
          navigate('/auth/login');
          return;
        }

        if (session) {
          console.log('Session found in callback:', session.user.email);
          // Successfully authenticated
          toast({
            title: "Authentication successful",
            description: "You have been successfully logged in!",
          });
          
          // Redirect to dashboard
          navigate('/app/dashboard');
          return;
        }

        // If we get here, there's no session and no error - likely a direct visit to callback
        console.log('No session found in callback, redirecting to login');
        navigate('/auth/login');
      } catch (error: any) {
        console.error('Callback error:', error);
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: error.message || "An unexpected error occurred",
        });
        navigate('/auth/login');
      }
    };
    
    if (mounted) {
      handleAuthCallback();
    }

    return () => {
      mounted = false;
    };
  }, [navigate, toast]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default Callback; 