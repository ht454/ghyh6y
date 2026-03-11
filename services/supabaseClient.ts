import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration
const RECONNECT_ATTEMPTS = 10;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 15000; // 15 seconds
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 8000; // 8 seconds (reduced from 10 seconds)
const DEBUG_MODE = import.meta.env.DEV;

// Connection state
let connectionState: 'connected' | 'disconnected' | 'checking' = 'checking';
let retryCount = 0;
let retryTimeout: number | null = null;
let connectionCheckInterval: number | null = null;
let lastSuccessfulConnection = Date.now();

// Event callbacks
const connectionStateCallbacks: ((state: typeof connectionState) => void)[] = [];
const errorCallbacks: ((error: Error) => void)[] = [];

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://example.supabase.co' || supabaseAnonKey === 'public-anon-key') {
  console.warn('⚠️ Warning: Supabase environment variables are missing or invalid.');
  console.warn('Please create a .env file in the project root and add:');
  console.warn('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.warn('VITE_SUPABASE_ANON_KEY=your-anon-key');
}

// Supabase client options
const options = {
  auth: {
    autoRefreshToken: true, // Automatically refresh the token before it expires
    persistSession: true,   // Persist the session in localStorage
    detectSessionInUrl: true, // Detect if there's a session in the URL
    storageKey: 'sherlook_supabase_auth', // Custom storage key
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.warn('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn('Error writing to localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Error removing from localStorage:', error);
        }
      }
    }
  },
  global: {
    headers: { 'x-application-name': 'sherlook-game' },
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  db: {
    schema: 'public'
  },
};

// Create Supabase client
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'public-anon-key',
  options as any
);

// Initialize connection monitoring
initConnectionMonitoring();

/**
 * Initialize connection monitoring
 */
function initConnectionMonitoring() {
  // Check connection on startup
  checkConnection();
  
  // Set up periodic connection checks
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  connectionCheckInterval = window.setInterval(() => {
    checkConnection();
  }, CONNECTION_CHECK_INTERVAL);
  
  // Set up cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
  
  // Set up online/offline event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Log initialization
  if (DEBUG_MODE) {
    console.log('🔌 Supabase connection monitoring initialized');
  }
}

/**
 * Check connection to Supabase
 */
export async function checkSupabaseConnection(silent: boolean = false): Promise<boolean> {
  try {
    if (DEBUG_MODE && !silent) {
      console.log('🔍 Checking Supabase connection with timeout...');
    }
    
    // Validate configuration
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://example.supabase.co' || supabaseAnonKey === 'public-anon-key') {
      console.warn('⚠️ Invalid Supabase configuration');
      updateConnectionState('disconnected', silent);
      return false;
    }

    // Check if we can reach the Supabase API
    if (navigator.onLine) {
      try {
        const response = await Promise.race([
          fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
            method: 'HEAD',
            headers: { 'Content-Type': 'application/json' }
          }),
          new Promise<Response>((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
          )
        ]);
        
        if (!response.ok && response.status !== 401) {
          if (!silent) console.error('❌ Supabase API not reachable:', response.status);
          updateConnectionState('disconnected', silent);
          return false;
        }
      } catch (fetchError) {
        if (!silent) console.error('❌ Supabase connection check failed:', fetchError);
        updateConnectionState('disconnected', silent);
        return false;
      }
    } else {
      // If offline, try a basic connection test
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
          method: 'HEAD',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok && response.status !== 401) {
          updateConnectionState('disconnected', silent);
          return false;
        }
      } catch (offlineError) {
        updateConnectionState('disconnected', silent);
        return false;
      }
    }

    // Connection successful
    if (DEBUG_MODE && !silent) {
      console.log('✅ Supabase connection successful');
    }
    
    // Update state and reset retry count
    updateConnectionState('connected', silent);
    retryCount = 0;
    lastSuccessfulConnection = Date.now();
    return true;
  } catch (error) {
    if (!silent) console.error('❌ Supabase connection check failed:', error);
    updateConnectionState('disconnected', silent);
    return false;
  }
}

/**
 * Update connection state and notify listeners
 */
function updateConnectionState(newState: typeof connectionState, silent: boolean = false) {
  if (connectionState !== newState) {
    const oldState = connectionState;
    connectionState = newState;
    
    // Log state change
    if (DEBUG_MODE && !silent) {
      console.log(`🔌 Supabase connection state changed: ${oldState} -> ${newState}`);
    }
    
    // Notify listeners
    connectionStateCallbacks.forEach(callback => {
      try {
        callback(newState);
      } catch (error) {
        console.error('Error in connection state callback:', error);
      }
    });
    
    // Handle disconnection
    if (newState === 'disconnected' && !silent) {
      handleDisconnection();
    }
  }
}

/**
 * Handle disconnection with automatic reconnection
 */
function handleDisconnection() {
  // Clear any existing retry timeout
  if (retryTimeout !== null) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  
  // Check if we've exceeded max retry attempts
  if (retryCount >= RECONNECT_ATTEMPTS) {
    console.error(`❌ Failed to reconnect after ${RECONNECT_ATTEMPTS} attempts`);
    
    // Notify error listeners
    const error = new Error(`Failed to reconnect to Supabase after ${RECONNECT_ATTEMPTS} attempts`);
    notifyErrorListeners(error);
    
    return;
  }
  
  // Calculate delay with exponential backoff
  const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  
  if (DEBUG_MODE) {
    console.log(`🔄 Attempting to reconnect in ${delay / 1000} seconds (attempt ${retryCount + 1}/${RECONNECT_ATTEMPTS})`);
  }
  
  // Schedule reconnection attempt
  retryTimeout = window.setTimeout(() => {
    if (DEBUG_MODE) {
      console.log(`🔄 Reconnection attempt ${retryCount + 1}/${RECONNECT_ATTEMPTS}`);
    }
    
    updateConnectionState('checking');
    retryCount++;
    
    // Attempt reconnection
    checkConnection();
  }, delay);
}

