import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { authCacheService } from '../services/authCacheService';
import { User, Session } from '@supabase/supabase-js';

/**
 * Custom hook for authentication with caching
 */
export function useAuthWithCache() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from cache
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      try {
        // Try to get from cache first
        const cachedUser = authCacheService.getCachedUser();
        const cachedSession = authCacheService.getCachedSession();
        const cachedProfile = authCacheService.getCachedUserProfile();
        
        if (cachedUser && cachedSession) {
          setUser(cachedUser);
          setSession(cachedSession);
          setProfile(cachedProfile);
          
          // Verify with server in background
          verifySession();
        } else {
          // If not in cache, check with Supabase
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setUser(session.user);
            setSession(session);
            
            // Cache auth data
            authCacheService.cacheUser(session.user);
            authCacheService.cacheSession(session);
            
            // Fetch and cache profile
            fetchProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Verify session with server
  const verifySession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        setSession(session);
        
        // Update cache
        authCacheService.cacheUser(session.user);
        authCacheService.cacheSession(session);
        
        // Fetch profile if needed
        if (!profile) {
          fetchProfile(session.user.id);
        }
      } else {
        // Session is invalid, clear state and cache
        setUser(null);
        setSession(null);
        setProfile(null);
        authCacheService.clearAuthCache();
      }
    } catch (err) {
      console.error('Error verifying session:', err);
    }
  }, [profile]);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (data) {
        setProfile(data);
        authCacheService.cacheUserProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check for rate limiting
      if (authCacheService.shouldRateLimit(email)) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Track failed attempt
        authCacheService.trackLoginAttempt(email, false);
        throw error;
      }
      
      // Track successful attempt
      authCacheService.trackLoginAttempt(email, true);
      
      // Update state
      setUser(data.user);
      setSession(data.session);
      
      // Cache auth data
      authCacheService.cacheUser(data.user);
      authCacheService.cacheSession(data.session, rememberMe);
      
      // Fetch and cache profile
      if (data.user) {
        fetchProfile(data.user.id);
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      // Clear state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear cache
      authCacheService.clearAuthCache();
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: any) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update state
      setProfile(data);
      
      // Update cache
      authCacheService.cacheUserProfile(data);
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    user,
    session,
    profile,
    loading,
    error,
    signIn,
    signOut,
    updateProfile,
    refreshSession: verifySession
  };
}