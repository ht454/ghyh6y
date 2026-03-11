import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'checking' | 'connecting';
  onRetry: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  onRetry,
  className = ''
}) => {
  let displayMessage = '';
  let icon = null;
  let bgColor = '';
  let textColor = '';
  let showRetryButton = false;

  switch (status) {
    case 'connected':
      displayMessage = 'متصل';
      icon = <Wifi className="w-4 h-4" />;
      bgColor = 'bg-green-900/50';
      textColor = 'text-green-300';
      break;
    case 'disconnected':
      displayMessage = 'غير متصل';
      icon = <WifiOff className="w-4 h-4" />;
      bgColor = 'bg-red-900/50';
      textColor = 'text-red-300';
      showRetryButton = true;
      break;
    case 'checking':
    case 'connecting':
      displayMessage = 'جاري الاتصال...';
      icon = <RefreshCw className="w-4 h-4 animate-spin" />;
      bgColor = 'bg-yellow-900/50';
      textColor = 'text-yellow-300';
      break;
    default:
      displayMessage = 'حالة غير معروفة';
      icon = <WifiOff className="w-4 h-4" />;
      bgColor = 'bg-gray-900/50';
      textColor = 'text-gray-300';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm ${bgColor} ${textColor} ${className}`}>
      {icon}
      <span>{displayMessage}</span>
      {showRetryButton && (
        <button
          onClick={onRetry}
          className="ml-2 p-1 rounded-full hover:bg-current hover:bg-opacity-20 transition-colors"
          title="إعادة المحاولة"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};