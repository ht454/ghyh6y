import React, { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ChampionPage } from './ChampionPage';
import './ChampionPage.css';

interface Match {
  id: string;
  player1: string;
  player2: string;
  winner: string;
  round: number;
  matchNumber: number;
}

interface TournamentBracketProps {
  className?: string;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({ className = '' }) => {
  const [matches, setMatches] = useState<Match[]>([
    // Round 1 - Quarter Finals
    { id: '1-1', player1: 'الفريق 1', player2: 'الفريق 2', winner: '', round: 1, matchNumber: 1 },
    { id: '1-2', player1: 'الفريق 3', player2: 'الفريق 4', winner: '', round: 1, matchNumber: 2 },
    { id: '1-3', player1: 'الفريق 5', player2: 'الفريق 6', winner: '', round: 1, matchNumber: 3 },
    { id: '1-4', player1: 'الفريق 7', player2: 'الفريق 8', winner: '', round: 1, matchNumber: 4 },
    
    // Round 2 - Semi Finals
    { id: '2-1', player1: '', player2: '', winner: '', round: 2, matchNumber: 1 },
    { id: '2-2', player1: '', player2: '', winner: '', round: 2, matchNumber: 2 },
    
    // Round 3 - Final
    { id: '3-1', player1: '', player2: '', winner: '', round: 3, matchNumber: 1 },
  ]);

  const [saved, setSaved] = useState(false);
  const [showAnimation, setShowAnimation] = useState<string | null>(null);
  const [showChampionPage, setShowChampionPage] = useState(false);
  const [championName, setChampionName] = useState('');

  // Load saved data from localStorage
  useEffect(() => {
    const savedMatches = localStorage.getItem('tournament-bracket');
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
  }, []);

  // Save to localStorage
  const saveTournament = () => {
    localStorage.setItem('tournament-bracket', JSON.stringify(matches));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Reset tournament
  const resetTournament = () => {
    const initialMatches = [
      { id: '1-1', player1: 'الفريق 1', player2: 'الفريق 2', winner: '', round: 1, matchNumber: 1 },
      { id: '1-2', player1: 'الفريق 3', player2: 'الفريق 4', winner: '', round: 1, matchNumber: 2 },
      { id: '1-3', player1: 'الفريق 5', player2: 'الفريق 6', winner: '', round: 1, matchNumber: 3 },
      { id: '1-4', player1: 'الفريق 7', player2: 'الفريق 8', winner: '', round: 1, matchNumber: 4 },
      { id: '2-1', player1: '', player2: '', winner: '', round: 2, matchNumber: 1 },
      { id: '2-2', player1: '', player2: '', winner: '', round: 2, matchNumber: 2 },
      { id: '3-1', player1: '', player2: '', winner: '', round: 3, matchNumber: 1 },
    ];
    setMatches(initialMatches);
    localStorage.removeItem('tournament-bracket');
  };

  // Update match
  const updateMatch = (matchId: string, field: 'player1' | 'player2' | 'winner', value: string) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId ? { ...match, [field]: value } : match
    ));
    
