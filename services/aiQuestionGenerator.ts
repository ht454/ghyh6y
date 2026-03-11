interface AIQuestionRequest {
  category: string;
  points: number;
  difficulty: 'متوسط' | 'صعب' | 'صعب جداً';
  usedQuestions: string[];
}

interface AIQuestionResponse {
  question: string;
  answer: string;
  additionalInfo?: string;
  imageDescription: string;
  imageSearchQuery: string;
}

class AIQuestionGenerator {
  private readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  
  private usedQuestions: Set<string> = new Set();
  private questionHistory: Map<string, number> = new Map();
  private questionPool: Map<string, any[]> = new Map();
  private currentQuestionIndex: Map<string, number> = new Map();
  
  
  private pendingOperations = new Map<string, Promise<AIQuestionResponse>>();

  
  private bannedPhrases: Set<string> = new Set([
    'ما اسم هذا المعلم الشهير',
    'ما اسم هذا المعلم',
    'في أي مدينة يقع هذا المعلم',
    'أين يقع هذا المعلم',
    'ما اسم هذا البرج',
    'ما اسم هذا المسجد',
    'ما اسم هذا القصر',
    'ما اسم هذا المتحف',
    'ما اسم هذا الاستاد',
    'ما اسم هذا الوادي',
    'ما اسم هذه القلعة',
    'في أي مدينة يقع',
    'أين يقع',
    'ما اسم'
  ]);

  constructor() {
    this.loadFromStorage();
    this.initializeQuestionPools();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('sherlook_used_questions');
      if (saved) {
        this.usedQuestions = new Set(JSON.parse(saved));
      }
      
      const historyData = localStorage.getItem('sherlook_question_history');
      if (historyData) {
        this.questionHistory = new Map(JSON.parse(historyData));
      }

      const indexData = localStorage.getItem('sherlook_question_index');
      if (indexData) {
        this.currentQuestionIndex = new Map(JSON.parse(indexData));
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات المحفوظة:', error);
      this.usedQuestions = new Set();
      this.questionHistory = new Map();
      this.currentQuestionIndex = new Map();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('sherlook_used_questions', JSON.stringify([...this.usedQuestions]));
      localStorage.setItem('sherlook_question_history', JSON.stringify([...this.questionHistory]));
      localStorage.setItem('sherlook_question_index', JSON.stringify([...this.currentQuestionIndex]));
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
    }
  }

  private initializeQuestionPools() {
    
    const questionPools = {
      'saudi-200': [
        { question: 'كم عدد مناطق المملكة العربية السعودية؟', answer: '13 منطقة', additionalInfo: 'تنقسم المملكة إلى 13 منطقة إدارية كل منطقة لها أمير يديرها.', imageDescription: 'خريطة مناطق السعودية', imageSearchQuery: 'مناطق السعودية' },
        { question: 'في أي منطقة تقع مدينة أبها؟', answer: 'منطقة عسير', additionalInfo: 'أبها عاصمة منطقة عسير وتشتهر بمناخها المعتدل وجبالها الخضراء.', imageDescription: 'مدينة أبها', imageSearchQuery: 'أبها عسير' },
        { question: 'كم يبلغ عدد سكان المملكة تقريباً؟', answer: '35 مليون نسمة', additionalInfo: 'يشمل هذا العدد المواطنين والمقيمين في المملكة.', imageDescription: 'سكان السعودية', imageSearchQuery: 'سكان السعودية' }
      ],
      'general-info': [
        { question: 'كم عدد قارات العالم؟', answer: 'سبع قارات', additionalInfo: 'آسيا، أفريقيا، أمريكا الشمالية، أمريكا الجنوبية، أوروبا، أوقيانوسيا، والقارة القطبية الجنوبية.', imageDescription: 'خريطة العالم', imageSearchQuery: 'قارات العالم' },
        { question: 'ما هو أكبر محيط في العالم؟', answer: 'المحيط الهادئ', additionalInfo: 'يغطي مساحة تقدر بحوالي 165.25 مليون كيلومتر مربع.', imageDescription: 'المحيط الهادئ', imageSearchQuery: 'المحيط الهادئ' },
        { question: 'ما هي أطول سلسلة جبال في العالم؟', answer: 'جبال الأنديز', additionalInfo: 'تمتد على طول الساحل الغربي لأمريكا الجنوبية بطول 7000 كم.', imageDescription: 'جبال الأنديز', imageSearchQuery: 'جبال الأنديز' }
      ]
    };

   
    for (const [key, questions] of Object.entries(questionPools)) {
      this.questionPool.set(key, questions);
    }
  }

