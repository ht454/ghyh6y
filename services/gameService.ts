import { supabase, checkSupabaseConnection } from './supabaseClient';
import { Category, Question } from '../types/admin';
import { v4 as uuidv4 } from 'uuid';

interface GameCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string; // إضافة خاصية اللون - أكواد مباشرة
  illustration: string;
}

interface GameQuestion {
  id: string;
  category: string;
  points: number;
  difficulty: 'متوسط' | 'صعب' | 'صعب جداً';
  question: string;
  answer: string;
  additionalInfo?: string;
  imageDescription: string;
  imageUrl?: string;
  used: boolean;
  questionType?:
    | 'text'
    | 'image'
    | 'multiple_choice'
    | 'blurry_image'
    | 'audio'
    | 'acting';
  options?: string[];
  audio_url?: string;
  qrCodeData?: string;
  blurLevel?: number;
  year_range_enabled?: boolean;
  year_range_value?: number;
}

class GameService {
  private categoriesCache: GameCategory[] = [];
  private questionsCache: Map<string, GameQuestion[]> = new Map();
  private lastCacheUpdate = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

  // تحسين الأداء - منع التكرار في العمليات
  private pendingOperations = new Map<string, Promise<any>>();

  // تحسين الأداء - إضافة مؤشر اتصال
  private isConnected = true;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private connectionRetryCount = 0;
  private readonly MAX_RETRY_COUNT = 5;
  private readonly RETRY_DELAY = 3000; // 3 seconds
  private readonly CONNECTION_CHECK_INTERVAL = 10000; // 10 seconds

  constructor() {
    // بدء فحص الاتصال دورياً
    this.startConnectionCheck();

    // تحميل البيانات مسبقاً عند بدء التطبيق
    this.preloadData();
  }

  // دالة لتحميل البيانات مسبقاً
  private async preloadData() {
    console.log('🔄 تحميل البيانات مسبقاً...');
    try {
      // تحميل الفئات
      await this.getCategories();

      // تحميل بعض الأسئلة الشائعة
      const categories = this.categoriesCache.slice(0, 3);
      const pointValues = [200, 400, 600];

      for (const category of categories) {
        for (const points of pointValues) {
          // تحميل الأسئلة بشكل غير متزامن
          this.getQuestionsByCategory(category.id, points).catch((err) => {
            console.log(
              `⚠️ فشل في تحميل أسئلة الفئة ${category.id} بنقاط ${points} مسبقاً:`,
              err
            );
          });
        }
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات مسبقاً:', error);
    }
  }

  // دالة لبدء فحص الاتصال دورياً
  private startConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(() => {
      this.checkConnection();
    }, this.CONNECTION_CHECK_INTERVAL);

    // فحص أولي للاتصال
    this.checkConnection();
  }

  // دالة لفحص الاتصال بـ Supabase
  private async checkConnection() {
    try {
      console.log('🔍 فحص الاتصال بـ Supabase...');
      const isConnected = await checkSupabaseConnection();

      const wasConnected = this.isConnected;
      this.isConnected = isConnected;

      // إذا تغيرت حالة الاتصال، سجل ذلك
      if (wasConnected !== this.isConnected) {
        if (this.isConnected) {
          console.log('✅ تم استعادة الاتصال بـ Supabase');
          // إعادة تحميل البيانات بعد استعادة الاتصال
          this.refreshData();
          // إعادة تعيين عداد المحاولات
          this.connectionRetryCount = 0;
        } else {
          console.log('❌ فقدان الاتصال بـ Supabase');
          // بدء محاولات إعادة الاتصال
          this.retryConnection();
        }
      } else if (!this.isConnected) {
        // إذا كان الاتصال لا يزال مفقوداً، حاول مرة أخرى
        this.retryConnection();
      } else {
        // الاتصال مستمر، إعادة تعيين عداد المحاولات
        this.connectionRetryCount = 0;
      }
    } catch (error) {
      console.error('خطأ في فحص الاتصال:', error);
      this.isConnected = false;
      // بدء محاولات إعادة الاتصال
      this.retryConnection();
    }
  }

