// Google Analytics 4 Configuration for Sherlook
// Using the actual Google Analytics Measurement ID: G-YDC6XME64Z

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Configure with your GA4 Measurement ID
gtag('config', 'G-YDC6XME64Z', {
  page_title: 'شير لوك - منصة الألعاب التفاعلية',
  page_location: window.location.href,
  custom_map: {
    'custom_parameter_1': 'user_type',
    'custom_parameter_2': 'game_category',
    'custom_parameter_3': 'language'
  },
  // Enhanced configuration for better tracking
  send_page_view: true,
  anonymize_ip: true,
  allow_google_signals: true,
  allow_ad_personalization_signals: true
});

// Enhanced Ecommerce Tracking
gtag('config', 'G-YDC6XME64Z', {
  'custom_map': {
    'dimension1': 'user_type',
    'dimension2': 'game_category',
    'dimension3': 'language'
  }
});

// Track Custom Events
function trackEvent(eventName, parameters = {}) {
  gtag('event', eventName, {
    event_category: 'game_interaction',
    event_label: 'sherlook_game',
    ...parameters
  });
}

// Track Page Views
function trackPageView(pageName) {
  gtag('event', 'page_view', {
    page_title: pageName,
    page_location: window.location.href
  });
}

// Track Game Events
function trackGameStart(category) {
  trackEvent('game_start', {
    game_category: category,
    user_type: getUserType()
  });
}

function trackGameComplete(score, category) {
  trackEvent('game_complete', {
    score: score,
    game_category: category,
    user_type: getUserType()
  });
}

function trackQuestionAnswered(correct, category) {
  trackEvent('question_answered', {
    correct: correct,
    game_category: category,
    user_type: getUserType()
  });
}

// Track User Engagement
function trackUserRegistration() {
  trackEvent('user_registration', {
    method: 'email',
    user_type: 'new_user'
  });
}

function trackUserLogin() {
  trackEvent('user_login', {
    method: 'email',
    user_type: getUserType()
  });
}

// Track Performance
function trackPageLoadTime(loadTime) {
  trackEvent('page_load_time', {
    load_time: loadTime,
    page_url: window.location.href
  });
}

// Track Errors
function trackError(errorMessage, errorCode) {
  trackEvent('error', {
    error_message: errorMessage,
    error_code: errorCode,
    page_url: window.location.href
  });
}

// Helper Functions
function getUserType() {
  // Check if user is logged in
  const user = localStorage.getItem('user');
  return user ? 'registered' : 'guest';
}

// Track Core Web Vitals
function trackCoreWebVitals() {
  // Track Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      trackEvent('lcp', {
        value: entry.startTime,
        page_url: window.location.href
      });
    }
  }).observe({entryTypes: ['largest-contentful-paint']});

  // Track First Input Delay (FID)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      trackEvent('fid', {
        value: entry.processingStart - entry.startTime,
        page_url: window.location.href
      });
    }
  }).observe({entryTypes: ['first-input']});

  // Track Cumulative Layout Shift (CLS)
  new PerformanceObserver((list) => {
    let clsValue = 0;
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
    trackEvent('cls', {
      value: clsValue,
      page_url: window.location.href
    });
  }).observe({entryTypes: ['layout-shift']});
}

// Initialize tracking when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Track initial page load
  trackPageView(document.title);
  
  // Track core web vitals
  trackCoreWebVitals();
  
  // Track page load time
  window.addEventListener('load', function() {
    const loadTime = performance.now();
    trackPageLoadTime(loadTime);
  });
});

// Export functions for use in React components
window.SherlookAnalytics = {
  trackEvent,
  trackPageView,
  trackGameStart,
  trackGameComplete,
  trackQuestionAnswered,
  trackUserRegistration,
  trackUserLogin,
  trackError
};

// Track route changes (for SPA)
let currentPath = window.location.pathname;
const observer = new MutationObserver(function() {
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    trackPageView(document.title);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 