  private getDifficultyPrompt(points: number): string {
    switch (points) {
      case 200: return 'متوسط - سؤال واضح ومباشر يتطلب معرفة أساسية';
      case 400: return 'صعب - سؤال يتطلب معرفة متقدمة ومعلومات متخصصة';
      case 600: return 'صعب جداً - سؤال للخبراء، يتطلب معرفة عميقة ومعلومات نادرة';
      default: return 'متوسط';
    }
  }

  private getCategoryPrompt(category: string): string {
    const categoryPrompts = {
      'saudi': 'المملكة العربية السعودية - تاريخ، جغرافيا، اقتصاد، ثقافة، شخصيات',
      'uae': 'دولة الإمارات العربية المتحدة - معالم، مشاريع، تاريخ، اقتصاد',
      'qatar': 'دولة قطر - تاريخ، رياضة، اقتصاد، مشاريع حديثة',
      'oman': 'سلطنة عمان - تاريخ، طبيعة، ثقافة، جغرافيا',
      'bahrain': 'مملكة البحرين - تاريخ، حضارة دلمون، اقتصاد',
      'kuwait': 'دولة الكويت - تاريخ، اقتصاد، ثقافة، معالم',
      'gcc-countries': 'دول مجلس التعاون الخليجي - تاريخ مشترك، مؤسسات',
      'general-info': 'معلومات عامة - علوم، تكنولوجيا، اكتشافات',
      'geography': 'جغرافيا - قارات، دول، جبال، أنهار، مناخ',
      'history': 'التاريخ - حضارات، شخصيات، أحداث مهمة',
      'poetry': 'الشعر والأدب - شعراء، قصائد، أدباء',
      'language': 'اللغة العربية - نحو، صرف، أدب، معاني',
      'quran': 'القرآن الكريم - سور، آيات، تفسير، علوم قرآنية',
      'islamic': 'العلوم الإسلامية - فقه، حديث، سيرة، تاريخ إسلامي',
      'songs': 'أغاني - أغاني عربية، مطربين، ألحان، كلمات'
    };
    
    return categoryPrompts[category] || 'معلومات عامة';
  }

  private createAdvancedPrompt(request: AIQuestionRequest): string {
    const categoryPrompt = this.getCategoryPrompt(request.category);
    const difficultyPrompt = this.getDifficultyPrompt(request.points);
    
    const bannedPhrasesText = [...this.bannedPhrases].join('، ');

    return `
أنت خبير في توليد أسئلة مسابقات متنوعة ومبتكرة. مهمتك إنشاء سؤال فريد تماماً.

المطلوب:
- الفئة: ${categoryPrompt}
- مستوى الصعوبة: ${difficultyPrompt}

⚠️ ممنوع تماماً استخدام هذه العبارات: ${bannedPhrasesText}

✅ استخدم صيغ متنوعة مثل:
- "كم عدد..."
- "في أي عام..."
- "من هو..."
- "كم يبلغ..."
- "ما هي..."
- "أين تقع..."
- "كم تبلغ مساحة..."
- "من مؤسس..."
- "في أي منطقة..."
- "ما اسم عملة..."

متطلبات الجودة:
1. السؤال يجب أن يكون مناسب للمستوى
2. إجابة دقيقة ومحددة
3. معلومة إضافية مفيدة
4. وصف مناسب للصورة
5. تجنب التكرار تماماً

أرجع الإجابة بصيغة JSON فقط:
{
  "question": "السؤال المبتكر هنا",
  "answer": "الإجابة الدقيقة",
  "additionalInfo": "معلومة إضافية مفيدة",
  "imageDescription": "وصف الصورة",
  "imageSearchQuery": "كلمات بحث للصورة"
}
`;
  }