    // Show animation when a winner is added
    if (field === 'winner' && value.trim() !== '') {
      setShowAnimation(matchId);
      setTimeout(() => setShowAnimation(null), 3000); // Hide after 3 seconds
      
      // Check if this is the final match (champion)
      if (matchId === '3-1') {
        setChampionName(value.trim());
        setTimeout(() => {
          setShowChampionPage(true);
        }, 1000); // Show champion page after 1 second
      }
    }
  };

  // Get matches by round
  const getMatchesByRound = (round: number) => {
    return matches.filter(match => match.round === round);
  };

  return (
    <div className={`tournament-bracket ${className}`}>
      {/* Tournament Bracket - Horizontal Layout */}
      <div className="tournament-container">
        {/* Round 1 - Quarter Finals */}
        <div className="round round-1">
          <h3 className="round-title">الدور الأول</h3>
          <div className="matches">
            {getMatchesByRound(1).map((match) => (
              <div key={match.id} className="match-container">
                <div className="match">
                  <div className="player-container">
                    <input
                      type="text"
                      value={match.player1}
                      onChange={(e) => updateMatch(match.id, 'player1', e.target.value)}
                      className="player-input player1"
                      placeholder="اسم الفريق الأول"
                    />
                  </div>
                  <div className="vs">VS</div>
                  <div className="player-container">
                    <input
                      type="text"
                      value={match.player2}
                      onChange={(e) => updateMatch(match.id, 'player2', e.target.value)}
                      className="player-input player2"
                      placeholder="اسم الفريق الثاني"
                    />
                  </div>
                  <div className="winner-container">
                    <input
                      type="text"
                      value={match.winner}
                      onChange={(e) => updateMatch(match.id, 'winner', e.target.value)}
                      className="player-input winner"
                      placeholder="الفائز"
                    />
                  </div>
                </div>
                {showAnimation === match.id && (
                  <div className="winner-animation">
                    <DotLottieReact
                      src="https://lottie.host/d279d54d-0b98-4b77-8100-68fa1989db40/sXuTX8pkJt.lottie"
                      loop
                      autoplay
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Round 2 - Semi Finals */}
        <div className="round round-2">
          <h3 className="round-title">نصف النهائي</h3>
          <div className="matches">
            {getMatchesByRound(2).map((match) => (
              <div key={match.id} className="match-container">
                <div className="match">
                  <div className="player-container">
                    <input
                      type="text"
                      value={match.player1}
                      onChange={(e) => updateMatch(match.id, 'player1', e.target.value)}
                      className="player-input player1"
                      placeholder="الفائز من المباراة 1"
                    />
                  </div>
                  <div className="vs">VS</div>
                  <div className="player-container">
                    <input
                      type="text"
                      value={match.player2}
                      onChange={(e) => updateMatch(match.id, 'player2', e.target.value)}
                      className="player-input player2"
                      placeholder="الفائز من المباراة 2"
                    />
                  </div>
                  <div className="winner-container">
                    <input
                      type="text"
                      value={match.winner}
                      onChange={(e) => updateMatch(match.id, 'winner', e.target.value)}
                      className="player-input winner"
                      placeholder="الفائز"
                    />
                  </div>
                </div>
                {showAnimation === match.id && (
                  <div className="winner-animation">
                    <DotLottieReact
                      src="https://lottie.host/d279d54d-0b98-4b77-8100-68fa1989db40/sXuTX8pkJt.lottie"
                      loop
                      autoplay
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Round 3 - Final */}
        <div className="round round-3">
          <h3 className="round-title">النهائي</h3>
          <div className="matches">
            {getMatchesByRound(3).map((match) => (
              <div key={match.id} className="match-container final-match">
                <div className="match">
                  <div className="player-container">
                    <input
                      type="text"
                      value={match.player1}
                      onChange={(e) => updateMatch(match.id, 'player1', e.target.value)}
                      className="player-input player1"
                      placeholder="الفائز من نصف النهائي 1"
                    />
                  </div>
                  <div className="vs">VS</div>
                  <div className="player-container">
                    <input
                      type="text"
                      value={match.player2}
                      onChange={(e) => updateMatch(match.id, 'player2', e.target.value)}
                      className="player-input player2"
                      placeholder="الفائز من نصف النهائي 2"
                    />
                  </div>
                  <div className="winner-container">
                    <input
                      type="text"
                      value={match.winner}
                      onChange={(e) => updateMatch(match.id, 'winner', e.target.value)}
                      className="player-input winner champion"
                      placeholder="البطل"
                    />
                  </div>
                </div>

                {showAnimation === match.id && (
                  <div className="winner-animation champion-animation">
                    <DotLottieReact
                      src="https://lottie.host/d279d54d-0b98-4b77-8100-68fa1989db40/sXuTX8pkJt.lottie"
                      loop
                      autoplay
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons - Under the tournament */}
      <div className="tournament-buttons">
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={saveTournament}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 flex items-center gap-1"
          >
            <Save className="w-3 h-3" />
            حفظ
          </button>
          <button
            onClick={resetTournament}
            className="bg-gray-700 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-600 transition-all duration-300 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            إعادة تعيين
          </button>
        </div>
        {saved && (
          <div className="mt-1 text-green-400 text-xs text-center">تم الحفظ!</div>
        )}
      </div>

      {/* Champion Page */}
      {showChampionPage && (
        <ChampionPage
          championName={championName}
          onClose={() => setShowChampionPage(false)}
        />
      )}
    </div>
  );
}; 