import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward, Loader, RefreshCw, AlertCircle } from 'lucide-react';

interface AudioQuestionProps {
  audio_url: string;
  question: string;
  isPlaying?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const AudioQuestion: React.FC<AudioQuestionProps> = ({
  audio_url,
  question,
  isPlaying: externalIsPlaying,
  onPlayStateChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  
  useEffect(() => {
    console.log('🎵 AudioQuestion Component - Props:', { 
      audio_url, 
      question,
      externalIsPlaying 
    });
    
    if (!audio_url) {
      console.error('❌ AudioQuestion: No audio URL provided');
      setError('لم يتم توفير رابط للملف الصوتي');
      setIsLoading(false);
      return;
    }
    
    try {
      new URL(audio_url);
    } catch (e) {
      console.error('❌ AudioQuestion: Invalid audio URL:', audio_url);
      setError('رابط الملف الصوتي غير صالح');
      setIsLoading(false);
      return;
    }
  }, [audio_url, question, externalIsPlaying]);

  useEffect(() => {
    if (externalIsPlaying !== undefined) {
      console.log('🔄 Syncing with external playing state:', externalIsPlaying);
      setIsPlaying(externalIsPlaying);
      
      if (externalIsPlaying && audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("❌ Failed to play on external state change:", e);
            setError('فشل في تشغيل الملف الصوتي. قد يكون هذا بسبب قيود المتصفح على التشغيل التلقائي.');
          });
        }
      } else if (!externalIsPlaying && audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [externalIsPlaying]);

  useEffect(() => {
    console.log('🔄 Creating new Audio element, retry count:', retryCount);
    setIsLoading(true);
    setError(null);
    
    const audio = new Audio();
    audio.preload = "auto";
    
    audio.crossOrigin = "anonymous";
    
    audioRef.current = audio;
    
    const handleLoadedMetadata = () => {
      console.log('✅ Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      console.log('🔄 Audio playback ended');
      setIsPlaying(false);
      setCurrentTime(0);
      if (onPlayStateChange) onPlayStateChange(false);
    };
    
    const handleCanPlayThrough = () => {
      console.log('✅ Audio can play through');
      setIsLoading(false);
    };
    
    const handleError = (e: Event) => {
      console.error('❌ Audio error:', e, audio.error);
      setIsLoading(false);
      
      
      if (audio.error) {
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            setError('تم إلغاء تحميل الملف الصوتي');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            setError('حدث خطأ في الشبكة أثناء تحميل الملف الصوتي');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            setError('فشل في فك تشفير الملف الصوتي');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError('تنسيق الملف الصوتي غير مدعوم أو الرابط غير صحيح');
            break;
          default:
            setError('فشل في تحميل الملف الصوتي');
        }
      } else {
        setError('فشل في تحميل الملف الصوتي');
      }
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    
    
    console.log('🔄 Setting audio source:', audio_url);
    audio.src = audio_url;
    
    
    try {
      audio.load();
      console.log('🔄 Audio loading started');
    } catch (err) {
      console.error('❌ Error loading audio:', err);
      setError('حدث خطأ أثناء تحميل الملف الصوتي');
      setIsLoading(false);
    }
    
    
    return () => {
      console.log('🧹 Cleaning up audio element');
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.src = '';
    };
  }, [audio_url, onPlayStateChange, retryCount]);

  const togglePlay = () => {
    if (!audioRef.current) {
      console.error('❌ Audio element not available');
      return;
    }
    
    console.log('🔄 Toggle play, current state:', isPlaying);
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback started successfully');
            setIsPlaying(true);
            if (onPlayStateChange) onPlayStateChange(true);
          })
          .catch(err => {
            console.error("❌ Play failed:", err);
            setError('فشل في تشغيل الملف الصوتي. قد يكون هذا بسبب قيود المتصفح على التشغيل التلقائي.');
          });
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      console.log('🔄 Toggle mute, current state:', isMuted);
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      console.log('🔄 Restarting audio');
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Audio playback started after restart');
              setIsPlaying(true);
              if (onPlayStateChange) onPlayStateChange(true);
            })
            .catch(err => {
              console.error("❌ Restart play failed:", err);
              setError('فشل في إعادة تشغيل الملف الصوتي');
            });
        }
      }
    }
  };

  const forward10 = () => {
    if (audioRef.current) {
      console.log('🔄 Forward 10 seconds');
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    console.log('🔄 Seek to position:', pos, 'new time:', newTime);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleRetry = () => {
    console.log('🔄 Retrying audio playback');
    setRetryCount(prev => prev + 1);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 w-full border border-gray-200 shadow-md">
      <div className="mb-4">
        <p className="text-xl font-bold text-gray-800 mb-2">{question}</p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-gray-600 mr-3">جاري تحميل الملف الصوتي...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
          <p className="text-sm mb-4">تأكد من صحة رابط الملف الصوتي</p>
          
          <div className="bg-gray-50 p-2 rounded-lg mb-4 overflow-hidden">
            <p className="text-xs text-gray-500 break-all text-center">
              {isValidUrl(audio_url) ? audio_url : 'الرابط غير صالح'}
            </p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleRetry}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : (
        <>
          {}
          <div className="flex flex-col gap-4">
            {}
            <div className="flex justify-center mb-2">
              <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:from-orange-600 hover:via-red-600 hover:to-purple-700 transition-all duration-500"
              >
                {isPlaying ? 
                  <Pause className="w-8 h-8 text-white" /> : 
                  <Play className="w-8 h-8 text-white ml-1" />
                }
              </button>
            </div>
            
            {}
            <div className="flex justify-center">
              <div className="bg-white text-gray-800 px-6 py-2 rounded-full text-2xl font-mono font-bold">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            {}
            <div 
              ref={progressRef}
              className="relative h-2 bg-gray-200 rounded-full cursor-pointer mt-2"
              onClick={handleProgressClick}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            
            {}
            <div className="flex items-center justify-center gap-6 mt-4">
              <button 
                onClick={restart}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button 
                onClick={forward10}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FastForward className="w-5 h-5" />
              </button>
              
              <button 
                onClick={toggleMute}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};