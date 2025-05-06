
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to Dashboard when accessing the root URL
    navigate('/');
  }, [navigate]);
  
  // This component won't render as we're redirecting,
  // but we'll include a simple fallback just in case
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Redirecting to Dashboard...</h1>
        <p className="text-xl text-gray-600">Please wait...</p>
      </div>
    </div>
  );
};

export default Index;
