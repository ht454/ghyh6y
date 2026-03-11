import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import './PredictionSpinner.css';

interface PredictionSpinnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PredictionSpinner: React.FC<PredictionSpinnerProps> = ({ isOpen, onClose }) => {
  const [teams, setTeams] = useState<string[]>(['']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  const addTeam = () => {
    setTeams([...teams, '']);
  };

  const removeTeam = (index: number) => {
    if (teams.length > 1) {
      const newTeams = teams.filter((_, i) => i !== index);
      setTeams(newTeams);
    }
  };

  const updateTeam = (index: number, value: string) => {
    const newTeams = [...teams];
    newTeams[index] = value;
    setTeams(newTeams);
  };

  const startSpin = () => {
    const validTeams = teams.filter(team => team.trim() !== '');
    if (validTeams.length < 2) {
      alert('يجب إضافة فريقين على الأقل');
      return;
    }

    setIsSpinning(true);
    setWinner('');
    
    // Generate completely random rotation (no predetermined winner)
    const baseRotations = 8; // 8 full rotations
    const randomFinalAngle = Math.random() * 360; // Random final position
    const totalRotation = baseRotations * 360 + randomFinalAngle;
    
    // Set the rotation degrees for CSS
    setRotationDegrees(totalRotation);
    
    // After spinning stops, calculate who won based on final position
    setTimeout(() => {
      // Calculate which team the arrow is pointing to
      const normalizedAngle = (360 - (totalRotation % 360)) % 360;
      const segmentAngle = 360 / validTeams.length;
      const winnerIndex = Math.floor(normalizedAngle / segmentAngle);
      const winner = validTeams[winnerIndex] || validTeams[0];
      
      setWinner(winner);
      setCurrentIndex(winnerIndex);
      setIsSpinning(false);
    }, 8000); // 8 seconds
  };

  const reset = () => {
    setWinner('');
    setCurrentIndex(0);
    setIsSpinning(false);
    setRotationDegrees(0);
  };

  if (!isOpen) return null;

  const validTeams = teams.filter(team => team.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className="relative ml-auto w-80 h-full bg-black shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img 
              src="https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754457199224-zl1ec5vwxm.png"
              alt="شيرلوك"
              className="w-8 h-8 object-contain"
            />
            <h2 className="text-xl font-bold text-white">التوقعات</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Teams Input */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">أسماء الفرق</h3>
            <div className="space-y-2">
              {teams.map((team, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => updateTeam(index, e.target.value)}
                    placeholder={`الفريق ${index + 1}`}
                    className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm"
                  />
                  {teams.length > 1 && (
                    <button
                      onClick={() => removeTeam(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={addTeam}
              className="mt-3 flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة فريق
            </button>
          </div>

          {/* Spinner */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">عجلة الحظ</h3>
            <div className="bg-black rounded-xl p-6 text-center">
              <div 
                className={`wheel-container mb-4 ${validTeams.length >= 2 && !isSpinning ? 'cursor-pointer' : ''}`}
                onClick={validTeams.length >= 2 && !isSpinning ? startSpin : undefined}
              >
                {/* Fixed Pointer */}
                <div className="wheel-pointer">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-black drop-shadow-lg"></div>
                </div>
                
                {/* Spinning Wheel */}
                <div 
                  className="wheel-spin"
                  style={{
                    transform: isSpinning ? `rotate(${rotationDegrees}deg)` : `rotate(0deg)`,
                    background: validTeams.length > 0 ? `conic-gradient(${validTeams.map((_, index) => {
                      const startAngle = (index / validTeams.length) * 360;
                      const endAngle = ((index + 1) / validTeams.length) * 360;
                      const colors = ['#f97316', '#ea580c', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];
                      const color = colors[index % colors.length];
                      return `${color} ${startAngle}deg ${endAngle}deg`;
                    }).join(', ')})` : '#374151'
                  }}
                >
                  {/* Segment Borders */}
                  {validTeams.map((_, index) => {
                    const angle = (index / validTeams.length) * 360;
                    return (
                      <div
                        key={`border-${index}`}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          background: `linear-gradient(to right, transparent 49.9%, rgba(0,0,0,0.8) 49.9%, rgba(0,0,0,0.8) 50.1%, transparent 50.1%)`,
                          transformOrigin: 'center center'
                        }}
                      />
                    );
                  })}
                  
                  {/* Team Names on Wheel Segments */}
                  {validTeams.map((team, index) => {
                    const angle = (index / validTeams.length) * 360 + (360 / validTeams.length) / 2;
                    
                    // Dynamic radius based on number of teams
                    const baseRadius = validTeams.length <= 4 ? 80 : validTeams.length <= 6 ? 75 : 65;
                    
                    // Dynamic text size based on number of teams and segment size
                    const segmentAngle = 360 / validTeams.length;
                    const maxTextLength = Math.max(3, Math.min(10, Math.floor(segmentAngle / 12)));
                    
                    // Font size adjustment
                    const fontSize = validTeams.length <= 4 ? '0.9rem' : 
                                   validTeams.length <= 6 ? '0.8rem' : 
                                   validTeams.length <= 8 ? '0.7rem' : '0.6rem';
                    
                    return (
                      <div
                        key={index}
                        className="team-segment pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${baseRadius}px) rotate(-${angle}deg)`,
                          fontSize: fontSize,
                          width: `${Math.max(40, 100 - validTeams.length * 4)}px`
                        }}
                      >
                        {team.length > maxTextLength ? team.substring(0, maxTextLength) + '...' : team}
                      </div>
                    );
                  })}
                </div>
                
                {/* Center Circle */}
                <div className="wheel-center pointer-events-none">
                  <img 
                    src="https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754457199224-zl1ec5vwxm.png"
                    alt="شيرلوك"
                    className="w-10 h-10 object-contain"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  {validTeams.length < 2 
                    ? 'أضف فريقين على الأقل للبدء' 
                    : isSpinning 
                    ? 'يدور...' 
                    : 'اضغط على العجلة للتشغيل'
                  }
                </p>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};