  // دالة لمحاولة إعادة الاتصال
  private retryConnection() {
    if (this.connectionRetryCount < this.MAX_RETRY_COUNT) {
      this.connectionRetryCount++;
      console.log(
        `🔄 محاولة إعادة الاتصال ${this.connectionRetryCount}/${this.MAX_RETRY_COUNT}...`
      );

      setTimeout(() => {
        this.checkConnection();
      }, this.RETRY_DELAY * this.connectionRetryCount); // زيادة التأخير مع كل محاولة
    } else {
      console.log(
        '⚠️ تم الوصول للحد الأقصى من محاولات إعادة الاتصال، سيتم الاعتماد على البيانات المخزنة مؤقتاً'
      );
    }
  }

  private async executeOnce<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (this.pendingOperations.has(key)) {
      console.log(`⏳ عملية قيد التنفيذ: ${key}`);
      return this.pendingOperations.get(key);
    }

    const promise = operation().finally(() => {
      this.pendingOperations.delete(key);
    });

    this.pendingOperations.set(key, promise);
    return promise;
  }

  // ==================== دالة للتحقق من صحة UUID ====================
  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // ==================== إدارة الفئات ====================
  async getCategories(): Promise<GameCategory[]> {
    return this.executeOnce('get-categories', async () => {
      try {
        console.log('🎮 جلب الفئات من قاعدة البيانات...');

        // 🔥 ALWAYS fetch fresh data to prevent sync issues
        console.log('🔄 Fetching fresh data from database (cache disabled for reliability)...');

        // التحقق من الاتصال
        if (!this.isConnected) {
          console.log(
            '⚠️ لا يوجد اتصال بـ Supabase، استخدام الفئات الافتراضية'
          );
          return this.getFallbackCategories();
        }

        // Try to get categories from Supabase
        try {
          const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          if (error) {
            console.error('❌ خطأ في جلب الفئات:', error);
            return this.getFallbackCategories();
          }

          if (!categories || categories.length === 0) {
            console.log(
              '⚠️ لا توجد فئات في قاعدة البيانات، استخدام الفئات الافتراضية'
            );
            return this.getFallbackCategories();
          }

          // تحويل البيانات إلى تنسيق اللعبة مع تضمين الألوان المباشرة
          this.categoriesCache = categories.map((cat) => ({
            id: cat.name_en || cat.id,
            name: cat.name,
            icon: cat.icon || '📁',
            description: cat.description || '',
            color: cat.color || '#ff6b35', // استخدام اللون المباشر من قاعدة البيانات
            illustration:
              cat.illustration ||
              'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400',
          }));

          this.lastCacheUpdate = Date.now();
          console.log(
            `✅ تم جلب ${this.categoriesCache.length} فئة من قاعدة البيانات مع الألوان المباشرة`
          );

          return this.categoriesCache;
        } catch (fetchError) {
          console.error('❌ خطأ في جلب الفئات من Supabase:', fetchError);
          return this.getFallbackCategories();
        }
      } catch (error) {
        console.error('💥 خطأ في getCategories:', error);
        return this.getFallbackCategories();
      }
    });
  }

  // ==================== إدارة الأسئلة ====================
  async getQuestionsByCategory(
    categoryId: string,
    points: number
  ): Promise<GameQuestion[]> {
    return this.executeOnce(
      `get-questions-${categoryId}-${points}`,
      async () => {
        try {
          console.log(`🎯 جلب أسئلة الفئة ${categoryId} بنقاط ${points}`);

          const cacheKey = `${categoryId}-${points}`;

          // التحقق من الكاش
          if (this.isCacheValid() && this.questionsCache.has(cacheKey)) {
            console.log('✅ استخدام الأسئلة من الكاش');
            return this.questionsCache.get(cacheKey) || [];
          }

          // التحقق من الاتصال
          if (!this.isConnected) {
            console.log('⚠️ لا يوجد اتصال بـ Supabase، استخدام أسئلة فارغة');
            return [];
          }

          // البحث عن الفئة بطريقة آمنة
          let category;

          // أولاً: البحث بـ name_en إذا كان categoryId ليس UUID
          if (!this.isValidUUID(categoryId)) {
            console.log(`🔍 البحث عن الفئة بالاسم الإنجليزي: ${categoryId}`);
            const { data: categoryByName, error: nameError } = await supabase
              .from('categories')
              .select('id, name_en, name')
              .eq('name_en', categoryId)
              .eq('is_active', true)
              .single();

            if (!nameError && categoryByName) {
              category = categoryByName;
            } else {
              // البحث بالاسم العربي كبديل
              console.log(`🔍 البحث عن الفئة بالاسم العربي: ${categoryId}`);
              const { data: categoryByArabicName, error: arabicNameError } =
                await supabase
                  .from('categories')
                  .select('id, name_en, name')
                  .eq('name', categoryId)
                  .eq('is_active', true)
                  .single();

              if (!arabicNameError && categoryByArabicName) {
                category = categoryByArabicName;
              }
            }
          } else {
            // البحث بـ UUID
            console.log(`🔍 البحث عن الفئة بـ UUID: ${categoryId}`);
            const { data: categoryById, error: idError } = await supabase
              .from('categories')
              .select('id, name_en, name')
              .eq('id', categoryId)
              .eq('is_active', true)
              .single();

            if (!idError && categoryById) {
              category = categoryById;
            }
          }

          if (!category) {
            console.log(`⚠️ لم يتم العثور على الفئة: ${categoryId}`);
            return [];
          }

          console.log(
            `✅ تم العثور على الفئة: ${category.name} (${category.id})`
          );

          // جلب الأسئلة
          const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select(
              `
            id,
            question,
            answer,
            additional_info,
            image_url,
            image_description,
            points,
            difficulty,
            category:categories(name, name_en),
            question_type,
            audio_url,
            qr_code_data,
            blur_level,
            year_range_enabled,
            year_range_value
          `
            )
            .eq('category_id', category.id)
            .eq('points', points)
            .eq('is_active', true);

          if (questionsError) {
            console.error('❌ خطأ في جلب الأسئلة:', questionsError);
            return [];
          }

          if (!questions || questions.length === 0) {
            console.log(
              `⚠️ لا توجد أسئلة للفئة ${category.name} بنقاط ${points}`
            );
            return [];
          }

          // تحويل البيانات إلى تنسيق اللعبة
          const gameQuestions: GameQuestion[] = questions.map((q) => ({
            id: q.id,
            category: categoryId,
            points: q.points,
            difficulty: q.difficulty,
            question: q.question,
            answer: q.answer,
            additionalInfo: q.additional_info || undefined,
            imageDescription: q.image_description || 'صورة السؤال',
            imageUrl: q.image_url || undefined,
            used: false,
            questionType: q.question_type,
            audio_url: q.audio_url || undefined,
            qrCodeData: q.qr_code_data || undefined,
            blurLevel: q.blur_level || 5,
            year_range_enabled: q.year_range_enabled,
            year_range_value: q.year_range_value,
          }));

          // حفظ في الكاش
          this.questionsCache.set(cacheKey, gameQuestions);

          console.log(
            `✅ تم جلب ${gameQuestions.length} سؤال من قاعدة البيانات`
          );
          return gameQuestions;
        } catch (error) {
          console.error('💥 خطأ في getQuestionsByCategory:', error);
          return [];
        }
      }
    );
  }

  // ==================== إحصائيات الاستخدام ====================
  async incrementQuestionUsage(questionId: string): Promise<void> {
    return this.executeOnce(`increment-usage-${questionId}`, async () => {
      try {
        console.log(`📊 تحديث إحصائيات استخدام السؤال: ${questionId}`);

        // التحقق من الاتصال
        if (!this.isConnected) {
          console.log('⚠️ لا يوجد اتصال بـ Supabase، تخطي تحديث الإحصائيات');
          return;
        }

        // First, get the current usage count
        const { data: currentQuestion, error: fetchError } = await supabase
          .from('questions')
          .select('usage_count')
          .eq('id', questionId)
          .single();

        if (fetchError) {
          console.error('❌ خطأ في جلب إحصائيات السؤال الحالية:', fetchError);
          return;
        }

        const newUsageCount = (currentQuestion?.usage_count || 0) + 1;

        // Update with the new count
        const { error } = await supabase
          .from('questions')
          .update({
            usage_count: newUsageCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', questionId);

        if (error) {
          console.error('❌ خطأ في تحديث إحصائيات السؤال:', error);
        } else {
          console.log(`✅ تم تحديث إحصائيات السؤال إلى ${newUsageCount}`);
        }
      } catch (error) {
        console.error('💥 خطأ في incrementQuestionUsage:', error);
      }
    });
  }

  // ==================== إدارة جلسات اللعب ====================
  async createGameSession(
    sessionName: string,
    hostName: string,
    selectedCategories: string[]
  ): Promise<string> {
    return this.executeOnce(`create-game-session-${Date.now()}`, async () => {
      try {
        console.log('🎮 إنشاء جلسة لعب جديدة...');

        // التحقق من الاتصال
        if (!this.isConnected) {
          console.log('⚠️ لا يوجد اتصال بـ Supabase، إنشاء جلسة محلية');
          return `local-${Date.now()}`;
        }

        // التأكد من أن selectedCategories تحتوي على UUIDs صحيحة
        const validCategoryIds: string[] = [];

        for (const categoryId of selectedCategories) {
          if (this.isValidUUID(categoryId)) {
            validCategoryIds.push(categoryId);
          } else {
            // البحث عن UUID الفئة بالاسم
            const { data: category } = await supabase
              .from('categories')
              .select('id')
              .or(`name_en.eq.${categoryId},name.eq.${categoryId}`)
              .eq('is_active', true)
              .single();

            if (category) {
              validCategoryIds.push(category.id);
            }
          }
        }

        const { data: session, error } = await supabase
          .from('game_sessions')
          .insert({
            session_name: sessionName,
            host_name: hostName,
            selected_categories: validCategoryIds,
            status: 'waiting',
            total_questions: 0,
            questions_asked: 0,
          })
          .select()
          .single();

        if (error) {
          console.error('❌ خطأ في إنشاء جلسة اللعب:', error);
          throw error;
        }

        console.log('✅ تم إنشاء جلسة اللعب:', session.id);
        return session.id;
      } catch (error) {
        console.error('💥 خطأ في createGameSession:', error);
        return `local-${Date.now()}`;
      }
    });
  }

  async updateGameSession(sessionId: string, updates: any): Promise<void> {
    return this.executeOnce(`update-game-session-${sessionId}`, async () => {
      try {
        // التحقق من الاتصال
        if (!this.isConnected) {
          console.log('⚠️ لا يوجد اتصال بـ Supabase، تخطي تحديث الجلسة');
          return;
        }

        // التحقق من أن sessionId ليس محلياً
        if (sessionId.startsWith('local-')) {
          console.log('⚠️ جلسة محلية، تخطي تحديث الجلسة');
          return;
        }

        const { error } = await supabase
          .from('game_sessions')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (error) {
          console.error('❌ خطأ في تحديث جلسة اللعب:', error);
          throw error;
        }

        console.log('✅ تم تحديث جلسة اللعب');
      } catch (error) {
        console.error('💥 خطأ في updateGameSession:', error);
      }
    });
  }

  // ==================== إدارة الفرق ====================
  async createTeam(
    sessionId: string,
    teamName: string,
    color: string
  ): Promise<string> {
    return this.executeOnce(
      `create-team-${sessionId}-${teamName}`,
      async () => {
        try {
          // التحقق من الاتصال
          if (!this.isConnected || sessionId.startsWith('local-')) {
            console.log(
              '⚠️ لا يوجد اتصال بـ Supabase أو جلسة محلية، إنشاء فريق محلي'
            );
            return `local-team-${Date.now()}`;
          }

          const { data: team, error } = await supabase
            .from('teams')
            .insert({
              session_id: sessionId,
              name: teamName,
              color: color,
              score: 0,
              members_count: 1,
              is_active: true,
              helper_tools: {
                callFriend: true,
                twoAnswers: true,
                steal: true,
              },
            })
            .select()
            .single();

          if (error) {
            console.error('❌ خطأ في إنشاء الفريق:', error);
            throw error;
          }

          console.log('✅ تم إنشاء الفريق:', team.id);
          return team.id;
        } catch (error) {
          console.error('💥 خطأ في createTeam:', error);
          return `local-team-${Date.now()}`;
        }
      }
    );
  }

  async updateTeamScore(teamId: string, newScore: number): Promise<void> {
    return this.executeOnce(`update-team-score-${teamId}`, async () => {
      try {
        // التحقق من الاتصال
        if (!this.isConnected || teamId.startsWith('local-')) {
          console.log(
            '⚠️ لا يوجد اتصال بـ Supabase أو فريق محلي، تخطي تحديث النقاط'
          );
          return;
        }

        const { error } = await supabase
          .from('teams')
          .update({
            score: newScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', teamId);

        if (error) {
          console.error('❌ خطأ في تحديث نقاط الفريق:', error);
          throw error;
        }

        console.log('✅ تم تحديث نقاط الفريق');
      } catch (error) {
        console.error('💥 خطأ في updateTeamScore:', error);
      }
    });
  }

  // ==================== دوال مساعدة ====================
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.CACHE_DURATION;
  }

  private getFallbackCategories(): GameCategory[] {
    console.log('🆘 استخدام الفئات الاحتياطية مع الألوان المباشرة');

    return [
      {
        id: 'gcc-countries',
        name: 'مجلس الأمة',
        icon: '🏛️',
        description: 'دول مجلس التعاون الخليجي',
        color: '#ff6b35',
        illustration:
          'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        id: 'uae',
        name: 'الإمارات',
        icon: '🏙️',
        description: 'دولة الإمارات العربية المتحدة',
        color: '#2563eb',
        illustration:
          'https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        id: 'qatar',
        name: 'قطر',
        icon: '🏗️',
        description: 'دولة قطر',
        color: '#16a34a',
        illustration:
          'https://images.pexels.com/photos/3243090/pexels-photo-3243090.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        id: 'saudi',
        name: 'السعودية',
        icon: '🕋',
        description: 'المملكة العربية السعودية',
        color: '#dc2626',
        illustration:
          'https://images.pexels.com/photos/4350057/pexels-photo-4350057.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        id: 'general-info',
        name: 'معلومات عامة',
        icon: '❓',
        description: 'معلومات عامة متنوعة',
        color: '#7c3aed',
        illustration:
          'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        id: 'songs',
        name: 'أغاني',
        icon: '🎵',
        description: 'أسئلة عن الأغاني والمقاطع الصوتية',
        color: '#db2777',
        illustration:
          'https://images.pexels.com/photos/4090902/pexels-photo-4090902.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
    ];
  }

  // ==================== تنظيف الكاش ====================
  clearCache(): void {
    this.categoriesCache = [];
    this.questionsCache.clear();
    this.lastCacheUpdate = 0;
    console.log('🧹 تم تنظيف كاش اللعبة');
  }

  // ==================== إعادة تحميل البيانات ====================
  async refreshData(): Promise<void> {
    return this.executeOnce('refresh-data', async () => {
      console.log('🔄 إعادة تحميل بيانات اللعبة مع الألوان المحدثة...');
      this.clearCache();
      await this.getCategories();
      console.log('✅ تم إعادة تحميل البيانات مع الألوان المباشرة');
    });
  }

  // ==================== التحقق من الاتصال ====================
  isSupabaseConnected(): boolean {
    return this.isConnected;
  }

  // ==================== إيقاف فحص الاتصال عند تدمير الخدمة ====================
  destroy() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }
}

export const gameService = new GameService();
