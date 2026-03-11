import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<{ success: boolean; error: string | null }>;
  signIn: (data: { email: string; password: string }) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  getRandomAvatar: () => string;
}

const LocalAuthContext = createContext<AuthContextType | undefined>(undefined);

export const LocalAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        const savedUser = localStorage.getItem('localUser');
        
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const getRandomAvatar = (): string => {
    const avatars = [
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346816765-lyg2xtd3xj.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346819012-8f4hfxog99m.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346821157-xdv69ctdvu.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346823722-pyvtfk9hzi.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346824830-b3q9imgdj3.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346826084-0xwbjcpkesd.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346827215-hfp5d5ddq7f.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346829971-o5z88n3hfc9.png'
    ];
    
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const signUp = async ({ email, password, full_name, phone_number }: { email: string; password: string; full_name: string; phone_number?: string }) => {
    try {
      console.log('Starting local signup process...');
      
      const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      
      if (existingUser) {
        return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' };
      }
      
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password,
        full_name,
        phone_number: phone_number || '',
        avatar_url: getRandomAvatar(),
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('localUsers', JSON.stringify(users));
      
      const marketingUsers = JSON.parse(localStorage.getItem('marketingUsers') || '[]');
      marketingUsers.push({
        email,
        full_name,
        phone_number: phone_number || '',
        signup_date: new Date().toISOString()
      });
      localStorage.setItem('marketingUsers', JSON.stringify(marketingUsers));
      
      console.log('User registered successfully:', newUser.email);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in local signUp:', error);
      return { success: false, error: error.message || 'حدث خطأ أثناء إنشاء الحساب' };
    }
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      console.log('Starting local login process...');
      
      const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        return { success: false, error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' };
      }
      
      const sessionUser = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url
      };
      
      localStorage.setItem('localUser', JSON.stringify(sessionUser));
      setUser(sessionUser);
      
      console.log('User logged in successfully:', user.email);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in local signIn:', error);
      return { success: false, error: error.message || 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('localUser');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        return { success: false, error: 'البريد الإلكتروني غير مسجل' };
      }
      
     
      
      console.log('Password reset requested for:', email);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      return { success: false, error: error.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور' };
    }
  };

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    getRandomAvatar
  };

  return <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>;
};

export const useLocalAuth = () => {
  const context = useContext(LocalAuthContext);
  if (context === undefined) {
    throw new Error('useLocalAuth must be used within a LocalAuthProvider');
  }
  return context;
};