import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getConnectionState } from '../services/supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/auth/login' 
}) => {
  // Get auth context with fallback for hot reloading scenarios
  const auth = useAuth();
  const user = auth?.user;
  const isLoading = auth?.isLoading || false;
  const connectionStatus = auth?.connectionStatus || getConnectionState();
  const navigate = useNavigate();
  
  console.log('ProtectedRoute render state:', { 
    isLoading, 
    hasUser: !!user,
    path: window.location.pathname,
    connectionStatus
  });

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('User not authenticated, redirecting to:', redirectTo);
      navigate(redirectTo);
    }
  }, [isLoading, user, navigate, redirectTo]);

  if (isLoading) {
    console.log('ProtectedRoute: Still loading authentication state');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg mb-2">جاري التحقق من حالة تسجيل الدخول...</p>
          <p className="text-gray-500 text-sm">يرجى الانتظار قليلاً</p>
          
          {}
          {connectionStatus !== 'connected' && (
            <div className="mt-4 bg-gray-800 rounded-lg p-3 max-w-xs mx-auto">
              <p className="text-sm text-gray-400">
                {connectionStatus === 'checking' ? 'جاري فحص الاتصال بقاعدة البيانات...' : 'مشكلة في الاتصال بقاعدة البيانات'}
              </p>
            </div>
          )}
        </div>
        
        {}
        <div className="mt-8 max-w-md mx-auto px-4">
          <p className="text-gray-500 text-sm text-center">
            إذا استمرت هذه الشاشة لفترة طويلة، يمكنك{' '}
            <button 
              onClick={() => navigate('/auth/login')}
              className="text-orange-500 hover:text-orange-400 underline"
            >
              العودة لصفحة تسجيل الدخول
            </button>
            {' '}والمحاولة مرة أخرى
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to={redirectTo} replace />;
  } else {
    console.log('ProtectedRoute: User is authenticated, rendering protected content');
    return <>{children}</>;
  }
};