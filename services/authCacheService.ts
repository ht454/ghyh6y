import { User, Session } from '@supabase/supabase-js';
import { cacheService, CACHE_KEYS, CACHE_EXPIRATION } from './cacheService';
import { supabase } from './supabaseClient';

// Auth-specific cache keys
const AUTH_CACHE_KEYS = {
  USER: CACHE_KEYS.AUTH_USER,
  SESSION: CACHE_KEYS.AUTH_SESSION,
  PROFILE: CACHE_KEYS.USER_PROFILE,
  PREFERENCES: CACHE_KEYS.USER_PREFERENCES,
  LAST_ACTIVE: 'auth_last_active',
  LOGIN_ATTEMPTS: 'auth_login_attempts',
  REMEMBER_ME: 'auth_remember_me',
};

/**
 * Service for handling authentication-related caching
 */
class AuthCacheService {
  /**
   * Cache user authentication data
   */
  public cacheUser(user: User | null): void {
    try {
      if (user) {
        console.log('Caching user data, ID:', user.id);
        cacheService.set(AUTH_CACHE_KEYS.USER, user, {
          storage: 'local',
          expiration: CACHE_EXPIRATION.AUTH,
          secure: true
        });
        
        // Update last active timestamp
        this.updateLastActive();
      } else {
        console.log('Removing cached user data');
        cacheService.remove(AUTH_CACHE_KEYS.USER);
      }
    } catch (error) {
      console.error('Error caching user data:', error);
    }
  }

  /**
   * Get cached user
   */
  public getCachedUser(): User | null {
    try {
      const user = cacheService.get<User>(AUTH_CACHE_KEYS.USER, {
        storage: 'local',
        secure: true
      });
      console.log('Retrieved cached user:', user ? 'found' : 'not found');
      return user;
    } catch (error) {
      console.error('Error getting cached user:', error);
      return null;
    }
  }

  /**
   * Cache session data
   */
  public cacheSession(session: Session | null, rememberMe: boolean = false): void {
    try {
      if (session) {
        console.log('Caching session data, expires at:', session.expires_at);
        
        // Always store in localStorage for better persistence
        const storage = 'local';
        
        // Store session with expiration based on session expiry
        const expiresAt = session.expires_at ? new Date(session.expires_at).getTime() : Date.now() + CACHE_EXPIRATION.AUTH;
        const expiration = Math.max(0, expiresAt - Date.now());
        
        cacheService.set(AUTH_CACHE_KEYS.SESSION, session, {
          storage,
          expiration: expiration || CACHE_EXPIRATION.AUTH,
          secure: true
        });
        
        // Store remember me preference
        cacheService.set(AUTH_CACHE_KEYS.REMEMBER_ME, rememberMe, {
          storage: 'local',
          expiration: CACHE_EXPIRATION.AUTH * 2 // Longer expiration for preference
        });
      } else {
        console.log('Removing cached session data');
        cacheService.remove(AUTH_CACHE_KEYS.SESSION, { storage: 'local' });
        cacheService.remove(AUTH_CACHE_KEYS.SESSION, { storage: 'session' });
      }
    } catch (error) {
      console.error('Error caching session data:', error);
    }
  }

  /**
   * Get cached session
   */
  public getCachedSession(): Session | null {
    // Try to get from session storage first
    let session = cacheService.get<Session>(AUTH_CACHE_KEYS.SESSION, {
      storage: 'session',
      secure: true
    });
    
    // If not found, try local storage (for "remember me" users)
    if (!session) {
      session = cacheService.get<Session>(AUTH_CACHE_KEYS.SESSION, {
        storage: 'local',
        secure: true
      });
    }
    
    return session;
  }

  /**
   * Cache user profile
   */
  public cacheUserProfile(profile: any): void {
    try {
      if (profile) {
        console.log('Caching user profile, ID:', profile.id);
        cacheService.set(AUTH_CACHE_KEYS.PROFILE, profile, {
          storage: 'local',
          expiration: CACHE_EXPIRATION.USER_PROFILE
        });
      } else {
        console.log('Removing cached profile data');
        cacheService.remove(AUTH_CACHE_KEYS.PROFILE);
      }
    } catch (error) {
      console.error('Error caching user profile:', error);
    }
  }