  async generateQuestion(request: AIQuestionRequest): Promise<AIQuestionResponse> {
   
    const operationKey = `generate-question-${request.category}-${request.points}-${Date.now()}`;
    
    if (this.pendingOperations.has(operationKey)) {
      console.log(`⏳ عملية توليد سؤال قيد التنفيذ: ${operationKey}`);
      return this.pendingOperations.get(operationKey)!;
    }
    
    const promise = this.performGenerateQuestion(request);
    this.pendingOperations.set(operationKey, promise);
    
    try {
      return await promise;
    } finally {
      this.pendingOperations.delete(operationKey);
    }
  }

  private async performGenerateQuestion(request: AIQuestionRequest): Promise<AIQuestionResponse> {
    console.log('🎯 توليد سؤال للفئة:', request.category, 'النقاط:', request.points);
    
   
    const poolKey = `${request.category}-${request.points}`;
    const questionPool = this.questionPool.get(poolKey);
    
    if (questionPool && questionPool.length > 0) {
      
      const availableQuestions = questionPool.filter((_, index) => {
        const questionId = `${poolKey}-pool-${index}`;
        return !this.usedQuestions.has(questionId) && !request.usedQuestions.includes(questionId);
      });
      
      if (availableQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];
        const originalIndex = questionPool.indexOf(selectedQuestion);
        
        
        const questionId = `${poolKey}-pool-${originalIndex}`;
        this.usedQuestions.add(questionId);
        this.saveToStorage();
        
        console.log('✅ تم اختيار سؤال من المجموعة المحلية:', selectedQuestion.question);
        return selectedQuestion;
      }
    }

    
    if (!this.API_KEY) {
      console.log('⚠️ لا يوجد API key، استخدام سؤال احتياطي');
      return this.getEmergencyFallback(request);
    }

