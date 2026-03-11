import { supabase } from './supabaseClient';
import { cacheService } from './cacheService';

export interface GamingSession {
  id: string;
  userId: string;
  gameType: string;
  gameId?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  score: number;
  xpEarned: number;
  levelReached: number;
}

export interface SessionActivity {
  id: string;
  sessionId: string;
  userId: string;
  activityType: string;
  activityData: any;
  pointsEarned: number;
  timestamp: Date;
}

export interface SessionAchievement {
  id: string;
  sessionId: string;
  userId: string;
  achievementId: string;
  achievementName: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
}

export interface SessionInteraction {
  id: string;
  sessionId: string;
  userId: string;
  targetUserId?: string;
  interactionType: string;
  interactionData: any;
  timestamp: Date;
}

export interface SessionResource {
  id: string;
  sessionId: string;
  userId: string;
  resourceType: string;
  resourceId?: string;
  quantity: number;
  operation: 'gained' | 'used' | 'converted';
  timestamp: Date;
}

export interface SessionStats {
  userId: string;
  totalSessions: number;
  totalDuration: number;
  avgSessionDuration: number;
  totalScore: number;
  totalXp: number;
  completedSessions: number;
  abandonedSessions: number;
  preferredGameType?: string;
  peakPlayHour?: number;
  achievementsEarned: number;
  dailyStats?: Array<{
    date: string;
    sessions: number;
    duration: number;
    score: number;
    xp: number;
  }>;
}

class SessionService {
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_KEYS = {
    ACTIVE_SESSION: 'active_session',
    SESSION_STATS: 'session_stats',
  };

  /**
   * Start a new gaming session
   */
  async startSession(
    gameType: string,
    gameId?: string,
    deviceInfo?: any
  ): Promise<GamingSession | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      // Get user's IP address and user agent
      const ipAddress = null; // In a real app, this would be obtained from the server
      const userAgent = navigator.userAgent;

      // Call the start_gaming_session function
      const { data, error } = await supabase.rpc('start_gaming_session', {
        p_user_id: user.id,
        p_game_type: gameType,
        p_game_id: gameId,
        p_device_info: deviceInfo ? JSON.stringify(deviceInfo) : null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Error starting session:', error);
        return null;
      }

      // Get the created session
      const sessionId = data;
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_gaming_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching created session:', sessionError);
        return null;
      }

      // Format the session data
      const session: GamingSession = {
        id: sessionData.id,
        userId: sessionData.user_id,
        gameType: sessionData.game_type,
        gameId: sessionData.game_id,
        startedAt: new Date(sessionData.started_at),
        status: sessionData.status,
        score: sessionData.score,
        xpEarned: sessionData.xp_earned,
        levelReached: sessionData.level_reached
      };

      // Cache the active session
      cacheService.set(`${this.CACHE_KEYS.ACTIVE_SESSION}_${user.id}`, session, {
        expiration: this.CACHE_DURATION
      });

