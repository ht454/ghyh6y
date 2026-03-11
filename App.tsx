import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';
import { useGameState } from './hooks/useGameState';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { LoadingScreen } from './components/LoadingScreen';
import { LandingPage } from './pages/LandingPage';
import { WinnerScreen } from './components/WinnerScreen';
import { AuthProvider } from './contexts/AuthContext';
import { SignupPage } from './pages/auth/SignupPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CategoriesManagement } from './pages/admin/CategoriesManagement';
import { QuestionsManagement } from './pages/admin/QuestionsManagement';
import { ContentManagement } from './pages/admin/ContentManagement';
import { GameSessionsManagement } from './pages/admin/GameSessionsManagement';
import { ActivityLogsManagement } from './pages/admin/ActivityLogsManagement';
import { UsersManagement } from './pages/admin/UsersManagement';
import { ImageManagement } from './pages/admin/ImageManagement';
import { ToolsPage } from './pages/admin/ToolsPage';
import { PWAInstallButton } from './components/PWAInstallButton';
import { InstallPage } from './pages/InstallPage';


import { PWAOfflineIndicator } from './components/PWAOfflineIndicator';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { EWCPage } from './pages/EWCPage';
import { ArrowUpRight } from 'lucide-react';

function App() {
  const {
    gameSession,
    initializeGame,
    selectQuestion,
    showAnswer,
    nextQuestion,
    updateTeamScore,
    resetGame,
    endGame,
    isQuestionUsed,
    isGeneratingQuestion,
    refreshGameData,
    showWinnerScreen,
    activateHelperTool,
    updateCallFriendTimer,
    endHelperTool,
    executeSteal,
  } = useGameState();

  return (
    <AuthProvider>
      <Router>
        <>
          <PWAOfflineIndicator />
          <PWAInstallButton />
          <PWAUpdateNotification />
          <Routes>
          {/* Landing Page - الصفحة الرئيسية الجديدة */}
          <Route path="/" element={<LandingPage />} />

          {/* Install Page */}
          <Route path="/install" element={<InstallPage />} />

          {/* EWC Page */}
          <Route path="/ewc" element={<EWCPage />} />

          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route
            path="/auth/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Profile Page */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="questions" element={<QuestionsManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="games" element={<GameSessionsManagement />} />
            <Route path="activities" element={<ActivityLogsManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="images" element={<ImageManagement />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route
              path="settings"
              element={<div className="p-6 text-white">الإعدادات - قريباً</div>}
            />
          </Route>

          {/* Game Routes - تحت مسار /game */}
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                {/* عرض شاشة التحميل أثناء توليد السؤال */}
                {isGeneratingQuestion && <LoadingScreen />}

                {/* عرض شاشة الفوز */}
                {showWinnerScreen && (
                  <WinnerScreen
                    teams={gameSession.teams}
                    gameName={gameSession.gameName}
                    onPlayAgain={resetGame}
                    onGoHome={() => (window.location.href = '/')}
                  />
                )}

                {!isGeneratingQuestion && !showWinnerScreen && (
                  <>
                    {!gameSession || !gameSession.gameStarted ? (
                      <HomePage onStartGame={initializeGame} />
                    ) : (
                      <GamePage
                        gameSession={gameSession}
                        onSelectQuestion={selectQuestion}
                        onShowAnswer={showAnswer}
                        onNextQuestion={nextQuestion}
                        onUpdateScore={updateTeamScore}
                        onEndGame={endGame}
                        isQuestionUsed={isQuestionUsed}
                        onRefreshData={refreshGameData}
                        activateHelperTool={activateHelperTool}
                        updateCallFriendTimer={updateCallFriendTimer}
                        endHelperTool={endHelperTool}
                        executeSteal={executeSteal}
                      />
                    )}
                  </>
                )}
              </ProtectedRoute>
            }
          />

          {/* Redirect any unknown routes to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
        </>
      </Router>
    </AuthProvider>
  );
}

export default App;
