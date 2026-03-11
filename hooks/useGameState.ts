import { useState, useCallback, useEffect, useRef } from 'react';
import { GameSession, Team, Question } from '../types/game';
import { gameService } from '../services/gameService';
import { aiQuestionGenerator } from '../services/aiQuestionGenerator';
import { imageSearchService } from '../services/imageSearchService';
import {
  checkSupabaseConnection,
  validateSupabaseConfig,
} from '../services/supabaseClient';

export const useGameState = () => {
  const [gameSession, setGameSession] = useState<GameSession>({
    id: '',
    gameName: '',
    teams: [],
    categories: [],
    currentTeam: 0,
    showAnswer: false,
    gameStarted: false,
    questionsAsked: 0,
    totalQuestions: 10,
    gameMode: 'category-selection',
    selectedCategories: [],
    usedQuestions: [],
  });

  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');
  const [lastConnectionCheck, setLastConnectionCheck] = useState(0);
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // تحسين الأداء - منع التكرار في العمليات
  const pendingOperations = useRef(new Map<string, Promise<any>>());

  // تخزين الأسئلة المستخدمة في الجلسة الحالية
  const sessionUsedQuestions = useRef<Set<string>>(new Set());

  const executeOnce = useCallback(
    async <T>(key: string, operation: () => Promise<T>): Promise<T> => {
      if (pendingOperations.current.has(key)) {
        console.log(`⏳ عملية قيد التنفيذ: ${key}`);
        return pendingOperations.current.get(key);
      }

      const promise = operation().finally(() => {
        pendingOperations.current.delete(key);
      });

      pendingOperations.current.set(key, promise);
      return promise;
    },
    []
  );

  // تحميل الفئات عند بدء التطبيق
  useEffect(() => {
    // التحقق من صحة التكوين أولاً
    if (!validateSupabaseConfig()) {
      console.warn('⚠️ تكوين Supabase غير صحيح، سيتم العمل في وضع محلي');
      setConnectionStatus('disconnected');
      return;
    }

    loadCategories();
    checkConnection();

    // Set up interval to check connection every 30 seconds
    const interval = setInterval(() => {
      if (validateSupabaseConfig()) {
        checkConnection();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Check connection status with improved error handling
  const checkConnection = useCallback(async () => {
    // Don't check too frequently
    const now = Date.now();
    if (now - lastConnectionCheck < 5000 && !isRetrying) {
      return;
    }

    setLastConnectionCheck(now);
    setConnectionStatus('checking');

    try {
      // التحقق من صحة التكوين أولاً
      if (!validateSupabaseConfig()) {
        console.log('❌ تكوين Supabase غير صحيح');
        setConnectionStatus('disconnected');
        return;
      }

      const isConnected = await checkSupabaseConnection();

      if (isConnected) {
        console.log('✅ Connected to Supabase');
        setConnectionStatus('connected');
        setConnectionRetryCount(0);
        setIsRetrying(false);

        // If we were previously disconnected, refresh data
        if (gameSession.categories.length === 0) {
          loadCategories();
        }
      } else {
        console.log('❌ Disconnected from Supabase');
        setConnectionStatus('disconnected');

        // Start retry process if not already retrying
        if (!isRetrying) {
          retryConnection();
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus('disconnected');

      // Start retry process if not already retrying
      if (!isRetrying) {
        retryConnection();
      }
    }
  }, [lastConnectionCheck, isRetrying, gameSession.categories.length]);

  // Retry connection with exponential backoff
  const retryConnection = useCallback(() => {
    if (connectionRetryCount >= 5) {
      console.log('⚠️ Max retry attempts reached');
      return;
    }

    setIsRetrying(true);
    const retryDelay = Math.min(
      1000 * Math.pow(2, connectionRetryCount),
      30000
    ); // Max 30 seconds

    console.log(
      `🔄 Retrying connection in ${retryDelay / 1000} seconds (attempt ${
        connectionRetryCount + 1
      }/5)`
    );

    setTimeout(() => {
      setConnectionRetryCount((prev) => prev + 1);
      checkConnection();
    }, retryDelay);
  }, [connectionRetryCount, checkConnection]);

  const loadCategories = useCallback(async () => {
    return executeOnce('load-categories', async () => {
      try {
        console.log('🎮 تحميل الفئات من قاعدة البيانات...');

        // التحقق من الاتصال أولاً
        if (!validateSupabaseConfig()) {
          console.warn('⚠️ لا يمكن تحميل الفئات - تكوين Supabase غير صحيح');
          return;
        }

        const categories = await gameService.getCategories();

        setGameSession((prev) => ({
          ...prev,
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            description: cat.description,
            color: cat.color, // 🔥 تضمين اللون من قاعدة البيانات
            illustration: cat.illustration,
          })),
        }));

        console.log(`✅ تم تحميل ${categories.length} فئة مع الألوان`);
      } catch (error) {
        console.error('❌ خطأ في تحميل الفئات:', error);
        // في حالة الخطأ، استخدم فئات افتراضية
        setGameSession((prev) => ({
          ...prev,
          categories: [
            {
              id: 'default-1',
              name: 'معلومات عامة',
              icon: '🧠',
              description: 'أسئلة متنوعة في المعرفة العامة',
              color: '#3B82F6',
            },
            {
              id: 'default-2',
              name: 'التاريخ',
              icon: '📚',
              description: 'أسئلة تاريخية مهمة',
              color: '#10B981',
            },
          ],
        }));
      }
    });
  }, [executeOnce]);

  // 🔥 دالة للتحقق من انتهاء جميع الأسئلة المتاحة
  const checkIfAllQuestionsUsed = useCallback(() => {
    const totalPossibleQuestions = gameSession.selectedCategories.length * 6; // 3 مستويات × 2 سؤال لكل مستوى
    const usedQuestionsCount = gameSession.usedQuestions.length;

    console.log(
      `📊 إحصائيات الأسئلة: ${usedQuestionsCount}/${totalPossibleQuestions} مستخدم`
    );

    // إذا تم استخدام جميع الأسئلة المتاحة، أظهر شاشة الفوز
    if (
      usedQuestionsCount >= totalPossibleQuestions &&
      totalPossibleQuestions > 0
    ) {
      console.log('🏁 تم استخدام جميع الأسئلة! عرض شاشة الفوز...');
      setTimeout(() => {
        setShowWinnerScreen(true);
      }, 2000); // تأخير قصير لإعطاء وقت لعرض آخر إجابة
      return true;
    }

    return false;
  }, [gameSession.selectedCategories.length, gameSession.usedQuestions.length]);

  // 🔥 دالة للتحقق من الأسئلة المتاحة لفئة معينة
  const getAvailableQuestionsForCategory = useCallback(
    (categoryId: string) => {
      const pointValues = [200, 400, 600];
      const questionNumbers = [1, 2];
      let availableCount = 0;

      pointValues.forEach((points) => {
        questionNumbers.forEach((questionNumber) => {
          const usedQuestionId = `${categoryId}-${points}-${questionNumber}`;
          if (!gameSession.usedQuestions.includes(usedQuestionId)) {
            availableCount++;
          }
        });
      });

      return availableCount;
    },
    [gameSession.usedQuestions]
  );

  // 🔥 دالة للتحقق من وجود أسئلة متاحة في أي فئة
  const hasAnyAvailableQuestions = useCallback(() => {
    return gameSession.selectedCategories.some(
      (categoryId) => getAvailableQuestionsForCategory(categoryId) > 0
    );
  }, [gameSession.selectedCategories, getAvailableQuestionsForCategory]);

  const initializeGame = useCallback(
    async (
      teams: Team[],
      totalQuestions: number,
      selectedCategories: string[],
      gameName: string
    ) => {
      return executeOnce('initialize-game', async () => {
        try {
          console.log('🎮 تهيئة اللعبة:', {
            teams,
            totalQuestions,
            selectedCategories,
            gameName,
          });

          // Check connection status
          const isConnected =
            validateSupabaseConfig() && (await checkSupabaseConnection());
          if (!isConnected) {
            console.log(
              '⚠️ No connection to Supabase, using local game session'
            );
          }

          // 🔥 CRITICAL: Force refresh categories to ensure fresh data
          console.log('🔄 Force refreshing category data to prevent stale data issues...');
          
          // Clear any cached data first
          if (validateSupabaseConfig()) {
            await gameService.refreshData();
          }
          
          // Reload categories with fresh data
          await loadCategories();
          
          // Add delay to ensure data is fully loaded
          await new Promise(resolve => setTimeout(resolve, 200));

          let newSessionId = Date.now().toString(); // fallback ID
          let teamsWithDbIds: Team[] = [];

          if (isConnected) {
            try {
              // إنشاء جلسة لعب في قاعدة البيانات
              newSessionId = await gameService.createGameSession(
                gameName || 'جلسة شير لوك',
                'مضيف اللعبة',
                selectedCategories
              );

              // إنشاء الفرق في قاعدة البيانات
              const teamIds: string[] = [];
              for (let i = 0; i < teams.length; i++) {
                const teamId = await gameService.createTeam(
                  newSessionId,
                  teams[i].name,
                  teams[i].color
                );
                teamIds.push(teamId);
                teams[i].id = teamId; // تحديث معرف الفريق

                // Initialize helper tools for each team
                teams[i].helperTools = {
                  callFriend: true,
                  twoAnswers: true,
                  steal: true,
                };

                teamsWithDbIds.push({
                  ...teams[i],
                  id: teamId,
                  helperTools: {
                    callFriend: true,
                    twoAnswers: true,
                    steal: true,
                  }
                });
              }

              // تحديث حالة الجلسة في قاعدة البيانات
              await gameService.updateGameSession(newSessionId, {
                status: 'active',
                started_at: new Date().toISOString(),
                total_questions: totalQuestions,
              });
            } catch (error) {
              console.error('❌ خطأ في إنشاء الجلسة في قاعدة البيانات:', error);
              // استخدم الجلسة المحلية
            }
          } else {
            // في الوضع المحلي: توليد معرفات فريدة لكل فريق
            for (let i = 0; i < teams.length; i++) {
              teamsWithDbIds.push({
                ...teams[i],
                id: `local-team-${Date.now()}-${i}`,
                helperTools: {
                  callFriend: true,
                  twoAnswers: true,
                  steal: true,
                }
              });
            }
          }

          setSessionId(newSessionId);

          // إعادة تعيين الأسئلة المستخدمة للجلسة الجديدة
          sessionUsedQuestions.current.clear();

          // استخدام الفرق مع المعرفات الصحيحة
          const finalTeams = teamsWithDbIds.length > 0 ? teamsWithDbIds : teams.map((team, i) => ({
            ...team,
            id: `local-team-${Date.now()}-${i}`,
            helperTools: {
              callFriend: true,
              twoAnswers: true,
              steal: true,
            }
          }));

          setGameSession((prev) => ({
            ...prev,
            id: newSessionId,
            gameName,
            teams: finalTeams,
            currentTeam: 0,
            showAnswer: false,
            gameStarted: true,
            questionsAsked: 0,
            totalQuestions,
            gameMode: 'game-board',
            selectedCategories,
            usedQuestions: [],
          }));

          // إخفاء شاشة الفوز عند بدء لعبة جديدة
          setShowWinnerScreen(false);

          console.log('✅ تم تهيئة اللعبة بنجاح مع الألوان المحدثة');
        } catch (error) {
          console.error('❌ خطأ في تهيئة اللعبة:', error);
          // في حالة الخطأ، استخدم التهيئة المحلية
          setGameSession((prev) => ({
            ...prev,
            id: Date.now().toString(),
            gameName,
            teams: teams.map((team) => ({
              ...team,
              helperTools: {
                callFriend: true,
                twoAnswers: true,
                steal: true,
              },
            })),
            currentTeam: 0,
            showAnswer: false,
            gameStarted: true,
            questionsAsked: 0,
            totalQuestions,
            gameMode: 'game-board',
            selectedCategories,
            usedQuestions: [],
          }));
          setShowWinnerScreen(false);
        }
      });
    },
    [loadCategories, executeOnce]
  );

  const selectQuestion = useCallback(
    async (categoryId: string, points: number, questionNumber: number) => {
      const operationKey = `select-question-${categoryId}-${points}-${questionNumber}`;

      return executeOnce(operationKey, async () => {
        console.log('🎯 اختيار سؤال:', { categoryId, points, questionNumber });

        setIsGeneratingQuestion(true);

        try {
          // إنشاء معرف فريد للسؤال المستخدم
          const usedQuestionId = `${categoryId}-${points}-${questionNumber}`;

          // التحقق من أن السؤال لم يتم استخدامه بالفعل
          if (gameSession.usedQuestions.includes(usedQuestionId)) {
            console.log('⚠️ هذا السؤال تم استخدامه بالفعل');
            setIsGeneratingQuestion(false);
            return;
          }

          // Check connection status
          const isConnected =
            validateSupabaseConfig() && (await checkSupabaseConnection());
          if (!isConnected) {
            console.log(
              '⚠️ No connection to Supabase, using fallback question'
            );
            const fallbackQuestion = getFallbackQuestion(categoryId, points);

            setGameSession((prev) => {
              const newUsedQuestions = [...prev.usedQuestions, usedQuestionId];
              const newQuestionsAsked = prev.questionsAsked + 1;

              return {
                ...prev,
                currentQuestion: fallbackQuestion,
                showAnswer: false,
                questionsAsked: newQuestionsAsked,
                usedQuestions: newUsedQuestions,
              };
            });

            setIsGeneratingQuestion(false);
            return;
          }

          // أولاً: محاولة الحصول على سؤال من قاعدة البيانات
          console.log('🔍 البحث عن أسئلة في قاعدة البيانات...');
          const dbQuestions = await gameService.getQuestionsByCategory(
            categoryId,
            points
          );

          let selectedQuestion: Question | null = null;

          if (dbQuestions.length > 0) {
            // تصفية الأسئلة التي لم تستخدم في هذه الجلسة
            const unusedQuestions = dbQuestions.filter(
              (q) => !sessionUsedQuestions.current.has(q.id)
            );

            if (unusedQuestions.length > 0) {
              // اختيار سؤال عشوائي من الأسئلة غير المستخدمة
              const randomIndex = Math.floor(
                Math.random() * unusedQuestions.length
              );
              const dbQuestion = unusedQuestions[randomIndex];

              selectedQuestion = {
                id: dbQuestion.id,
                category: categoryId,
                points: dbQuestion.points,
                difficulty: dbQuestion.difficulty,
                question: dbQuestion.question,
                answer: dbQuestion.answer,
                additionalInfo: dbQuestion.additionalInfo,
                imageDescription: dbQuestion.imageDescription,
                imageUrl: dbQuestion.imageUrl,
                used: true,
                questionType: dbQuestion.questionType,
                audio_url: dbQuestion.audio_url,
                qrCodeData: dbQuestion.qrCodeData,
                blurLevel: dbQuestion.blurLevel,
                year_range_enabled: dbQuestion.year_range_enabled,
                year_range_value: dbQuestion.year_range_value,
              };

              // تسجيل السؤال كمستخدم في الجلسة الحالية
              sessionUsedQuestions.current.add(dbQuestion.id);

              // تحديث إحصائيات استخدام السؤال
              await gameService.incrementQuestionUsage(dbQuestion.id);

              console.log(
                '✅ تم اختيار سؤال من قاعدة البيانات:',
                selectedQuestion.question
              );
            } else if (dbQuestions.length > 0) {
              // إذا كانت جميع الأسئلة مستخدمة، اختر سؤالاً عشوائياً
              console.log('⚠️ جميع الأسئلة مستخدمة، اختيار سؤال عشوائي');
              const randomIndex = Math.floor(
                Math.random() * dbQuestions.length
              );
              const dbQuestion = dbQuestions[randomIndex];

              selectedQuestion = {
                id: dbQuestion.id,
                category: categoryId,
                points: dbQuestion.points,
                difficulty: dbQuestion.difficulty,
                question: dbQuestion.question,
                answer: dbQuestion.answer,
                additionalInfo: dbQuestion.additionalInfo,
                imageDescription: dbQuestion.imageDescription,
                imageUrl: dbQuestion.imageUrl,
                used: true,
                questionType: dbQuestion.questionType,
                audio_url: dbQuestion.audio_url,
                qrCodeData: dbQuestion.qrCodeData,
                blurLevel: dbQuestion.blurLevel,
                year_range_enabled: dbQuestion.year_range_enabled,
                year_range_value: dbQuestion.year_range_value,
              };

              // تحديث إحصائيات استخدام السؤال
              await gameService.incrementQuestionUsage(dbQuestion.id);

              console.log(
                '✅ تم اختيار سؤال مستخدم سابقاً:',
                selectedQuestion.question
              );
            }
          }

          // إذا لم يتم العثور على سؤال من قاعدة البيانات، استخدم الذكاء الاصطناعي
          if (!selectedQuestion) {
            console.log(
              '🤖 لا توجد أسئلة في قاعدة البيانات، استخدام الذكاء الاصطناعي...'
            );

            const difficulty =
              points === 200 ? 'متوسط' : points === 400 ? 'صعب' : 'صعب جداً';

            const aiResponse = await aiQuestionGenerator.generateQuestion({
              category: categoryId,
              points,
              difficulty,
              usedQuestions: gameSession.usedQuestions,
            });

            console.log('✅ تم توليد السؤال بالذكاء الاصطناعي:', aiResponse);

            // البحث عن صورة مناسبة
            const imageUrl = await imageSearchService.searchImage(
              aiResponse.imageSearchQuery
            );

            selectedQuestion = {
              id: `ai-${Date.now()}-${questionNumber}`,
              category: categoryId,
              points,
              difficulty,
              question: aiResponse.question,
              answer: aiResponse.answer,
              additionalInfo: aiResponse.additionalInfo,
              imageDescription: aiResponse.imageDescription,
              imageUrl,
              used: true,
              questionType: 'text',
              year_range_enabled: false,
              year_range_value: 1,
            };

            // تسجيل السؤال كمستخدم في الجلسة الحالية
            sessionUsedQuestions.current.add(selectedQuestion.id);
          }

          if (selectedQuestion) {
            setGameSession((prev) => {
              const newUsedQuestions = [...prev.usedQuestions, usedQuestionId];
              const newQuestionsAsked = prev.questionsAsked + 1;

              return {
                ...prev,
                currentQuestion: selectedQuestion,
                showAnswer: false,
                questionsAsked: newQuestionsAsked,
                usedQuestions: newUsedQuestions,
              };
            });

            // تحديث الجلسة في قاعدة البيانات
            if (sessionId && isConnected) {
              try {
                await gameService.updateGameSession(sessionId, {
                  questions_asked: gameSession.questionsAsked + 1,
                });
              } catch (error) {
                console.error('❌ خطأ في تحديث الجلسة:', error);
              }
            }
          }
        } catch (error) {
          console.error('❌ خطأ في توليد السؤال:', error);

          // في حالة الخطأ، استخدم سؤال افتراضي
          const fallbackQuestion = getFallbackQuestion(categoryId, points);

          const usedQuestionId = `${categoryId}-${points}-${questionNumber}`;

          setGameSession((prev) => ({
            ...prev,
            currentQuestion: fallbackQuestion,
            showAnswer: false,
            questionsAsked: prev.questionsAsked + 1,
            usedQuestions: [...prev.usedQuestions, usedQuestionId],
          }));
        } finally {
          setIsGeneratingQuestion(false);
        }
      });
    },
    [
      gameSession.usedQuestions,
      sessionId,
      gameSession.questionsAsked,
      executeOnce,
    ]
  );

  // Fallback question function
  const getFallbackQuestion = useCallback(
    (categoryId: string, points: number): Question => {
      console.log(
        '🆘 استخدام سؤال احتياطي للفئة:',
        categoryId,
        'بنقاط:',
        points
      );

      // Determine difficulty based on points
      const difficulty =
        points === 200 ? 'متوسط' : points === 400 ? 'صعب' : 'صعب جداً';

      // Get category name
      const category = gameSession.categories.find(
        (cat) => cat.id === categoryId
      );
      const categoryName = category ? category.name : 'عامة';

      // Create a fallback question based on category
      let question = 'ما اسم هذا المعلم الشهير؟';
      let answer = 'معلم تاريخي';
      let additionalInfo = 'معلم تاريخي مهم في المنطقة.';
      let imageUrl =
        'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800';

      if (categoryId.includes('saudi') || categoryId.includes('السعودية')) {
        question = 'ما اسم هذا المعلم السعودي الشهير؟';
        answer = 'برج المملكة';
        additionalInfo =
          'يقع في مدينة الرياض وهو أحد أبرز المعالم في المملكة العربية السعودية.';
        imageUrl =
          'https://images.pexels.com/photos/4350057/pexels-photo-4350057.jpeg?auto=compress&cs=tinysrgb&w=800';
      } else if (
        categoryId.includes('uae') ||
        categoryId.includes('الإمارات')
      ) {
        question = 'ما اسم هذا المعلم الإماراتي الشهير؟';
        answer = 'برج خليفة';
        additionalInfo = 'يقع في مدينة دبي وهو أطول مبنى في العالم.';
        imageUrl =
          'https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?auto=compress&cs=tinysrgb&w=800';
      } else if (categoryId.includes('qatar') || categoryId.includes('قطر')) {
        question = 'ما اسم هذا المعلم القطري الشهير؟';
        answer = 'متحف قطر الوطني';
        additionalInfo = 'تم تصميمه على شكل وردة الصحراء.';
        imageUrl =
          'https://images.pexels.com/photos/3243090/pexels-photo-3243090.jpeg?auto=compress&cs=tinysrgb&w=800';
      } else if (categoryId.includes('songs') || categoryId.includes('أغاني')) {
        question = 'ما اسم هذه الأغنية الشهيرة؟';
        answer = 'أغنية عربية شهيرة';
        additionalInfo = 'من أشهر الأغاني العربية.';
        imageUrl =
          'https://images.pexels.com/photos/4090902/pexels-photo-4090902.jpeg?auto=compress&cs=tinysrgb&w=800';
      }

      return {
        id: `fallback-${Date.now()}`,
        category: categoryId,
        points,
        difficulty,
        question,
        answer,
        additionalInfo,
        imageDescription: categoryName,
        imageUrl,
        used: true,
        questionType: 'image',
      };
    },
    [gameSession.categories]
  );

  const showAnswer = useCallback(() => {
    console.log('📖 عرض الإجابة');
    setGameSession((prev) => ({
      ...prev,
      showAnswer: true,
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    console.log('➡️ السؤال التالي');

    setGameSession((prev) => {
      const newState = {
        ...prev,
        currentQuestion: undefined,
        showAnswer: false,
        currentTeam: (prev.currentTeam + 1) % prev.teams.length,
        activeHelperTool: undefined, // Reset any active helper tool
      };

      // 🔥 التحقق من انتهاء الأسئلة بعد تحديث الحالة
      setTimeout(() => {
        const totalPossibleQuestions = prev.selectedCategories.length * 6;
        const usedQuestionsCount = prev.usedQuestions.length;

        console.log(
          `📊 فحص انتهاء الأسئلة: ${usedQuestionsCount}/${totalPossibleQuestions}`
        );

        if (
          usedQuestionsCount >= totalPossibleQuestions &&
          totalPossibleQuestions > 0
        ) {
          console.log('🏁 انتهت جميع الأسئلة! عرض شاشة الفوز...');
          setShowWinnerScreen(true);
        }
      }, 500);

      return newState;
    });
  }, []);

  const updateTeamScore = useCallback(
    async (teamId: string, points: number) => {
      return executeOnce(`update-score-${teamId}-${Date.now()}`, async () => {
        console.log('🏆 Starting team score update:', { teamId, points });
        console.log('🔍 Current teams before update:', gameSession.teams.map(t => ({ id: t.id, name: t.name, score: t.score })));

        setGameSession((prev) => {
          // Find the team to update
          const teamToUpdate = prev.teams.find((team) => team.id === teamId);

          if (!teamToUpdate) {
            console.error('❌ Team not found:', teamId);
            console.error('Available teams:', prev.teams.map(t => ({ id: t.id, name: t.name })));
            return prev;
          }

          // Calculate new score (ensure it doesn't go below 0)
          const newScore = Math.max(0, teamToUpdate.score + points);
          console.log(
            `✏️ Updating team ${teamId} (${teamToUpdate.name}): ${teamToUpdate.score} => ${newScore}`
          );

          // Create a completely new teams array with the updated score
          const updatedTeams = prev.teams.map((team) => {
            if (team.id === teamId) {
              console.log(
                `🔄 Updating team: ${team.id} (${team.name}), old score: ${team.score}, new score: ${newScore}`
              );
              // Return a completely new object to ensure React detects the change
              return { 
                ...team, 
                score: newScore,
                // Add a timestamp to force re-render
                lastUpdated: Date.now()
              };
            }
            // Return unchanged team as new object to ensure immutability
            return { ...team };
          });

          console.log('🔍 Teams after update:', updatedTeams.map(t => ({ id: t.id, name: t.name, score: t.score })));

          // Update the team score in the database
          if (sessionId && validateSupabaseConfig()) {
            gameService.updateTeamScore(teamId, newScore).catch((error) => {
              console.error(
                '❌ Error updating team score in database:',
                error
              );
            });
          }

          // Return completely new state object
          const newState = {
            ...prev,
            teams: updatedTeams,
          };
          
          console.log('🎯 Final state update:', newState.teams.map(t => ({ id: t.id, name: t.name, score: t.score })));
          return newState;
        });
      });
    },
    [sessionId, executeOnce]
  );

  // دالة جديدة لإنهاء اللعبة وعرض شاشة الفوز
  const endGame = useCallback(async () => {
    return executeOnce('end-game', async () => {
      console.log('🏁 إنهاء اللعبة وعرض شاشة الفوز');

      // تحديث حالة الجلسة في قاعدة البيانات
      if (sessionId && validateSupabaseConfig()) {
        try {
          await gameService.updateGameSession(sessionId, {
            status: 'completed',
            ended_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('❌ خطأ في تحديث حالة الجلسة:', error);
        }
      }

      // عرض شاشة الفوز
      setShowWinnerScreen(true);
    });
  }, [sessionId, executeOnce]);

  const resetGame = useCallback(async () => {
    return executeOnce('reset-game', async () => {
      console.log('🔄 إعادة تعيين اللعبة');

      // تحديث حالة الجلسة في قاعدة البيانات
      if (sessionId && validateSupabaseConfig()) {
        try {
          await gameService.updateGameSession(sessionId, {
            status: 'completed',
            ended_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('❌ خطأ في تحديث حالة الجلسة:', error);
        }
      }

      // إعادة تعيين الأسئلة المستخدمة
      aiQuestionGenerator.resetUsedQuestions();
      sessionUsedQuestions.current.clear();

      // إعادة تحميل الفئات من قاعدة البيانات
      await loadCategories();

      setGameSession({
        id: '',
        gameName: '',
        teams: [],
        categories: gameSession.categories, // الاحتفاظ بالفئات المحملة
        currentTeam: 0,
        showAnswer: false,
        gameStarted: false,
        questionsAsked: 0,
        totalQuestions: 10,
        gameMode: 'category-selection',
        selectedCategories: [],
        usedQuestions: [],
      });

      setSessionId('');
      setShowWinnerScreen(false);
    });
  }, [sessionId, gameSession.categories, loadCategories, executeOnce]);

  // دالة للتحقق من استخدام السؤال
  const isQuestionUsed = useCallback(
    (categoryId: string, points: number, questionNumber: number) => {
      const usedQuestionId = `${categoryId}-${points}-${questionNumber}`;
      const isUsed = gameSession.usedQuestions.includes(usedQuestionId);
      console.log('🔍 التحقق من استخدام السؤال:', {
        categoryId,
        points,
        questionNumber,
        isUsed,
      });
      return isUsed;
    },
    [gameSession.usedQuestions]
  );

  // دالة لإعادة تحميل البيانات مع الألوان المحدثة
  const refreshGameData = useCallback(async () => {
    return executeOnce('refresh-game-data', async () => {
      console.log('🔄 إعادة تحميل بيانات اللعبة مع الألوان المحدثة...');
      if (validateSupabaseConfig()) {
        await gameService.refreshData();
        await loadCategories(); // 🔥 إعادة تحميل الفئات مع الألوان الجديدة
        console.log('✅ تم إعادة تحميل بيانات اللعبة مع الألوان');
      } else {
        console.warn(
          '⚠️ لا يمكن إعادة تحميل البيانات - تكوين Supabase غير صحيح'
        );
      }
    });
  }, [loadCategories, executeOnce]);

  // دوال وسائل المساعدة
  const activateHelperTool = useCallback(
    (
      toolType: 'callFriend' | 'twoAnswers' | 'steal',
      teamId: string,
      targetTeamId?: string
    ) => {
      console.log(`🛠️ تفعيل وسيلة المساعدة: ${toolType} للفريق: ${teamId}`);

      setGameSession((prev) => {
        // التحقق من أن الفريق يملك الوسيلة
        const team = prev.teams.find((t) => t.id === teamId);
        if (!team || !team.helperTools[toolType]) {
          console.log('⚠️ الفريق لا يملك هذه الوسيلة');
          return prev;
        }

        // تحديث حالة الوسيلة للفريق
        const updatedTeams = prev.teams.map((t) => {
          if (t.id === teamId) {
            return {
              ...t,
              helperTools: {
                ...t.helperTools,
                [toolType]: false, // استخدام الوسيلة
              },
            };
          }
          return t;
        });

        // إعداد الوسيلة النشطة
        let activeHelperTool = {
          type: toolType,
          teamId,
          targetTeamId,
        };

        // إذا كانت الوسيلة هي الاتصال بصديق، نضبط المؤقت
        if (toolType === 'callFriend') {
          activeHelperTool = {
            ...activeHelperTool,
            timeRemaining: 60, // 60 ثانية
          };
        }

        return {
          ...prev,
          teams: updatedTeams,
          activeHelperTool: activeHelperTool as any,
        };
      });
    },
    []
  );

  // دالة لتحديث مؤقت الاتصال بصديق
  const updateCallFriendTimer = useCallback((newTime: number) => {
    setGameSession((prev) => {
      if (
        !prev.activeHelperTool ||
        prev.activeHelperTool.type !== 'callFriend'
      ) {
        return prev;
      }

      return {
        ...prev,
        activeHelperTool: {
          ...prev.activeHelperTool,
          timeRemaining: newTime,
        },
      };
    });
  }, []);

  // دالة لإنهاء استخدام وسيلة المساعدة
  const endHelperTool = useCallback(() => {
    setGameSession((prev) => ({
      ...prev,
      activeHelperTool: undefined,
    }));
  }, []);

  // دالة لتنفيذ السرقة
  const executeSteal = useCallback(
    (stealingTeamId: string, targetTeamId: string, points: number) => {
      console.log(
        `🔄 تنفيذ السرقة: ${stealingTeamId} يسرق ${points} نقطة من ${targetTeamId}`
      );

      setGameSession((prev) => {
        // Create a deep copy of the teams array to avoid reference issues
        const updatedTeams = prev.teams.map((team) => {
          if (team.id === stealingTeamId) {
            console.log(
              `✅ زيادة نقاط الفريق ${team.name} من ${team.score} إلى ${
                team.score + points
              }`
            );
            return { ...team, score: team.score + points };
          }
          if (team.id === targetTeamId) {
            const newScore = Math.max(0, team.score - points);
            console.log(
              `⬇️ خفض نقاط الفريق ${team.name} من ${team.score} إلى ${newScore}`
            );
            return { ...team, score: newScore };
          }
          return { ...team };
        });

        return {
          ...prev,
          teams: updatedTeams,
          activeHelperTool: undefined, // إنهاء وسيلة المساعدة
        };
      });

      // تحديث النقاط في قاعدة البيانات
      if (sessionId && validateSupabaseConfig()) {
        const stealingTeam = gameSession.teams.find(
          (t) => t.id === stealingTeamId
        );
        const targetTeam = gameSession.teams.find((t) => t.id === targetTeamId);

        if (stealingTeam && targetTeam) {
          gameService
            .updateTeamScore(stealingTeamId, stealingTeam.score + points)
            .catch((error) => {
              console.error('❌ خطأ في تحديث نقاط الفريق السارق:', error);
            });

          gameService
            .updateTeamScore(
              targetTeamId,
              Math.max(0, targetTeam.score - points)
            )
            .catch((error) => {
              console.error('❌ خطأ في تحديث نقاط الفريق المستهدف:', error);
            });
        }
      }
    },
    [sessionId, gameSession.teams]
  );

  // 🔥 مراقبة تلقائية لانتهاء الأسئلة
  useEffect(() => {
    if (gameSession.gameStarted && gameSession.selectedCategories.length > 0) {
      const totalPossibleQuestions = gameSession.selectedCategories.length * 6;
      const usedQuestionsCount = gameSession.usedQuestions.length;

      console.log(
        `🔍 مراقبة الأسئلة: ${usedQuestionsCount}/${totalPossibleQuestions}`
      );

      // إذا تم استخدام جميع الأسئلة وليس هناك سؤال حالي معروض
      if (
        usedQuestionsCount >= totalPossibleQuestions &&
        totalPossibleQuestions > 0 &&
        !gameSession.currentQuestion &&
        !showWinnerScreen
      ) {
        console.log(
          '🏁 تم اكتشاف انتهاء جميع الأسئلة! عرض شاشة الفوز تلقائياً...'
        );

        setTimeout(() => {
          setShowWinnerScreen(true);
        }, 1000); // تأخير قصير للتأكد من استقرار الحالة
      }
    }
  }, [
    gameSession.usedQuestions.length,
    gameSession.selectedCategories.length,
    gameSession.currentQuestion,
    gameSession.gameStarted,
    showWinnerScreen,
  ]);

  return {
    gameSession,
    initializeGame,
    selectQuestion,
    showAnswer,
    nextQuestion,
    updateTeamScore,
    resetGame,
    endGame, // دالة جديدة لإنهاء اللعبة
    isQuestionUsed,
    isGeneratingQuestion,
    refreshGameData,
    sessionId,
    showWinnerScreen, // حالة عرض شاشة الفوز
    // 🔥 دوال جديدة للتحقق من الأسئلة المتاحة
    checkIfAllQuestionsUsed,
    getAvailableQuestionsForCategory,
    hasAnyAvailableQuestions,
    // دوال وسائل المساعدة
    activateHelperTool,
    updateCallFriendTimer,
    endHelperTool,
    executeSteal,
    // Connection status
    connectionStatus,
    checkConnection,
  };
};
