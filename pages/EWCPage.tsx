import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Target } from 'lucide-react';
import { TournamentBracket } from '../components/TournamentBracket';
import { PredictionSpinner } from '../components/PredictionSpinner';
import '../components/TournamentBracket.css';

export const EWCPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [isPredictionsOpen, setIsPredictionsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '7755') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('الرمز غير صحيح');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handlePredictions = () => {
    setIsPredictionsOpen(true);
  };

  const closePredictions = () => {
    setIsPredictionsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-black flex items-center justify-center p-2">
        <div className="w-full max-w-sm">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-center mb-4">
              <Lock className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <h1 className="text-xl font-bold text-white mb-1">
                صفحة محمية
              </h1>
              <p className="text-gray-400 text-sm">
                أدخل الرمز للوصول إلى المحتوى
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="أدخل الرمز"
                  className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  maxLength={4}
                />
              </div>

              {error && (
                <div className="text-red-500 text-center text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-sm"
              >
                دخول
              </button>
            </form>

            <button
              onClick={handleBack}
              className="w-full mt-3 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-3 h-3" />
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="px-3 py-2 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </button>
          
          <button
            onClick={handlePredictions}
            className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors text-sm bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded-lg"
          >
            <Target className="w-4 h-4" />
            التوقعات
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Title - Absolute positioned at top */}
        <div className="absolute top-0 left-0 right-0 z-10 text-center pt-2">
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white leading-tight">
            بطولة شيرلوك لكأس العالم للرياضات الإلكترونية
            <span className="block text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-orange-400 mt-1">
              EWC
            </span>
          </h1>
        </div>

        <div className="flex-1 flex flex-col justify-start items-center p-2 pt-8">
          {/* Logos - Positioned in corners */}
          <div className="absolute top-4 left-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32">
            <img
              src="https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754446733811-bo1d8jq387.png"
              alt="شعار EWC 1"
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32">
            <img
              src="https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754457199224-zl1ec5vwxm.png"
              alt="شعار EWC 2"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Tournament Bracket */}
          <div className="flex-1 w-full max-w-6xl mt-4">
            <TournamentBracket />
          </div>
        </div>
      </div>

      {/* Predictions Sidebar */}
      <PredictionSpinner 
        isOpen={isPredictionsOpen} 
        onClose={closePredictions} 
      />
    </div>
  );
}; 