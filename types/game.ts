export interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
  // Add helper tools status
  helperTools: {
    callFriend: boolean;
    twoAnswers: boolean;
    steal: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string; // إضافة خاصية اللون
  illustration: string;
}

export interface Question {
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
  blurLevel?: number; // For blurry image questions (1-10)
  year_range_enabled?: boolean; // Whether year range validation is enabled
  year_range_value?: number; // Year range tolerance (±)
}

export interface GameSession {
  id: string;
  gameName: string;
  teams: Team[];
  categories: Category[];
  currentTeam: number;
  currentQuestion?: Question;
  showAnswer: boolean;
  gameStarted: boolean;
  questionsAsked: number;
  totalQuestions: number;
  gameMode: 'category-selection' | 'game-board' | 'question-display';
  selectedCategories: string[];
  usedQuestions: string[];
  // Add helper tool states
  activeHelperTool?: {
    type: 'callFriend' | 'twoAnswers' | 'steal';
    teamId: string;
    targetTeamId?: string; // For steal tool
    timeRemaining?: number; // For call friend timer
  };
}