  /**
   * Get cached user profile
   */
  public getCachedUserProfile(): any {
    return cacheService.get(AUTH_CACHE_KEYS.PROFILE, {
      storage: 'local',
      fallback: async () => {
        const user = this.getCachedUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          return data;
        }
        return null;
      }
    });
  }

  /**
   * Cache user preferences
   */
  public cacheUserPreferences(preferences: any): void {
    if (preferences) {
      cacheService.set(AUTH_CACHE_KEYS.PREFERENCES, preferences, {
        storage: 'local',
        expiration: CACHE_EXPIRATION.AUTH
      });
    } else {
      cacheService.remove(AUTH_CACHE_KEYS.PREFERENCES);
    }
  }

  /**
   * Get cached user preferences
   */
  public getCachedUserPreferences(): any {
    return cacheService.get(AUTH_CACHE_KEYS.PREFERENCES, {
      storage: 'local'
    });
  }

  /**
   * Update last active timestamp
   */
  private updateLastActive(): void {
    cacheService.set(AUTH_CACHE_KEYS.LAST_ACTIVE, Date.now(), {
      storage: 'local',
      expiration: CACHE_EXPIRATION.AUTH * 2 // Longer expiration for activity tracking
    });
  }

  /**
   * Get last active timestamp
   */
  public getLastActive(): number | null {
    return cacheService.get<number>(AUTH_CACHE_KEYS.LAST_ACTIVE, {
      storage: 'local'
    });
  }

  /**
   * Track login attempts (for rate limiting)
   */
  public trackLoginAttempt(email: string, success: boolean): void {
    const attempts = cacheService.get<Record<string, any[]>>(AUTH_CACHE_KEYS.LOGIN_ATTEMPTS, {
      storage: 'local'
    }) || {};
    
    const userAttempts = attempts[email] || [];
    
    userAttempts.push({
      timestamp: Date.now(),
      success
    });
    
    // Keep only the last 5 attempts
    if (userAttempts.length > 5) {
      userAttempts.shift();
    }
    
    attempts[email] = userAttempts;
    
    cacheService.set(AUTH_CACHE_KEYS.LOGIN_ATTEMPTS, attempts, {
      storage: 'local',
      expiration: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  /**
   * Check if login should be rate limited
   */
  public shouldRateLimit(email: string): boolean {
    const attempts = cacheService.get<Record<string, any[]>>(AUTH_CACHE_KEYS.LOGIN_ATTEMPTS, {
      storage: 'local'
    }) || {};
    
    const userAttempts = attempts[email] || [];
    
    // If less than 3 attempts, no rate limiting
    if (userAttempts.length < 3) {
      return false;
    }
    
    // Count failed attempts in the last 15 minutes
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentFailedAttempts = userAttempts.filter(
      attempt => !attempt.success && attempt.timestamp > fifteenMinutesAgo
    );
    
    // Rate limit if 3 or more failed attempts in the last 15 minutes
    return recentFailedAttempts.length >= 3;
  }

  /**
   * Clear all auth-related cache
   */
  public clearAuthCache(): void {
    try {
      console.log('Clearing all auth-related cache');
      cacheService.remove(AUTH_CACHE_KEYS.USER);
      cacheService.remove(AUTH_CACHE_KEYS.SESSION, { storage: 'local' });
      cacheService.remove(AUTH_CACHE_KEYS.SESSION, { storage: 'session' });
      cacheService.remove(AUTH_CACHE_KEYS.PROFILE);
      cacheService.remove(AUTH_CACHE_KEYS.PREFERENCES);
      // Don't clear login attempts (for security)
    } catch (error) {
      console.error('Error clearing auth cache:', error);
    }
  }

  /**
   * Check if "remember me" is enabled
   */
  public isRememberMeEnabled(): boolean {
    return cacheService.get<boolean>(AUTH_CACHE_KEYS.REMEMBER_ME, {
      storage: 'local'
    }) || false;
  }
}

// Export singleton instance
export const authCacheService = new AuthCacheService();