/**
 * Handle online event
 */
function handleOnline() {
  if (DEBUG_MODE) {
    console.log('🌐 Browser online event detected');
  }
  
  // Reset retry count and attempt immediate reconnection
  retryCount = 0;
  
  // Clear any existing retry timeout
  if (retryTimeout !== null) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  
  // Attempt reconnection
  updateConnectionState('checking');
  checkConnection();
}

/**
 * Handle offline event
 */
function handleOffline() {
  if (DEBUG_MODE) {
    console.log('🌐 Browser offline event detected');
  }
  
  // Update connection state
  updateConnectionState('disconnected');
}

/**
 * Perform connection check and handle reconnection
 */
async function checkConnection(silent: boolean = false) {
  try {
    // Add a timeout to the connection check
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Connection check timeout')), CONNECTION_TIMEOUT + 2000);
    });
    
    let isConnected = false;
    
    try {
      isConnected = await Promise.race([
        checkSupabaseConnection(silent),
        timeoutPromise
      ]);
    } catch (timeoutError) {
      console.warn('Connection check timed out:', timeoutError);
      updateConnectionState('disconnected', silent);
      return;
    }
    
    if (isConnected) {
      // Refresh auth session if needed
      const timeSinceLastConnection = Date.now() - lastSuccessfulConnection;
      if (timeSinceLastConnection > 5 * 60 * 1000) { // 5 minutes
        refreshAuthSession();
      }
    }
  } catch (error) {
    console.error('Error checking connection:', error);
    updateConnectionState('disconnected', silent);
  }
}

/**
 * Refresh authentication session
 */
async function refreshAuthSession() {
  try {
    if (DEBUG_MODE) {
      console.log('🔄 Refreshing auth session...');
    }
    
    // Add timeout to prevent hanging
    const { data, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth session refresh timeout')), 5000)
      )
    ]) as any;
    
    if (error) {
      console.error('Error refreshing auth session:', error);
      return;
    }
    
    if (data.session) {
      if (DEBUG_MODE) {
        console.log('✅ Auth session refreshed successfully');
      }
    } else {
      if (DEBUG_MODE) {
        console.log('ℹ️ No active auth session found');
      }
    }
  } catch (error) {
    console.error('Error refreshing auth session:', error);
  }
}

/**
 * Cleanup resources
 */
function cleanup() {
  if (connectionCheckInterval !== null) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
  
  if (retryTimeout !== null) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('beforeunload', cleanup);
}

/**
 * Notify error listeners
 */
function notifyErrorListeners(error: Error) {
  errorCallbacks.forEach(callback => {
    try {
      callback(error);
    } catch (callbackError) {
      console.error('Error in error callback:', callbackError);
    }
  });
}

/**
 * Subscribe to connection state changes
 * @returns Unsubscribe function
 */
export function onConnectionStateChange(callback: (state: typeof connectionState) => void): () => void {
  connectionStateCallbacks.push(callback);
  
  // Call immediately with current state
  callback(connectionState);
  
  // Return unsubscribe function
  return () => {
    const index = connectionStateCallbacks.indexOf(callback);
    if (index !== -1) {
      connectionStateCallbacks.splice(index, 1);
    }
  };
}

/**
 * Subscribe to connection errors
 * @returns Unsubscribe function
 */
export function onConnectionError(callback: (error: Error) => void): () => void {
  errorCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = errorCallbacks.indexOf(callback);
    if (index !== -1) {
      errorCallbacks.splice(index, 1);
    }
  };
}

/**
 * Get current connection state
 */
export function getConnectionState(): typeof connectionState {
  return connectionState;
}

/**
 * Force a connection state update (useful for testing)
 */
export function setConnectionState(state: typeof connectionState): void {
  updateConnectionState(state);
}

/**
 * Retry a failed operation with exponential backoff
 */
export async function retryOperation<T, E = any>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  shouldRetry: (error: E) => boolean = () => true
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      retries++;
      
      // Check if we should retry this error
      if (retries >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, retries - 1);
      
      if (DEBUG_MODE) {
        console.log(`🔄 Retrying operation in ${delay}ms (attempt ${retries}/${maxRetries})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Validate Supabase configuration
 */
export function validateSupabaseConfig(): boolean {
  const isValid = !!(supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://example.supabase.co' &&
    supabaseAnonKey !== 'public-anon-key' &&
    supabaseUrl.includes('supabase.co'));

  if (!isValid) {
    console.error('❌ Supabase configuration is invalid. Make sure to add the correct variables in your .env file:');
    console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
  }

  return isValid;
}

/**
 * Set up connection retry with custom interval
 */
export function setupConnectionRetry(callback: () => void, interval = 30000): () => void {
  console.log(`🔄 Setting up connection retry every ${interval / 1000} seconds`);

  const intervalId = setInterval(async () => {
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      console.log('✅ Connection restored to Supabase');
      if (callback) callback();
    } else {
      console.log('⚠️ Still disconnected from Supabase, will retry...');
    }
  }, interval);

  return () => {
    console.log('🛑 Stopping connection retry attempts');
    clearInterval(intervalId);
  };
}

// Export connection state for components
export const supabaseConnection = {
  getState: getConnectionState,
  check: checkSupabaseConnection,
  onStateChange: onConnectionStateChange,
  onError: onConnectionError,
  retry: retryOperation,
  validateConfig: validateSupabaseConfig,
  setupRetry: setupConnectionRetry
};