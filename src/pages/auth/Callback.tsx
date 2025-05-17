import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Callback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Process the authentication response on component mount
    const handleAuthCallback = async () => {
      const { hash } = window.location;
      
      if (hash && hash.includes('access_token')) {
        // Process the hash with Supabase
        const { data: authData, error } = await supabase.auth.getSession();
        
        if (error) {
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: error.message,
          });
          navigate('/auth/login');
          return;
        }
        
        if (authData?.session) {
          // Successfully authenticated
          toast({
            title: "Email verified",
            description: "Your account has been verified successfully!",
          });
          
          // Redirect to dashboard
          navigate('/app/dashboard');
        }
      } else {
        // No auth data in URL, redirect to login
        navigate('/auth/login');
      }
    };
    
    handleAuthCallback();
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