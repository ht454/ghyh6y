export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_en?: string;
  icon?: string;
  description?: string;
  color: string;
  illustration?: string;
  is_active: boolean;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  additional_info?: string;
  image_url?: string;
  image_description?: string;
  answer_image_url?: string;
  question_image_url?: string;
  points: 200 | 400 | 600;
  difficulty: 'متوسط' | 'صعب' | 'صعب جداً';
  question_type: 'text' | 'image' | 'multiple_choice' | 'blurry_image' | 'audio' | 'acting' | 'image_answer' | 'mixed';
  options?: string[];
  is_active: boolean;
  usage_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  audio_url?: string; 
  qr_code_data?: string; 
  blur_level?: number; 
  year_range_enabled?: boolean; 
  year_range_value?: number; 
}

export interface GameSession {
  id: string;
  session_name: string;
  host_name?: string[];
  status: 'waiting' | 'active' | 'paused' | 'completed';
  total_questions: number;
  questions_asked: number;
  selected_categories: string[];
  settings: Record<string, any>;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  user_email?: string;
  user_full_name?: string;
  teams?: Team[];
}

export interface Team {
  id: string;
  session_id: string;
  name: string;
  score: number;
  color: string;
  members_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  helper_tools?: {
    callFriend: boolean;
    twoAnswers: boolean;
    steal: boolean;
  };
}

export interface ActivityLog {
  id: string;
  admin_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  admin?: AdminUser;
}

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content?: string;
  meta_description?: string;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  is_active: boolean;
  position: 'hero' | 'sidebar' | 'footer';
  target_audience: 'all' | 'guests' | 'users' | 'admins';
  start_date: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_active: boolean;
  target_audience: 'all' | 'admins' | 'users';
  auto_dismiss: boolean;
  dismiss_after: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  is_public: boolean;
  updated_by?: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  is_public: boolean;
  updated_by?: string;
  updated_at: string;
}

export interface Statistics {
  id: string;
  date: string;
  total_games: number;
  total_questions_asked: number;
  total_users: number;
  active_sessions: number;
  popular_categories: Record<string, number>;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalGames: number;
  totalQuestions: number;
  activeGames: number;
  todayGames: number;
  weeklyGames: number;
  monthlyGames: number;
  popularCategories: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  recentActivities: ActivityLog[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  country?: string;
  city?: string;
  is_verified?: boolean;
  is_active?: boolean;
  last_login?: string;
  total_games_played?: number;
  total_points_earned?: number;
  created_at: string;
  updated_at: string;
export interface UserGamingSession {
  id: string;
  user_id: string;
  game_type: string;
  game_id?: string;
  started_at: string;
  ended_at?: string;
  duration?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  score: number;
  xp_earned: number;
  level_reached: number;
  device_info?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_full_name?: string;
}

export interface SessionActivity {
  id: string;
  session_id: string;
  user_id: string;
  activity_type: string;
  activity_data: any;
  points_earned: number;
  timestamp: string;
}

export interface SessionAchievement {
  id: string;
  session_id: string;
  user_id: string;
  achievement_id: string;
  achievement_name: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionStats {
  user_id: string;
  total_sessions: number;
  total_duration: string;
  avg_session_duration: string;
  total_score: number;
  total_xp: number;
  completed_sessions: number;
  abandoned_sessions: number;
  preferred_game_type?: string;
  peak_play_hour?: number;
  achievements_earned: number;
  daily_stats?: Array<{
    date: string;
    sessions: number;
    duration: string;
    score: number;
    xp: number;
  }>;
}

}

export interface UserGameStats {
  id: string;
  user_id: string;
  game_session_id: string;
  team_name: string;
  final_score: number;
  questions_answered: number;
  correct_answers: number;
  categories_played: string[];
  game_duration?: string;
  rank_in_game: number;
  points_earned: number;
  played_at: string;
}

export interface BlurSettings {
  defaultLevel: number;
  previewEnabled: boolean;
  autoAdjustByDifficulty: boolean;
  difficultyMapping: {
    'متوسط': number;
    'صعب': number;
    'صعب جداً': number;
  };
}