import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, checkSupabaseConnection, onConnectionStateChange, getConnectionState } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';
import { authCacheService } from '../services/authCacheService'; 

interface UserProfile {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  retryConnection: () => Promise<boolean>;
  signUp: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<{ success: boolean; error: string | null }>;
  signIn: (data: { email: string; password: string }) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  getRandomAvatar: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Try to get from cache first
    const cachedProfile = authCacheService.getCachedUserProfile();
    console.log('Initial cached profile:', cachedProfile ? 'found' : 'not found');
    return cachedProfile;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>(() => getConnectionState());
  const connectionCheckIntervalRef = React.useRef<number | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      console.log('AuthContext: Checking session on initialization');
      
      try {
        console.log('Checking for existing session...');
        
        const isConnected = await checkSupabaseConnection();
        console.log('Connection check result:', isConnected ? 'connected' : 'disconnected');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Active session found, user ID:', session.user.id);
          
          // Cache user data
          authCacheService.cacheUser(session.user);
          
          setUser(session.user);
          
          // Fetch profile in background but don't wait for it to complete
          fetchUserProfile(session.user.id).catch(err => {
            console.error('Error fetching profile during initialization:', err);
          });
          
          // Mark auth as complete even if profile fetch is still in progress
          setAuthCheckComplete(true);
          setIsLoading(false);
        } else {
          console.log('No active session found');
          setUser(null);
          setProfile(null);
          setAuthCheckComplete(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error during initial session check:', error);
        // Try to recover from cache if possible
        const cachedUser = authCacheService.getCachedUser();
        const cachedProfile = authCacheService.getCachedUserProfile();
        
        if (cachedUser) {
          console.log('Recovering from cached user data during connection error');
          setUser(cachedUser);
          setProfile(cachedProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setUser(null);
        setProfile(null);
        setAuthCheckComplete(true);
        setIsLoading(false);
      }
    };
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed event:', event, session?.user?.id);
      
      if (session?.user) {
        console.log('User authenticated, setting user state');
        setUser(session.user);

        // Cache user data
        authCacheService.cacheUser(session.user);
        authCacheService.cacheSession(session);
        
        // Fetch profile in background
        fetchUserProfile(session.user.id).catch(err => {
          console.error('Error fetching profile during auth state change:', err);
        });
        
        // Don't wait for profile fetch to complete
        setAuthCheckComplete(true);
        setIsLoading(false);
      } else {
        console.log('User signed out or session expired');
        setUser(null);
        setProfile(null);
        
        // Clear auth cache
        authCacheService.clearAuthCache();
        
        setAuthCheckComplete(true);
        setIsLoading(false);
      }
    });
    
    checkSession();