      return session;
    } catch (error) {
      console.error('Error in startSession:', error);
      return null;
    }
  }

  /**
   * End an active gaming session
   */
  async endSession(
    sessionId: string,
    score?: number,
    xpEarned?: number,
    levelReached?: number
  ): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Call the end_gaming_session function
      const { data, error } = await supabase.rpc('end_gaming_session', {
        p_session_id: sessionId,
        p_score: score,
        p_xp_earned: xpEarned,
        p_level_reached: levelReached
      });

      if (error) {
        console.error('Error ending session:', error);
        return false;
      }

      // Clear the active session from cache
      cacheService.remove(`${this.CACHE_KEYS.ACTIVE_SESSION}_${user.id}`);

      return true;
    } catch (error) {
      console.error('Error in endSession:', error);
      return false;
    }
  }

  /**
   * Pause an active gaming session
   */
  async pauseSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_gaming_sessions')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('status', 'active');

      if (error) {
        console.error('Error pausing session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in pauseSession:', error);
      return false;
    }
  }

  /**
   * Resume a paused gaming session
   */
  async resumeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_gaming_sessions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('status', 'paused');

      if (error) {
        console.error('Error resuming session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resumeSession:', error);
      return false;
    }
  }

  /**
   * Abandon a gaming session
   */
  async abandonSession(sessionId: string): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('user_gaming_sessions')
        .update({
          status: 'abandoned',
          ended_at: new Date().toISOString(),
          duration: supabase.sql`now() - started_at`,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .in('status', ['active', 'paused']);

      if (error) {
        console.error('Error abandoning session:', error);
        return false;
      }

      // Clear the active session from cache
      cacheService.remove(`${this.CACHE_KEYS.ACTIVE_SESSION}_${user.id}`);

      return true;
    } catch (error) {
      console.error('Error in abandonSession:', error);
      return false;
    }
  }

  /**
   * Get the current active session for the user
   */
  async getActiveSession(): Promise<GamingSession | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      // Try to get from cache first
      const cachedSession = cacheService.get<GamingSession>(
        `${this.CACHE_KEYS.ACTIVE_SESSION}_${user.id}`
      );
      
      if (cachedSession) {
        return cachedSession;
      }

      // Get from database
      const { data, error } = await supabase
        .from('user_gaming_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active session found
          return null;
        }
        console.error('Error fetching active session:', error);
        return null;
      }

      // Format the session data
      const session: GamingSession = {
        id: data.id,
        userId: data.user_id,
        gameType: data.game_type,
        gameId: data.game_id,
        startedAt: new Date(data.started_at),
        status: data.status,
        score: data.score,
        xpEarned: data.xp_earned,
        levelReached: data.level_reached
      };

      // Cache the active session
      cacheService.set(`${this.CACHE_KEYS.ACTIVE_SESSION}_${user.id}`, session, {
        expiration: this.CACHE_DURATION
      });

      return session;
    } catch (error) {
      console.error('Error in getActiveSession:', error);
      return null;
    }
  }

  /**
   * Record a user activity during a session
   */
  async recordActivity(
    sessionId: string,
    activityType: string,
    activityData: any = {},
    pointsEarned: number = 0
  ): Promise<string | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      // Call the record_session_activity function
      const { data, error } = await supabase.rpc('record_session_activity', {
        p_session_id: sessionId,
        p_user_id: user.id,
        p_activity_type: activityType,
        p_activity_data: activityData,
        p_points_earned: pointsEarned
      });

      if (error) {
        console.error('Error recording activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in recordActivity:', error);
      return null;
    }
  }

  /**
   * Update achievement progress during a session
   */
  async updateAchievement(
    sessionId: string,
    achievementId: string,
    achievementName: string,
    progress: number,
    completed: boolean = false
  ): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Check if achievement already exists for this session
      const { data: existingAchievement, error: checkError } = await supabase
        .from('session_achievements')
        .select('id, progress')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking achievement:', checkError);
        return false;
      }

      let completedAt = null;
      if (completed) {
        completedAt = new Date().toISOString();
      }

      if (existingAchievement) {
        // Update existing achievement
        const { error } = await supabase
          .from('session_achievements')
          .update({
            progress,
            completed,
            completed_at: completedAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAchievement.id);

        if (error) {
          console.error('Error updating achievement:', error);
          return false;
        }
      } else {
        // Insert new achievement
        const { error } = await supabase
          .from('session_achievements')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            achievement_id: achievementId,
            achievement_name: achievementName,
            progress,
            completed,
            completed_at: completedAt
          });

        if (error) {
          console.error('Error inserting achievement:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateAchievement:', error);
      return false;
    }
  }

  /**
   * Record an interaction with another player
   */
  async recordInteraction(
    sessionId: string,
    targetUserId: string,
    interactionType: string,
    interactionData: any = {}
  ): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Insert interaction
      const { error } = await supabase
        .from('session_interactions')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          target_user_id: targetUserId,
          interaction_type: interactionType,
          interaction_data: interactionData
        });

      if (error) {
        console.error('Error recording interaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in recordInteraction:', error);
      return false;
    }
  }

  /**
   * Record resource usage or gain
   */
  async recordResource(
    sessionId: string,
    resourceType: string,
    quantity: number,
    operation: 'gained' | 'used' | 'converted',
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Insert resource record
      const { error } = await supabase
        .from('session_resources')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          resource_type: resourceType,
          resource_id: resourceId,
          quantity,
          operation
        });

      if (error) {
        console.error('Error recording resource:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in recordResource:', error);
      return false;
    }
  }

  /**
   * Get user session statistics
   */
  async getUserStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<SessionStats | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      // Format dates
      const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
      const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;

      // Try to get from cache first
      const cacheKey = `${this.CACHE_KEYS.SESSION_STATS}_${user.id}_${formattedStartDate}_${formattedEndDate}`;
      const cachedStats = cacheService.get<SessionStats>(cacheKey);
      
      if (cachedStats) {
        return cachedStats;
      }

      // Call the get_user_session_stats function
      const { data, error } = await supabase.rpc('get_user_session_stats', {
        p_user_id: user.id,
        p_start_date: formattedStartDate,
        p_end_date: formattedEndDate
      });

      if (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }

      // Cache the stats
      cacheService.set(cacheKey, data, {
        expiration: this.CACHE_DURATION
      });

      return data;
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return null;
    }
  }

  /**
   * Get user session history
   */
  async getSessionHistory(
    page: number = 1,
    pageSize: number = 10,
    gameType?: string
  ): Promise<{ sessions: GamingSession[], count: number }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return { sessions: [], count: 0 };
      }

      // Build query
      let query = supabase
        .from('user_gaming_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      // Apply game type filter if provided
      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching session history:', error);
        return { sessions: [], count: 0 };
      }

      // Format the sessions
      const sessions: GamingSession[] = data.map(session => ({
        id: session.id,
        userId: session.user_id,
        gameType: session.game_type,
        gameId: session.game_id,
        startedAt: new Date(session.started_at),
        endedAt: session.ended_at ? new Date(session.ended_at) : undefined,
        duration: session.duration,
        status: session.status,
        score: session.score,
        xpEarned: session.xp_earned,
        levelReached: session.level_reached
      }));

      return { sessions, count: count || 0 };
    } catch (error) {
      console.error('Error in getSessionHistory:', error);
      return { sessions: [], count: 0 };
    }
  }

  /**
   * Get session activities
   */
  async getSessionActivities(
    sessionId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ activities: SessionActivity[], count: number }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return { activities: [], count: 0 };
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Execute query
      const { data, error, count } = await supabase
        .from('session_activities')
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching session activities:', error);
        return { activities: [], count: 0 };
      }

      // Format the activities
      const activities: SessionActivity[] = data.map(activity => ({
        id: activity.id,
        sessionId: activity.session_id,
        userId: activity.user_id,
        activityType: activity.activity_type,
        activityData: activity.activity_data,
        pointsEarned: activity.points_earned,
        timestamp: new Date(activity.timestamp)
      }));

      return { activities, count: count || 0 };
    } catch (error) {
      console.error('Error in getSessionActivities:', error);
      return { activities: [], count: 0 };
    }
  }

  /**
   * Get session achievements
   */
  async getSessionAchievements(
    sessionId: string
  ): Promise<SessionAchievement[]> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return [];
      }

      // Execute query
      const { data, error } = await supabase
        .from('session_achievements')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session achievements:', error);
        return [];
      }

      // Format the achievements
      const achievements: SessionAchievement[] = data.map(achievement => ({
        id: achievement.id,
        sessionId: achievement.session_id,
        userId: achievement.user_id,
        achievementId: achievement.achievement_id,
        achievementName: achievement.achievement_name,
        progress: achievement.progress,
        completed: achievement.completed,
        completedAt: achievement.completed_at ? new Date(achievement.completed_at) : undefined
      }));

      return achievements;
    } catch (error) {
      console.error('Error in getSessionAchievements:', error);
      return [];
    }
  }

  /**
   * Get all user achievements
   */
  async getAllUserAchievements(): Promise<SessionAchievement[]> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return [];
      }

      // Execute query
      const { data, error } = await supabase
        .from('session_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }

      // Format the achievements
      const achievements: SessionAchievement[] = data.map(achievement => ({
        id: achievement.id,
        sessionId: achievement.session_id,
        userId: achievement.user_id,
        achievementId: achievement.achievement_id,
        achievementName: achievement.achievement_name,
        progress: achievement.progress,
        completed: achievement.completed,
        completedAt: achievement.completed_at ? new Date(achievement.completed_at) : undefined
      }));

      return achievements;
    } catch (error) {
      console.error('Error in getAllUserAchievements:', error);
      return [];
    }
  }
}

export const sessionService = new SessionService();