    try {
      console.log('🤖 توليد سؤال بالذكاء الاصطناعي...');
      
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 ثانية
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'أنت خبير في توليد أسئلة مسابقات متنوعة ومبتكرة. تتجنب التكرار وتستخدم صيغ متنوعة.'
            },
            {
              role: 'user',
              content: this.createAdvancedPrompt(request)
            }
          ],
          max_tokens: 600,
          temperature: 0.9,
          presence_penalty: 0.8,
          frequency_penalty: 0.9
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('استجابة غير صالحة من الذكاء الاصطناعي');
      }

      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('لم يتم العثور على JSON في الاستجابة');
      }

      const questionData: AIQuestionResponse = JSON.parse(jsonMatch[0]);
      
      if (!questionData.question || !questionData.answer) {
        throw new Error('بيانات السؤال غير مكتملة');
      }

      
      const isBanned = [...this.bannedPhrases].some(phrase => 
        questionData.question.toLowerCase().includes(phrase.toLowerCase())
      );

      if (isBanned) {
        console.log('❌ السؤال يحتوي على عبارة ممنوعة، استخدام سؤال احتياطي');
        return this.getEmergencyFallback(request);
      }

      const questionId = `${request.category}-${request.points}-ai-${this.generateQuestionHash(questionData.question)}`;
      this.usedQuestions.add(questionId);
      
      const categoryKey = `${request.category}-${request.points}`;
      const currentCount = this.questionHistory.get(categoryKey) || 0;
      this.questionHistory.set(categoryKey, currentCount + 1);
      
      this.saveToStorage();

      console.log('✅ تم توليد السؤال بالذكاء الاصطناعي:', questionData.question);
      return questionData;

    } catch (error) {
      console.error('❌ خطأ في توليد السؤال بالذكاء الاصطناعي:', error);
      return this.getEmergencyFallback(request);
    }
  }

  private generateQuestionHash(question: string): string {
    let hash = 0;
    for (let i = 0; i < question.length; i++) {
      const char = question.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private getEmergencyFallback(request: AIQuestionRequest): AIQuestionResponse {
    console.log('🆘 استخدام السؤال الاحتياطي الطارئ');
    
    
    const emergencyQuestions = {
      200: [
        { question: 'كم عدد قارات العالم؟', answer: 'سبع قارات', additionalInfo: 'آسيا، أفريقيا، أمريكا الشمالية، أمريكا الجنوبية، أوروبا، أوقيانوسيا، والقارة القطبية الجنوبية.', imageDescription: 'خريطة العالم', imageSearchQuery: 'قارات العالم' },
        { question: 'كم عدد أيام السنة الميلادية؟', answer: '365 يوم', additionalInfo: 'في السنة الكبيسة تصبح 366 يوماً.', imageDescription: 'تقويم ميلادي', imageSearchQuery: 'تقويم ميلادي' },
        { question: 'ما هي أكبر دولة عربية من حيث المساحة؟', answer: 'الجزائر', additionalInfo: 'تبلغ مساحتها حوالي 2.38 مليون كيلومتر مربع.', imageDescription: 'خريطة الجزائر', imageSearchQuery: 'الجزائر' }
      ],
      400: [
        { question: 'في أي عام سقطت الإمبراطورية العثمانية؟', answer: '1922', additionalInfo: 'انتهت رسمياً عام 1922 وتأسست الجمهورية التركية عام 1923.', imageDescription: 'الإمبراطورية العثمانية', imageSearchQuery: 'الإمبراطورية العثمانية' },
        { question: 'من هو مخترع المصباح الكهربائي؟', answer: 'توماس إديسون', additionalInfo: 'اخترع المصباح الكهربائي العملي عام 1879.', imageDescription: 'توماس إديسون', imageSearchQuery: 'توماس إديسون' },
        { question: 'ما هي أكبر صحراء في العالم؟', answer: 'الصحراء الكبرى', additionalInfo: 'تغطي مساحة تقدر بحوالي 9.2 مليون كيلومتر مربع.', imageDescription: 'الصحراء الكبرى', imageSearchQuery: 'الصحراء الكبرى' }
      ],
      600: [
        { question: 'كم عدد عظام جسم الإنسان البالغ؟', answer: '206 عظمة', additionalInfo: 'يولد الإنسان بحوالي 270 عظمة تندمج مع النمو.', imageDescription: 'هيكل عظمي', imageSearchQuery: 'عظام الإنسان' },
        { question: 'ما هي أعمق نقطة في المحيطات؟', answer: 'خندق ماريانا', additionalInfo: 'يصل عمقه إلى حوالي 11 كيلومتر تحت سطح البحر.', imageDescription: 'خندق ماريانا', imageSearchQuery: 'خندق ماريانا' },
        { question: 'من هو مؤلف كتاب "الأمير"؟', answer: 'نيكولو مكيافيلي', additionalInfo: 'كتبه عام 1513 ويعتبر من أهم الكتب في الفلسفة السياسية.', imageDescription: 'نيكولو مكيافيلي', imageSearchQuery: 'نيكولو مكيافيلي' }
      ]
    };

    
    const questions = emergencyQuestions[request.points] || emergencyQuestions[200];
    
    
    const unusedQuestions = questions.filter(q => {
      const questionId = `emergency-${request.category}-${request.points}-${this.generateQuestionHash(q.question)}`;
      return !this.usedQuestions.has(questionId) && !request.usedQuestions.includes(questionId);
    });
    
    
    const questionList = unusedQuestions.length > 0 ? unusedQuestions : questions;
    const randomIndex = Math.floor(Math.random() * questionList.length);
    const selectedQuestion = questionList[randomIndex];
    
    
    const questionId = `emergency-${request.category}-${request.points}-${this.generateQuestionHash(selectedQuestion.question)}`;
    this.usedQuestions.add(questionId);
    this.saveToStorage();
    
    return selectedQuestion;
  }

  resetUsedQuestions() {
    this.usedQuestions.clear();
    this.questionHistory.clear();
    this.currentQuestionIndex.clear();
    localStorage.removeItem('sherlook_used_questions');
    localStorage.removeItem('sherlook_question_history');
    localStorage.removeItem('sherlook_question_index');
    console.log('🔄 تم إعادة تعيين جميع الأسئلة المستخدمة');
  }

  getQuestionStats(): { totalUsed: number; byCategory: Map<string, number> } {
    return {
      totalUsed: this.usedQuestions.size,
      byCategory: new Map(this.questionHistory)
    };
  }

  hasAvailableQuestions(category: string, points: number): boolean {
    const poolKey = `${category}-${points}`;
    const questionPool = this.questionPool.get(poolKey);
    
    if (!questionPool) return true;
    
  
    for (let i = 0; i < questionPool.length; i++) {
      const questionId = `${poolKey}-pool-${i}`;
      if (!this.usedQuestions.has(questionId)) {
        return true;
      }
    }
    
    return false;
  }
}

export const aiQuestionGenerator = new AIQuestionGenerator();