    // Set up connection state change listener
    const unsubscribe = onConnectionStateChange((state) => {
      setConnectionStatus(state);
      
      // If connection is restored, refresh auth state
      if (state === 'connected' && connectionStatus === 'disconnected') {
        console.log('Connection restored, refreshing auth state');
        checkSession();
      }
    });
    
    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, []);
  
  const retryConnection = async (): Promise<boolean> => {
    setConnectionStatus('connecting');
    console.log('Manually retrying connection...');
    try {
      const isConnected = await checkSupabaseConnection();
      console.log('Manual connection retry result:', isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      console.error('Error retrying connection:', error);
      return false;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      let profileData = null;
      
      // First try to get profile by user_id
      const { data: idProfileData, error: profileError } = await supabase 
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile by user_id:', profileError);
      } else if (idProfileData) {
        profileData = idProfileData;
        console.log('Profile found by user_id:', profileData);
      }

      // If not found, profile doesn't exist
      if (!profileData) {
        console.log('Profile not found, attempting to create a new one');
        try {
          const createdProfile = await createProfile(userId);
          if (createdProfile) {
            console.log('Profile created successfully:', createdProfile);
            
            // Cache profile data
            authCacheService.cacheUserProfile(createdProfile);
            
            setProfile(createdProfile);
          } else {
            console.error('Failed to create profile, using fallback profile');
            // Create a fallback profile from cached user data
            const fallbackProfile = createFallbackProfile(userId);
            setProfile(fallbackProfile);
          }
        } catch (profileCreationError) {
          console.error('Profile creation failed with error:', profileCreationError);
          // Create a fallback profile from cached user data
          const fallbackProfile = createFallbackProfile(userId);
          setProfile(fallbackProfile);
        }
      } else {
        // Cache profile data
        authCacheService.cacheUserProfile(profileData);
        
        setProfile(profileData);
      }
      
      setAuthCheckComplete(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Create a fallback profile from cached user data
      const fallbackProfile = createFallbackProfile(userId);
      setProfile(fallbackProfile);
      setAuthCheckComplete(true);
      setIsLoading(false);
    }
  };

  const createFallbackProfile = (userId: string): UserProfile => {
    console.log('Creating fallback profile for user:', userId);
    
    // Try to get cached user data first
    const cachedUser = authCacheService.getCachedUser();
    
    const fallbackProfile: UserProfile = {
      id: userId,
      user_id: userId,
      email: cachedUser?.email || user?.email || '',
      full_name: (cachedUser?.user_metadata?.full_name as string) || 
                 (user?.user_metadata?.full_name as string) || 
                 'مستخدم جديد',
      phone_number: (cachedUser?.user_metadata?.phone_number as string) || 
                    (user?.user_metadata?.phone_number as string) || 
                    '',
      avatar_url: (cachedUser?.user_metadata?.avatar_url as string) || 
                  (user?.user_metadata?.avatar_url as string) || 
                  getRandomAvatar()
    };
    
    console.log('Fallback profile created:', fallbackProfile);
    
    // Cache the fallback profile
    authCacheService.cacheUserProfile(fallbackProfile);
    
    return fallbackProfile;
  };
  const createProfile = async (userId: string) => {
    try {
      console.log('Creating new profile for user:', userId);
      
      // Try to get cached user data first
      const cachedUser = authCacheService.getCachedUser();
      if (cachedUser) {
        console.log('Using cached user data for profile creation');
        
        const newProfile = {
          user_id: userId,
          email: cachedUser.email || '',
          full_name: (cachedUser.user_metadata?.full_name as string) || 'مستخدم جديد',
          avatar_url: (cachedUser.user_metadata?.avatar_url as string) || getRandomAvatar(),
          phone_number: (cachedUser.user_metadata?.phone_number as string) || ''
        };
        
        const { data, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select();
          
        if (createError) {
          console.error('Error creating profile from cached data:', createError);
          throw createError;
        } else {
          console.log('Profile created successfully from cached data');
          return data?.[0];
        }
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Error getting user data for profile creation:', userError);
        throw new Error('Unable to get user data for profile creation');
      }
      
      const newProfile = {
        user_id: userId,
        email: userData.user.email || '',
        full_name: userData.user.user_metadata.full_name || 'مستخدم جديد',
        avatar_url: userData.user.user_metadata.avatar_url || getRandomAvatar(),
        phone_number: userData.user.user_metadata.phone_number || ''
      };
      
      const { data, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select();
        
      if (createError) {
        console.error('Error creating profile:', createError);
        throw createError;
      }
      
      const createdProfile = data?.[0];
      console.log('Profile created successfully:', createdProfile);
      
      // Cache profile data
      if (createdProfile) {
        authCacheService.cacheUserProfile(createdProfile);
      }
      
      return createdProfile;
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  };

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
      console.log('Starting signup process...');
      console.log('Signup data:', { email, full_name, phone_number });
      
      setIsLoading(true);
      
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            phone_number: phone_number || '',
            avatar_url: getRandomAvatar()
          }
        }
      });
      
      if (error) {
        console.error('Auth signup error:', error);
        setIsLoading(false);
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        console.log('User created successfully');
        
        // Cache user data
        authCacheService.cacheUser(data.user);
        
        console.log('User metadata:', data.user.user_metadata);
        
        try {
          const newProfile = {
            id: data.user.id,
            user_id: data.user.id,
            email: email,
            full_name: full_name,
            phone_number: phone_number || '',
            avatar_url: getRandomAvatar()
          };
          
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(newProfile);
            
          if (profileError) { 
            console.error('Error creating profile:', profileError);
          }  
        } catch (profileError) {
          console.error('Error in profile creation:', profileError);
        }

        await fetchUserProfile(data.user.id);

        setIsLoading(false);
        return { success: true, error: null };
        
      }
      
      setIsLoading(false);
      return { success: false, error: 'Failed to create user' };
    } catch (error: any) {
      console.error('Error in signUp:', error);
      setIsLoading(false);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      console.log('Starting signin process...');
      
      // Check connection before attempting sign in
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.error('Cannot sign in: No connection to Supabase');
        return { success: false, error: 'لا يمكن تسجيل الدخول: لا يوجد اتصال بقاعدة البيانات' };
      }
      
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Auth signin error:', error);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        console.log('User authenticated successfully:', data.user.id);
        setUser(data.user);

        // Cache user and session data
        authCacheService.cacheUser(data.user);
        authCacheService.cacheSession(data.session, true);
        console.log('User and session cached successfully');
        
        // Start profile fetch but don't wait for it
        fetchUserProfile(data.user.id).catch(err => {
          console.error('Error fetching profile during sign in:', err);
        });
        
        return { success: true, error: null };
      }
      
      return { success: false, error: 'Failed to sign in' };
    } catch (error: any) {
      console.error('Error in signIn:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    setIsLoading(true);
    
    try {
      // Clear auth cache
      authCacheService.clearAuthCache();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during sign out from Supabase:', error);
        // Continue with local sign out even if Supabase fails
      }
      
      // Always clear local state regardless of Supabase response
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      if (!user) {
        console.error('Cannot update profile: User not authenticated');
        return { success: false, error: 'Not authenticated' };
      }
      
      console.log('Updating profile for user:', user.id, updates);
      
      if (updates.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: updates.full_name }
        });
      }
      
      let updateError = null;
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Update profile cache
      if (profile) {
        authCacheService.cacheUserProfile({ ...profile, ...updates });
      }
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred while updating profile'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    profile,
    isLoading: isLoading,
    connectionStatus,
    retryConnection,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    getRandomAvatar
  };

  useEffect(() => {
    console.log('Auth state updated:', { 
      isLoading,
      authCheckComplete,
      hasUser: !!user,
      connectionStatus
    });
    
    if (authCheckComplete && isLoading) {
      console.log('Auth check complete but still loading, forcing loading to false');
      setIsLoading(false);
    }
  }, [isLoading, authCheckComplete, user, connectionStatus]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined && process.env.NODE_ENV !== 'development') {
    // In production, throw an error
    throw new Error('useAuth must be used within an AuthProvider');
  } else if (context === undefined) {
    // In development, provide a fallback to prevent crashes during hot reloading
    console.warn('useAuth was called outside of AuthProvider - using fallback');
    return {
      user: null,
      profile: null,
      isLoading: false,
      connectionStatus: 'disconnected' as 'connected' | 'disconnected' | 'checking',
      retryConnection: async () => false,
      signUp: async () => ({ success: false, error: 'Not implemented' }),
      signIn: async () => ({ success: false, error: 'Not implemented' }),
      signOut: async () => {},
      resetPassword: async () => ({ success: false, error: 'Not implemented' }),
      updateProfile: async () => ({ success: false, error: 'Not implemented' }),
      getRandomAvatar: () => ''
    };
  }
  return context;
};