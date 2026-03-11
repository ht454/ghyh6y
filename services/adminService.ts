import { supabase } from './supabaseClient';
import { 
  AdminUser, Category, Question, GameSession, ActivityLog, 
  ContentPage, SystemSetting, Statistics, DashboardStats,
  BlurSettings, UserProfile
} from '../types/admin';

class AdminService {
 
  async signIn(email: string, password: string) {
    try {
      console.log('🔐 محاولة تسجيل الدخول للبريد:', email);
      
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError);
        
        
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('يرجى تأكيد البريد الإلكتروني أولاً');
        } else if (authError.message.includes('Too many requests')) {
          throw new Error('تم تجاوز عدد المحاولات المسموحة، يرجى المحاولة لاحقاً');
        }
        throw new Error(authError.message);
      }
      
      console.log('✅ تم تسجيل الدخول في Auth بنجاح، UUID:', authData.user?.id);
      
      
      let { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();
      
      
      if (adminError && adminError.code === 'PGRST116') {
        console.log('🔍 البحث بالبريد الإلكتروني...');
        
        const { data: emailUser, error: emailError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single();
        
        if (emailUser) {
          
          console.log('🔄 تحديث UUID للمستخدم الموجود...');
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('admin_users')
            .update({ 
              id: authData.user.id,
              updated_at: new Date().toISOString()
            })
            .eq('email', email)
            .select()
            .single();
          
          if (updateError) {
            console.error('❌ فشل في تحديث UUID:', updateError);
            
            adminUser = await this.createAdminUserRecord(authData.user.id, email);
          } else {
            adminUser = updatedUser;
          }
        } else {
         
          console.log('➕ إنشاء مستخدم إداري جديد...');
          adminUser = await this.createAdminUserRecord(authData.user.id, email);
        }
      } else if (adminError) {
        console.error('❌ خطأ في البحث عن المستخدم الإداري:', adminError);
        await supabase.auth.signOut();
        throw new Error('خطأ في الوصول إلى بيانات المستخدم الإداري');
      }
      
      if (!adminUser) {
        await supabase.auth.signOut();
        throw new Error('غير مصرح لك بالدخول إلى لوحة التحكم');
      }
      
      console.log('✅ تم العثور على المستخدم الإداري:', adminUser.full_name);
      
      
      await supabase
        .from('admin_users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUser.id);
      
      return { user: authData.user, adminUser };
      
    } catch (error: any) {
      console.error('💥 خطأ في تسجيل الدخول:', error);
      throw error;
    }
  }

  private async createAdminUserRecord(userId: string, email: string): Promise<AdminUser> {
    try {
      const { data: newAdminUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email: email,
          full_name: 'فهد أبو سبعة',
          role: 'super_admin',
          is_active: true,
          blur_settings: {
            defaultLevel: 5,
            previewEnabled: true,
            autoAdjustByDifficulty: true,
            difficultyMapping: {
              'متوسط': 3,
              'صعب': 6,
              'صعب جداً': 9
            }
          }
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ فشل في إنشاء المستخدم الإداري:', createError);
        throw new Error('فشل في إنشاء حساب إداري');
      }
      
      console.log('✅ تم إنشاء المستخدم الإداري بنجاح');
      
      
      await this.logActivity('CREATE', 'admin_user', userId, null, {
        email,
        full_name: 'فهد أبو سبعة',
        role: 'super_admin'
      });
      
      return newAdminUser;
    } catch (error) {
      console.error('💥 خطأ في إنشاء المستخدم الإداري:', error);
      throw error;
    }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentAdmin(): Promise<AdminUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ لا يوجد مستخدم مسجل دخول');
        return null;
      }
      
      console.log('🔍 البحث عن المستخدم الإداري للـ UUID:', user.id);
      
     
      let { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();
      
      
      if (error && error.code === 'PGRST116') {
        console.log('🔍 لم يتم العثور على المستخدم بـ UUID، البحث بالبريد الإلكتروني...');
        
        const { data: emailData, error: emailError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email)
          .eq('is_active', true)
          .single();
        
        if (emailError) {
          console.error('❌ خطأ في البحث بالبريد الإلكتروني:', emailError);
          return null;
        }
        
        data = emailData;
      } else if (error) {
        console.error('❌ خطأ في البحث عن المستخدم الإداري:', error);
        return null;
      }
      
      console.log('✅ تم العثور على المستخدم الإداري:', data?.full_name);
      return data;
    } catch (error) {
      console.error('💥 خطأ في getCurrentAdmin:', error);
      return null;
    }
  }

  
  async getBlurSettings(): Promise<BlurSettings> {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin || !admin.blur_settings) {
        
        return {
          defaultLevel: 5,
          previewEnabled: true,
          autoAdjustByDifficulty: true,
          difficultyMapping: {
            'متوسط': 3,
            'صعب': 6,
            'صعب جداً': 9
          }
        };
      }
      
      return admin.blur_settings as BlurSettings;
    } catch (error) {
      console.error('Error getting blur settings:', error);
     
      return {
        defaultLevel: 5,
        previewEnabled: true,
        autoAdjustByDifficulty: true,
        difficultyMapping: {
          'متوسط': 3,
          'صعب': 6,
          'صعب جداً': 9
        }
      };
    }
  }

  async updateBlurSettings(settings: BlurSettings): Promise<void> {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin) {
        throw new Error('User not authenticated');
      }
      
      await supabase
        .from('admin_users')
        .update({
          blur_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', admin.id);
        
      
      await this.logActivity('UPDATE', 'admin_settings', admin.id, null, {
        blur_settings: settings
      });
    } catch (error) {
      console.error('Error updating blur settings:', error);
      throw error;
    }
  }

  async getCategoryDefaultBlurLevel(categoryId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('default_blur_level')
        .eq('id', categoryId)
        .single();
        
      if (error) {
        console.error('Error getting category default blur level:', error);
        return 5;
      }
      
      return data.default_blur_level || 5;
    } catch (error) {
      console.error('Error getting category default blur level:', error);
      return 5;
    }
  }

  async updateCategoryDefaultBlurLevel(categoryId: string, level: number): Promise<void> {
    try {
      if (level < 1 || level > 10) {
        throw new Error('Blur level must be between 1 and 10');
      }
      
      const { error } = await supabase
        .from('categories')
        .update({
          default_blur_level: level,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId);
        
      if (error) {
        throw error;
      }
      
      
      await this.logActivity('UPDATE', 'category', categoryId, null, {
        default_blur_level: level
      });
    } catch (error) {
      console.error('Error updating category default blur level:', error);
      throw error;
    }
  }

  async bulkUpdateBlurLevels(questionIds: string[], level: number): Promise<void> {
    try {
      if (level < 1 || level > 10) {
        throw new Error('Blur level must be between 1 and 10');
      }
      
      
      for (const id of questionIds) {
        const { error } = await supabase
          .from('questions')
          .update({
            blur_level: level,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('question_type', 'blurry_image');
          
        if (error) {
          console.error(`Error updating blur level for question ${id}:`, error);
        }
      }
      
      
      await this.logActivity('BULK_UPDATE', 'questions', null, null, {
        action: 'update_blur_levels',
        question_count: questionIds.length,
        new_blur_level: level
      });
    } catch (error) {
      console.error('Error in bulk update blur levels:', error);
      throw error;
    }
  }

  
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Fetching dashboard stats...');
      
      // Call the get_dashboard_stats function
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      
      if (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
      
      // Get recent activities
      const { data: recentActivities, error: activitiesError } = await supabase
        .from('activity_logs')
        .select(`
          *,
          admin:admin_users!activity_logs_admin_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (activitiesError) {
        console.error('Error fetching recent activities:', activitiesError);
      }

      // Return the dashboard stats with recent activities
      return {
        ...data,
        recentActivities: recentActivities || []
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      
      return {
        totalUsers: 10,
        totalGames: 5,
        totalQuestions: 662,
        activeGames: 2,
        todayGames: 1,
        weeklyGames: 3,
        monthlyGames: 5,
        popularCategories: [],
        recentActivities: []
      };
    }
  }
  
  
  async getUsers(page = 1, limit = 20, searchTerm = '', roleFilter = '', statusFilter = ''): Promise<{ data: UserProfile[], count: number }> {
    try {
      console.log('Fetching users with params:', { page, limit, searchTerm, roleFilter, statusFilter });
      
      // Directly query the profiles table
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      
      // Apply filters if provided
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
      }
      
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      // Paginate results
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return { data: [], count: 0 };
      }
      
      // Map the data to UserProfile format
      const userProfiles = data?.map(profile => ({
        id: profile.user_id,
        full_name: profile.full_name || 'مستخدم جديد',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        avatar_url: profile.avatar_url || '',
        is_active: profile.is_active || false,
        is_verified: profile.email_verified || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        total_games_played: 0,
        total_points_earned: 0
      })) || [];
      
      return {
        data: userProfiles,
        count: count || 0
      };
    } catch (error) {
      console.error('Error in getUsers:', error);
      return { data: [], count: 0 };
    }
  }
  
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      // Get user profile directly
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return {
        id: data.user_id,
        full_name: data.full_name || 'مستخدم جديد',
        email: data.email || '',
        phone_number: data.phone_number || '',
        avatar_url: data.avatar_url || '',
        is_active: data.is_active || false,
        is_verified: data.email_verified || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_games_played: 0,
        total_points_earned: 0
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }
  
  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean, error: string | null }> {
    try {
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) {
        
        const { error: userIdError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', userId);
          
        if (userIdError) {
          console.error('Error updating user:', userIdError);
          return { success: false, error: userIdError.message };
        }
      }
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteUser(userId: string): Promise<{ success: boolean, error: string | null }> {
    try {
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .or(`id.eq.${userId},user_id.eq.${userId}`);
      
      if (error) {
        console.error('Error deleting user from profiles:', error);
        return { success: false, error: error.message };
      }
      
      
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      return { success: false, error: error.message };
    }
  }
  
  async exportUsers(): Promise<UserProfile[]> {
    try {
      // Get all users with their stats for export
      const { data, error } = await supabase
        .from('user_stats_view')
        .select('*')
        .order('last_played_at', { ascending: false });
      
      if (error) {
        console.error('Error exporting users:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in exportUsers:', error);
      return [];
    }
  }

  
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    
   
    await this.logActivity('CREATE', 'category', data.id, null, data);
    
    return data;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    
    const { data: oldData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
   
    await this.logActivity('UPDATE', 'category', id, oldData, data);
    
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    
    const { data: oldData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    
    await this.logActivity('DELETE', 'category', id, oldData, null);
  }

  async reorderCategories(categoryIds: string[]): Promise<void> {
    const updates = categoryIds.map((id, index) => ({
      id,
      sort_order: index
    }));

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    
    await this.logActivity('REORDER', 'categories', null, null, { new_order: categoryIds });
  }

  
  async getQuestions(categoryId?: string, page = 1, limit = 20): Promise<{ data: Question[], count: number }> {
    let query = supabase
      .from('questions')
      .select(`
        *,
        category:categories(name, icon)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  async getQuestionsByType(type: string, page = 1, limit = 20): Promise<{ data: Question[], count: number }> {
    const { data, error, count } = await supabase
      .from('questions')
      .select(`
        *,
        category:categories(name, icon)
      `, { count: 'exact' })
      .eq('question_type', type)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  async getBlurryImageQuestions(page = 1, limit = 20): Promise<{ data: Question[], count: number }> {
    return this.getQuestionsByType('blurry_image', page, limit);
  }

  async createQuestion(question: Omit<Question, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select(`
        *,
        category:categories(name, icon)
      `)
      .single();
    
    if (error) throw error;
    
    
    await this.logActivity('CREATE', 'question', data.id, null, data);
    
    return data;
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    
    const { data: oldData } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories(name, icon)
      `)
      .single();
    
    if (error) throw error;
    
    
    await this.logActivity('UPDATE', 'question', id, oldData, data);
    
    return data;
  }

  async deleteQuestion(id: string): Promise<void> {
    
    const { data: oldData } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    
    await this.logActivity('DELETE', 'question', id, oldData, null);
  }

  async getQuestionStats(): Promise<{
    totalQuestions: number;
    activeQuestions: number;
    totalUsage: number;
    byDifficulty: {[key: string]: number};
    byCategory: {[key: string]: number};
    mostUsed: Question[];
  }> {
    try {
      // Get question statistics using a single RPC call
      const { data, error } = await supabase.rpc('get_question_statistics');
      
      if (error) {
        console.error('Error fetching question statistics:', error);
        throw error;
      }
      
      // Get most used questions
      const { data: mostUsed, error: mostUsedError } = await supabase
        .from('questions')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .order('usage_count', { ascending: false })
        .limit(5);
      
      if (mostUsedError) {
        console.error('Error fetching most used questions:', mostUsedError);
      }
      
      return {
        ...data,
        mostUsed: mostUsed || []
      };
    } catch (error) {
      console.error('Error getting question stats:', error);
      return {
        totalQuestions: 0,
        activeQuestions: 0,
        totalUsage: 0,
        byDifficulty: {},
        byCategory: {},
        mostUsed: []
      };
    }
  }

  
  async getUserGamingSessions(
    page = 1, 
    limit = 10, 
    statusFilter = '', 
    gameTypeFilter = '',
    dateFilter = ''
  ): Promise<{ data: any[], count: number }> {
    try {
      console.log('Fetching user gaming sessions with params:', { page, limit, statusFilter, gameTypeFilter, dateFilter });
      
      // Build query
      let query = supabase
        .from('user_gaming_sessions')
        .select(`
          *,
          user:profiles!user_gaming_sessions_user_id_fkey(email, full_name)
        `, { count: 'exact' });
      
      // Apply filters
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      if (gameTypeFilter) {
        query = query.eq('game_type', gameTypeFilter);
      }
      
      if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        if (dateFilter === 'today') {
          query = query.gte('created_at', today);
        } else if (dateFilter === 'week') {
          query = query.gte('created_at', weekAgo);
        } else if (dateFilter === 'month') {
          query = query.gte('created_at', monthAgo);
        }
      }
      
      // Apply pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) {
        console.error('Error fetching user gaming sessions:', error);
        return { data: [], count: 0 };
      }

      // Format the data
      const formattedData = data.map(session => ({
        ...session,
        user_email: session.user?.email,
        user_full_name: session.user?.full_name
      }));
      
      return { data: formattedData, count: count || 0 };
    } catch (error) {
      console.error('Error in getUserGamingSessions:', error);
      return { data: [], count: 0 };
    }
  }

  async getAllUserGamingSessions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_gaming_sessions')
        .select(`
          *,
          user:profiles!user_gaming_sessions_user_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all user gaming sessions:', error);
        return [];
      }

      // Format the data
      const formattedData = data.map(session => ({
        ...session,
        user_email: session.user?.email,
        user_full_name: session.user?.full_name
      }));
      
      return formattedData;
    } catch (error) {
      console.error('Error in getAllUserGamingSessions:', error);
      return [];
    }
  }

  async getSessionActivities(sessionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('session_activities')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching session activities:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSessionActivities:', error);
      return [];
    }
  }

  async getSessionAchievements(sessionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('session_achievements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching session achievements:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSessionAchievements:', error);
      return [];
    }
  }

  async getUserSessionStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_user_session_stats', {
        p_user_id: userId
      });
      
      if (error) {
        console.error('Error fetching user session stats:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserSessionStats:', error);
      return null;
    }
  }

  async getGameSessions(
    page = 1, 
    limit = 20, 
    statusFilter = '', 
    dateFilter = ''
  ): Promise<{ data: GameSession[], count: number }> {
    try {
      console.log('Fetching game sessions with params:', { page, limit, statusFilter, dateFilter });
      
      // Query game_sessions directly with user info
      let query = supabase
        .from('game_sessions')
        .select(`
          *,
          creator:profiles!game_sessions_created_by_fkey(full_name, email)
        `, { count: 'exact' });
      
      // Apply filters
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        if (dateFilter === 'today') {
          query = query.gte('created_at', today);
        } else if (dateFilter === 'week') {
          query = query.gte('created_at', weekAgo);
        } else if (dateFilter === 'month') {
          query = query.gte('created_at', monthAgo);
        }
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) {
        console.error('Error fetching game sessions:', error);
        return { data: [], count: 0 };
      }

      // If we have game sessions, fetch their teams separately
      if (data && data.length > 0) {
        const sessionIds = data.map(session => session.id);
        
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('session_id', sessionIds);
          
        if (!teamsError && teamsData) {
          // Add teams to their respective sessions
          data.forEach(session => {
            session.teams = teamsData.filter(team => team.session_id === session.id);
            // Set host_name from creator profile if available
            if (session.creator) {
              session.host_name = session.creator.full_name || session.creator.email || session.host_name;
              session.user_full_name = session.creator.full_name;
              session.user_email = session.creator.email;
            }
          });
        }
      }
      
      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error in getGameSessions:', error);
      return { data: [], count: 0 };
    }
  }

  async getGameSession(id: string): Promise<GameSession> {
    try {
      const { data, error } = await supabase
        .rpc('get_game_session_details', { session_id: id });
      
      if (error) {
        console.error('Error fetching game session:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getGameSession:', error);
      throw error;
    }
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating game session:', error);
        throw error;
      }
      
      await this.logActivity('UPDATE', 'game_session', id, null, updates);
    } catch (error) {
      console.error('Error in updateGameSession:', error);
      throw error;
    }
  }
  
  async exportSessionData(sessionId: string): Promise<GameSession | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          teams(*)
        `)
        .eq('id', sessionId)
        .single();
      
      if (error) {
        console.error('Error exporting session data:', error);
        return null;
      }
      
      await this.logActivity('EXPORT', 'game_session', sessionId, null, null);
      
      return data;
    } catch (error) {
      console.error('Error in exportSessionData:', error);
      return null;
    }
  }
  
  async exportAllSessionsData(): Promise<GameSession[]> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          teams(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error exporting all sessions data:', error);
        return [];
      }
      
      await this.logActivity('EXPORT', 'game_sessions', null, null, null);
      
      return data || [];
    } catch (error) {
      console.error('Error in exportAllSessionsData:', error);
      return [];
    }
  }

  async getActivityLogs(
    page = 1, 
    limit = 50, 
    actionFilter = '', 
    entityFilter = '', 
    dateFilter = ''
  ): Promise<{ data: ActivityLog[], count: number }> {
    try {
      console.log('Fetching activity logs with params:', { page, limit, actionFilter, entityFilter, dateFilter });
      
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          admin:admin_users(full_name, email)
        `, { count: 'exact' });
      
      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      
      if (entityFilter) {
        query = query.eq('entity_type', entityFilter);
      }
      
      if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        if (dateFilter === 'today') {
          query = query.gte('created_at', today);
        } else if (dateFilter === 'week') {
          query = query.gte('created_at', weekAgo);
        } else if (dateFilter === 'month') {
          query = query.gte('created_at', monthAgo);
        }
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) {
        console.error('Error fetching activity logs:', error);
        return { data: [], count: 0 };
      }
      
      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error in getActivityLogs:', error);
      return { data: [], count: 0 };
    }
  }
  
  async exportActivityLogs(
    actionFilter = '', 
    entityFilter = '', 
    dateFilter = ''
  ): Promise<ActivityLog[]> {
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          admin:admin_users(full_name, email)
        `);
      
      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      
      if (entityFilter) {
        query = query.eq('entity_type', entityFilter);
      }
      
      if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        if (dateFilter === 'today') {
          query = query.gte('created_at', today);
        } else if (dateFilter === 'week') {
          query = query.gte('created_at', weekAgo);
        } else if (dateFilter === 'month') {
          query = query.gte('created_at', monthAgo);
        }
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error exporting activity logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in exportActivityLogs:', error);
      return [];
    }
  }

  private async logActivity(
    action: string,
    entityType: string,
    entityId?: string | null,
    oldData?: any,
    newData?: any
  ): Promise<void> {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin) return;
      
      // Use the log_admin_activity function
      const { data, error } = await supabase.rpc('log_admin_activity', {
        admin_id: admin.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_data: oldData,
        new_data: newData,
        ip_address: '127.0.0.1', // Placeholder
        user_agent: navigator.userAgent
      });
        
      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  async getContentPages(): Promise<ContentPage[]> {
    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createContentPage(page: Omit<ContentPage, 'id' | 'created_at' | 'updated_at'>): Promise<ContentPage> {
    const { data, error } = await supabase
      .from('content_pages')
      .insert(page)
      .select()
      .single();
    
    if (error) throw error;
    
    await this.logActivity('CREATE', 'content_page', data.id, null, data);
    
    return data;
  }

  async updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage> {
    const { data: oldData } = await supabase
      .from('content_pages')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('content_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    await this.logActivity('UPDATE', 'content_page', id, oldData, data);
    
    return data;
  }

  async deleteContentPage(id: string): Promise<void> {
    const { data: oldData } = await supabase
      .from('content_pages')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('content_pages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await this.logActivity('DELETE', 'content_page', id, oldData, null);
  }

  async getSystemSettings(): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async updateSystemSetting(key: string, value: any): Promise<SystemSetting> {
    const { data: oldData } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .single();

    const { data, error } = await supabase
      .from('system_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();
    
    if (error) throw error;
    
    // تسجيل النشاط
    await this.logActivity('UPDATE', 'system_setting', key, oldData, data);
    
    return data;
  }

  async uploadFile(file: File, fileType: 'image' | 'audio' = 'image'): Promise<string> {
    try {
      console.log(`📤 بدء رفع ${fileType === 'image' ? 'الصورة' : 'الملف الصوتي'}:`, file.name, 'الحجم:', file.size);
      
      let bucket: string;
      let allowedTypes: string[];
      
      if (fileType === 'image') {
        bucket = 'images';
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      } else if (fileType === 'audio') {
        bucket = 'files'; 
        allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      } else {
        throw new Error('نوع ملف غير مدعوم');
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}`);
      }
      
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى 50MB');
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileType === 'audio' ? 'audio' : 'images'}/${fileName}`;
      
      console.log('📁 مسار الملف:', filePath);
      console.log('🪣 Bucket:', bucket);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ خطأ في رفع الملف:', uploadError);
        
        if (uploadError.message.includes('Duplicate')) {
          throw new Error('الملف موجود بالفعل');
        } else if (uploadError.message.includes('Policy')) {
          throw new Error('ليس لديك صلاحية لرفع الملفات');
        } else if (uploadError.message.includes('size')) {
          throw new Error('حجم الملف كبير جداً');
        } else if (uploadError.message.includes('mime type')) {
          throw new Error(`نوع الملف ${file.type} غير مدعوم في هذا المكان`);
        }
        
        throw new Error(`فشل في رفع الملف: ${uploadError.message}`);
      }
      
      console.log('✅ تم رفع الملف بنجاح:', uploadData.path);
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);
      
      if (!urlData.publicUrl) {
        throw new Error('فشل في الحصول على رابط الملف');
      }
      
      console.log('🔗 رابط الملف:', urlData.publicUrl);
      
      await this.logActivity('UPLOAD', fileType === 'image' ? 'image' : 'audio', null, null, {
        file_name: fileName,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl,
        bucket: bucket
      });
      
      return urlData.publicUrl;
      
    } catch (error: any) {
      console.error(`💥 خطأ في upload${fileType === 'image' ? 'Image' : 'Audio'}:`, error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string, fileType: 'image' | 'audio' = 'image'): Promise<void> {
    try {
      const bucket = fileType === 'image' ? 'images' : 'files';
      
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `uploads/${fileType === 'audio' ? 'audio' : 'images'}/${fileName}`;
      
      console.log(`🗑️ حذف ${fileType === 'image' ? 'الصورة' : 'الملف الصوتي'}:`, filePath);
      console.log('🪣 Bucket:', bucket);
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      
      if (error) {
        console.error(`❌ خطأ في حذف ${fileType === 'image' ? 'الصورة' : 'الملف الصوتي'}:`, error);
        throw new Error(`فشل في حذف ${fileType === 'image' ? 'الصورة' : 'الملف الصوتي'}: ${error.message}`);
      }
      
      console.log('✅ تم حذف الملف بنجاح');
      
      await this.logActivity('DELETE', fileType === 'image' ? 'image' : 'audio', null, null, {
        file_path: filePath,
        file_url: fileUrl,
        bucket: bucket
      });
      
    } catch (error: any) {
      console.error(`💥 خطأ في delete${fileType === 'image' ? 'Image' : 'Audio'}:`, error);
      throw error;
    }
  }

  async createAdminUser(email: string, password: string, fullName: string, role: 'super_admin' | 'admin' | 'moderator' = 'admin'): Promise<void> {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;

      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          is_active: true,
          blur_settings: {
            defaultLevel: 5,
            previewEnabled: true,
            autoAdjustByDifficulty: true,
            difficultyMapping: {
              'متوسط': 3,
              'صعب': 6,
              'صعب جداً': 9
            }
          }
        });

      if (adminError) throw adminError;

      await this.logActivity('CREATE', 'admin_user', authData.user.id, null, {
        email,
        full_name: fullName,
        role
      });
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  async checkStorageStatus(): Promise<{ isConfigured: boolean, error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('images')
        .list('', { limit: 1 });
      
      if (error) {
        console.error('❌ خطأ في الوصول إلى Storage:', error);
        return { 
          isConfigured: false, 
          error: `خطأ في إعداد Storage: ${error.message}` 
        };
      }
      
      console.log('✅ Storage مُعد بشكل صحيح');
      return { isConfigured: true };
      
    } catch (error: any) {
      console.error('💥 خطأ في checkStorageStatus:', error);
      return { 
        isConfigured: false, 
        error: `خطأ في فحص Storage: ${error.message}` 
      };
    }
  }

  
  async exportQuestionsToPDF(categoryId?: string, difficulty?: string): Promise<void> {
    try {
      console.log('📄 تصدير الأسئلة إلى PDF...');
      
      
      
      await this.logActivity('EXPORT', 'questions', null, null, {
        format: 'PDF',
        category_id: categoryId,
        difficulty: difficulty,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ تم تصدير الأسئلة بنجاح');
    } catch (error) {
      console.error('Error exporting questions to PDF:', error);
      throw error;
    }
  }

 
  async exportSessionData(sessionId: string): Promise<void> {
    try {
      console.log('📄 تصدير بيانات الجلسة...');
      
     
      
      await this.logActivity('EXPORT', 'game_session', sessionId, null, {
        format: 'JSON',
        session_id: sessionId,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ تم تصدير بيانات الجلسة بنجاح');
    } catch (error) {
      console.error('Error exporting session data:', error);
      throw error;
    }
  }

 
  async exportAllSessionsData(): Promise<void> {
    try {
      console.log('📄 تصدير جميع بيانات الجلسات...');
      
    
      
      await this.logActivity('EXPORT', 'game_sessions', null, null, {
        format: 'JSON',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ تم تصدير جميع بيانات الجلسات بنجاح');
    } catch (error) {
      console.error('Error exporting all sessions data:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();