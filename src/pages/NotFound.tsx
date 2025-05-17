
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-medium text-gray-900">404</h1>
        <h2 className="text-xl font-medium mt-4 text-gray-800">Page Not Found</h2>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
                  <Button asChild className="mt-8 bg-gray-900 hover:bg-gray-800 text-white">
          <Link to="/app/dashboard">
            <Home size={16} className="mr-2" />
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
